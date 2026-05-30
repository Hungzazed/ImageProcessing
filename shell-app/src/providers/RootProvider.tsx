'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { listenEvent } from '../events/eventBus';

function isAbsoluteHttpUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

export default function RootProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);

  // 1. Client-Side Hydration for Zustand + Cookies on mount
  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  // 2. Decoupled Navigation System
  // Listen to CustomEvent('navigate') and transition using Next.js App Router
  useEffect(() => {
    if (!mounted) return;

    const unsubNavigate = listenEvent('navigate', (detail) => {
      console.log(`Orchestration routing transition triggered: ${detail.path}`);
      if (isAbsoluteHttpUrl(detail.path)) {
        window.location.assign(detail.path);
        return;
      }
      router.push(detail.path);
    });

    const unsubExpired = listenEvent('token-expired', () => {
      console.warn('Session expired. Directing to registry panel.');
      logout();
      router.push('/auth/login?error=session_expired');
    });

    const unsubLogout = listenEvent('auth-logout', () => {
      logout();
      router.push('/auth/login');
    });

    return () => {
      unsubNavigate();
      unsubExpired();
      unsubLogout();
    };
  }, [mounted, router, logout]);

  // Return loading screen during hydration to prevent server/client mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-accent-cyan rounded-full animate-spin" />
        <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-4 uppercase">Syncing Quantum Core...</p>
      </div>
    );
  }

  return <>{children}</>;
}
