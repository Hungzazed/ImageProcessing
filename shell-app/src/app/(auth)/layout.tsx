'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';

// ── Logo mark ─────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d2bbff" />
          <stop offset="1" stopColor="#4cd7f6" />
        </linearGradient>
      </defs>
      <rect width="30" height="30" rx="9" fill="url(#logo-g)" opacity="0.12" />
      <rect width="30" height="30" rx="9" stroke="url(#logo-g)" strokeWidth="1" opacity="0.3" />
      {/* mountain / image icon */}
      <path d="M6 22L11 14.5L15.5 19.5L19 15L24 22H6Z" fill="url(#logo-g)" opacity="0.85" />
      <circle cx="20.5" cy="10.5" r="3" fill="#d2bbff" opacity="0.9" />
    </svg>
  );
}

// ── User chip ─────────────────────────────────────────────────────────────────
function UserChip({ name, email }: { name: string; email?: string }) {
  const initial = name?.[0]?.toUpperCase() || '?';
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-[#d2bbff]/20 bg-[#d2bbff]/5 pl-1 pr-4 py-1 backdrop-blur-sm transition-all duration-200 hover:border-[#d2bbff]/40 hover:bg-[#d2bbff]/10 cursor-default">
      {/* avatar */}
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d2bbff] to-[#7c3aed] text-[11px] font-bold text-white shadow-[0_0_12px_rgba(210,187,255,0.35)]">
        {initial}
        {/* online dot */}
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-[#0b1326] bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
      </div>
      <div className="leading-tight">
        <p className="text-[13px] font-semibold text-white">{name}</p>
        {email && <p className="text-[10px] text-[#ccc3d8]/55 max-w-[160px] truncate">{email}</p>}
      </div>
    </div>
  );
}

// ── Auth action buttons (unauthenticated) ──────────────────────────────────────
function AuthButtons({ pathname }: { pathname: string }) {
  const isLogin = pathname.includes('login');
  const isRegister = pathname.includes('register');

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className={`
          rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200
          ${isLogin
            ? 'bg-[#d2bbff]/12 text-[#d2bbff] ring-1 ring-[#d2bbff]/25'
            : 'text-[#ccc3d8]/70 hover:text-white hover:bg-white/5'
          }
        `}
      >
        Sign in
      </Link>
      <Link
        href="/auth/register"
        className={`
          rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-200
          bg-gradient-to-r from-[#d2bbff] to-[#a78bfa] text-[#2d0060]
          shadow-[0_2px_20px_rgba(210,187,255,0.28)]
          hover:shadow-[0_2px_28px_rgba(210,187,255,0.45)]
          hover:brightness-110 active:scale-95
          ${isRegister ? 'brightness-110 shadow-[0_2px_28px_rgba(210,187,255,0.45)]' : ''}
        `}
      >
        Get started →
      </Link>
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#070d1d] text-[#dae2fd] select-none">

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-48 -top-48 h-96 w-96 rounded-full bg-[#7c3aed]/18 blur-[130px]" />
        <div className="absolute -right-24 -top-8 h-72 w-72 rounded-full bg-[#4cd7f6]/10 blur-[110px]" />
        <div className="absolute bottom-10 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-[#d2bbff]/6 blur-[90px]" />
      </div>

      {/* ═══════════════════════════════ HEADER ══════════════════════════════ */}
      <header className="relative z-20 shrink-0">
        <div className="flex items-center justify-between gap-4 bg-[#0b1326]/65 px-5 py-3 backdrop-blur-2xl md:px-8">

          {/* ── Brand ── */}
          <Link href="/" className="group flex items-center gap-3">
            <LogoMark />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] font-semibold uppercase tracking-[0.42em] text-[#ccc3d8]/45 transition-colors group-hover:text-[#d2bbff]/65">
                Lumina Studio
              </span>
              <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-white transition-colors group-hover:text-[#d2bbff]">
                Image Pipeline
              </span>
            </div>
          </Link>

          {/* ── Center status badge ── */}
          <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/3 px-3 py-1 md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4cd7f6] shadow-[0_0_6px_rgba(76,215,246,0.8)]" />
            <span className="text-[11px] font-medium text-[#ccc3d8]/60 tracking-wide">Auth workspace</span>
          </div>

          {/* ── Right: auth state ── */}
          {isAuthenticated && user ? (
            <UserChip name={user.name || 'User'} email={user.email} />
          ) : (
            <AuthButtons pathname={pathname || ''} />
          )}
        </div>

        {/* Shimmer divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#d2bbff]/18 to-transparent" />
      </header>

      {/* ═══════════════════════════════ BODY ════════════════════════════════ */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {children}
      </div>

      {/* ═══════════════════════════════ FOOTER ══════════════════════════════ */}
      <footer className="relative z-20 shrink-0">
        {/* Shimmer divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#d2bbff]/10 to-transparent" />

        <div className="flex items-center justify-between bg-[#060c1e]/75 px-5 py-2 backdrop-blur-xl md:px-8">
          {/* Left */}
          <div className="flex items-center gap-2.5">
            <div className="h-px w-3 bg-gradient-to-r from-[#d2bbff]/30 to-transparent" />
            <span className="text-[10.5px] text-[#ccc3d8]/35">
              © 2026 Serverless Image Pipeline Studio
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user?.email ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]" />
                <span className="text-[10.5px] text-[#ccc3d8]/50">{user.email}</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d2bbff]/30" />
                <span className="text-[10.5px] text-[#ccc3d8]/35">Not signed in</span>
              </>
            )}
            <div className="h-px w-3 bg-gradient-to-l from-[#4cd7f6]/25 to-transparent" />
          </div>
        </div>
      </footer>
    </main>
  );
}
