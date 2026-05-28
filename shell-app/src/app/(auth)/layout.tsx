'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-950 relative overflow-hidden select-none">
      {/* Dynamic Background Overlays */}
      <div className="absolute inset-0 cyber-grid" />
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent-cyan/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-accent-indigo/10 blur-3xl pointer-events-none" />

      {/* Decorative cybernetic frames */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Grid Overlay Panels */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Animated Brand Emblem */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-8 text-center"
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-accent-cyan to-accent-indigo shadow-[0_0_25px_rgba(6,182,212,0.4)] mb-3">
            <Layers size={24} className="text-white" />
            <div className="absolute inset-0 rounded-xl border border-white/20 animate-pulse-glow" />
          </div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-gray-400">
            QUANTUM SYSTEM LINK
          </h1>
        </motion.div>

        {/* Auth Forms Insertion */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, cubicBezier: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {children}
        </motion.div>
        
        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-[10px] text-gray-600 uppercase tracking-widest font-mono font-medium"
        >
          Secured Core // Protocol v15.1.7
        </motion.p>
      </div>
    </main>
  );
}
