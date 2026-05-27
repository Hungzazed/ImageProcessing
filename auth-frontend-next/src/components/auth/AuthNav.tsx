import Link from 'next/link';
import React from 'react';

type Props = {
  active?: 'login' | 'register' | string;
};

export default function AuthNav({ active = 'login' }: Props) {
  const linkClass = (name: string) =>
    `text-sm font-semibold transition-colors ${active === name ? 'text-[#d2bbff]' : 'text-[#ccc3d8] hover:text-[#d2bbff]'} `;

  return (
    <div className="flex items-center gap-8">
      <Link className={linkClass('login')} href="/login">
        Sign In
      </Link>
      <Link className={linkClass('register')} href="/register">
        Join Now
      </Link>
      <Link
        className="rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        href="/dashboard"
      >
        Get Started
      </Link>
    </div>
  );
}
