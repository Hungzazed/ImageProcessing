'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { authApi } from '@/api/authApi';
import { authStorage, type AuthUser } from '@/store/authStorage';
import { setSession } from '@/store/authSlice';
import AuthCardLayout from '@/layouts/AuthCardLayout';

const SHELL_BASE_URL = (process.env.NEXT_PUBLIC_SHELL_APP_URL || '').replace(/\/+$/, '');

export function CallbackPage() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('Completing Google sign-in...');
  const [error, setError] = useState('');
  const dashboardUrl = SHELL_BASE_URL ? `${SHELL_BASE_URL}/dashboard` : '';

  function notifyShellLogin(accessToken: string, refreshToken: string | null, user: AuthUser) {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
      new CustomEvent('auth-login', {
        detail: { accessToken, refreshToken, user },
      })
    );
    window.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { path: dashboardUrl || '/' },
      })
    );

    if (window !== window.parent) {
      window.parent.postMessage(
        {
          type: 'auth-login',
          accessToken,
          refreshToken,
          user,
        },
        '*'
      );
      window.parent.postMessage(
        {
          type: 'navigate',
          path: dashboardUrl || '/',
        },
        '*'
      );
    } else {
      window.location.assign(dashboardUrl || '/');
    }
  }

  useEffect(() => {
    let alive = true;

    async function finishGoogleAuth() {
      try {
        const hashParams = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
          : new URLSearchParams();

        const oauthError = searchParams?.get('error') || hashParams.get('error') || '';
        const oauthErrorDescription = searchParams?.get('error_description') || hashParams.get('error_description') || '';

        if (oauthError) {
          throw new Error(oauthErrorDescription || `Google OAuth failed: ${oauthError}`);
        }

        const accessTokenFromQuery =
          searchParams?.get('accessToken') ||
          hashParams.get('access_token') ||
          '';
        const refreshTokenFromQuery =
          searchParams?.get('refreshToken') ||
          hashParams.get('refresh_token') ||
          '';
        const encodedUserFromQuery = searchParams?.get('user') || '';
        if (!accessTokenFromQuery || !refreshTokenFromQuery) {
          throw new Error('Missing Google callback tokens. Verify redirect URLs and OAuth client configuration.');
        }

        let decodedUserFromQuery: AuthUser | null = null;
        if (encodedUserFromQuery) {
          try {
            decodedUserFromQuery = JSON.parse(
              decodeURIComponent(
                atob(
                  `${encodedUserFromQuery.replace(/-/g, '+').replace(/_/g, '/')}${'='.repeat((4 - (encodedUserFromQuery.length % 4)) % 4)}`
                )
                  .split('')
                  .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
                  .join('')
              )
            ) as AuthUser;
          } catch {
            decodedUserFromQuery = null;
          }
        }

        const session = await authApi.verifyToken(accessTokenFromQuery);
        const rawUser = decodedUserFromQuery || session.user;
        const profile = rawUser?.email ? await authApi.getUserByEmail(rawUser.email) : null;
        const user = authApi.mergeAuthAndProfile(rawUser, profile);
        const resolvedAccessToken = accessTokenFromQuery || session.accessToken || '';

        if (!resolvedAccessToken) throw new Error('No access token was returned after the callback.');
        if (!user) throw new Error('No user information was returned after the callback.');

        authStorage.saveSession(resolvedAccessToken, refreshTokenFromQuery, user, 'backend');
        dispatch(setSession({ accessToken: resolvedAccessToken, user }));
        notifyShellLogin(resolvedAccessToken, refreshTokenFromQuery, user);

        if (!dashboardUrl) {
          throw new Error('Missing NEXT_PUBLIC_SHELL_APP_URL');
        }

        if (alive) {
          setStatus('Google sign-in successful. Redirecting to the dashboard...');
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
  }, [dispatch, searchParams]);

  return (
    <AuthCardLayout eyebrow="Google sign-in" title="Finishing callback" subtitle="The frontend is completing the OAuth exchange and saving the session.">
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
