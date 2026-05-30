'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';

interface RemoteLoaderProps {
  appName: 'auth' | 'dashboard' | 'users';
  moduleName: string;
  mockComponent: React.ComponentType<any>;
  fallbackName: string;
  props?: any;
}

const REMOTE_URLS = {
  auth: process.env.NEXT_PUBLIC_AUTH_REMOTE_URL || 'http://localhost:3001/login',
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_REMOTE_URL || 'http://localhost:3002/',
  users: process.env.NEXT_PUBLIC_USERS_REMOTE_URL || 'https://ui-user-service.vercel.app/',
};

function isAbsoluteHttpUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

export default function RemoteLoader({
  appName,
  moduleName,
  mockComponent: MockComponent,
  fallbackName,
  props = {},
}: RemoteLoaderProps) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Secure cross-frame orchestration bridge
  useEffect(() => {
    if (!mounted) return;

    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_AUTH_REMOTE_ORIGIN,
        process.env.NEXT_PUBLIC_DASHBOARD_REMOTE_ORIGIN,
        process.env.NEXT_PUBLIC_USERS_REMOTE_ORIGIN,
      ].filter(Boolean) as string[];

      const isAllowedOrigin =
        allowedOrigins.some((origin) => event.origin.startsWith(origin)) ||
        event.origin.startsWith('http://localhost:') ||
        event.origin.startsWith('https://ui-user-service.vercel.app');

      if (!isAllowedOrigin) return;

      const data = event.data;
      if (data && typeof data === 'object') {
        if (data.type === 'navigate') {
          console.log(`[Shell] iframe navigation: ${data.path}`);
          if (typeof data.path === 'string' && isAbsoluteHttpUrl(data.path)) {
            window.location.assign(data.path);
            return;
          }
          router.push(data.path);
        }
        if (data.type === 'auth-login') {
          console.log('[Shell] iframe auth-login synced');
          login(data.accessToken, '', data.user);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [mounted, router, login]);

  if (!mounted) return null;

  const url = REMOTE_URLS[appName];
  const isAuth = appName === 'auth';

  // ── Auth: full-bleed iframe, fills the shell body completely ──────────────
  if (isAuth) {
    return (
      <iframe
        src={url}
        title={fallbackName}
        className="block h-full w-full border-none outline-none"
        style={{ display: 'block' }}
        allow="clipboard-write"
        scrolling="no"
      />
    );
  }

  // ── Dashboard / Users: framed card ────────────────────────────────────────
  return (
    <div
      className="relative w-full rounded-2xl border border-white/10 bg-gray-900/40 backdrop-blur-md shadow-2xl overflow-hidden"
      style={{ blockSize: '780px' }}
    >
      <iframe
        src={url}
        title={fallbackName}
        className="block h-full w-full border-none outline-none"
        allow="clipboard-write"
      />
    </div>
  );
}
