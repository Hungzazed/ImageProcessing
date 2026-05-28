'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function LandingPage() {
  const router = useRouter();
  const { accessToken, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Spotlight mouse effect
  useEffect(() => {
    if (!mounted) return;
    const handleMouseMove = (e: MouseEvent) => {
      setSpotlightPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mounted]);

  // Before/After Slider drag handlers
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let position = (x / rect.width) * 100;
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    setSliderPosition(position);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleSliderMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    if (e.touches && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (isDragging.current) {
        handleSliderMove(e.clientX);
      }
    };
    const handleTouchMoveGlobal = (e: TouchEvent) => {
      if (isDragging.current && e.touches && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMoveGlobal);
    window.addEventListener('touchmove', handleTouchMoveGlobal);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('touchmove', handleTouchMoveGlobal);
    };
  }, [mounted]);

  // 3D Tilt hover card effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, target: HTMLDivElement) => {
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleCardMouseLeave = (target: HTMLDivElement) => {
    target.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  const isLoggedIn = !!accessToken;

  return (
    <div className="relative min-h-screen bg-[#070d1d] text-[#dae2fd] overflow-x-hidden selection:bg-[#d2bbff]/30 font-sans">
      {/* Stylesheets & Fonts Injection */}
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Spotlight Hover Interaction Background */}
      <div 
        className="spotlight pointer-events-none fixed inset-0 z-1" 
        style={{
          background: `radial-gradient(600px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(210, 187, 255, 0.07), transparent 40%)`
        }}
      />
      <div className="fixed inset-0 noise-texture z-50 pointer-events-none opacity-[0.03]" />
      <div className="fixed inset-0 cyber-grid pointer-events-none opacity-20" />

      {/* ── Navigation Header ─────────────────────────────────────────── */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-[100] flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[#0d1629]/60 px-5 py-3 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] md:px-7">

        {/* Brand */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#d2bbff]/20 to-[#4cd7f6]/10 border border-[#d2bbff]/25 shadow-[0_0_16px_rgba(210,187,255,0.2)] transition-shadow group-hover:shadow-[0_0_24px_rgba(210,187,255,0.35)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L5.5 7L8.5 10.5L11 7.5L14 12H2Z" fill="url(#nav-g)" opacity="0.9"/>
              <circle cx="11.5" cy="4.5" r="2" fill="#d2bbff"/>
              <defs>
                <linearGradient id="nav-g" x1="2" y1="7" x2="14" y2="12">
                  <stop stopColor="#d2bbff"/>
                  <stop offset="1" stopColor="#4cd7f6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-black tracking-tight text-white transition-colors group-hover:text-[#d2bbff]">
            Lumina<span className="text-[#d2bbff] group-hover:text-white transition-colors">.</span>
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {[
            { label: 'Gallery', href: '/' },
            { label: 'Features', href: '#features' },
            { label: 'Showcase', href: '#showcase' },
            { label: 'Performance', href: '#stats' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="rounded-full px-4 py-1.5 text-[13px] font-medium text-[#ccc3d8]/70 transition-all hover:bg-white/5 hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right: auth-aware CTA */}
        <div className="flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* User chip */}
              <div className="hidden items-center gap-2 rounded-full border border-[#d2bbff]/20 bg-[#d2bbff]/5 pl-1 pr-3.5 py-1 sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#d2bbff] to-[#7c3aed] text-[10px] font-bold text-white shadow-[0_0_10px_rgba(210,187,255,0.3)]">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-[12px] font-semibold text-white">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-xl bg-gradient-to-r from-[#d2bbff] to-[#a78bfa] px-5 py-2 text-[13px] font-bold text-[#2d0060] shadow-[0_0_20px_rgba(210,187,255,0.3)] transition-all hover:brightness-110 hover:shadow-[0_0_28px_rgba(210,187,255,0.5)] active:scale-95 cursor-pointer"
              >
                Control Center
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/auth/login')}
                className="hidden rounded-full px-4 py-1.5 text-[13px] font-medium text-[#ccc3d8]/70 transition-all hover:bg-white/5 hover:text-white sm:block cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="rounded-xl bg-gradient-to-r from-[#d2bbff] to-[#a78bfa] px-5 py-2 text-[13px] font-bold text-[#2d0060] shadow-[0_0_20px_rgba(210,187,255,0.3)] transition-all hover:brightness-110 hover:shadow-[0_0_28px_rgba(210,187,255,0.5)] active:scale-95 cursor-pointer"
              >
                Get started →
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Header Section */}
      <header className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Lumina Hero" 
            className="w-full h-full object-cover scale-105 opacity-60" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdvGxDmeVBH-OMka8cx2uAQR1XM8GUZzvrDtiFBDBWMHhdNf-6ql_HGjdRCL58H38YwBmOL5exlbsdFqZrULII-IkOA9OOsSqCnfy2GAwRJzHDQdVIE82epA-unrxtsVA93RoHUv0o3KAMkYqyqMdhtqCvSH3M809YAUlwOgaEawslJ8UdeAvIFCEzalLKHq8jjjkQLYR6ohWS7uji6GUlgz0F5rUAw5DV5eG5BOaR0uVyIjXVZtjpJwga0aJsOVnIA0x61IvY66w"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070d1d] via-[#070d1d]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#070d1d]/80 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(210,187,255,0.2)_0%,transparent_70%)] mix-blend-screen opacity-30" />
        </div>
        
        <div className="container mx-auto px-6 md:px-16 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 max-w-4xl text-left">
              <div className="inline-flex items-center gap-3 px-5 py-1.5 rounded-full border border-[#d2bbff]/20 bg-[#d2bbff]/5 text-[#d2bbff] mb-6 backdrop-blur-md">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">Aesthetic Intelligence v4.0</span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] text-[44px] sm:text-[64px] md:text-[84px] mb-6 leading-[0.98] tracking-tighter text-white font-extrabold">
                Redefining the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d2bbff] via-[#4cd7f6] to-white drop-shadow-[0_0_30px_rgba(210,187,255,0.4)]">
                  Future of Vision.
                </span>
              </h1>
              <p className="font-['Inter'] text-sm md:text-base text-[#ccc3d8]/90 max-w-xl mb-10 leading-relaxed">
                Lumina Studio orchestrates neural rendering with visionary aesthetic intelligence to transform your raw captures into immersive cinematic masterpieces.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/login')}
                  className="bg-white text-black px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all group cursor-pointer text-sm"
                >
                  {isLoggedIn ? 'Access Studio' : 'Start Creating'}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-sm font-bold">east</span>
                </button>
                <a 
                  href="#showcase"
                  className="glass-panel px-8 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/5 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-sm text-white"
                >
                  <span className="material-symbols-outlined text-sm font-bold">play_circle</span>
                  View Showcase
                </a>
              </div>
            </div>

            {/* Floating UI Hologram Decoration */}
            <div className="lg:col-span-5 hidden lg:flex justify-end perspective-1000">
              <div className="tilt-card glass-panel rounded-3xl p-8 border-[#d2bbff]/10 w-[420px] h-[340px] relative floating-hologram">
                <div className="absolute inset-0 bg-[#d2bbff]/5 rounded-3xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d2bbff] to-transparent animate-[shimmer_3s_infinite]" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#d2bbff]" />
                    </div>
                    <span className="text-[9px] font-mono text-[#d2bbff] tracking-wider opacity-60">ANALYZING GEOMETRY...</span>
                  </div>
                  <div className="flex-grow flex items-center justify-center py-4">
                    <span className="material-symbols-outlined text-[80px] text-[#d2bbff]/30 animate-pulse">model_training</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-auto">
                    <div className="h-1.5 bg-[#d2bbff]/20 rounded-full" />
                    <div className="h-1.5 bg-[#d2bbff]/20 rounded-full" />
                    <div className="h-1.5 bg-[#d2bbff]/40 rounded-full" />
                    <div className="h-1.5 bg-[#d2bbff]/10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Trusted By / Standards section */}
      <section className="py-12 relative z-10 border-y border-white/5 bg-[#060e20]/30 backdrop-blur-md w-full">
        <div className="container mx-auto px-6 md:px-16 w-full">
          <p className="text-center text-[10px] font-mono text-[#ccc3d8]/40 mb-8 uppercase tracking-[0.4em] font-semibold">Integrated With Global Standards</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24 opacity-30 select-none font-bold tracking-widest text-xs md:text-sm font-mono text-[#dae2fd]">
            <div>NEURAL_NET</div>
            <div>VIRTUAL_VISION</div>
            <div>QUANTUM_PIX</div>
            <div>AESTHETIC_CORE</div>
          </div>
        </div>
      </section>

      {/* Capabilities Feature Grid */}
      <section id="features" className="py-24 container mx-auto px-6 md:px-16 w-full">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="font-['Plus_Jakarta_Sans'] text-3xl md:text-5xl font-black mb-4 text-white">Infinite Capabilities.</h2>
          <p className="font-['Inter'] text-sm md:text-base text-[#ccc3d8]/70">Our specialized neural modules handle every pixel with clinical precision.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div 
            onMouseMove={(e) => handleCardMouseMove(e, e.currentTarget)}
            onMouseLeave={(e) => handleCardMouseLeave(e.currentTarget)}
            className="tilt-card glass-panel rounded-3xl p-8 flex flex-col group hover:shadow-[0_0_40px_rgba(210,187,255,0.15)] hover:border-[#d2bbff]/30 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#d2bbff]/10 flex items-center justify-center mb-6 border border-[#d2bbff]/20 overflow-hidden">
              <img 
                alt="Enhance" 
                className="w-full h-full object-cover scale-[4] translate-x-[-12%] translate-y-[-12%]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdKTGuqjKzzc1X0lb3MIt2slCISHGzVeiohcEv1AdoHWc7TbxFzLhsOUbzvGfXnqCqnv-lPpVuHq7y_o33CAfcZPcRDAXjGaNw3YSNRiDDOOXZfRqJKhdwFVYkY45E7dEmMecU3jKQJQ37-QAbRjDjcPmt6vr8vO51dycaAE6YbLnnHxQ3hVifTnKdBkcxC2tpuiZMf1roesCrui03kMk2YjoWEhGv-Xt3644uE03Iz0e3CsDb-a6CJ6Lc8kazSO-i4PCbazEkMPc"
              />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">Intelligent Enhance</h3>
            <p className="text-xs text-[#ccc3d8]/80 leading-relaxed font-['Inter']">Automatically balance exposures and skin tones using cinematic lighting models.</p>
          </div>

          {/* Card 2 */}
          <div 
            onMouseMove={(e) => handleCardMouseMove(e, e.currentTarget)}
            onMouseLeave={(e) => handleCardMouseLeave(e.currentTarget)}
            className="tilt-card glass-panel rounded-3xl p-8 flex flex-col group hover:shadow-[0_0_40px_rgba(210,187,255,0.15)] hover:border-[#d2bbff]/30 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#d2bbff]/10 flex items-center justify-center mb-6 border border-[#d2bbff]/20 overflow-hidden">
              <img 
                alt="Restore" 
                className="w-full h-full object-cover scale-[4] translate-x-[12%] translate-y-[-12%]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdKTGuqjKzzc1X0lb3MIt2slCISHGzVeiohcEv1AdoHWc7TbxFzLhsOUbzvGfXnqCqnv-lPpVuHq7y_o33CAfcZPcRDAXjGaNw3YSNRiDDOOXZfRqJKhdwFVYkY45E7dEmMecU3jKQJQ37-QAbRjDjcPmt6vr8vO51dycaAE6YbLnnHxQ3hVifTnKdBkcxC2tpuiZMf1roesCrui03kMk2YjoWEhGv-Xt3644uE03Iz0e3CsDb-a6CJ6Lc8kazSO-i4PCbazEkMPc"
              />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">Detail Restoration</h3>
            <p className="text-xs text-[#ccc3d8]/80 leading-relaxed font-['Inter']">Breathe life into old archives by reconstructing high-frequency details from raw noise.</p>
          </div>

          {/* Card 3 */}
          <div 
            onMouseMove={(e) => handleCardMouseMove(e, e.currentTarget)}
            onMouseLeave={(e) => handleCardMouseLeave(e.currentTarget)}
            className="tilt-card glass-panel rounded-3xl p-8 flex flex-col group hover:shadow-[0_0_40px_rgba(210,187,255,0.15)] hover:border-[#d2bbff]/30 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#d2bbff]/10 flex items-center justify-center mb-6 border border-[#d2bbff]/20 overflow-hidden">
              <img 
                alt="Super-Res" 
                className="w-full h-full object-cover scale-[4] translate-x-[36%] translate-y-[-12%]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdKTGuqjKzzc1X0lb3MIt2slCISHGzVeiohcEv1AdoHWc7TbxFzLhsOUbzvGfXnqCqnv-lPpVuHq7y_o33CAfcZPcRDAXjGaNw3YSNRiDDOOXZfRqJKhdwFVYkY45E7dEmMecU3jKQJQ37-QAbRjDjcPmt6vr8vO51dycaAE6YbLnnHxQ3hVifTnKdBkcxC2tpuiZMf1roesCrui03kMk2YjoWEhGv-Xt3644uE03Iz0e3CsDb-a6CJ6Lc8kazSO-i4PCbazEkMPc"
              />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">Super-Resolution</h3>
            <p className="text-xs text-[#ccc3d8]/80 leading-relaxed font-['Inter']">Upscale assets up to 16k for large-scale print and IMAX-level display requirements.</p>
          </div>

          {/* Card 4 */}
          <div 
            onMouseMove={(e) => handleCardMouseMove(e, e.currentTarget)}
            onMouseLeave={(e) => handleCardMouseLeave(e.currentTarget)}
            className="tilt-card glass-panel rounded-3xl p-8 flex flex-col group hover:shadow-[0_0_40px_rgba(210,187,255,0.15)] hover:border-[#d2bbff]/30 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#d2bbff]/10 flex items-center justify-center mb-6 border border-[#d2bbff]/20 overflow-hidden">
              <img 
                alt="Remove" 
                className="w-full h-full object-cover scale-[4] translate-x-[60%] translate-y-[-12%]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdKTGuqjKzzc1X0lb3MIt2slCISHGzVeiohcEv1AdoHWc7TbxFzLhsOUbzvGfXnqCqnv-lPpVuHq7y_o33CAfcZPcRDAXjGaNw3YSNRiDDOOXZfRqJKhdwFVYkY45E7dEmMecU3jKQJQ37-QAbRjDjcPmt6vr8vO51dycaAE6YbLnnHxQ3hVifTnKdBkcxC2tpuiZMf1roesCrui03kMk2YjoWEhGv-Xt3644uE03Iz0e3CsDb-a6CJ6Lc8kazSO-i4PCbazEkMPc"
              />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">Neural Removal</h3>
            <p className="text-xs text-[#ccc3d8]/80 leading-relaxed font-['Inter']">Clean complex backgrounds with context-aware inpainting that defies detection.</p>
          </div>
        </div>
      </section>

      {/* Before/After Interactive Comparison Section */}
      <section id="showcase" className="py-24 bg-[#060e20]/20 w-full border-y border-white/5">
        <div className="container mx-auto px-6 md:px-16 text-center mb-16 w-full">
          <h2 className="font-['Plus_Jakarta_Sans'] text-3xl md:text-5xl font-black mb-4 text-white">The Lumina Difference</h2>
          <p className="font-['Inter'] text-sm md:text-base text-[#ccc3d8]/70">Precision engineering meets artistic intent.</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative w-full select-none">
          <div 
            ref={sliderContainerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="relative aspect-[21/9] rounded-[24px] md:rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(210,187,255,0.1)] group cursor-ew-resize"
          >
            {/* Glowing borders */}
            <div className="absolute inset-0 border-[8px] md:border-[16px] border-[#171f33]/40 z-20 pointer-events-none" />
            
            {/* After Image (Standard full render) */}
            <img 
              alt="After Restoration" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjT5qef6Vb1HdJxckfw1w5OPj25gJYC0cpWjDZ6fAEm_ampS6IkcyVfZ-LDoR3FuIV9eDbrArXe78qcTzXO0oQ8HPjkXDZ6aer8AC5KX_YEps5p1v2WrwngbHDQTu-sJ5x5zSccNVos3c4k9aJ_IzNec0o0kBZG0i_SAF1YMjaJ32rVPtJUzo16rBLxw-RBp2dG7EFybNsb4IoDb4rrHHJYySLbHkowzW-LEEijWMQrfXWiq72w5MfhxRU3i1i8HT2Wdm1ns2MUkM"
            />
            
            {/* Before Image (Clipped Left Side) */}
            <div 
              className="absolute inset-0 z-10 overflow-hidden" 
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
              <img 
                alt="Before Restoration" 
                className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.35] contrast-[0.9] pointer-events-none" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjT5qef6Vb1HdJxckfw1w5OPj25gJYC0cpWjDZ6fAEm_ampS6IkcyVfZ-LDoR3FuIV9eDbrArXe78qcTzXO0oQ8HPjkXDZ6aer8AC5KX_YEps5p1v2WrwngbHDQTu-sJ5x5zSccNVos3c4k9aJ_IzNec0o0kBZG0i_SAF1YMjaJ32rVPtJUzo16rBLxw-RBp2dG7EFybNsb4IoDb4rrHHJYySLbHkowzW-LEEijWMQrfXWiq72w5MfhxRU3i1i8HT2Wdm1ns2MUkM"
              />
            </div>

            {/* Interactive Labels */}
            <div className="absolute top-6 left-6 md:top-12 md:left-12 z-30 font-mono bg-black/60 backdrop-blur-xl px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-white/10 tracking-widest text-[9px] md:text-[10px] text-white">
              LEGACY RAW
            </div>
            <div className="absolute top-6 right-6 md:top-12 md:right-12 z-30 font-mono bg-[#d2bbff]/15 backdrop-blur-xl px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-[#d2bbff]/30 tracking-widest text-[9px] md:text-[10px] text-[#d2bbff] font-semibold">
              LUMINA MASTER
            </div>

            {/* Sliding Divider Line */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-[#d2bbff] z-40 shadow-[0_0_30px_#d2bbff] pointer-events-none" 
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full flex items-center justify-center shadow-2xl">
                <span className="material-symbols-outlined text-white text-[16px] md:text-[20px] font-bold">unfold_more</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Stats Metrics */}
      <section id="stats" className="py-24 container mx-auto px-6 md:px-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-10 rounded-[32px] text-center hover:border-[#d2bbff]/20 transition-all duration-300">
            <div className="font-['Plus_Jakarta_Sans'] text-5xl md:text-6xl text-[#d2bbff] mb-2 font-black">72<span className="text-2xl font-bold">%</span></div>
            <div className="text-base font-semibold text-white/90 font-['Plus_Jakarta_Sans']">Efficiency Gain</div>
            <p className="font-mono text-[9px] text-[#ccc3d8]/50 mt-4 uppercase tracking-widest font-bold">Neural Compression</p>
          </div>
          <div className="glass-panel p-10 rounded-[32px] text-center border-[#4cd7f6]/20 hover:border-[#4cd7f6]/40 transition-all duration-300">
            <div className="font-['Plus_Jakarta_Sans'] text-5xl md:text-6xl text-[#4cd7f6] mb-2 font-black">850<span className="text-2xl font-bold">ms</span></div>
            <div className="text-base font-semibold text-white/90 font-['Plus_Jakarta_Sans']">Inference Speed</div>
            <p className="font-mono text-[9px] text-[#ccc3d8]/50 mt-4 uppercase tracking-widest font-bold">Real-time rendering</p>
          </div>
          <div className="glass-panel p-10 rounded-[32px] text-center hover:border-[#d2bbff]/20 transition-all duration-300">
            <div className="font-['Plus_Jakarta_Sans'] text-5xl md:text-6xl text-white mb-2 font-black">50M<span className="text-2xl font-bold">+</span></div>
            <div className="text-base font-semibold text-white/90 font-['Plus_Jakarta_Sans']">Pixels Processed</div>
            <p className="font-mono text-[9px] text-[#ccc3d8]/50 mt-4 uppercase tracking-widest font-bold">Global Throughput</p>
          </div>
        </div>
      </section>

      {/* CTA Final Invitation Section */}
      <section className="py-24 relative overflow-hidden w-full px-6 md:px-16">
        <div className="container mx-auto max-w-4xl relative z-10 text-center w-full">
          <div className="glass-panel p-8 md:p-16 rounded-[40px] border-[#d2bbff]/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#d2bbff]/5 group-hover:bg-[#d2bbff]/10 transition-colors duration-700 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#d2bbff]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#4cd7f6]/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 py-4">
              <h2 className="font-['Plus_Jakarta_Sans'] text-[36px] sm:text-[48px] md:text-[64px] mb-6 leading-tight tracking-tighter text-white font-extrabold">
                Experience the <br/>
                <span className="text-[#d2bbff] italic">Intelligence.</span>
              </h2>
              <p className="font-['Inter'] text-sm md:text-base text-[#ccc3d8]/80 mb-10 max-w-lg mx-auto">
                Join the world's most innovative studios and start creating visuals that define the next decade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/login')}
                  className="bg-[#d2bbff] text-[#3f008e] px-10 py-4 rounded-xl font-black text-sm md:text-base hover:shadow-[0_0_50px_rgba(210,187,255,0.5)] hover:scale-105 active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
                >
                  {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
                </button>
                <button 
                  onClick={() => router.push('/auth/login')}
                  className="px-10 py-4 rounded-xl font-bold text-white border border-white/20 hover:bg-white/5 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto cursor-pointer text-sm md:text-base"
                >
                  Establish Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-white/[0.06] bg-[#060e20]/60 backdrop-blur-xl">
        {/* 1px shimmer top */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d2bbff]/15 to-transparent" />

        <div className="mx-auto max-w-7xl px-6 py-14 md:px-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">

            {/* Brand col */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d2bbff]/25 bg-gradient-to-br from-[#d2bbff]/20 to-[#4cd7f6]/10">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2 12L5.5 7L8.5 10.5L11 7.5L14 12H2Z" fill="#d2bbff" opacity="0.85"/>
                    <circle cx="11.5" cy="4.5" r="2" fill="#d2bbff"/>
                  </svg>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] text-[16px] font-black text-white">
                  Lumina<span className="text-[#d2bbff]">.</span>
                </span>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-[#ccc3d8]/60 font-['Inter']">
                Architecting the future of visual reality through proprietary Aesthetic Intelligence.
              </p>
              <div className="flex gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-[#ccc3d8]/60 transition-all hover:border-[#d2bbff]/30 hover:text-[#d2bbff] cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">public</span>
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-[#ccc3d8]/60 transition-all hover:border-[#d2bbff]/30 hover:text-[#d2bbff] cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">share</span>
                </button>
              </div>
            </div>

            {/* Link cols */}
            {[
              { title: 'Product', links: ['Neural Studio', 'API Gateway', 'Documentation'] },
              { title: 'Legal', links: ['Privacy Architecture', 'Terms of Protocol', 'Service Agreement'] },
              { title: 'Support', links: ['Help Systems', 'Live Neural Chat', 'System Status'] },
            ].map(({ title, links }) => (
              <div key={title} className="flex flex-col gap-3">
                <h4 className="mb-1 text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-white/50">{title}</h4>
                {links.map((l) => (
                  <a key={l} href="#" className="text-xs font-medium text-[#ccc3d8]/55 transition-colors hover:text-[#d2bbff]">{l}</a>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-8 sm:flex-row">
            <p className="text-[10px] text-[#ccc3d8]/35">© 2026 Lumina Studio. Designed for the Future of Sight.</p>
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  <span className="text-[10px] text-[#ccc3d8]/40">{user?.email || 'Authenticated'}</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d2bbff]/35" />
                  <span className="text-[10px] text-[#ccc3d8]/35">Not signed in</span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
