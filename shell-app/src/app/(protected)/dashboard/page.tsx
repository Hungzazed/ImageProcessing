'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [mounted, setMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', background: '#0b1120' }}>
      <iframe
        ref={iframeRef}
        src="http://localhost:3002/"
        title="Dashboard"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="clipboard-write; clipboard-read"
      />
    </div>
  );
}
