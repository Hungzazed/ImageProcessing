'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from '../../components/navigation/Navbar';
import Sidebar from '../../components/navigation/Sidebar';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname() || '';
  const router = useRouter();

  const login = useAuthStore((state) => state.login);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const [mounted, setMounted] = useState(false);
  const [loadDashboard, setLoadDashboard] = useState(false);
  const [loadUsers, setLoadUsers] = useState(false);

  const dashboardIframeRef = useRef<HTMLIFrameElement>(null);
  const usersIframeRef = useRef<HTMLIFrameElement>(null);

  const dashboardRemoteUrl = process.env.NEXT_PUBLIC_DASHBOARD_REMOTE_URL || 'http://localhost:3002/';
  const dashboardRemoteOrigin = process.env.NEXT_PUBLIC_DASHBOARD_REMOTE_ORIGIN || 'http://localhost:3002';
  const usersRemoteUrl = process.env.NEXT_PUBLIC_USERS_REMOTE_URL || 'https://ui-user-service.vercel.app/';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lazy preloading scheduler
  useEffect(() => {
    if (!mounted) return;

    if (pathname.startsWith('/dashboard')) {
      // 1. Load active tab immediately
      setLoadDashboard(true);
      // 2. Preload inactive tab with a 2-second delay
      const timer = setTimeout(() => setLoadUsers(true), 2000);
      return () => clearTimeout(timer);
    } else if (pathname.startsWith('/users')) {
      // 1. Load active tab immediately
      setLoadUsers(true);
      // 2. Preload inactive tab with a 2-second delay
      const timer = setTimeout(() => setLoadDashboard(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [mounted, pathname]);

  // Secure cross-frame orchestration bridge
  useEffect(() => {
    if (!mounted) return;

    const handleMessage = (event: MessageEvent) => {
      const isAllowedOrigin =
        event.origin.startsWith('http://localhost:') ||
        event.origin.startsWith('https://ui-user-service.vercel.app');

      if (!isAllowedOrigin) return;

      const data = event.data;
      if (data && typeof data === 'object') {
        if (data.type === 'navigate') {
          console.log(`[Shell] iframe navigation: ${data.path}`);
          router.push(data.path);
        }
        if (data.type === 'auth-login') {
          console.log('[Shell] iframe auth-login synced');
          login(data.accessToken, '', data.user);
        }
        if (data.type === 'auth-ready' && accessToken) {
          dashboardIframeRef.current?.contentWindow?.postMessage(
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
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [mounted, router, login, accessToken, user, dashboardRemoteOrigin]);

  // Keep auth token in sync with the dashboard iframe
  useEffect(() => {
    if (!mounted || !accessToken || !dashboardIframeRef.current?.contentWindow) return;

    dashboardIframeRef.current.contentWindow.postMessage(
      {
        type: 'auth-login',
        accessToken,
        user,
      },
      dashboardRemoteOrigin
    );
  }, [mounted, accessToken, user, dashboardRemoteOrigin, pathname]);

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#070d1d] text-[#dae2fd]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col relative">
          
          {/* Render real iframe elements and keep them alive in the DOM */}
          {mounted && (
            <>
              {/* Dashboard Iframe */}
              {loadDashboard && (
                <iframe
                  ref={dashboardIframeRef}
                  src={dashboardRemoteUrl}
                  title="Dashboard"
                  className="absolute inset-0 h-full w-full border-none"
                  style={{ 
                    display: pathname.startsWith('/dashboard') ? 'block' : 'none',
                    zIndex: pathname.startsWith('/dashboard') ? 10 : 0 
                  }}
                  allow="clipboard-write; clipboard-read"
                />
              )}
              
              {/* Users Iframe */}
              {loadUsers && (
                <iframe
                  ref={usersIframeRef}
                  src={usersRemoteUrl}
                  title="Users Management"
                  className="absolute inset-0 h-full w-full border-none"
                  style={{ 
                    display: pathname.startsWith('/users') ? 'block' : 'none',
                    zIndex: pathname.startsWith('/users') ? 10 : 0 
                  }}
                  allow="clipboard-write; clipboard-read"
                />
              )}
            </>
          )}

          {/* Fallback container for children/other subpages */}
          <div 
            style={{ display: (pathname.startsWith('/dashboard') || pathname.startsWith('/users')) ? 'none' : 'block' }} 
            className="flex-1"
          >
            {children}
          </div>
        </main>

        <footer className="border-t border-white/5 bg-[#060e20]/90 px-5 py-3 text-[11px] text-[#ccc3d8]/70 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <span>© 2026 Quantum Shell Orchestrator</span>
            <span>Unified shell chrome powered by store state</span>
          </div>
        </footer>
      </div>
    </div>
  );
}