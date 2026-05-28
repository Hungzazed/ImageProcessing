'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Settings,
  ShieldAlert,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Users Management', path: '/users', icon: Users },
  ];

  return (
    <motion.aside
      initial={{ width: isOpen ? 260 : 70 }}
      animate={{ width: isOpen ? 260 : 70 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-30 flex flex-col h-screen bg-gray-950 border-r border-cyan-500/10 backdrop-blur-xl text-gray-300 select-none overflow-hidden"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-cyan-500/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-cyan to-accent-indigo shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Layers size={18} className="text-white" />
            <div className="absolute inset-0 rounded-lg border border-white/20 animate-pulse-glow" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-indigo text-sm uppercase font-sans"
              >
                Quantum Shell
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-gray-500 hover:text-accent-cyan hover:bg-gray-900/60 transition-all hidden md:block"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute right-4 top-4 p-1 rounded-md text-gray-500 hover:text-accent-cyan hover:bg-gray-900/60 transition-all hidden md:block"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] uppercase font-bold tracking-widest text-gray-600">
          {isOpen ? 'Main Console' : 'Menu'}
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-300 group cursor-pointer ${isActive
                  ? 'text-accent-cyan bg-cyan-500/5 font-semibold border border-cyan-500/20'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900/40 border border-transparent'
                  }`}
              >
                {/* Active Glowing Dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-6 rounded-r bg-accent-cyan shadow-[0_0_10px_#06b6d4]"
                  />
                )}

                <item.icon
                  size={18}
                  className={`transition-colors group-hover:text-accent-cyan ${isActive ? 'text-accent-cyan' : 'text-gray-400'
                    }`}
                />

                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}

        {/* Security Extension Example */}
        {user?.role === 'admin' && (
          <>
            <div className="px-3 pt-4 mb-2 text-[10px] uppercase font-bold tracking-widest text-gray-600">
              {isOpen ? 'Admin Zone' : 'Admin'}
            </div>
            <Link href="/dashboard/admin">
              <div
                className={`relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-300 group cursor-pointer ${pathname === '/dashboard/admin'
                  ? 'text-accent-rose bg-rose-500/5 font-semibold border border-rose-500/20'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900/40 border border-transparent'
                  }`}
              >
                <ShieldAlert
                  size={18}
                  className={`transition-colors group-hover:text-accent-rose ${pathname === '/dashboard/admin' ? 'text-accent-rose' : 'text-gray-400'
                    }`}
                />
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium truncate text-accent-rose"
                    >
                      Secure Controls
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          </>
        )}
      </nav>
    </motion.aside>
  );
}
