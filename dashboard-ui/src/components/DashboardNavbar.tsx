import React from 'react';

interface DashboardNavbarProps {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  setStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  uploadedFile: { name: string } | null;
  jobId: string;
  onNewPipeline: () => void;
  onOpenAiPipeline: () => void;
}

export default function DashboardNavbar({
  step,
  setStep,
  uploadedFile,
  jobId,
  onNewPipeline,
  onOpenAiPipeline,
}: DashboardNavbarProps) {
  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between px-8 py-4 gap-4 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-lg select-none relative z-20">
      {/* Horizontal Nav Tabs */}
      <nav className="flex items-center flex-wrap gap-1.5 bg-white/[0.02] p-1 rounded-2xl border border-white/5 max-w-full overflow-x-auto scrollbar-none">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-sans text-xs font-bold cursor-pointer ${
            step === 1
              ? 'bg-primary/25 text-primary border border-primary/30 shadow-[0_2px_12px_rgba(210,187,255,0.15)] scale-[1.02]'
              : 'text-on-surface-variant/90 hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
          <span>Upload</span>
        </button>

        <button
          onClick={() => uploadedFile && setStep(2)}
          disabled={!uploadedFile}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-sans text-xs font-bold cursor-pointer disabled:cursor-not-allowed ${
            step === 2
              ? 'bg-primary/25 text-primary border border-primary/30 shadow-[0_2px_12px_rgba(210,187,255,0.15)] scale-[1.02]'
              : 'text-on-surface-variant/90 hover:bg-white/5 hover:text-white disabled:opacity-40 border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
          <span>Setup</span>
        </button>

        <button
          onClick={() => jobId && setStep(3)}
          disabled={!jobId}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-sans text-xs font-bold cursor-pointer disabled:cursor-not-allowed ${
            step === 3
              ? 'bg-primary/25 text-primary border border-primary/30 shadow-[0_2px_12px_rgba(210,187,255,0.15)] scale-[1.02]'
              : 'text-on-surface-variant/90 hover:bg-white/5 hover:text-white disabled:opacity-40 border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">monitoring</span>
          <span>Monitor</span>
        </button>

        <button
          onClick={() => jobId && setStep(4)}
          disabled={!jobId}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-sans text-xs font-bold cursor-pointer disabled:cursor-not-allowed ${
            step === 4
              ? 'bg-primary/25 text-primary border border-primary/30 shadow-[0_2px_12px_rgba(210,187,255,0.15)] scale-[1.02]'
              : 'text-on-surface-variant/90 hover:bg-white/5 hover:text-white disabled:opacity-40 border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          <span>Analytics</span>
        </button>

        <button
          onClick={() => jobId && setStep(5)}
          disabled={!jobId}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-sans text-xs font-bold cursor-pointer disabled:cursor-not-allowed ${
            step === 5
              ? 'bg-primary/25 text-primary border border-primary/30 shadow-[0_2px_12px_rgba(210,187,255,0.15)] scale-[1.02]'
              : 'text-on-surface-variant/90 hover:bg-white/5 hover:text-white disabled:opacity-40 border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">webhook</span>
          <span>Alerts</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-1 self-center" />

        <button
          onClick={onOpenAiPipeline}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-sans text-xs font-bold cursor-pointer ${
            step === 6
              ? 'bg-secondary/25 text-secondary border border-secondary/30 shadow-[0_2px_12px_rgba(210,187,255,0.15)] scale-[1.02]'
              : 'text-secondary hover:bg-secondary/15 border border-secondary/15 hover:border-secondary/35'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">draw</span>
          <span>AI Pipeline</span>
        </button>
      </nav>

      {/* Action Button: New Pipeline */}
      <div className="flex items-center">
        <button
          onClick={onNewPipeline}
          className="bg-primary/20 text-primary border border-primary/30 px-5 py-2.5 rounded-xl font-display text-xs font-bold flex items-center gap-1.5 hover:bg-primary/30 transition-all hover:scale-105 active:scale-95 shadow-[0_2px_10px_rgba(210,187,255,0.05)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] font-bold">add</span>
          New Process
        </button>
      </div>
    </header>
  );
}
