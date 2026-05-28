'use client';

import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-[#0b1326] relative select-none">
      <div className="w-full min-h-screen flex flex-col">
        {children}
      </div>
    </main>
  );
}
