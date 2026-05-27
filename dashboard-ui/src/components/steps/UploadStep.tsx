import React from 'react';

interface UploadStepProps {
  uploadedFile: any;
  isUploading: boolean;
  uploadProgress: number;
  handleFiles: (files: FileList | null) => void;
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void;
}

export default function UploadStep({
  uploadedFile,
  isUploading,
  uploadProgress,
  handleFiles,
  setStep,
}: UploadStepProps) {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-10 mt-10 relative z-10 animate-float select-none">
      <div className="text-center space-y-2">
        <h1 className="font-display text-4xl font-extrabold text-white tracking-tight">Upload Image</h1>
        <p className="text-sm text-on-surface-variant max-w-lg mx-auto">
          Start your creative journey by uploading your best visual assets.
        </p>
      </div>

      {/* Dropzone */}
      <div
        className="w-full group cursor-pointer transition-all duration-500"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/png, image/jpeg, image/webp';
          input.onchange = (e: any) => handleFiles(e.target.files);
          input.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.querySelector('.border-dashed')?.classList.add('border-primary', 'bg-primary/5');
        }}
        onDragLeave={(e) => {
          e.currentTarget.querySelector('.border-dashed')?.classList.remove('border-primary', 'bg-primary/5');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.querySelector('.border-dashed')?.classList.remove('border-primary', 'bg-primary/5');
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="w-full border-2 border-dashed border-primary/30 rounded-[24px] p-10 flex flex-col items-center justify-center gap-6 bg-white/[0.02] group-hover:bg-primary/[0.05] group-hover:border-primary/60 transition-all duration-500 dropzone-glow relative overflow-hidden min-h-[280px]">
          {/* Progress Bar */}
          {isUploading && (
            <div
              className="absolute bottom-0 left-0 h-1.5 bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(210,187,255,0.8)]"
              style={{ width: `${uploadProgress}%` }}
            />
          )}

          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud_upload
            </span>
          </div>

          <div className="text-center space-y-2">
            <p className="font-display text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
              {isUploading ? `Uploading... ${uploadProgress}%` : 'Drag & drop your creative image here, or click to browse'}
            </p>
            <p className="text-xs font-semibold text-outline tracking-wider">
              Supported Formats: <span className="text-on-surface-variant">PNG, JPG, WebP</span> (Max 10MB)
            </p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-t border-l border-white/5 rounded-[24px]" />
        </div>
      </div>

      {uploadedFile && (
        <button
          onClick={() => setStep(2)}
          className="font-display text-xs font-bold text-primary hover:underline flex items-center gap-1 select-none"
        >
          Use recently uploaded image ({uploadedFile.name}) <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      )}
    </div>
  );
}
