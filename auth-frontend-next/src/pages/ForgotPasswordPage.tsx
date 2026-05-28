'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/api/authApi';
import AuthCardLayout from '@/layouts/AuthCardLayout';
import InputField from '@/components/common/InputField';
import StatusBanner from '@/components/common/StatusBanner';

export function ForgotPasswordPage() {
  const [form, setForm] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authApi.forgotPassword(form);
      setSuccess(response.message);
    } catch (submitError: any) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardLayout
      eyebrow="Password recovery"
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận liên kết đặt lại mật khẩu"
      footer={
        <div className="flex items-center justify-between text-sm text-[#ccc3d8]">
          <Link href="/login">Về đăng nhập</Link>
          <Link href="/register">Tạo tài khoản mới</Link>
        </div>
      }
    >
      <div className="space-y-4">
        <StatusBanner tone="success" message={success} />
        <StatusBanner tone="error" message={error} />
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <InputField label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ email: event.target.value })} autoComplete="email" />
        <button className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white" type="submit" disabled={loading}>{loading ? 'Đang gửi mail...' : 'Gửi link reset'}</button>
      </form>
    </AuthCardLayout>
  );
}

export default function Page() {
  return null;
}
