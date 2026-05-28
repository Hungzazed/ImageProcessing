'use client';

import React, { useState } from 'react';
import Sidebar from '../../components/navigation/Sidebar';
import Navbar from '../../components/navigation/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100 font-sans relative">
      {/* Dynamic Ambient Background Light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent-cyan/[0.03] rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 left-20 w-80 h-80 bg-accent-indigo/[0.03] rounded-full blur-3xl pointer-events-none z-0" />

      {/* Mobile Sidebar Backdrop Drawer */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed inset-0 z-20 bg-black/60 md:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Retractable Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Console Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Console Workspace Area */}
        <main className="flex-1 overflow-y-auto bg-gray-950/40 relative">
          {/* Cyber grid overlays */}
          <div className="absolute inset-0 cyber-grid opacity-50 pointer-events-none" />
          
          <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
