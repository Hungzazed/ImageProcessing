'use client';

import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useSearchParams } from 'next/navigation';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { VerifyOtpPage } from './VerifyOtpPage';
import { ResetPasswordPage } from './ResetPasswordPage';

export type AuthAppPage =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'verify-otp'
  | 'reset-password';

interface AuthAppProps {
  page?: AuthAppPage;
}

function AuthPageContent({ page = 'login' }: AuthAppProps) {
  const searchParams = useSearchParams();

  switch (page) {
    case 'register':
      return <RegisterPage />;
    case 'forgot-password':
      return <ForgotPasswordPage />;
    case 'verify-otp':
      return <VerifyOtpPage />;
    case 'reset-password':
      return (
        <ResetPasswordPage
          searchParams={{
            email: searchParams?.get('email') ?? undefined,
            token: searchParams?.get('token') ?? undefined,
          }}
        />
      );
    case 'login':
    default:
      return <LoginPage />;
  }
}

/**
 * Self-contained Auth micro-frontend entry point.
 * Wraps everything in its own Redux Provider so the shell doesn't need
 * to know anything about the auth state management internals.
 *
 * Usage in shell (via Module Federation):
 *   const AuthApp = dynamic(() => import('auth/AuthApp').then(m => m.AuthApp), { ssr: false });
 *   <AuthApp page="login" />
 */
export function AuthApp({ page = 'login' }: AuthAppProps) {
  return (
    <Provider store={store}>
      <Suspense fallback={<AuthLoadingFallback />}>
        <AuthPageContent page={page} />
      </Suspense>
    </Provider>
  );
}

function AuthLoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0b1326]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d2bbff]/20 border-t-[#d2bbff]" />
        <p className="text-sm text-[#ccc3d8]/60">Loading auth module...</p>
      </div>
    </div>
  );
}

export default AuthApp;
