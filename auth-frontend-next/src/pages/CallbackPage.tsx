'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { authApi } from '@/api/authApi';
import { authStorage } from '@/store/authStorage';
import { setSession } from '@/store/authSlice';
import { clearCookie, readCookie } from '@/utils/cookies';
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
  const [status, setStatus] = useState('Đang hoàn tất đăng nhập Google...');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function finishGoogleAuth() {
      try {
        const accessTokenFromQuery = searchParams?.get('accessToken') || '';
        const encodedUserFromQuery = searchParams?.get('user') || '';
        const decodedUserFromQuery = encodedUserFromQuery
          ? JSON.parse(decodeBase64Url(encodedUserFromQuery))
          : null;

        const accessToken = accessTokenFromQuery || readCookie('accessToken');
        const tempUserInfo = readCookie('tempUserInfo');
        const session = accessToken ? await authApi.verifyToken(accessToken) : await authApi.verifySession();
        const rawUser = decodedUserFromQuery || (tempUserInfo ? JSON.parse(tempUserInfo) : session.user);
        const profile = rawUser?.email ? await authApi.getUserByEmail(rawUser.email) : null;
        const user = authApi.mergeAuthAndProfile(rawUser, profile);
        const resolvedAccessToken = accessToken || session.accessToken || '';

        if (!resolvedAccessToken) throw new Error('Không tìm thấy access token sau callback');

        authStorage.saveSession(resolvedAccessToken, user);
        dispatch(setSession({ accessToken: resolvedAccessToken, user }));
        clearCookie('accessToken');
        clearCookie('tempUserInfo');

        if (alive) {
          setStatus('Đăng nhập Google thành công. Đang chuyển tới dashboard...');
          setTimeout(() => router.replace('/dashboard'), 800);
        }
      } catch (callbackError: any) {
        if (alive) {
          setError(callbackError.message);
          setStatus('Không thể hoàn tất đăng nhập Google');
        }
      }
    }

    finishGoogleAuth();

    return () => {
      alive = false;
    };
  }, [dispatch, router, searchParams]);

  return (
    <AuthCardLayout eyebrow="Google sign-in" title="Đang hoàn tất callback" subtitle="Frontend đang lấy token do auth-service trả về và lưu phiên đăng nhập.">
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
