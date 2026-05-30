'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dashboardRemoteUrl = process.env.NEXT_PUBLIC_DASHBOARD_REMOTE_URL || 'http://localhost:3002/';
  const dashboardRemoteOrigin = process.env.NEXT_PUBLIC_DASHBOARD_REMOTE_ORIGIN || 'http://localhost:3002';

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
        if (data.type === 'auth-ready' && accessToken) {
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: 'auth-login',
              accessToken,
              user,
            },
            dashboardRemoteOrigin
          );
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mounted, router, login, accessToken, user, dashboardRemoteOrigin]);

  useEffect(() => {
    if (!mounted || !accessToken || !iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'auth-login',
        accessToken,
        user,
      },
      dashboardRemoteOrigin
    );
  }, [mounted, accessToken, user, dashboardRemoteOrigin]);

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
