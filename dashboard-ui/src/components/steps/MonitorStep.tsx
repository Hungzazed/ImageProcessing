import React from 'react';

interface MonitorStepProps {
  nodeStatus: Record<string, { state: string; size?: string }>;
  enableResize: boolean;
  enableFilter: boolean;
  enableWatermark: boolean;
  compressFormat: string;
  compressQuality: number;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: string;
  filterType: string;
  filterIntensity: number;
  resizeWidth: number;
  resizeHeight: number;
  resizeFit: string;
  jobId: string;
  isProcessing: boolean;
  setStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
}

export default function MonitorStep({
  nodeStatus,
  enableResize,
  enableFilter,
  enableWatermark,
  compressFormat,
  compressQuality,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  filterType,
  filterIntensity,
  resizeWidth,
  resizeHeight,
  resizeFit,
  jobId,
  isProcessing,
  setStep,
}: MonitorStepProps) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-10 z-10">
      {/* Dynamic flowchart */}
      <div className="glass-panel p-8 rounded-[24px] flex flex-col md:flex-row items-center justify-center gap-6 border border-white/10 shadow-2xl min-h-[160px] overflow-x-auto select-none">
        {/* Start Node */}
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-500 shadow-md ${nodeStatus.startPipeline?.state === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-primary/20 border-primary text-primary node-pulse-glow'}`}>
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
          </div>
          <span className="text-xs font-semibold mt-1">Upload (Start)</span>
        </div>

        {/* Flow Connector */}
        <div className={`hidden md:block h-[3px] w-16 transition-all duration-500 ${nodeStatus.startPipeline?.state === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary/25'}`} />

        {/* Resize Node */}
        {enableResize && (
          <>
            <div className="flex flex-col items-center gap-2 min-w-[100px]">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-500 ${nodeStatus.resize?.state === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white' : nodeStatus.resize?.state === 'processing' || (nodeStatus.startPipeline?.state === 'completed' && !nodeStatus.resize?.state) ? 'bg-primary/20 border-primary text-primary node-pulse-glow' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                <span className="material-symbols-outlined text-[28px]">aspect_ratio</span>
              </div>
              <span className="text-xs font-semibold mt-1">Resize Image</span>
            </div>
            <div className={`hidden md:block h-[3px] w-16 transition-all duration-500 ${nodeStatus.resize?.state === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary/25'}`} />
          </>
        )}

        {/* Filter Node */}
        {enableFilter && (
          <>
            <div className="flex flex-col items-center gap-2 min-w-[100px]">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-500 ${nodeStatus.filter?.state === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white' : nodeStatus.filter?.state === 'processing' || ((nodeStatus.resize?.state === 'completed' || (!enableResize && nodeStatus.startPipeline?.state === 'completed')) && !nodeStatus.filter?.state) ? 'bg-primary/20 border-primary text-primary node-pulse-glow' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                <span className="material-symbols-outlined text-[28px]">photo_filter</span>
              </div>
              <span className="text-xs font-semibold mt-1">Apply Color Filter</span>
            </div>
            <div className={`hidden md:block h-[3px] w-16 transition-all duration-500 ${nodeStatus.filter?.state === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary/25'}`} />
          </>
        )}

        {/* Watermark Node */}
        {enableWatermark && (
          <>
            <div className="flex flex-col items-center gap-2 min-w-[100px]">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-500 ${nodeStatus.watermark?.state === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white' : nodeStatus.watermark?.state === 'processing' || ((nodeStatus.filter?.state === 'completed' || (!enableFilter && nodeStatus.resize?.state === 'completed') || (!enableFilter && !enableResize && nodeStatus.startPipeline?.state === 'completed')) && !nodeStatus.watermark?.state) ? 'bg-primary/20 border-primary text-primary node-pulse-glow' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                <span className="material-symbols-outlined text-[28px]">workspace_premium</span>
              </div>
              <span className="text-xs font-semibold mt-1">Watermark Overlay</span>
            </div>
            <div className={`hidden md:block h-[3px] w-16 transition-all duration-500 ${nodeStatus.watermark?.state === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary/25'}`} />
          </>
        )}

        {/* Compress Node */}
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-500 ${nodeStatus.compress?.state === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white' : nodeStatus.compress?.state === 'processing' || ((nodeStatus.watermark?.state === 'completed' || (!enableWatermark && nodeStatus.filter?.state === 'completed') || (!enableWatermark && !enableFilter && nodeStatus.resize?.state === 'completed') || (!enableWatermark && !enableFilter && !enableResize && nodeStatus.startPipeline?.state === 'completed')) && !nodeStatus.compress?.state) ? 'bg-primary/20 border-primary text-primary node-pulse-glow' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
            <span className="material-symbols-outlined text-[28px]">compress</span>
          </div>
          <span className="text-xs font-semibold mt-1">Compress & Format</span>
        </div>

        {/* Flow Connector */}
        <div className={`hidden md:block h-[3px] w-16 transition-all duration-500 ${nodeStatus.compress?.state === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary/25'}`} />

        {/* Success Node */}
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-500 ${nodeStatus.compress?.state === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          </div>
          <span className="text-xs font-semibold mt-1">Completed</span>
        </div>
      </div>

      {/* Detailed Processing Status Dashboard */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-6 font-sans relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full ${nodeStatus.compress?.state === 'completed' ? 'bg-emerald-500' : 'bg-primary animate-pulse shadow-[0_0_10px_rgba(210,187,255,0.8)]'}`} />
            <h3 className="font-display text-sm font-extrabold text-white tracking-wide">PIPELINE PROCESSING PROGRESS DETAILS</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Active Step Info Card */}
          <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
            {/* Glowing background blur inside the active card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Active Step Status */}
            <div>
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Current Active Step</span>

              {(() => {
                let activeTitle = 'Launching pipeline...';
                let activeDesc = 'Establishing real-time AppSync WebSocket and stateless processing context.';
                let activeIcon = 'sync';
                let activeColor = 'text-primary';

                if (nodeStatus.compress?.state === 'completed') {
                  activeTitle = 'Pipeline Complete!';
                  activeDesc = 'Image processed successfully through the Lambda chain. Final asset written to S3.';
                  activeIcon = 'task_alt';
                  activeColor = 'text-emerald-400';
                } else if (nodeStatus.compress?.state === 'processing' || (nodeStatus.watermark?.state === 'completed' && !nodeStatus.compress?.state)) {
                  activeTitle = 'Compress & Format';
                  activeDesc = `Optimizing asset size into ${compressFormat.toUpperCase()} format with a targeted quality of ${compressQuality}%.`;
                  activeIcon = 'compress';
                } else if (nodeStatus.watermark?.state === 'processing' || (nodeStatus.filter?.state === 'completed' && !nodeStatus.watermark?.state)) {
                  activeTitle = 'Watermark Signature';
                  activeDesc = `Securing visual assets with "${watermarkText}" overlay (Opacity: ${watermarkOpacity * 100}%, Position: ${watermarkPosition}).`;
                  activeIcon = 'workspace_premium';
                } else if (nodeStatus.filter?.state === 'processing' || (nodeStatus.resize?.state === 'completed' && !nodeStatus.filter?.state)) {
                  activeTitle = 'Applying Color Filter';
                  activeDesc = `Adding selected artistic flavor ${filterType.toUpperCase()} with an intensity of ${filterIntensity}%.`;
                  activeIcon = 'photo_filter';
                } else if (nodeStatus.resize?.state === 'processing' || (nodeStatus.startPipeline?.state === 'completed' && !nodeStatus.resize?.state)) {
                  activeTitle = 'Resizing Image';
                  activeDesc = `Adjusting resolution to ${resizeWidth}x${resizeHeight}px under ${resizeFit} mode.`;
                  activeIcon = 'aspect_ratio';
                } else if (nodeStatus.startPipeline?.state === 'processing') {
                  activeTitle = 'Initializing SQS Queue...';
                  activeDesc = 'Reading source parameters, parsing metadata attributes, and enqueuing jobs.';
                  activeIcon = 'cloud_upload';
                }

                return (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[36px] ${activeColor} animate-float`}>{activeIcon}</span>
                      <h4 className="text-base font-bold text-white leading-tight">{activeTitle}</h4>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                      {activeDesc}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Progress Bar Animation */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-[10px] font-bold tracking-wide">
                <span className="text-slate-400">STATUS</span>
                <span className="text-primary font-mono">
                  {nodeStatus.compress?.state === 'completed' ? '100% COMPLETED' : 'PROCESSING...'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                {nodeStatus.compress?.state === 'completed' ? (
                  <div className="h-full w-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                ) : (
                  <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 shadow-[0_0_10px_rgba(210,187,255,0.8)] animate-pulse" style={{ width: '65%' }} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Timeline Checklist */}
          <div className="lg:col-span-7 space-y-3">
            {/* Node 1: Start */}
            <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${nodeStatus.startPipeline?.state === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20 animate-pulse'}`}>
                  <span className="material-symbols-outlined text-[16px]">{nodeStatus.startPipeline?.state === 'completed' ? 'check' : 'sync'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Upload Image</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/10">Active</span>
            </div>

            {/* Node 2: Resize */}
            {enableResize && (
              <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${nodeStatus.resize?.state === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : nodeStatus.resize?.state === 'processing' ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {nodeStatus.resize?.state === 'completed' ? 'check' : nodeStatus.resize?.state === 'processing' ? 'sync' : 'hourglass_empty'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Scale & Resize Image</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Target: {resizeWidth}x{resizeHeight}px ({resizeFit})
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${nodeStatus.resize?.state === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' :
                  nodeStatus.resize?.state === 'processing' ? 'text-primary bg-primary/10 border-primary/10 animate-pulse' :
                    'text-slate-400 bg-slate-800 border-slate-700'
                  }`}>
                  {nodeStatus.resize?.state === 'completed' ? 'Completed' : nodeStatus.resize?.state === 'processing' ? 'Active' : 'Pending'}
                </span>
              </div>
            )}

            {/* Node 3: Filter */}
            {enableFilter && (
              <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${nodeStatus.filter?.state === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : nodeStatus.filter?.state === 'processing' ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {nodeStatus.filter?.state === 'completed' ? 'check' : nodeStatus.filter?.state === 'processing' ? 'sync' : 'hourglass_empty'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Apply Artistic Color Filter</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Filter: {filterType.toUpperCase()} ({filterIntensity}%)
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${nodeStatus.filter?.state === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' :
                  nodeStatus.filter?.state === 'processing' ? 'text-primary bg-primary/10 border-primary/10 animate-pulse' :
                    'text-slate-400 bg-slate-800 border-slate-700'
                  }`}>
                  {nodeStatus.filter?.state === 'completed' ? 'Completed' : nodeStatus.filter?.state === 'processing' ? 'Active' : 'Pending'}
                </span>
              </div>
            )}

            {/* Node 4: Watermark */}
            {enableWatermark && (
              <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${nodeStatus.watermark?.state === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : nodeStatus.watermark?.state === 'processing' ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {nodeStatus.watermark?.state === 'completed' ? 'check' : nodeStatus.watermark?.state === 'processing' ? 'sync' : 'hourglass_empty'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Watermark Brand Signature</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Text: "{watermarkText}" ({watermarkPosition})
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${nodeStatus.watermark?.state === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' :
                  nodeStatus.watermark?.state === 'processing' ? 'text-primary bg-primary/10 border-primary/10 animate-pulse' :
                    'text-slate-400 bg-slate-800 border-slate-700'
                  }`}>
                  {nodeStatus.watermark?.state === 'completed' ? 'Completed' : nodeStatus.watermark?.state === 'processing' ? 'Active' : 'Pending'}
                </span>
              </div>
            )}

            {/* Node 5: Compress */}
            <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${nodeStatus.compress?.state === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : nodeStatus.compress?.state === 'processing' ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {nodeStatus.compress?.state === 'completed' ? 'check' : nodeStatus.compress?.state === 'processing' ? 'sync' : 'hourglass_empty'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Compress & Target Format</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Target: {compressFormat.toUpperCase()} ({compressQuality}% quality)
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${nodeStatus.compress?.state === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' :
                nodeStatus.compress?.state === 'processing' ? 'text-primary bg-primary/10 border-primary/10 animate-pulse' :
                  'text-slate-400 bg-slate-800 border-slate-700'
                }`}>
                {nodeStatus.compress?.state === 'completed' ? 'Completed' : nodeStatus.compress?.state === 'processing' ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual navigation on completion */}
      {!isProcessing && nodeStatus.compress?.state === 'completed' && (
        <button
          onClick={() => setStep(4)}
          className="py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 active:scale-[0.98] shadow-lg shadow-emerald-600/10 transition-all select-none w-full max-w-sm mx-auto flex items-center justify-center gap-2 cursor-pointer"
        >
          VIEW COMPARISON RESULTS <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      )}
    </div>
  );
}
