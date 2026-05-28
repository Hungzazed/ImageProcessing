'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Search, 
  Cpu, 
  Maximize2, 
  RefreshCw, 
  Trash2, 
  Globe, 
  Share2, 
  Check 
} from 'lucide-react';

export default function LuminaLandingPage() {
  const [activeTab, setActiveTab] = useState('gallery');
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const compareContainerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // 1. Mouse Spotlight tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty('--x', `${e.clientX}px`);
        spotlightRef.current.style.setProperty('--y', `${e.clientY}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 2. Before/After Image Slider Dragging Handler
  const handleSliderMove = (clientX: number) => {
    if (!compareContainerRef.current) return;
    const rect = compareContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let position = (x / rect.width) * 100;
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    setSliderPos(position);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleSliderMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  };

  return (
    <div className="relative min-h-screen bg-[#070d1d] text-[#dae2fd] overflow-x-hidden font-sans select-none scroll-smooth">
      {/* 1. Dynamic Mouse-Tracking Spotlight */}
      <div 
        ref={spotlightRef}
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(210, 187, 255, 0.05), transparent 40%)`
        }}
      />

      {/* 2. Cyber grid texture background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0" 
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 rounded-2xl border border-white/5 bg-[#171f33]/40 backdrop-blur-2xl shadow-2xl flex justify-between items-center px-6 sm:px-10 py-4 transition-all duration-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#d2bbff] rounded-lg flex items-center justify-center rotate-45 shadow-[0_0_20px_#d2bbff]">
            <Sparkles className="text-[#3f008e] -rotate-45" size={14} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white font-sans uppercase">
            Lumina<span className="text-[#d2bbff]">.</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {[
            { id: 'gallery', name: 'Gallery' },
            { id: 'features', name: 'Features' },
            { id: 'enterprise', name: 'Enterprise' },
            { id: 'pricing', name: 'Pricing' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-1 text-sm font-semibold tracking-wide transition-all ${
                activeTab === tab.id ? 'text-[#d2bbff]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.name}
              {activeTab === tab.id && (
                <motion.span 
                  layoutId="navIndicator" 
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d2bbff] rounded-full" 
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button className="text-gray-400 hover:text-[#d2bbff] transition-all cursor-pointer">
            <Search size={18} />
          </button>
          <button className="bg-[#d2bbff] text-[#3f008e] px-5 sm:px-8 py-2.5 rounded-xl font-semibold text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 cursor-pointer">
            Join Beta
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        {/* Ambient image background */}
        <div className="absolute inset-0 z-0">
          <img 
            alt="Lumina Hero background" 
            className="w-full h-full object-cover scale-105 opacity-30 select-none pointer-events-none" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdvGxDmeVBH-OMka8cx2uAQR1XM8GUZzvrDtiFBDBWMHhdNf-6ql_HGjdRCL58H38YwBmOL5exlbsdFqZrULII-IkOA9OOsSqCnfy2GAwRJzHDQdVIE82epA-unrxtsVA93RoHUv0o3KAMkYqyqMdhtqCvSH3M809YAUlwOgaEawslJ8UdeAvIFCEzalLKHq8jjjkQLYR6ohWS7uji6GUlgz0F5rUAw5DV5eG5BOaR0uVyIjXVZtjpJwga0aJsOVnIA0x61IvY66w"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070d1d] via-[#070d1d]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070d1d]/90 via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-6 sm:px-12 md:px-16 lg:px-20 relative z-10">
          <div className="max-w-4xl space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[#d2bbff]/20 bg-[#d2bbff]/5 text-[#d2bbff] backdrop-blur-md"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] tracking-[0.2em] font-bold uppercase font-mono">Aesthetic Intelligence v4.0</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-white"
            >
              Redefining the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d2bbff] via-[#4cd7f6] to-white drop-shadow-[0_0_35px_rgba(210,187,255,0.35)]">
                Future of Vision.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl leading-relaxed font-light"
            >
              Lumina Studio orchestrates neural rendering with visionary aesthetic intelligence to transform your raw captures into immersive cinematic masterpieces.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <button className="bg-white text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all group cursor-pointer text-sm">
                Start Creating 
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-xl font-bold bg-[#171f33]/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer text-sm">
                <Play size={16} fill="currentColor" />
                View Showcase
              </button>
            </motion.div>
          </div>
        </div>

        {/* Floating Interactive 3D Hologram Frame */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[48%] hidden xl:block perspective-1000">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-[580px] h-[380px] rounded-3xl p-8 border border-white/10 bg-[#171f33]/30 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative overflow-hidden"
          >
            {/* Hologram loading glow lines */}
            <div className="absolute inset-0 bg-[#d2bbff]/5 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d2bbff] to-transparent animate-[shimmer_3s_infinite]" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ffafd3]" />
                  <div className="w-3 h-3 rounded-full bg-[#4cd7f6]" />
                  <div className="w-3 h-3 rounded-full bg-[#d2bbff]" />
                </div>
                <span className="text-[9px] tracking-widest text-[#d2bbff] opacity-60 font-mono">ANALYZING GEOMETRY...</span>
              </div>
              
              <div className="flex-grow flex items-center justify-center">
                <Cpu size={120} className="text-[#d2bbff]/30 animate-pulse" />
              </div>
              
              <div className="mt-auto grid grid-cols-4 gap-4">
                <div className="h-2 bg-[#d2bbff]/20 rounded-full" />
                <div className="h-2 bg-[#d2bbff]/20 rounded-full" />
                <div className="h-2 bg-[#d2bbff]/40 rounded-full animate-pulse" />
                <div className="h-2 bg-[#d2bbff]/10 rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Trusted By Standards Section */}
      <section className="py-16 relative z-10 border-y border-white/5 bg-[#060e20]/30 backdrop-blur-md">
        <div className="container mx-auto px-6 sm:px-12">
          <p className="text-center text-[10px] uppercase tracking-[0.4em] font-mono text-gray-500 mb-8">Integrated With Global Standards</p>
          <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 lg:gap-32 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {['NEURAL_NET', 'VIRTUAL_VISION', 'QUANTUM_PIX', 'AESTHETIC_CORE'].map(brand => (
              <span key={brand} className="font-extrabold tracking-widest text-sm text-gray-400 font-mono hover:text-[#d2bbff] transition-all">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Capability Modules Grid */}
      <section className="py-24 container mx-auto px-6 sm:px-12 md:px-16 lg:px-20">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-sans">Infinite Capabilities.</h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">Our specialized neural modules handle every pixel with clinical precision.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Intelligent Enhance',
              desc: 'Automatically balance exposures and skin tones using cinematic lighting models.',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdKTGuqjKzzc1X0lb3MIt2slCISHGzVeiohcEv1AdoHWc7TbxFzLhsOUbzvGfXnqCqnv-lPpVuHq7y_o33CAfcZPcRDAXjGaNw3YSNRiDDOOXZfRqJKhdwFVYkY45E7dEmMecU3jKQJQ37-QAbRjDjcPmt6vr8vO51dycaAE6YbLnnHxQ3hVifTnKdBkcxC2tpuiZMf1roesCrui03kMk2YjoWEhGv-Xt3644uE03Iz0e3CsDb-a6CJ6Lc8kazSO-i4PCbazEkMPc',
              clip: 'scale-[4] translate-x-[-12%] translate-y-[-12%]',
            },
            {
              title: 'Detail Restoration',
              desc: 'Breathe life into old archives by reconstructing high-frequency details from raw noise.',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdKTGuqjKzzc1X0lb3MIt2slCISHGzVeiohcEv1AdoHWc7TbxFzLhsOUbzvGfXnqCqnv-lPpVuHq7y_o33CAfcZPcRDAXjGaNw3YSNRiDDOOXZfRqJKhdwFVYkY45E7dEmMecU3jKQJQ37-QAbRjDjcPmt6vr8vO51dycaAE6YbLnnHxQ3hVifTnKdBkcxC2tpuiZMf1roesCrui03kMk2YjoWEhGv-Xt3644uE03Iz0e3CsDb-a6CJ6Lc8kazSO-i4PCbazEkMPc',
              clip: 'scale-[4] translate-x-[12%] translate-y-[-12%]',
            },
            {
              title: 'Super-Resolution',
              desc: 'Upscale assets up to 16k for large-scale print and IMAX-level display requirements.',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdKTGuqjKzzc1X0lb3MIt2slCISHGzVeiohcEv1AdoHWc7TbxFzLhsOUbzvGfXnqCqnv-lPpVuHq7y_o33CAfcZPcRDAXjGaNw3YSNRiDDOOXZfRqJKhdwFVYkY45E7dEmMecU3jKQJQ37-QAbRjDjcPmt6vr8vO51dycaAE6YbLnnHxQ3hVifTnKdBkcxC2tpuiZMf1roesCrui03kMk2YjoWEhGv-Xt3644uE03Iz0e3CsDb-a6CJ6Lc8kazSO-i4PCbazEkMPc',
              clip: 'scale-[4] translate-x-[36%] translate-y-[-12%]',
            },
            {
              title: 'Neural Removal',
              desc: 'Clean complex backgrounds with context-aware inpainting that defies detection.',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdKTGuqjKzzc1X0lb3MIt2slCISHGzVeiohcEv1AdoHWc7TbxFzLhsOUbzvGfXnqCqnv-lPpVuHq7y_o33CAfcZPcRDAXjGaNw3YSNRiDDOOXZfRqJKhdwFVYkY45E7dEmMecU3jKQJQ37-QAbRjDjcPmt6vr8vO51dycaAE6YbLnnHxQ3hVifTnKdBkcxC2tpuiZMf1roesCrui03kMk2YjoWEhGv-Xt3644uE03Iz0e3CsDb-a6CJ6Lc8kazSO-i4PCbazEkMPc',
              clip: 'scale-[4] translate-x-[60%] translate-y-[-12%]',
            }
          ].map((item, index) => (
            <div 
              key={index}
              className="group p-6 rounded-3xl border border-white/5 bg-[#171f33]/30 backdrop-blur-2xl shadow-xl hover:shadow-[#d2bbff]/10 hover:border-[#d2bbff]/20 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#d2bbff]/10 border border-[#d2bbff]/25 overflow-hidden mb-6">
                <img 
                  alt={item.title} 
                  className={`w-full h-full object-cover select-none pointer-events-none ${item.clip}`} 
                  src={item.img}
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Before/After Comparison Tool */}
      <section className="py-24 bg-[#060e20]/40">
        <div className="container mx-auto px-6 sm:px-12 text-center mb-16 space-y-2">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">The Lumina Difference</h2>
          <p className="text-base sm:text-lg text-gray-400">Precision engineering meets artistic intent.</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative">
          <div 
            ref={compareContainerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchEnd={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            className="relative aspect-[21/9] rounded-[32px] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(210,187,255,0.1)] select-none cursor-ew-resize"
          >
            {/* Outer framing wrapper */}
            <div className="absolute inset-0 border-[16px] border-[#171f33]/50 z-20 pointer-events-none" />

            {/* After Image (Full Background) */}
            <img 
              alt="After Restoration" 
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjT5qef6Vb1HdJxckfw1w5OPj25gJYC0cpWjDZ6fAEm_ampS6IkcyVfZ-LDoR3FuIV9eDbrArXe78qcTzXO0oQ8HPjkXDZ6aer8AC5KX_YEps5p1v2WrwngbHDQTu-sJ5x5zSccNVos3c4k9aJ_IzNec0o0kBZG0i_SAF1YMjaJ32rVPtJUzo16rBLxw-RBp2dG7EFybNsb4IoDb4rrHHJYySLbHkowzW-LEEijWMQrfXWiq72w5MfhxRU3i1i8HT2Wdm1ns2MUkM"
            />

            {/* Before Image (Clipping Layer) */}
            <div 
              className="absolute inset-0 z-10 overflow-hidden" 
              style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
            >
              <img 
                alt="Before Restoration" 
                className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 select-none pointer-events-none" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjT5qef6Vb1HdJxckfw1w5OPj25gJYC0cpWjDZ6fAEm_ampS6IkcyVfZ-LDoR3FuIV9eDbrArXe78qcTzXO0oQ8HPjkXDZ6aer8AC5KX_YEps5p1v2WrwngbHDQTu-sJ5x5zSccNVos3c4k9aJ_IzNec0o0kBZG0i_SAF1YMjaJ32rVPtJUzo16rBLxw-RBp2dG7EFybNsb4IoDb4rrHHJYySLbHkowzW-LEEijWMQrfXWiq72w5MfhxRU3i1i8HT2Wdm1ns2MUkM"
              />
            </div>

            {/* Label Tags */}
            <div className="absolute top-10 left-10 z-30 bg-black/60 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 tracking-widest text-[9px] font-mono text-gray-400">
              LEGACY RAW
            </div>
            <div className="absolute top-10 right-10 z-30 bg-[#d2bbff]/10 backdrop-blur-xl px-5 py-2 rounded-full border border-[#d2bbff]/20 tracking-widest text-[9px] font-mono text-[#d2bbff]">
              LUMINA MASTER
            </div>

            {/* Draggable Slider Line */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-[#d2bbff] z-40 shadow-[0_0_20px_#d2bbff]"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full flex items-center justify-center shadow-2xl">
                <Maximize2 size={16} className="text-white rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Performance Stats */}
      <section className="py-24 container mx-auto px-6 sm:px-12 md:px-16 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { metric: '72%', label: 'Efficiency Gain', detail: 'Neural Compression' },
            { metric: '850ms', label: 'Inference Speed', detail: 'Real-time rendering' },
            { metric: '50M+', label: 'Pixels Processed', detail: 'Global Throughput' }
          ].map((stat, index) => (
            <div key={index} className="bg-[#171f33]/30 border border-white/5 backdrop-blur-2xl p-8 rounded-[24px] text-center">
              <h3 className="text-5xl font-black text-[#d2bbff] mb-2 tracking-tight drop-shadow-[0_0_10px_rgba(210,187,255,0.2)]">
                {stat.metric}
              </h3>
              <p className="font-semibold text-gray-200 text-sm mb-2">{stat.label}</p>
              <span className="text-[9px] tracking-wider text-gray-500 uppercase font-mono">{stat.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final Action CTA Block */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 sm:px-12 md:px-16 lg:px-20 relative z-10 text-center">
          <div className="max-w-4xl mx-auto bg-[#171f33]/30 border border-white/10 rounded-[32px] p-12 backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#d2bbff]/5 group-hover:bg-[#d2bbff]/10 transition-colors duration-700" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#d2bbff]/15 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#4cd7f6]/15 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-tight text-white">
                Experience the <br/>
                <span className="text-[#d2bbff] italic">Intelligence.</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto font-light text-sm sm:text-base leading-relaxed">
                Join the world's most innovative studios and start creating visuals that define the next decade.
              </p>
              <div className="flex flex-wrap gap-4 justify-center items-center pt-4">
                <button className="bg-[#d2bbff] text-[#3f008e] px-10 py-4 rounded-xl font-bold text-sm hover:shadow-[0_0_50px_rgba(210,187,255,0.5)] hover:scale-105 transition-all cursor-pointer">
                  Get Started Free
                </button>
                <button className="px-10 py-4 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition-all cursor-pointer text-sm">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-white/5 bg-[#060e20]/60 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <span className="font-black text-xl text-white uppercase tracking-wider font-sans">Lumina<span className="text-[#d2bbff]">.</span></span>
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Architecting the future of visual reality through proprietary Aesthetic Intelligence. Based in San Francisco.
            </p>
            <div className="flex gap-4 pt-2">
              <button className="w-10 h-10 rounded-xl bg-[#171f33]/40 border border-white/5 hover:border-[#d2bbff]/40 hover:text-[#d2bbff] flex items-center justify-center transition-all cursor-pointer">
                <Globe size={16} />
              </button>
              <button className="w-10 h-10 rounded-xl bg-[#171f33]/40 border border-white/5 hover:border-[#d2bbff]/40 hover:text-[#d2bbff] flex items-center justify-center transition-all cursor-pointer">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {[
            {
              title: 'Product',
              links: ['Neural Studio', 'API Gateway', 'Documentation', 'Changelog']
            },
            {
              title: 'Legal',
              links: ['Privacy Architecture', 'Terms of Protocol', 'Service Agreement']
            },
            {
              title: 'Support',
              links: ['Help Systems', 'Live Neural Chat', 'System Status']
            }
          ].map((col, index) => (
            <div key={index} className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-[#d2bbff] transition-colors font-light">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500 font-light">© 2024 Lumina Studio. Designed for the Future of Sight.</p>
        </div>
      </footer>
    </div>
  );
}
