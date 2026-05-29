'use client';

import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import useSessionVerifier from '@/hooks/useSessionVerifier';
import { authApi } from '@/api/authApi';
import { authStorage } from '@/store/authStorage';
import { clearSession } from '@/store/authSlice';

export function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { state, loading } = useSessionVerifier(() => router.push('/login'));

  async function handleLogout() {
    const { refreshToken } = authStorage.loadSession();

    try {
      await authApi.logout(refreshToken);
    } catch {
      // ignore transport error and clear session locally
    }

    authStorage.clearSession();
    dispatch(clearSession());
    router.push('/login');
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#070d1d] text-[#dae2fd]">Checking sign-in session...</div>;
  }

  return (
    <div className="min-h-screen bg-[#070d1d] px-4 py-6 text-[#dae2fd]">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#0f1530] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-semibold text-white">Active account</h1>
            <p className="mt-2 text-[#ccc3d8]">This session is authenticated with auth-service.</p>
          </div>
          <button className="rounded-xl border border-red-300/40 px-4 py-2 text-sm text-red-200" onClick={handleLogout}>Sign out</button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">User</div>
            <div className="mt-3 text-xl font-bold text-white">{state.user?.name || 'Unknown'}</div>
            <div className="mt-1 text-sm text-slate-300">{state.user?.email || 'No email'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Role</div>
            <div className="mt-3 text-xl font-bold text-white">{state.user?.role || 'user'}</div>
            <div className="mt-1 text-sm text-slate-300">{state.user?.isVerified ? 'Email verified' : 'Pending verification'}</div>
          </div>
        </div>

        <div className="mt-4 break-all rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-emerald-100">{state.accessToken}</div>
      </div>
    </div>
  );
}

export default function Page() {
  return null;
}
