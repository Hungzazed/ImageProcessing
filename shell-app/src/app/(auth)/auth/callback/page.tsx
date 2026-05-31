'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/authStore';
import type { User } from '../../../../types';

function decodeBase64UrlJson<T>(value: string): T | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken') || '';
    const refreshToken = searchParams.get('refreshToken') || '';
    const encodedUser = searchParams.get('user') || '';
    const user = encodedUser ? decodeBase64UrlJson<User>(encodedUser) : null;

    if (!accessToken || !user) {
      setMessage('Unable to complete sign-in. Please try again.');
      router.replace('/auth/login?error=callback_missing_session');
      return;
    }

    login(accessToken, refreshToken || null, user);
    router.replace('/dashboard');
  }, [login, router, searchParams]);

  return (
    <div className="flex h-full items-center justify-center bg-[#070d1d] text-[#dae2fd]">
      <div className="flex items-center gap-3 text-sm text-[#ccc3d8]">
        <span className="h-3 w-3 animate-pulse rounded-full bg-[#4cd7f6]" />
        {message}
      </div>
    </div>
  );
}
