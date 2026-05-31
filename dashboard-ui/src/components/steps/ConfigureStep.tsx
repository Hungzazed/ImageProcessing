import React from 'react';

interface ConfigureStepProps {
  uploadedFile: {
    name: string;
    size: string;
    resolution: string;
    previewUrl: string;
  };
  enableResize: boolean;
  setEnableResize: (val: boolean) => void;
  resizeWidth: number;
  setResizeWidth: (val: number) => void;
  resizeHeight: number;
  setResizeHeight: (val: number) => void;
  resizeFit: 'cover' | 'contain' | 'fill';
  setResizeFit: (val: 'cover' | 'contain' | 'fill') => void;
  enableFilter: boolean;
  setEnableFilter: (val: boolean) => void;
  filterType: 'sepia' | 'grayscale' | 'blur' | 'brightness';
  setFilterType: (val: 'sepia' | 'grayscale' | 'blur' | 'brightness') => void;
  filterIntensity: number;
  setFilterIntensity: (val: number) => void;
  enableWatermark: boolean;
  setEnableWatermark: (val: boolean) => void;
  watermarkText: string;
  setWatermarkText: (val: string) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (val: number) => void;
  watermarkPosition: string;
  setWatermarkPosition: (val: string) => void;
  enableCompress: boolean;
  setEnableCompress: (val: boolean) => void;
  compressFormat: 'webp' | 'png' | 'jpeg';
  setCompressFormat: (val: 'webp' | 'png' | 'jpeg') => void;
  compressQuality: number;
  setCompressQuality: (val: number) => void;
  triggerPipeline: () => void;
}

