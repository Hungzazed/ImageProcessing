import React from 'react';

interface ExportStepProps {
  uploadedFile: any;
  getProcessedFilterStyle: () => React.CSSProperties;
  enableWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: string;
  jobId: string;
  user: any;
  subChannel: 'email' | 'webhook';
  setSubChannel: (val: 'email' | 'webhook') => void;
  subDestination: string;
  setSubDestination: (val: string) => void;
  subEvents: string[];
  setSubEvents: (val: string[]) => void;
  saveSubscription: (e: React.FormEvent) => void;
  saveSubStatus: string;
  subHistory: any[];
  onNewPipeline: () => void;
}

export default function ExportStep({
  uploadedFile,
  getProcessedFilterStyle,
  enableWatermark,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  jobId,
  user,
  subChannel,
  setSubChannel,
  subDestination,
  setSubDestination,
  subEvents,
  setSubEvents,
  saveSubscription,
  saveSubStatus,
  subHistory,
  onNewPipeline,
}: ExportStepProps) {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 z-10">
      <div className="mb-2">
        <h1 className="font-display text-3xl font-extrabold text-white">File Export & Notification Center</h1>
        <p className="text-sm text-on-surface-variant mt-1">Complete the pipeline. Download optimized assets and subscribe to webhooks or email event streams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left card */}
        <div className="glass-panel p-6 rounded-[24px] border border-white/10 space-y-6 shadow-2xl">
          <h3 className="font-display text-xl font-bold text-white">Download Visual Work</h3>

          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/30 flex items-center justify-center relative border border-white/5">
            <img
              alt="Final Output"
              className="max-w-full max-h-full object-contain"
              style={getProcessedFilterStyle()}
              src={uploadedFile.previewUrl}
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

          <div className="space-y-3">
            <a
              href={uploadedFile.previewUrl}
              download={`processed_${uploadedFile.name}`}
              className="w-full py-4 bg-primary text-on-primary font-display text-base font-bold rounded-xl shadow-[0_0_20px_rgba(210,187,255,0.3)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
              DOWNLOAD OPTIMIZED ASSET
            </a>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://image-pipeline-bucket.s3.amazonaws.com/processed/${jobId}/final.webp`);
                alert('Copied AWS S3 data link!');
              }}
              className="w-full py-3 glass-card border border-white/10 hover:bg-white/10 text-sm font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
            >
              <span className="material-symbols-outlined">link</span>
              COPY AWS S3 DATA LINK
            </button>

            <button
              onClick={onNewPipeline}
              className="w-full py-3 border border-dashed border-primary/30 hover:border-primary text-primary text-sm font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
            >
              <span className="material-symbols-outlined">restart_alt</span>
              LAUNCH NEW IMAGE PIPELINE
            </button>
          </div>
        </div>

        {/* Right card */}
        <div className="glass-panel p-6 rounded-[24px] border border-white/10 space-y-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Event Notification Center</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Get notified instantly when the Lambda processing chain completes via Email (AWS SES) or Webhook URL. The serverless framework pushes notifications asynchronously.
            </p>

            <form onSubmit={saveSubscription} className="space-y-4 mt-4 font-sans text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubChannel('email')}
                  className={`flex-1 py-2.5 rounded-lg font-bold border transition-all duration-200 cursor-pointer active:scale-95 ${
                    subChannel === 'email'
                      ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(210,187,255,0.45)]'
                      : 'glass-card text-on-surface border-white/5 hover:bg-white/5'
                  }`}
                >
                  Email (AWS SES)
                </button>
                <button
                  type="button"
                  onClick={() => setSubChannel('webhook')}
                  className={`flex-1 py-2.5 rounded-lg font-bold border transition-all duration-200 cursor-pointer active:scale-95 ${
                    subChannel === 'webhook'
                      ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(210,187,255,0.45)]'
                      : 'glass-card text-on-surface border-white/5 hover:bg-white/5'
                  }`}
                >
                  Webhook URL
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  {subChannel === 'email' ? 'Email Address' : 'Webhook URL endpoint'}
                </label>
                <input
                  type={subChannel === 'email' ? 'email' : 'text'}
                  placeholder={subChannel === 'email' ? 'creator@lumina.studio' : 'https://api.yourdomain.com/webhook'}
                  value={subDestination}
                  onChange={(e) => setSubDestination(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Event Subscriptions</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={subEvents.includes('image.completed')}
                      onChange={(e) => {
                        if (e.target.checked) setSubEvents([...subEvents, 'image.completed']);
                        else setSubEvents(subEvents.filter(x => x !== 'image.completed'));
                      }}
                      className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20"
                    />
                    <span>image.completed (Success)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={subEvents.includes('image.failed')}
                      onChange={(e) => {
                        if (e.target.checked) setSubEvents([...subEvents, 'image.failed']);
                        else setSubEvents(subEvents.filter(x => x !== 'image.failed'));
                      }}
                      className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20"
                    />
                    <span>image.failed (Failed)</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-white text-black hover:bg-slate-100 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer"
              >
                SAVE NOTIFICATION SETTINGS
              </button>

              {saveSubStatus && (
                <p className="text-center font-bold text-secondary mt-1">{saveSubStatus}</p>
              )}
            </form>
          </div>

          {/* Subscriptions history */}
          <div className="border-t border-white/5 pt-4 mt-4 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">DynamoDB Subscription Streams</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-sans text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-on-surface-variant">
                    <th className="pb-1.5">Channel</th>
                    <th className="pb-1.5">Destination</th>
                    <th className="pb-1.5">Events</th>
                    <th className="pb-1.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-slate-500">No event streams registered for User ID: {user?.id}</td>
                    </tr>
                  ) : (
                    subHistory.map((sub, index) => (
                      <tr key={index} className="border-b border-white/5 text-slate-300">
                        <td className="py-2 capitalize font-semibold">{sub.channel}</td>
                        <td className="py-2 max-w-[120px] truncate">{sub.destination}</td>
                        <td className="py-2">{sub.events.join(', ')}</td>
                        <td className="py-2 text-right">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
