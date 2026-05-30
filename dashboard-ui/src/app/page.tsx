'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { pipelineApi, PipelineOptions } from '@/api/pipelineApi';
import { useAppSyncSubscription, ProgressEvent } from '@/hooks/useAppSyncSubscription';

// Import decoupled components
import UploadStep from '@/components/steps/UploadStep';
import ConfigureStep from '@/components/steps/ConfigureStep';
import MonitorStep from '@/components/steps/MonitorStep';
import CompareStep from '@/components/steps/CompareStep';
import ExportStep from '@/components/steps/ExportStep';
import AiPipelineStep from '@/components/steps/AiPipelineStep';
import DashboardNavbar from '@/components/DashboardNavbar';
import { getSharedSession, saveSharedSession } from '@/utils/session';

type UploadedFile = {
  name: string;
  size: string;
  resolution: string;
  width?: number;
  height?: number;
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
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const shellAppUrl = process.env.NEXT_PUBLIC_SHELL_APP_URL || 'http://localhost:3000';
  const pipelineStartedAtRef = useRef<number | null>(null);

  // Active file details
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [s3Uploaded, setS3Uploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pipeline configuration toggles
  const [enableResize, setEnableResize] = useState(false);
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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== shellAppUrl) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'auth-login' && typeof data.accessToken === 'string') {
        const nextUser = data.user && typeof data.user === 'object' ? data.user : null;
        saveSharedSession(data.accessToken, nextUser);
        setToken(data.accessToken);
        setUser(nextUser);
        return;
      }

      if (data.type === 'auth-logout') {
        // Clear all keys used across all microfrontends
        window.localStorage.removeItem('authToken');
        window.localStorage.removeItem('auth_access_token');
        window.localStorage.removeItem('authRefreshToken');    // auth-frontend-next
        window.localStorage.removeItem('auth_refresh_token');  // shell-app
        window.localStorage.removeItem('authUser');
        window.localStorage.removeItem('auth_user');
        window.localStorage.removeItem('authProvider');
        // Clear all shared cookies
        document.cookie = 'authToken=; path=/; max-age=0; samesite=strict';
        document.cookie = 'auth_access_token=; path=/; max-age=0; samesite=strict';
        document.cookie = 'auth_refresh_token=; path=/; max-age=0; samesite=strict';
        document.cookie = 'authUser=; path=/; max-age=0; samesite=strict';
        document.cookie = 'auth_user=; path=/; max-age=0; samesite=strict';
        setToken(null);
        setUser(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [shellAppUrl]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.parent) return;

    window.parent.postMessage({ type: 'auth-ready' }, shellAppUrl);
  }, [shellAppUrl]);

  const getPublicS3Url = (s3Key?: string | null) => {
    if (!s3Key) return null;

    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'image-pipeline-bucket-prod-108836621838';
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    const normalizedKey = s3Key.replace(/^\/+/, '');

    return `https://${bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
  };

  const fetchS3Head = async (url: string) => {
    try {
      const response = await fetch(`/api/fetch-head?url=${encodeURIComponent(url)}`);
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        return null;
      }

      return {
        length: typeof payload.length === 'number' ? payload.length : null,
        type: typeof payload.type === 'string' ? payload.type : null,
      };
    } catch {
      return null;
    }
  };

  const parseProcessingTimeMs = (value?: string | number | null) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value);
    }

    if (value == null) return undefined;

    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return undefined;

    const msMatch = normalized.match(/^([\d.]+)\s*ms$/);
    if (msMatch) return Math.round(parseFloat(msMatch[1]));

    const secMatch = normalized.match(/^([\d.]+)\s*s(ec(onds?)?)?$/);
    if (secMatch) return Math.round(parseFloat(secMatch[1]) * 1000);

    const minMatch = normalized.match(/^([\d.]+)\s*m(in(utes?)?)?$/);
    if (minMatch) return Math.round(parseFloat(minMatch[1]) * 60 * 1000);

    const numericOnly = Number(normalized);
    if (!Number.isNaN(numericOnly)) return Math.round(numericOnly);

    return undefined;
  };

  const getImageDimensions = async (previewUrl: string) => {
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = previewUrl;
      });

      return {
        w: image.naturalWidth,
        h: image.naturalHeight,
      };
    } catch {
      return null;
    }
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
        void (async () => {
          const headInfo = await fetchS3Head(finalAsset.url);
          if (!headInfo?.length) return;

          setJobAssets((prev) =>
            prev.map((item) =>
              item.stage === 'compress' && item.url === finalAsset.url
                ? { ...item, size: headInfo.length || item.size }
                : item
            )
          );
        })();
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
      const stageUrl = metadata?.url || getPublicS3Url(metadata?.s3Key);

      // Record start timestamp for duration calculation
      setNodeStatus((prev) => {
        const nextState: 'processing' | 'failed' | 'completed' = eventType === 'image.processing.started' ? 'processing' : status === 'FAILED' ? 'failed' : 'completed';
        const next: { state: string; duration?: number; size?: string } = {
          state: nextState,
          ...(metadata?.size ? { size: formatBytes(metadata.size) } : {}),
        };

        return { ...prev, [stageKey]: next } as Record<string, { state: string; duration?: number; size?: string }>;
      });

      // Populate stage image urls and jobAssets when possible
      if (stageUrl) {
        setStageImageUrls((prev) => ({ ...prev, [stageKey]: stageUrl }));
        if (eventType === 'image.completed') {
          setProcessedImageUrl(stageUrl);
        }

        // If metadata contains a size, add to jobAssets for metrics
        if (metadata?.size) {
          setJobAssets((prev) => {
            const exists = prev.some((p) => p.stage === stageKey && p.url === stageUrl);
            if (exists) return prev;
            return [
              ...prev,
              { key: `${stageKey}-${Date.now()}`, stage: stageKey as any, size: metadata.size, lastModified: null, url: stageUrl },
            ];
          });
        }
      } else if (metadata?.size) {
        // If no URL but size is provided, still add a job asset placeholder so metrics can compute
        setJobAssets((prev) => {
          const exists = prev.some((p) => p.stage === stageKey && !p.url);
          if (exists) return prev;
          return [
            ...prev,
            { key: `${stageKey}-${Date.now()}`, stage: stageKey as any, size: metadata.size, lastModified: null, url: '' },
          ];
        });
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
      const backendProcessingMs = parseProcessingTimeMs(metadata?.processingTime ?? metadata?.duration ?? metadata?.elapsedMs);
      const fallbackProcessingMs = pipelineStartedAtRef.current ? Date.now() - pipelineStartedAtRef.current : undefined;

      if (backendProcessingMs || fallbackProcessingMs) {
        setNodeStatus((prev) => ({
          ...prev,
          compress: {
            ...(prev.compress || { state: 'completed' }),
            state: 'completed',
            duration: backendProcessingMs ?? fallbackProcessingMs,
          },
        }));
      }

      void refreshJobAssets(jobId || event.jobId);
      setTimeout(() => {
        setStep(4); // Automatically navigate to comparison screen!
      }, 1500);
    }
  };

  // AppSync WebSocket listener
  const { runSimulation } = useAppSyncSubscription({
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
        const preview = URL.createObjectURL(file);
        const dimensions = await getImageDimensions(preview);
        const width = dimensions?.w ?? 1920;
        const height = dimensions?.h ?? 1080;

        setUploadedFile({
          name: file.name,
          size: formatBytes(file.size),
          resolution: `${width} x ${height}px`,
          width,
          height,
          previewUrl: preview,
          s3Key: response.data.key,
        });
        setEnableResize(false);
        setResizeWidth(width);
        setResizeHeight(height);
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
      const preview = URL.createObjectURL(file);
      const dimensions = await getImageDimensions(preview);
      const width = dimensions?.w ?? 1920;
      const height = dimensions?.h ?? 1080;

      setUploadedFile({
        name: file.name,
        size: formatBytes(file.size),
        resolution: `${width} x ${height}px`,
        width,
        height,
        previewUrl: preview,
      });
      setEnableResize(false);
      setResizeWidth(width);
      setResizeHeight(height);
      setStep(2);
    }
  };

  // Run Pipeline Execution
  const triggerPipeline = async () => {
    if (!uploadedFile) return;

    setLogs([]);
    setIsProcessing(true);
    pipelineStartedAtRef.current = Date.now();

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
      const backendProcessingMs = parseProcessingTimeMs(responseData?.processingTime ?? responseData?.data?.processingTime);
      const fallbackProcessingMs = pipelineStartedAtRef.current ? Date.now() - pipelineStartedAtRef.current : undefined;

      setJobId(actualJobId);
      setImageId(actualImageId);
      void refreshJobAssets(actualJobId);

      if (backendProcessingMs || fallbackProcessingMs) {
        setNodeStatus((prev) => ({
          ...prev,
          compress: {
            ...(prev.compress || { state: 'completed' }),
            state: 'completed',
            duration: backendProcessingMs ?? fallbackProcessingMs,
          },
        }));
      }

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

  // If we have a processedImageUrl but no compress asset recorded, try to fetch its size
  useEffect(() => {
    if (!processedImageUrl) return;

    let canceled = false;

    (async () => {
      try {
        const proxyRes = await fetch(`/api/fetch-head?url=${encodeURIComponent(processedImageUrl)}`);
        const payload = await proxyRes.json();
        if (!canceled && payload?.success && payload.length) {
          const size = payload.length as number;
          setJobAssets((prev) => {
            const hasCompress = prev.some((p) => p.stage === 'compress');
            if (hasCompress) return prev;
            return [
              ...prev,
              { key: `compress-${Date.now()}`, stage: 'compress', size, lastModified: null, url: processedImageUrl },
            ];
          });

          setStageImageUrls((prev) => ({ ...prev, compress: processedImageUrl }));
        }
      } catch (e) {
        // ignore proxy errors
      }
    })();

    return () => {
      canceled = true;
    };
  }, [processedImageUrl]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Dashboard Horizontal Top Navigation Navbar */}
      <DashboardNavbar
        step={step}
        setStep={setStep}
        uploadedFile={uploadedFile}
        jobId={jobId}
        onNewPipeline={handleNewPipeline}
        onOpenAiPipeline={() => setStep(6)}
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
              nodeStatus={nodeStatus}
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

          {step === 6 && (
            <AiPipelineStep embedded onClose={() => setStep(1)} />
          )}
      </main>
    </div>
  );
}
