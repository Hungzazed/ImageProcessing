'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { pipelineApi, PipelineOptions } from '@/api/pipelineApi';
import { useAppSyncSubscription, ProgressEvent } from '@/hooks/useAppSyncSubscription';

// Import decoupled components
import Sidebar from '@/components/Sidebar';
import UploadStep from '@/components/steps/UploadStep';
import ConfigureStep from '@/components/steps/ConfigureStep';
import MonitorStep from '@/components/steps/MonitorStep';
import CompareStep from '@/components/steps/CompareStep';
import ExportStep from '@/components/steps/ExportStep';
import { getSharedSession } from '@/utils/session';

type UploadedFile = {
  name: string;
  size: string;
  resolution: string;
  previewUrl: string;
  s3Key?: string;
};

type StageImageUrls = Partial<Record<'startPipeline' | 'resize' | 'filter' | 'watermark' | 'compress', string>>;

type JobAsset = {
  key: string;
  stage: 'startPipeline' | 'resize' | 'filter' | 'watermark' | 'compress';
  size: number;
  lastModified: string | null;
  url: string;
};

type LogMessage = {
  timestamp: string;
  stage: string;
  message: string;
  status: 'info' | 'success' | 'error';
};

export default function DashboardPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Active file details
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [s3Uploaded, setS3Uploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pipeline configuration toggles
  const [enableResize, setEnableResize] = useState(true);
  const [resizeWidth, setResizeWidth] = useState(1920);
  const [resizeHeight, setResizeHeight] = useState(1080);
  const [resizeFit, setResizeFit] = useState<'cover' | 'contain' | 'fill'>('cover');

  const [enableFilter, setEnableFilter] = useState(true);
  const [filterType, setFilterType] = useState<'sepia' | 'grayscale' | 'blur' | 'brightness'>('sepia');
  const [filterIntensity, setFilterIntensity] = useState(65);

  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('Copyright 2026');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.6);
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');

  const [enableCompress, setEnableCompress] = useState(true);
  const [compressFormat, setCompressFormat] = useState<'webp' | 'png' | 'jpeg'>('webp');
  const [compressQuality, setCompressQuality] = useState(85);

  // Active execution job details
  const [jobId, setJobId] = useState<string>('');
  const [imageId, setImageId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Running nodes status: 'pending' | 'processing' | 'completed' | 'failed'
  const [nodeStatus, setNodeStatus] = useState<Record<string, { state: string; duration?: number; size?: string }>>({});
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Split comparison slider position
  const [sliderPosition, setSliderPosition] = useState(50);

  // Notification Subscriptions
  const [subChannel, setSubChannel] = useState<'email' | 'webhook'>('email');
  const [subDestination, setSubDestination] = useState('');
  const [subEvents, setSubEvents] = useState<string[]>(['image.completed', 'image.failed']);
  const [subHistory, setSubHistory] = useState<any[]>([]);
  const [saveSubStatus, setSaveSubStatus] = useState('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [stageImageUrls, setStageImageUrls] = useState<StageImageUrls>({});
  const [jobAssets, setJobAssets] = useState<JobAsset[]>([]);
  const hasRealtimeConfig = Boolean(
    process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT && process.env.NEXT_PUBLIC_APPSYNC_API_KEY
  );

  // ----------------------------------------------------
  // Initialize Session
  // ----------------------------------------------------
  useEffect(() => {
    const session = getSharedSession();
    setToken(session.accessToken);
    setUser(session.user);
  }, []);

  const getPublicS3Url = (s3Key?: string | null) => {
    if (!s3Key) return null;

    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'image-pipeline-bucket-prod-108836621838';
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    const normalizedKey = s3Key.replace(/^\/+/, '');

    return `https://${bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
  };

  const refreshJobAssets = async (activeJobId: string) => {
    if (!activeJobId) return;

    try {
      const response = await fetch(`/api/job-assets?jobId=${encodeURIComponent(activeJobId)}`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        return;
      }

      const assets: JobAsset[] = Array.isArray(payload.items) ? payload.items : [];
      setJobAssets(assets);

      const mappedStages = assets.reduce<StageImageUrls>((acc, item) => {
        acc[item.stage] = item.url;
        return acc;
      }, {});

      setStageImageUrls((prev) => ({
        ...prev,
        ...mappedStages,
      }));

      const finalAsset = assets.find((item) => item.stage === 'compress') || assets[assets.length - 1];
      if (finalAsset?.url) {
        setProcessedImageUrl(finalAsset.url);
      }
    } catch (error) {
      console.warn('Unable to load S3 assets for job', activeJobId, error);
    }
  };

  const onSelectAsset = (url: string) => {
    if (!url) return;
    setProcessedImageUrl(url);
  };

  const onDownloadAsset = (url: string, filename?: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'asset';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Real-time Event Receiver
  const handleProgressEvent = (event: ProgressEvent) => {
    const { eventType, status, metadata } = event;

    let stageKey = '';
    let message = '';
    let logStatus: 'info' | 'success' | 'error' = 'info';

    switch (eventType) {
      case 'image.processing.started':
        stageKey = 'startPipeline';
        message = 'Pipeline started: Context initialized and validations passed.';
        break;
      case 'image.resized':
        stageKey = 'resize';
        message = `Image resized successfully to ${metadata?.width || resizeWidth}x${metadata?.height || resizeHeight}.`;
        logStatus = 'success';
        break;
      case 'image.filtered':
        stageKey = 'filter';
        message = `Applied color filter: ${metadata?.filter || filterType} successfully.`;
        logStatus = 'success';
        break;
      case 'image.watermarked':
        stageKey = 'watermark';
        message = `Watermark overlay attached securely: "${metadata?.watermark || watermarkText}".`;
        logStatus = 'success';
        break;
      case 'image.completed':
        stageKey = 'compress';
        message = `Compression stage finished. Format converted to ${metadata?.format || compressFormat}. Optimized size: ${formatBytes(metadata?.size || 108200)}.`;
        logStatus = 'success';
        break;
      case 'image.failed':
        stageKey = 'failed';
        message = `Pipeline execution failed during stage. Check serverless SQS logs.`;
        logStatus = 'error';
        break;
    }

    if (stageKey) {
      const stageUrl = getPublicS3Url(metadata?.s3Key);

      setNodeStatus((prev) => ({
        ...prev,
        [stageKey]: {
          state: status === 'FAILED' ? 'failed' : 'completed',
          size: metadata?.size ? formatBytes(metadata.size) : undefined,
        },
      }));

      if (stageUrl) {
        setStageImageUrls((prev) => ({
          ...prev,
          [stageKey]: stageUrl,
        }));

        if (eventType === 'image.completed') {
          setProcessedImageUrl(stageUrl);
        }
      }
    }

    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        stage: stageKey || 'system',
        message,
        status: logStatus,
      },
    ]);

    // Check if pipeline is fully complete
    if (eventType === 'image.completed') {
      setIsProcessing(false);
      void refreshJobAssets(jobId || event.jobId);
      setTimeout(() => {
        setStep(4); // Automatically navigate to comparison screen!
      }, 1500);
    }
  };

  // AppSync WebSocket listener
  const { connected, runSimulation } = useAppSyncSubscription({
    endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT || '',
    apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY || '',
    userId: user?.id || 'user-999',
    onUpdate: handleProgressEvent,
    enabled: isProcessing,
  });

  // Real S3 upload logic on file selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Perform real S3 upload via Next.js proxy route with upload progress
      const response = await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      if (response.data?.success) {
        setIsUploading(false);
        setS3Uploaded(true);
        setUploadedFile({
          name: file.name,
          size: formatBytes(file.size),
          resolution: '1920 x 1080px',
          previewUrl: URL.createObjectURL(file),
          s3Key: response.data.key,
        });
        setStep(2); // Auto proceed to configure screen
      } else {
        throw new Error(response.data?.error || 'S3 upload failed');
      }
    } catch (err: any) {
      console.warn('Real S3 upload failed, falling back to local sandbox:', err.message);
      setIsUploading(false);
      setS3Uploaded(false);
      setUploadProgress(0); // Reset progress on error
      
      // Still allow them to use the app in offline/simulation mode
      setUploadedFile({
        name: file.name,
        size: formatBytes(file.size),
        resolution: '1920 x 1080px',
        previewUrl: URL.createObjectURL(file),
      });
      setStep(2);
    }
  };

  // Run Pipeline Execution
  const triggerPipeline = async () => {
    if (!uploadedFile) return;

    setLogs([]);
    setIsProcessing(true);

    const activeStages: string[] = [];
    const initNodeStatus: Record<string, { state: string }> = {
      startPipeline: { state: 'processing' },
    };

    if (enableResize) {
      activeStages.push('resize');
      initNodeStatus.resize = { state: 'pending' };
    }
    if (enableFilter) {
      activeStages.push('filter');
      initNodeStatus.filter = { state: 'pending' };
    }
    if (enableWatermark) {
      activeStages.push('watermark');
      initNodeStatus.watermark = { state: 'pending' };
    }
    activeStages.push('compress');
    initNodeStatus.compress = { state: 'pending' };

    setNodeStatus(initNodeStatus);
    setStep(3); // Navigate to live monitoring dashboard!

    const fallbackJobId = 'job-' + Math.random().toString(36).substr(2, 9);
    const fallbackImageId = 'img-' + Math.random().toString(36).substr(2, 9);
    setJobId(fallbackJobId);
    setImageId(fallbackImageId);

    // 1. Verify S3 original file status
    if (s3Uploaded) {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          stage: 'startPipeline',
          message: `Verified original image on AWS S3: inputs/${uploadedFile.name}`,
          status: 'success',
        },
      ]);
    } else {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          stage: 'startPipeline',
          message: `AWS S3 source asset missing (Upload failed/skipped). Running in simulation/fallback mode.`,
          status: 'error',
        },
      ]);
    }

    // 2. Call real EC2 API gateway in the background
    try {
      const options: PipelineOptions = {};
      if (enableResize) {
        const resizeOptions = Object.fromEntries([
          ['width', resizeWidth],
          ['height', resizeHeight],
          ['fit', resizeFit],
        ]) as NonNullable<PipelineOptions['resize']>;
        options.resize = resizeOptions;
      }
      if (enableFilter) {
        options.filter = { type: filterType, value: filterIntensity / 50 };
      }
      if (enableWatermark) {
        options.watermark = {
          type: 'text',
          text: watermarkText,
          position: watermarkPosition,
          opacity: watermarkOpacity,
        };
      }
      if (enableCompress) {
        options.compression = { format: compressFormat, quality: compressQuality };
      }

      const responseData = await pipelineApi.startProcess({
        userId: user?.id || 'user-999',
        s3Key: uploadedFile.s3Key || `inputs/${uploadedFile.name}`,
        options,
      });

      const actualJobId = responseData?.data?.jobId || responseData?.jobId || fallbackJobId;
      const actualImageId = responseData?.data?.imageId || responseData?.imageId || fallbackImageId;

      setJobId(actualJobId);
      setImageId(actualImageId);
      void refreshJobAssets(actualJobId);

      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          stage: 'gateway',
          message: 'Process command enqueued to SQS successfully.',
          status: 'success',
        },
      ]);
    } catch (err: any) {
        const details = err?.response?.data || err?.response || err?.message;
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            stage: 'startPipeline',
            message: `API Gateway trigger failed: ${err.message}. See console for details.`,
            status: 'error',
          },
        ]);
        // Log full error details for troubleshooting (status, headers, body)
        // eslint-disable-next-line no-console
        console.warn('API Gateway POST failed, using simulation mode:', details);
    }

    // Use local simulation only when the real realtime channel is not configured.
    if (!hasRealtimeConfig) {
      runSimulation(fallbackJobId, fallbackImageId, activeStages, filterType);
    }
  };

  // Notification setup
  const saveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subDestination) {
      setSaveSubStatus('Please enter a valid destination endpoint.');
      return;
    }

    setSaveSubStatus('Saving...');
    try {
      const payload = {
        userId: user?.id || 'user-999',
        id: 'sub-' + Date.now(),
        channel: subChannel,
        destination: subDestination,
        events: subEvents,
        isActive: true,
      };
      await pipelineApi.saveSubscription(user?.id || 'user-999', payload);
      setSaveSubStatus('Subscription saved successfully!');
      setSubDestination('');

      // Fetch latest
      const updated = await pipelineApi.getSubscriptions(user?.id || 'user-999');
      setSubHistory(Array.isArray(updated) ? updated : [payload]);
    } catch (err: any) {
      setSaveSubStatus(`Error: ${err.message}`);
    }
  };

  // Helper formatting size bytes
  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Get active CSS filters based on configuration
  const getProcessedFilterStyle = () => {
    if (!enableFilter) return {};
    let styles = '';
    if (filterType === 'sepia') styles += `sepia(${filterIntensity}%) `;
    if (filterType === 'grayscale') styles += `grayscale(${filterIntensity}%) `;
    if (filterType === 'blur') styles += `blur(${filterIntensity / 25}px) `;
    if (filterType === 'brightness') styles += `brightness(${100 + (filterIntensity - 50)}%) `;
    return { filter: styles };
  };

  // Reset states to launch a new pipeline
  const handleNewPipeline = () => {
    setUploadedFile(null);
    setJobId('');
    setImageId('');
    setNodeStatus({});
    setProcessedImageUrl(null);
    setStageImageUrls({});
    setStep(1);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="w-full top-0 sticky z-50 bg-surface/70 backdrop-blur-xl border-b border-white/10 shadow-xl flex justify-between items-center px-16 py-4">
        <div
          className="font-display text-2xl font-extrabold tracking-tighter text-primary cursor-pointer select-none"
          onClick={() => setStep(1)}
        >
          Pipeline Studio
        </div>
        <nav className="hidden md:flex items-center gap-6 select-none">
          <button
            className={`font-display text-sm font-semibold transition-all pb-1 duration-200 outline-none cursor-pointer ${step === 1 ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setStep(1)}
          >
            Upload
          </button>
          <button
            className={`font-display text-sm font-semibold transition-all pb-1 duration-200 outline-none cursor-pointer ${step === 2 ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => uploadedFile && setStep(2)}
            disabled={!uploadedFile}
          >
            Configure
          </button>
          <button
            className={`font-display text-sm font-semibold transition-all pb-1 duration-200 outline-none cursor-pointer ${step === 3 ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => jobId && setStep(3)}
            disabled={!jobId}
          >
            Monitor
          </button>
          <button
            className={`font-display text-sm font-semibold transition-all pb-1 duration-200 outline-none cursor-pointer ${step === 4 ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => jobId && setStep(4)}
            disabled={!jobId}
          >
            Compare
          </button>
          <button
            className={`font-display text-sm font-semibold transition-all pb-1 duration-200 outline-none cursor-pointer ${step === 5 ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => jobId && setStep(5)}
            disabled={!jobId}
          >
            Export
          </button>
          <button
              className={`font-display text-sm font-semibold text-on-surface-variant hover:text-primary transition-all pb-1 duration-200 outline-none cursor-pointer flex items-center gap-1.5`}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/users' } }));
                if (window !== window.parent) {
                  window.parent.postMessage({
                    type: 'navigate',
                    path: '/users',
                  }, '*');
                }
              }
            }}
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            Manage Users
          </button>
        </nav>

        <div className="flex items-center gap-4 select-none">
          <span className="text-xs font-mono px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-secondary">
            {connected ? '● AppSync Live' : '○ Local Sandbox'}
          </span>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[20px] outline-none">notifications</button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[20px] outline-none">settings</button>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-1">{user?.email || 'N/A'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Side and main content layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Layout */}
        <Sidebar
          step={step}
          setStep={setStep}
          uploadedFile={uploadedFile}
          jobId={jobId}
          onNewPipeline={handleNewPipeline}
        />

        {/* Main Work Area */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-12 py-10 relative">
          {/* Glowing Blurs */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Render Active Steps */}
          {step === 1 && (
            <UploadStep
              uploadedFile={uploadedFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              handleFiles={handleFiles}
              setStep={setStep}
            />
          )}

          {step === 2 && uploadedFile && (
            <ConfigureStep
              uploadedFile={uploadedFile}
              enableResize={enableResize}
              setEnableResize={setEnableResize}
              resizeWidth={resizeWidth}
              setResizeWidth={setResizeWidth}
              resizeHeight={resizeHeight}
              setResizeHeight={setResizeHeight}
              resizeFit={resizeFit}
              setResizeFit={setResizeFit}
              enableFilter={enableFilter}
              setEnableFilter={setEnableFilter}
              filterType={filterType}
              setFilterType={setFilterType}
              filterIntensity={filterIntensity}
              setFilterIntensity={setFilterIntensity}
              enableWatermark={enableWatermark}
              setEnableWatermark={setEnableWatermark}
              watermarkText={watermarkText}
              setWatermarkText={setWatermarkText}
              watermarkOpacity={watermarkOpacity}
              setWatermarkOpacity={setWatermarkOpacity}
              watermarkPosition={watermarkPosition}
              setWatermarkPosition={setWatermarkPosition}
              enableCompress={enableCompress}
              setEnableCompress={setEnableCompress}
              compressFormat={compressFormat}
              setCompressFormat={setCompressFormat}
              compressQuality={compressQuality}
              setCompressQuality={setCompressQuality}
              triggerPipeline={triggerPipeline}
            />
          )}

          {step === 3 && (
            <MonitorStep
              nodeStatus={nodeStatus}
              enableResize={enableResize}
              enableFilter={enableFilter}
              enableWatermark={enableWatermark}
              compressFormat={compressFormat}
              compressQuality={compressQuality}
              watermarkText={watermarkText}
              watermarkOpacity={watermarkOpacity}
              watermarkPosition={watermarkPosition}
              filterType={filterType}
              filterIntensity={filterIntensity}
              resizeWidth={resizeWidth}
              resizeHeight={resizeHeight}
              resizeFit={resizeFit}
              jobId={jobId}
              isProcessing={isProcessing}
              setStep={setStep}
            />
          )}

          {step === 4 && uploadedFile && (
            <CompareStep
              uploadedFile={uploadedFile}
              originalImageUrl={uploadedFile.previewUrl}
              processedImageUrl={processedImageUrl}
              stageImageUrls={stageImageUrls}
              jobAssets={jobAssets}
              onSelectAsset={onSelectAsset}
              onDownloadAsset={onDownloadAsset}
              sliderPosition={sliderPosition}
              setSliderPosition={setSliderPosition}
              getProcessedFilterStyle={getProcessedFilterStyle}
              enableWatermark={enableWatermark}
              watermarkText={watermarkText}
              watermarkOpacity={watermarkOpacity}
              watermarkPosition={watermarkPosition}
              compressFormat={compressFormat}
              setStep={setStep}
            />
          )}

          {step === 5 && uploadedFile && (
            <ExportStep
              uploadedFile={uploadedFile}
              originalImageUrl={uploadedFile.previewUrl}
              processedImageUrl={processedImageUrl}
              jobAssets={jobAssets}
              getProcessedFilterStyle={getProcessedFilterStyle}
              enableWatermark={enableWatermark}
              watermarkText={watermarkText}
              watermarkOpacity={watermarkOpacity}
              watermarkPosition={watermarkPosition}
              jobId={jobId}
              user={user}
              subChannel={subChannel}
              setSubChannel={setSubChannel}
              subDestination={subDestination}
              setSubDestination={setSubDestination}
              subEvents={subEvents}
              setSubEvents={setSubEvents}
              saveSubscription={saveSubscription}
              saveSubStatus={saveSubStatus}
              subHistory={subHistory}
              onNewPipeline={handleNewPipeline}
            />
          )}
        </main>
      </div>

      {/* Unified Footer */}
      <footer className="bg-surface-container-lowest border-t border-white/5 flex justify-between items-center px-16 py-4 text-xs select-none">
        <div className="text-slate-400 font-sans">
          © 2026 Serverless Image Pipeline Studio. Visionary Processing.
        </div>
        <div className="flex gap-6 font-sans">
          <a className="text-slate-500 hover:text-secondary transition-colors" href="#">Documentation</a>
          <a className="text-slate-500 hover:text-secondary transition-colors" href="#">API Status</a>
          <a className="text-slate-500 hover:text-secondary transition-colors" href="#">Support</a>
          <a className="text-slate-500 hover:text-secondary transition-colors" href="#">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
