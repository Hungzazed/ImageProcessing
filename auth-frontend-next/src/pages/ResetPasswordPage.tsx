'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/api/authApi';
import AuthCardLayout from '@/layouts/AuthCardLayout';
import InputField from '@/components/common/InputField';
import StatusBanner from '@/components/common/StatusBanner';

export function ResetPasswordPage({ searchParams }: { searchParams?: { email?: string; token?: string } }) {
  const email = searchParams?.email || '';
  const token = searchParams?.token || '';
  const [form, setForm] = useState({ email, token, newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const resetCompleted = Boolean(success);

  useEffect(() => {
    setForm((current) => ({ ...current, email, token }));
  }, [email, token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setLoading(false);
      setError('The confirmation password does not match.');
      return;
    }

    if (!form.email || !form.token) {
      setLoading(false);
      setError('Missing email or reset token.');
      return;
    }

    try {
      await authApi.resetPassword({ email: form.email, token: form.token, newPassword: form.newPassword });
      setSuccess('Congratulations, your password has been changed successfully.');
      setForm((current) => ({ ...current, newPassword: '', confirmPassword: '' }));

      if (typeof window !== 'undefined') {
        localStorage.setItem('password-reset-completed-at', String(Date.now()));
        window.dispatchEvent(new Event('password-reset-completed'));
      }
    } catch (submitError: any) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardLayout
      eyebrow="Reset password"
      title="Reset password"
      subtitle="Enter a new password to complete the recovery flow."
      footer={!resetCompleted ? (
        <div className="flex items-center justify-between text-sm text-[#ccc3d8]">
          <Link href="/login">Back to sign in</Link>
          <Link href="/forgot-password">Resend reset email</Link>
        </div>
      ) : undefined}
    >
      <div className="space-y-4">
        <StatusBanner tone="success" message={success} />
        <StatusBanner tone="error" message={error} />
      </div>

      {!resetCompleted && (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <InputField label="Email" type="email" value={form.email} readOnly />
          <InputField label="New password" type="password" placeholder="Enter a new password" value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} />
          <InputField label="Confirm password" type="password" placeholder="Re-enter the new password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
          <button className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white" type="submit" disabled={loading}>{loading ? 'Updating...' : 'Reset password'}</button>
        </form>
      )}
    </AuthCardLayout>
  );
}

export default function Page() {
  return null;
}
