'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { authApi } from '@/api/authApi';
import { authStorage } from '@/store/authStorage';
import { setSession } from '@/store/authSlice';
import AuthCardLayout from '@/layouts/AuthCardLayout';

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const decoded = atob(`${normalized}${padding}`);

  // Preserve UTF-8 characters from decoded binary string.
  return decodeURIComponent(
    decoded
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  );
}

export function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('Completing Google sign-in...');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function finishGoogleAuth() {
      try {
        const accessTokenFromQuery = searchParams?.get('accessToken') || '';
        const refreshTokenFromQuery = searchParams?.get('refreshToken') || '';
        const encodedUserFromQuery = searchParams?.get('user') || '';
        const decodedUserFromQuery = encodedUserFromQuery
          ? JSON.parse(decodeBase64Url(encodedUserFromQuery))
          : null;

        if (!accessTokenFromQuery || !refreshTokenFromQuery) {
          throw new Error('Missing Google callback tokens.');
        }

        const session = await authApi.verifyToken(accessTokenFromQuery);
        const rawUser = decodedUserFromQuery || session.user;
        const profile = rawUser?.email ? await authApi.getUserByEmail(rawUser.email) : null;
        const user = authApi.mergeAuthAndProfile(rawUser, profile);
        const resolvedAccessToken = accessTokenFromQuery || session.accessToken || '';

        if (!resolvedAccessToken) throw new Error('No access token was returned after the callback.');

        authStorage.saveSession(resolvedAccessToken, refreshTokenFromQuery, user);
        dispatch(setSession({ accessToken: resolvedAccessToken, user }));

        if (alive) {
          setStatus('Google sign-in successful. Redirecting to the dashboard...');
          setTimeout(() => router.replace('/dashboard'), 800);
        }
      } catch (callbackError: any) {
        if (alive) {
          setError(callbackError.message);
          setStatus('Unable to complete Google sign-in');
        }
      }
    }

    finishGoogleAuth();

    return () => {
      alive = false;
    };
  }, [dispatch, router, searchParams]);

  return (
    <AuthCardLayout eyebrow="Google sign-in" title="Finishing callback" subtitle="The frontend is receiving the token from auth-service and saving the session.">
      {error ? <div className="mb-4 rounded-xl border border-[#ffb4ab]/20 bg-[#93000a]/20 px-4 py-3 text-sm text-[#ffdad6]">{error}</div> : null}
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-300" />
        {status}
      </div>
    </AuthCardLayout>
  );
}

export default function Page() {
  return null;
}
