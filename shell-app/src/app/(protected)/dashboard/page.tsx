'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [mounted, setMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dashboardRemoteUrl = process.env.NEXT_PUBLIC_DASHBOARD_REMOTE_URL || 'http://localhost:3002/';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleMessage = (event: MessageEvent) => {
      const isAllowedOrigin =
        event.origin.startsWith('http://localhost:') ||
        event.origin.startsWith('https://ui-user-service.vercel.app');
      if (!isAllowedOrigin) return;
      const data = event.data;
      if (data && typeof data === 'object') {
        if (data.type === 'navigate') router.push(data.path);
        if (data.type === 'auth-login') login(data.accessToken, '', data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mounted, router, login]);

  if (!mounted) return null;

  return (
    <iframe
      ref={iframeRef}
      src={dashboardRemoteUrl}
      title="Dashboard"
      className="block h-full w-full border-none flex-1"
      allow="clipboard-write; clipboard-read"
    />
  );
}
