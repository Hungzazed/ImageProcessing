'use client';

import React, { useState } from 'react';
import Navbar from '../../components/navigation/Navbar';
import Sidebar from '../../components/navigation/Sidebar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#070d1d] text-[#dae2fd]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          {children}
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