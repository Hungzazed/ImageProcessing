'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { listenEvent } from '../../events/eventBus';
import Breadcrumbs from './Breadcrumbs';
import {
  Bell,
  Menu,
  User as UserIcon,
  LogOut,
  Settings,
  Wifi,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface ShellNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<ShellNotification[]>([
    {
      id: 'init',
      message: 'Quantum Shell Orchestrator Initialized.',
      type: 'success',
      time: 'Just now',
    },
  ]);
  const [notiOpen, setNotiOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setNotiOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to remote and local notifications via CustomEvent Bus
  useEffect(() => {
    const unsub = listenEvent('notification', (detail) => {
      setNotifications((prev) => [
        {
          id: Math.random().toString(36).substr(2, 9),
          message: detail.message,
          type: detail.type,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
    });
    return unsub;
  }, []);

  const unreadCount = notifications.length;

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-gray-950/80 border-b border-cyan-500/10 backdrop-blur-md text-gray-200">
      {/* Left side: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-gray-400 hover:text-accent-cyan hover:bg-gray-900/60 transition-all md:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Sidebar Toggle for Desktop (if closed) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-gray-400 hover:text-accent-cyan hover:bg-gray-900/60 transition-all hidden md:block"
          title="Toggle Navigation Console"
        >
          <Menu size={18} />
        </button>

        <Breadcrumbs />
      </div>

      {/* Right side: Connection Status, Notification & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon and Dropdown */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => setNotiOpen(!notiOpen)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-accent-cyan hover:bg-gray-900/60 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan"></span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {notiOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-gray-900 border border-cyan-500/20 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden z-50 text-xs"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10 bg-gray-950/50">
                  <span className="font-semibold text-gray-200 uppercase tracking-wider text-[10px]">Security & System Alerts</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-accent-cyan hover:underline transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-950/50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No warning flags detected on grid.
                    </div>
                  ) : (
                    notifications.map((noti) => (
                      <div key={noti.id} className="p-3 hover:bg-gray-950/20 transition-colors flex gap-2">
                        {noti.type === 'success' && <CheckCircle size={14} className="text-accent-emerald mt-0.5 flex-shrink-0" />}
                        {noti.type === 'warning' && <AlertTriangle size={14} className="text-accent-amber mt-0.5 flex-shrink-0" />}
                        {noti.type === 'error' && <AlertTriangle size={14} className="text-accent-rose mt-0.5 flex-shrink-0" />}
                        {noti.type === 'info' && <CheckCircle size={14} className="text-accent-cyan mt-0.5 flex-shrink-0" />}

                        <div className="flex-1">
                          <p className="text-gray-300 leading-normal">{noti.message}</p>
                          <span className="text-[9px] text-gray-500 mt-1 block">{noti.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 hover:bg-gray-900/40 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-950 text-accent-cyan border border-cyan-500/30 font-bold uppercase text-[10px]">
              {user?.name ? user.name.slice(0, 2) : (user?.email ? user.email.slice(0, 2) : 'US')}
            </div>
            <span className="text-xs font-medium text-gray-300 hidden md:inline truncate max-w-[80px]">
              {user?.name || (user?.email ? user.email.split('@')[0] : 'Console User')}
            </span>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-gray-900 border border-cyan-500/20 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden z-50 text-xs text-gray-300"
              >
                <div className="px-4 py-3 border-b border-cyan-500/10 bg-gray-950/40 leading-tight">
                  <p className="font-semibold text-gray-200 truncate">
                    {user?.name || (user?.email ? user.email.split('@')[0] : 'Console User')}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email || 'user@grid.io'}</p>
                </div>

                <div className="p-1">
                  <div
                    onClick={() => {
                      setProfileOpen(false);
                      // Trigger dynamic notification alert as example
                      window.dispatchEvent(
                        new CustomEvent('notification', {
                          detail: { message: 'Profile console is synced with core database.', type: 'info' }
                        })
                      );
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-950/40 hover:text-accent-cyan cursor-pointer transition-colors"
                  >
                    <UserIcon size={14} />
                    <span>My Credentials</span>
                  </div>
                  <div
                    onClick={() => {
                      setProfileOpen(false);
                      window.dispatchEvent(
                        new CustomEvent('notification', {
                          detail: { message: 'Grid systems are running optimally.', type: 'success' }
                        })
                      );
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-950/40 hover:text-accent-cyan cursor-pointer transition-colors"
                  >
                    <Settings size={14} />
                    <span>Orchestration Options</span>
                  </div>
                </div>

                <div className="p-1 border-t border-cyan-500/10 bg-gray-950/10">
                  <div
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      router.push('/auth/login');
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-950/40 hover:text-accent-rose cursor-pointer text-gray-400 hover:font-medium transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
