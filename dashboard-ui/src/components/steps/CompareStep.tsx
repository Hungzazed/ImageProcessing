import React from 'react';

interface CompareStepProps {
  uploadedFile: {
    name: string;
    size: string;
    resolution: string;
    previewUrl: string;
  };
  originalImageUrl: string;
  processedImageUrl: string | null;
  stageImageUrls?: Partial<Record<'startPipeline' | 'resize' | 'filter' | 'watermark' | 'compress', string>>;
  sliderPosition: number;
  setSliderPosition: (pos: number) => void;
  getProcessedFilterStyle: () => React.CSSProperties;
  enableWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: string;
  compressFormat: string;
  setStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  jobAssets?: Array<{ key: string; stage: string; size: number; lastModified: string | null; url: string }>;
  onSelectAsset?: (url: string) => void;
  onDownloadAsset?: (url: string, filename?: string) => void;
  nodeStatus?: Record<string, { state: string; duration?: number; size?: string }>;
}

export default function CompareStep({
  uploadedFile,
  originalImageUrl,
  processedImageUrl,
  stageImageUrls = {},
  sliderPosition,
  setSliderPosition,
  getProcessedFilterStyle,
  enableWatermark,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  compressFormat,
  setStep,
  jobAssets = [],
  onSelectAsset,
  onDownloadAsset,
  nodeStatus = {},
}: CompareStepProps) {
  const formatBytes = (bytes?: number) => {
    if (bytes == null) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const parseSizeString = (s?: string) => {
    if (!s) return undefined;
    try {
      const m = s.match(/([\d,.]+)\s*(KB|MB|GB|Bytes)/i);
      if (!m) return undefined;
      const num = parseFloat(m[1].replace(/,/g, ''));
      const unit = (m[2] || '').toUpperCase();
      if (unit === 'BYTES') return Math.round(num);
      if (unit === 'KB') return Math.round(num * 1024);
      if (unit === 'MB') return Math.round(num * 1024 * 1024);
      if (unit === 'GB') return Math.round(num * 1024 * 1024 * 1024);
    } catch {
      return undefined;
    }
    return undefined;
  };

  const startAsset = jobAssets.find((a) => a.stage === 'startPipeline');
  const finalAsset = jobAssets.find((a) => a.stage === 'compress') || jobAssets[jobAssets.length - 1];
  const startBytes = startAsset?.size ?? parseSizeString(uploadedFile?.size as string);
  const finalBytes = finalAsset?.size;
  const savedPercent = startBytes && finalBytes ? Math.round((1 - finalBytes / startBytes) * 100) : undefined;
  const sqsTime = nodeStatus?.compress?.duration ?? nodeStatus?.startPipeline?.duration ?? undefined;
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 z-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">Quality & Visual Comparison</h1>
          <p className="text-sm text-on-surface-variant mt-1">Drag the slider handles to compare the original (Before) and optimized (After) assets.</p>
        </div>
        <button
          onClick={() => setStep(5)}
          className="py-3 px-6 bg-primary-container text-on-primary-container text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 shadow-lg shadow-primary/20 transition-all select-none flex items-center gap-2 cursor-pointer"
        >
          PROCEED TO EXPORT FILES <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image slider container */}
        <div className="lg:col-span-2 glass-panel p-3 rounded-[24px] shadow-2xl relative select-none">
          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/40 relative">

            {/* Before Image */}
            <img
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              src={originalImageUrl}
            />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-[10px] font-bold tracking-wider text-primary z-20">
              PROCESSED IMAGE (AFTER)
            </div>

            {/* After Image Container with pixel-perfect clipPath */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
              }}
            >
              <img
                alt="Processed"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={processedImageUrl ? undefined : getProcessedFilterStyle()}
                src={processedImageUrl || originalImageUrl}
              />

              {enableWatermark && (
                <div
                  className="absolute font-bold text-white tracking-widest pointer-events-none z-10 text-shadow"
                  style={{
                    opacity: watermarkOpacity,
                    ...(watermarkPosition === 'bottom-right' ? { bottom: '24px', right: '24px' } : {}),
                    ...(watermarkPosition === 'bottom-left' ? { bottom: '24px', left: '24px' } : {}),
                    ...(watermarkPosition === 'top-right' ? { top: '24px', right: '24px' } : {}),
                    ...(watermarkPosition === 'top-left' ? { top: '24px', left: '24px' } : {}),
                    ...(watermarkPosition === 'center' ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : {}),
                  }}
                >
                  {watermarkText}
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-[10px] font-bold tracking-wider text-slate-300 z-20">
              ORIGINAL IMAGE (BEFORE)
            </div>

            {/* Range handle */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />

            {/* Slider split line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary/75 shadow-[0_0_10px_rgba(210,187,255,0.8)] pointer-events-none z-20"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-primary shadow-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-primary select-none">unfold_more</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right panel specs */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Optimization Metrics</h3>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 flex items-center justify-center text-emerald-400 font-extrabold text-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                {typeof savedPercent === 'number' ? `${savedPercent}%` : '—'}
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Storage Space Saved</p>
                <p className="text-xl font-extrabold text-white mt-1">{startBytes ? formatBytes(startBytes) : uploadedFile.size} ──&gt; {finalBytes ? formatBytes(finalBytes) : (processedImageUrl ? '—' : '—')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 font-sans text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400">SQS Execution Time</span>
                <span className="text-sm font-bold text-white">{sqsTime ? `${sqsTime} ms` : '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400">Target Format</span>
                <span className="text-sm font-bold text-white">{compressFormat.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