export default function ConfigureStep({
  uploadedFile,
  enableResize,
  setEnableResize,
  resizeWidth,
  setResizeWidth,
  resizeHeight,
  setResizeHeight,
  resizeFit,
  setResizeFit,
  enableFilter,
  setEnableFilter,
  filterType,
  setFilterType,
  filterIntensity,
  setFilterIntensity,
  enableWatermark,
  setEnableWatermark,
  watermarkText,
  setWatermarkText,
  watermarkOpacity,
  setWatermarkOpacity,
  watermarkPosition,
  setWatermarkPosition,
  enableCompress,
  setEnableCompress,
  compressFormat,
  setCompressFormat,
  compressQuality,
  setCompressQuality,
  triggerPipeline,
}: ConfigureStepProps) {
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left Column: Image and Basic Specs */}
        <div className="space-y-6">
          {/* Image Preview Card */}
          <div 
            onClick={() => setIsLightboxOpen(true)}
            className="glass-panel p-3 rounded-2xl shadow-2xl relative overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-300 group"
          >
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center bg-black/40 relative">
              <img
                alt="Uploaded Preview"
                className="max-w-full max-h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                src={uploadedFile.previewUrl}
              />
              {/* Subtle hover icon overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-all duration-300">
                  <span className="material-symbols-outlined text-[24px]">zoom_in</span>
                </div>
              </div>
            </div>
            <div className="absolute top-6 right-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white hover:text-primary hover:border-primary/40 hover:bg-black/80 hover:scale-105 active:scale-95 flex items-center gap-1 transition-all duration-300 cursor-pointer shadow-lg shadow-black/20"
              >
                <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                Original Preview
              </button>
            </div>
          </div>

          {/* Basic File Specs Card */}
          <div className="glass-card p-6 rounded-2xl flex justify-between items-center border border-white/5 font-sans">
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">File Name</span>
              <span className="text-sm font-semibold text-on-surface max-w-[150px] truncate">{uploadedFile.name}</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">File Size</span>
              <span className="text-sm font-semibold text-on-surface">{uploadedFile.size}</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Resolution</span>
              <span className="text-sm font-semibold text-on-surface">{uploadedFile.resolution}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Parameter Controls & Launch Button */}
        <div className="space-y-6">
          {/* 1. Resize Options */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">1</span>
                <h3 className="font-display text-lg font-bold text-white">Resize Options (Resize)</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableResize}
                  onChange={(e) => setEnableResize(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {enableResize && (
              <div className="space-y-4 transition-all duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Width (px)</label>
                    <input
                      type="number"
                      value={resizeWidth}
                      onChange={(e) => setResizeWidth(parseInt(e.target.value) || 0)}
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Height (px)</label>
                    <input
                      type="number"
                      value={resizeHeight}
                      onChange={(e) => setResizeHeight(parseInt(e.target.value) || 0)}
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Fit Mode</label>
                  <select
                    value={resizeFit}
                    onChange={(e) => setResizeFit(e.target.value as 'cover' | 'contain' | 'fill')}
                    className="bg-surface border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="cover" className="bg-surface-container">Cover (Crop to fill)</option>
                    <option value="contain" className="bg-surface-container">Contain (Fit inside)</option>
                    <option value="fill" className="bg-surface-container">Fill (Stretch to fit)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. Artistic Filters */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">2</span>
                <h3 className="font-display text-lg font-bold text-white">Artistic Filters (Filter)</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFilter}
                  onChange={(e) => setEnableFilter(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {enableFilter && (
              <div className="space-y-4 transition-all duration-300">
                <div className="flex gap-4">
                  {([
                    { key: 'sepia', label: 'Sepia', icon: 'photo_filter', color: 'bg-yellow-950/20' },
                    { key: 'grayscale', label: 'Grayscale', icon: 'gradient', color: 'bg-slate-700/20' },
                    { key: 'blur', label: 'Blur', icon: 'blur_on', color: 'bg-blue-900/20' },
                    { key: 'brightness', label: 'Brightness', icon: 'light_mode', color: 'bg-amber-800/10' }
                  ] as const).map((filter) => (
                    <div
                      key={filter.key}
                      onClick={() => setFilterType(filter.key)}
                      className={`flex-1 glass-card p-3 rounded-xl text-center cursor-pointer transition-all duration-300 border ${filterType === filter.key
                        ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(210,187,255,0.4)] scale-[1.04]'
                        : 'border-white/5 hover:bg-white/5 hover:border-white/10'
                        }`}
                    >
                      <div
                        className={`w-full aspect-square rounded-lg mb-2 flex items-center justify-center transition-all duration-300 ${filterType === filter.key
                          ? 'bg-primary/25 text-primary shadow-[0_0_12px_rgba(210,187,255,0.2)]'
                          : `${filter.color} text-on-surface-variant`
                          }`}
                      >
                        <span
                          className="material-symbols-outlined transition-all"
                          style={{ fontVariationSettings: filterType === filter.key ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          {filter.icon}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold block transition-colors duration-300 ${filterType === filter.key ? 'text-primary' : 'text-on-surface-variant'
                          }`}
                      >
                        {filter.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Filter Intensity</span>
                    <span className="text-primary font-bold">{filterIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterIntensity}
                    onChange={(e) => setFilterIntensity(parseInt(e.target.value))}
                    className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer range-slider outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Watermark Signature */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">3</span>
                <h3 className="font-display text-lg font-bold text-white">Watermark Signature (Watermark)</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {enableWatermark && (
              <div className="space-y-4 transition-all duration-300">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Watermark Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Opacity</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1.0"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value) || 0.1)}
                      className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Position</label>
                    <select
                      value={watermarkPosition}
                      onChange={(e) => setWatermarkPosition(e.target.value)}
                      className="bg-surface border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="bottom-right" className="bg-surface-container">Bottom-Right</option>
                      <option value="bottom-left" className="bg-surface-container">Bottom-Left</option>
                      <option value="top-right" className="bg-surface-container">Top-Right</option>
                      <option value="top-left" className="bg-surface-container">Top-Left</option>
                      <option value="center" className="bg-surface-container">Center</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Compression Options */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">4</span>
                <h3 className="font-display text-lg font-bold text-white">Compression & Format (Compress)</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCompress}
                  onChange={(e) => setEnableCompress(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {enableCompress && (
              <div className="space-y-4 transition-all duration-300">
                <div className="flex gap-2">
                  {(['webp', 'png', 'jpeg'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => setCompressFormat(format)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border cursor-pointer active:scale-95 ${compressFormat === format
                        ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(210,187,255,0.45)]'
                        : 'glass-card text-on-surface hover:bg-white/10 border-white/5'
                        }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Compression Quality</span>
                    <span className="text-primary font-bold">{compressQuality}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={compressQuality}
                    onChange={(e) => setCompressQuality(parseInt(e.target.value))}
                    className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer range-slider outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Container */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center pt-2">
            <button
              onClick={() => {
                setEnableResize(true);
                setEnableFilter(true);
                setEnableWatermark(false);
                setEnableCompress(true);
              }}
              className="px-5 py-4 glass-card rounded-xl text-xs font-bold text-on-surface hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer select-none border border-white/5 whitespace-nowrap text-center"
            >
              Reset Parameters
            </button>
            <button
              onClick={triggerPipeline}
              className="flex-1 py-4 bg-primary-container text-on-primary-container font-display text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_50px_rgba(124,58,237,0.6)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              LAUNCH PROCESS
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 transition-all duration-300 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 hover:rotate-90 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>

          {/* Image Container */}
          <div 
            className="relative max-w-5xl max-h-[80vh] flex flex-col items-center justify-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              alt="Original High Resolution"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
              src={uploadedFile.previewUrl}
            />
            {/* Image Specs Details */}
            <div className="mt-4 text-center space-y-1">
              <h4 className="text-sm font-bold text-white tracking-wide">{uploadedFile.name}</h4>
              <p className="text-xs text-slate-400 font-mono">
                {uploadedFile.resolution} • {uploadedFile.size}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
