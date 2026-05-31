import React from 'react';

interface SidebarProps {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  setStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  uploadedFile: { name: string } | null;
  jobId: string;
  onNewPipeline: () => void;
  onOpenAiPipeline: () => void;
}

export default function Sidebar({
  step,
  setStep,
  uploadedFile,
  jobId,
  onNewPipeline,
  onOpenAiPipeline,
}: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 flex-col p-6 gap-4 bg-surface-container-low/70 backdrop-blur-xl border-r border-white/5 shadow-2xl">
      <div className="flex items-center gap-2 mb-6 select-none">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/10">
          <span className="material-symbols-outlined">auto_fix_high</span>
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-primary leading-tight">ImagePipeline_v1</h3>
          <p className="text-[10px] text-on-surface-variant opacity-70 mt-0.5">Active Session</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 select-none">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
            step === 1 ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
          <span className="font-sans text-xs font-bold">Assets Upload</span>
        </button>
        <button
          onClick={() => uploadedFile && setStep(2)}
          disabled={!uploadedFile}
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
            step === 2 ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-white/5 disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
          <span className="font-sans text-xs font-bold">Processing Setup</span>
        </button>
        <button
          onClick={() => jobId && setStep(3)}
          disabled={!jobId}
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
            step === 3 ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-white/5 disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">monitoring</span>
          <span className="font-sans text-xs font-bold">Live Monitor</span>
        </button>
        <button
          onClick={() => jobId && setStep(4)}
          disabled={!jobId}
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
            step === 4 ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-white/5 disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">history</span>
          <span className="font-sans text-xs font-bold">Analytics & Compare</span>
        </button>
        <button
          onClick={() => jobId && setStep(5)}
          disabled={!jobId}
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
            step === 5 ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-white/5 disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">webhook</span>
          <span className="font-sans text-xs font-bold">Notifications</span>
        </button>
        <button
          onClick={onOpenAiPipeline}
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all mt-1 ${
            step === 6
              ? 'bg-secondary/10 text-secondary border-r-4 border-secondary border border-secondary/20'
              : 'text-secondary hover:bg-secondary/10 border border-secondary/10'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">draw</span>
          <span className="font-sans text-xs font-bold">AI Image Pipeline</span>
        </button>
      </div>
      <div className="mt-auto select-none">
        <button
          onClick={onNewPipeline}
          className="w-full bg-primary/20 text-primary border border-primary/30 py-3 rounded-xl font-display text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/30 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Pipeline
        </button>
      </div>
    </aside>
  );
}
