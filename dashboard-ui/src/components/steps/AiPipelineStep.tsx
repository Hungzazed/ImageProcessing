import React, { useEffect, useMemo, useState } from 'react';
import { getPipelineGatewayBaseUrl } from '@/utils/gatewayUrls';
import { getSharedSession } from '@/utils/session';

type PipelineMode = 'remove-object' | 'product-enhance';

type PipelineStep = {
  filterName?: string;
  status?: string;
  durationMs?: number;
  outputImageUrl?: string;
  metadata?: Record<string, unknown>;
};

type PipelineResponse = {
  success?: boolean;
  imageUrl?: string;
  processingTime?: string;
  steps?: PipelineStep[];
  error?: string;
};

interface AiPipelineStepProps {
  embedded?: boolean;
  onClose?: () => void;
}

const PIPELINE_BASE_URL = getPipelineGatewayBaseUrl();

const BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', hex: '#FFFFFF', textDark: true },
  { value: 'black', label: 'Black', hex: '#000000', textDark: false },
  { value: 'transparent', label: 'Transparent', isTransparent: true, textDark: false },
  { value: 'gray', label: 'Gray', hex: '#6B7280', textDark: false },
];

const PRESET_OPTIONS = [
  { value: 'balanced', label: 'Balanced', description: 'Natural details', brightness: 1.1, contrast: 1, sharpen: true },
  { value: 'clean', label: 'Clean', description: 'Smooth outlines', brightness: 1, contrast: 1, sharpen: false },
  { value: 'strong', label: 'Strong', description: 'High contrast', brightness: 1.2, contrast: 1.05, sharpen: true },
];

const SUGGESTED_PROMPTS = [
  'Erase background elements',
  'Remove wire watermark',
  'Remove photobomber in background',
  'Erase random text watermark',
];

