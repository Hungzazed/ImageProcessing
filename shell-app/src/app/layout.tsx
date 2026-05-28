import type { Metadata } from 'next';
import './globals.css';
import RootProvider from '../providers/RootProvider';

export const metadata: Metadata = {
  title: 'Quantum Micro Frontend Shell',
  description: 'Enterprise production-ready micro frontend orchestrator built with Next.js 15 App Router & Module Federation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased min-h-screen relative font-sans">
        {/* Absolute Glowing Accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent-indigo/5 rounded-full blur-3xl pointer-events-none" />
        
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
