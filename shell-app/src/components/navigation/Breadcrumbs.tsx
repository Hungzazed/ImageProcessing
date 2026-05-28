'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname) return null;

  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-gray-400">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-accent-cyan transition-colors"
      >
        <Home size={14} className="text-gray-500" />
        <span className="hidden sm:inline">Shell</span>
      </Link>

      {paths.map((segment, index) => {
        const url = `/${paths.slice(0, index + 1).join('/')}`;
        const isLast = index === paths.length - 1;
        const formattedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={url}>
            <ChevronRight size={12} className="text-gray-600" />
            {isLast ? (
              <span className="text-accent-cyan font-semibold drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                {formattedSegment}
              </span>
            ) : (
              <Link href={url} className="hover:text-accent-indigo transition-colors">
                {formattedSegment}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