function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 124, g: 58, b: 237 };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (val: number) => Math.max(0, Math.min(255, val));
  const toHex = (c: number) => {
    const hex = clamp(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r = l;
  let g = l;
  let b = l;

  if (s !== 0) {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function inferFileName(url?: string, fallback = 'ai-image-result') {
  if (!url) return `${fallback}.jpg`;
  try {
    const parsed = new URL(url);
    const lastPart = parsed.pathname.split('/').filter(Boolean).pop();
    return lastPart || `${fallback}.jpg`;
  } catch {
    return `${fallback}.jpg`;
  }
}

function getOutputFormat(url?: string) {
  if (!url) return 'Unknown';
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.png')) return 'PNG';
  if (cleanUrl.endsWith('.webp')) return 'WEBP';
  if (cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.jpg')) return 'JPG';
  return 'Unknown';
}

export default function AiPipelineStep({ embedded = true, onClose }: AiPipelineStepProps) {
  const [mode, setMode] = useState<PipelineMode>('remove-object');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [prompt, setPrompt] = useState('Erase background elements');
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [preset, setPreset] = useState('balanced');
  const [crop, setCrop] = useState(true);
  const [sharpen, setSharpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [responseData, setResponseData] = useState<PipelineResponse | null>(null);
  const [splitPosition, setSplitPosition] = useState(50);
  const [customColorVal, setCustomColorVal] = useState('#7c3aed');
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');

  const isPresetColor = (color: string) => ['white', 'black', 'transparent', 'gray'].includes(color);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const outputImageUrl = responseData?.imageUrl || '';
  const outputFormat = getOutputFormat(outputImageUrl);
  const presetConfig = PRESET_OPTIONS.find((option) => option.value === preset) || PRESET_OPTIONS[0];

  const buildOptions = useMemo(() => {
    return {
      crop,
      sharpen,
      brightness: presetConfig.brightness,
      contrast: presetConfig.contrast,
    };
  }, [crop, sharpen, presetConfig]);

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setResponseData(null);
    setSplitPosition(50);
  };

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, image/webp';
    input.onchange = (event: Event) => handleFileChange((event.target as HTMLInputElement).files);
    input.click();
  };

  const handleDownload = async () => {
    if (!outputImageUrl) return;

    try {
      const response = await fetch(outputImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = inferFileName(outputImageUrl, `${mode}-result`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(outputImageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setResponseData(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('options', JSON.stringify(buildOptions));
      formData.append('operation', mode);

      if (mode === 'remove-object') {
        formData.append('prompt', prompt.trim());
      } else {
        formData.append('backgroundColor', backgroundColor);
      }

      const { accessToken } = getSharedSession();
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/ai-image-pipeline`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const rawBody = await response.text();
      let payload: PipelineResponse;

      try {
        payload = JSON.parse(rawBody) as PipelineResponse;
      } catch {
        payload = response.ok ? { success: true, imageUrl: rawBody } : { success: false, error: rawBody || 'AI pipeline request failed' };
      }

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'AI pipeline request failed');
      }

      setResponseData(payload);
      setSplitPosition(50);
    } catch (submissionError: unknown) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to process the image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const compareClip = {
    clipPath: `inset(0 ${100 - splitPosition}% 0 0)`,
  };

  return (
    <div className={embedded ? 'w-full max-w-7xl mx-auto' : 'min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(76,215,246,0.08),transparent_35%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_30%),linear-gradient(180deg,#060c18_0%,#091122_100%)] text-on-surface'}>
      {!embedded && (
        <div className="mx-auto max-w-7xl px-8 py-10">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-8 mb-8">
            <div>
              <button
                onClick={() => (onClose ? onClose() : window.location.assign('/'))}
                className="group flex items-center gap-1.5 text-xs font-semibold tracking-[0.24em] uppercase text-accent-indigo hover:text-accent-cyan transition-colors"
              >
                <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
                Back to Dashboard
              </button>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e2d5ff] to-accent-cyan tracking-tight">
                AI Image Pipeline Studio
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant max-w-xl">
                Harness advanced neural models to seamlessly edit, patch, and optimize your assets in real time.
              </p>
            </div>
          </header>
        </div>
      )}

      <div className={embedded ? 'w-full' : 'mx-auto max-w-7xl px-8 pb-12'}>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          
          {/* LEFT SECTION: CONTROLS PANEL */}
          <section className="bg-slate-900/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20 group-hover:bg-primary/10 transition-all duration-700" />
            
            <div className="flex items-start justify-between gap-4 mb-8 relative z-10">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">
                  <span className="material-symbols-outlined text-[10px] animate-spin">smart_toy</span>
                  Neural Processing
                </span>
                <h2 className="mt-3 text-2.5xl font-display font-extrabold text-white tracking-tight">AI Settings & Tools</h2>
                <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
                  Upload an image, pick a model mode below, customize your options, and trigger the cloud processor.
                </p>
              </div>

              {embedded && onClose && (
                <button
                  onClick={onClose}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  Close Panel
                </button>
              )}
            </div>

            <div className="space-y-6 relative z-10">
              {/* 1. Mode Select (Visual Cards) */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#ccc3d8]/80 block">Select AI Model Mode</span>
                <div className="grid gap-4 grid-cols-2">
                  <div
                    onClick={() => setMode('remove-object')}
                    className={`relative p-5 rounded-[22px] border cursor-pointer select-none transition-all duration-300 group/card ${
                      mode === 'remove-object'
                        ? 'bg-primary/10 border-primary shadow-[0_0_25px_rgba(210,187,255,0.15)]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        mode === 'remove-object' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 group-hover/card:text-white'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]">ink_eraser</span>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white tracking-wide">Object Eraser</p>
                        <p className="text-[10px] text-on-surface-variant/90 mt-0.5">Erase items with AI</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setMode('product-enhance')}
                    className={`relative p-5 rounded-[22px] border cursor-pointer select-none transition-all duration-300 group/card ${
                      mode === 'product-enhance'
                        ? 'bg-secondary/15 border-secondary shadow-[0_0_25px_rgba(76,215,246,0.1)]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        mode === 'product-enhance' ? 'bg-secondary text-slate-950' : 'bg-white/5 text-slate-400 group-hover/card:text-white'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white tracking-wide">Product Enhancer</p>
                        <p className="text-[10px] text-on-surface-variant/90 mt-0.5">E-commerce cleanup</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. File Upload Area */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#ccc3d8]/80 block">Source Image</span>
                
                {selectedFile && previewUrl ? (
                  <div className="relative rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between gap-4 group/preview">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 relative">
                        <img src={previewUrl} alt="Original thumbnail" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[320px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-on-surface-variant/80 mt-1 uppercase tracking-wider font-semibold">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.replace('image/', '').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                        setResponseData(null);
                        setError('');
                      }}
                      className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                      title="Remove file"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className="group/upload cursor-pointer rounded-2xl border border-dashed border-white/15 bg-white/[0.01] hover:bg-white/[0.03] hover:border-primary/40 p-8 text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 dropzone-glow min-h-[160px]"
                    onClick={openFilePicker}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.currentTarget.classList.add('border-primary', 'bg-primary/5');
                    }}
                    onDragLeave={(event) => {
                      event.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                      handleFileChange(event.dataTransfer.files);
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] group-hover/upload:bg-primary/10 text-[#ccc3d8] group-hover/upload:text-primary border border-white/5 group-hover/upload:border-primary/20 flex items-center justify-center transition-all duration-300 group-hover/upload:scale-110">
                      <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover/upload:text-primary transition-colors">
                        Drag & drop your source asset here
                      </div>
                      <div className="mt-1.5 text-[10px] font-semibold text-on-surface-variant tracking-wide">
                        Supports PNG, JPG, or WEBP (Max 10MB)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Conditional Parameters (Prompt or Background) */}
              {mode === 'remove-object' ? (
                <div className="space-y-3 animate-float-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#ccc3d8]/80 block">AI Object Prompt</span>
                    <span className="text-[10px] font-semibold text-on-surface-variant">Describe what to erase</span>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={2.5}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 focus:bg-slate-950/60 px-4 py-3 text-xs text-white placeholder:text-slate-600 outline-none transition focus:border-primary focus:shadow-[0_0_15px_rgba(210,187,255,0.1)] leading-relaxed resize-none"
                    placeholder="E.g. Remove the background tourists, Erase the black text label on top, etc."
                  />
                  
                  {/* Prompt Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrompt(p)}
                        className={`text-[9px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          prompt === p
                            ? 'bg-primary/20 border-primary/40 text-primary'
                            : 'bg-white/[0.02] border-white/5 text-[#ccc3d8]/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-float-subtle">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#ccc3d8]/80 block">Product Target Background</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {BACKGROUND_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setBackgroundColor(option.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-sans text-xs font-bold transition-all relative ${
                          backgroundColor === option.value
                            ? 'bg-[#0c182f] border-secondary text-secondary shadow-[0_0_12px_rgba(76,215,246,0.1)]'
                            : 'bg-white/[0.02] border-white/5 text-[#ccc3d8] hover:border-white/15'
                        }`}
                      >
                        {option.isTransparent ? (
                          <div className="w-4 h-4 rounded-full border border-white/15 bg-[conic-gradient(#334155_25%,#1e293b_0_50%,#334155_0_75%,#1e293b_0)] bg-[size:6px_6px] flex-shrink-0" />
                        ) : (
                          <div 
                            className="w-4 h-4 rounded-full border border-white/15 flex-shrink-0"
                            style={{ backgroundColor: option.hex }}
                          />
                        )}
                        <span>{option.label}</span>
                        {backgroundColor === option.value && (
                          <span className="w-1 h-1 rounded-full bg-secondary absolute top-1 right-1" />
                        )}
                      </button>
                    ))}

                    {/* Custom Color Option */}
                    <button
                      type="button"
                      onClick={() => setBackgroundColor(customColorVal)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-sans text-xs font-bold transition-all relative ${
                        !isPresetColor(backgroundColor)
                          ? 'bg-[#0c182f] border-secondary text-secondary shadow-[0_0_12px_rgba(76,215,246,0.1)]'
                          : 'bg-white/[0.02] border-white/5 text-[#ccc3d8] hover:border-white/15'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-white/15 flex-shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                        style={{ backgroundColor: customColorVal }}
                      />
                      <span>Custom</span>
                      {!isPresetColor(backgroundColor) && (
                        <span className="w-1 h-1 rounded-full bg-secondary absolute top-1 right-1" />
                      )}
                    </button>
                  </div>

                  {/* Custom Color Input Panel (HEX / RGB / HSL) */}
                  {!isPresetColor(backgroundColor) && (
                    <div className="flex flex-col gap-3.5 mt-3 p-4 rounded-2xl bg-slate-950/40 border border-white/5 animate-float-subtle">
                      
                      {/* Format Switcher Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div className="flex items-center gap-2">
                          {/* Color Picker Circular Bubble */}
                          <div className="relative w-7 h-7 rounded-full border border-white/15 overflow-hidden cursor-pointer flex-shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.05)] hover:scale-105 transition-all">
                            <input
                              type="color"
                              value={customColorVal.startsWith('#') && customColorVal.length === 7 ? customColorVal : '#7c3aed'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomColorVal(val);
                                setBackgroundColor(val);
                              }}
                              className="absolute inset-0 w-[150%] h-[150%] -translate-x-[15%] -translate-y-[15%] cursor-pointer border-none p-0 bg-transparent"
                            />
                            <div 
                              className="absolute inset-0 pointer-events-none"
                              style={{ backgroundColor: customColorVal }}
                            />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Color Console</span>
                        </div>

                        {/* Format Switcher Pills */}
                        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                          {(['hex', 'rgb', 'hsl'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => setColorFormat(fmt)}
                              className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase transition-all cursor-pointer ${
                                colorFormat === fmt
                                  ? 'bg-primary text-white shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Inputs Row based on selected format */}
                      <div className="flex items-center gap-3">
                        {colorFormat === 'hex' && (
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">HEX</span>
                            <input
                              type="text"
                              value={customColorVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomColorVal(val);
                                setBackgroundColor(val);
                              }}
                              placeholder="#7c3aed"
                              className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-3 py-1.5 text-xs text-white outline-none transition focus:border-secondary placeholder:text-slate-700"
                            />
                          </div>
                        )}

                        {colorFormat === 'rgb' && (() => {
                          const { r, g, b } = hexToRgb(customColorVal);
                          return (
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              {/* Red */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-red-400 uppercase tracking-wider">R</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="255"
                                  value={r}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                                    const newHex = rgbToHex(val, g, b);
                                    setCustomColorVal(newHex);
                                    setBackgroundColor(newHex);
                                  }}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-6 pr-2 py-1.5 text-xs text-white outline-none transition focus:border-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>

                              {/* Green */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider">G</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="255"
                                  value={g}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                                    const newHex = rgbToHex(r, val, b);
                                    setCustomColorVal(newHex);
                                    setBackgroundColor(newHex);
                                  }}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-6 pr-2 py-1.5 text-xs text-white outline-none transition focus:border-emerald-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>

                              {/* Blue */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider">B</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="255"
                                  value={b}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                                    const newHex = rgbToHex(r, g, val);
                                    setCustomColorVal(newHex);
                                    setBackgroundColor(newHex);
                                  }}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-6 pr-2 py-1.5 text-xs text-white outline-none transition focus:border-cyan-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {colorFormat === 'hsl' && (() => {
                          const { r, g, b } = hexToRgb(customColorVal);
                          const { h, s, l } = rgbToHsl(r, g, b);
                          return (
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              {/* Hue */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-[#d2bbff] uppercase tracking-wider">H</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="360"
                                  value={h}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                                    const rgb = hslToRgb(val, s, l);
                                    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
                                    setCustomColorVal(newHex);
                                    setBackgroundColor(newHex);
                                  }}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-5 pr-2 py-1.5 text-xs text-white outline-none transition focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>

                              {/* Saturation */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-[#d2bbff] uppercase tracking-wider">S</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={s}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                    const rgb = hslToRgb(h, val, l);
                                    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
                                    setCustomColorVal(newHex);
                                    setBackgroundColor(newHex);
                                  }}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-5 pr-4 py-1.5 text-xs text-white outline-none transition focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500">%</span>
                              </div>

                              {/* Lightness */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-[#d2bbff] uppercase tracking-wider">L</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={l}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                    const rgb = hslToRgb(h, s, val);
                                    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
                                    setCustomColorVal(newHex);
                                    setBackgroundColor(newHex);
                                  }}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-5 pr-4 py-1.5 text-xs text-white outline-none transition focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500">%</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* 4. Segmented Presets */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#ccc3d8]/80 block">Select Processing Preset</span>
                <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-white/5">
                  {PRESET_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPreset(option.value)}
                      className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-xl transition-all duration-300 ${
                        preset === option.value
                          ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_2px_10px_rgba(210,187,255,0.05)] scale-[1.01]'
                          : 'text-on-surface-variant hover:text-white border border-transparent'
                      }`}
                    >
                      <span className="text-xs font-bold">{option.label}</span>
                      <span className="text-[8px] opacity-75 mt-0.5 font-semibold tracking-wider uppercase">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Toggles (Crop, Sharpen) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.01] px-5 py-3 hover:border-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Smart Crop</span>
                    <span className="text-[9px] text-on-surface-variant font-medium mt-0.5">Optimize boundaries</span>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crop}
                      onChange={(event) => setCrop(event.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </div>
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.01] px-5 py-3 hover:border-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Neural Sharpen</span>
                    <span className="text-[9px] text-on-surface-variant font-medium mt-0.5">Accentuate clarity</span>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sharpen}
                      onChange={(event) => setSharpen(event.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </div>
                </label>
              </div>

              {/* 6. Buttons Area */}
              <div className="flex flex-wrap gap-4 pt-3">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile || isSubmitting}
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3.5 px-6 text-xs font-extrabold tracking-wide uppercase transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100 shadow-[0_4px_20px_rgba(124,58,237,0.3)] cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-[18px]">magic_button</span>
                  {isSubmitting ? 'AI Model Running...' : 'Execute AI Pipeline'}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setResponseData(null);
                    setError('');
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all cursor-pointer active:scale-95 select-none"
                >
                  Reset
                </button>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-xs font-semibold text-red-300 flex items-start gap-2 animate-pulse-glow">
                  <span className="material-symbols-outlined text-[16px] text-red-400 mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT SECTION: PREVIEW & RESULT PANEL */}
          <section className="bg-slate-900/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.4)] flex flex-col h-full min-h-[580px]">
            {responseData ? (
              <div className="flex flex-col h-full justify-between">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent-cyan">Comparison Console</span>
                    <h2 className="mt-1 text-2.5xl font-display font-extrabold text-white tracking-tight">AI Output</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300">
                    <span className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">image</span>
                      {outputFormat}
                    </span>
                    <span className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] animate-pulse">timer</span>
                      {responseData.processingTime || 'Done'}
                    </span>
                  </div>
                </div>

                {/* Compare Screen */}
                <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/80 aspect-[4/3] w-full flex items-center justify-center shadow-inner group/canvas">
                  {previewUrl && (
                    <>
                      {outputImageUrl ? (
                        <>
                          <div
                            className="absolute inset-0 bg-center bg-contain bg-no-repeat w-full h-full"
                            style={{ backgroundImage: `url(${outputImageUrl})` }}
                          />
                          <div className="absolute inset-0 w-full h-full" style={compareClip}>
                            <div
                              className="absolute inset-0 bg-center bg-contain bg-no-repeat w-full h-full"
                              style={{ backgroundImage: `url(${previewUrl})` }}
                            />
                          </div>
                        </>
                      ) : (
                        <div
                          className="absolute inset-0 bg-center bg-contain bg-no-repeat w-full h-full"
                          style={{ backgroundImage: `url(${previewUrl})` }}
                        />
                      )}

                      {outputImageUrl && (
                        <>
                          <div
                            className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-gradient-to-b from-cyan-400 via-primary to-violet-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                            style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
                          />
                          <div
                            className="pointer-events-none absolute top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/40 bg-slate-950/90 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover/canvas:scale-110 transition-transform duration-300"
                            style={{ left: `${splitPosition}%`, transform: 'translate(-50%, -50%)' }}
                          >
                            <span className="material-symbols-outlined text-[16px] font-bold">drag_indicator</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={splitPosition}
                            onChange={(event) => setSplitPosition(Number(event.target.value))}
                            className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
                          />
                          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/5 px-2.5 py-1 text-[8px] font-extrabold tracking-[0.22em] text-gray-300">
                            BEFORE
                          </div>
                          <div className="pointer-events-none absolute right-4 top-4 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/5 px-2.5 py-1 text-[8px] font-extrabold tracking-[0.22em] text-primary">
                            AFTER
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Controls Area */}
                <div className="mt-6 flex flex-wrap gap-4">
                  <button
                    onClick={handleDownload}
                    disabled={!outputImageUrl}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary hover:bg-cyan-400 text-slate-950 py-3.5 px-6 text-xs font-extrabold tracking-wide uppercase transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_4px_15px_rgba(76,215,246,0.15)] cursor-pointer select-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download Asset
                  </button>
                  {outputImageUrl && (
                    <a
                      href={outputImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all cursor-pointer active:scale-95 select-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      Open Raw File
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.01] px-8 py-12 text-center relative overflow-hidden group/empty min-h-[460px]">
                {/* Floating gradient circles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-secondary/5 rounded-full blur-[80px] pointer-events-none group-hover/empty:scale-125 transition-transform duration-700" />
                
                <div className="w-16 h-16 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-center mb-6 relative z-10 group-hover/empty:scale-105 group-hover/empty:border-secondary/20 transition-all duration-300 shadow-lg">
                  <span className="material-symbols-outlined text-[28px] text-secondary animate-pulse-glow">hourglass_empty</span>
                </div>
                
                <h3 className="text-lg font-display font-extrabold text-white tracking-tight relative z-10">
                  Awaiting Pipeline Output
                </h3>
                <p className="mt-2.5 max-w-sm text-xs text-on-surface-variant/90 leading-relaxed relative z-10 font-medium">
                  Select a photo, pick your AI mode, and execute the pipeline. The interactive comparison screen will appear here once the server finishes processing.
                </p>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}