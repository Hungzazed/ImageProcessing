'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/api/authApi';
import AuthCardLayout from '@/layouts/AuthCardLayout';
import InputField from '@/components/common/InputField';
import StatusBanner from '@/components/common/StatusBanner';

export function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get('email') || sessionStorage.getItem('pendingRegistrationEmail') || '',
    otp: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.verifyOtp(form);
      sessionStorage.removeItem('pendingRegistrationEmail');
      setSuccess('Xác thực thành công. Đang chuyển về màn hình đăng nhập...');
      setTimeout(() => router.push(`/login?verified=1&email=${encodeURIComponent(form.email)}`), 900);
    } catch (submitError: any) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardLayout
      eyebrow="Verify email"
      title="Xác thực OTP"
      subtitle="Nhập mã OTP đã gửi từ auth-service để hoàn tất tạo tài khoản"
      footer={
        <div className="flex items-center justify-between text-sm text-[#ccc3d8]">
          <Link href="/register">Quay lại đăng ký</Link>
          <Link href="/login">Về đăng nhập</Link>
        </div>
      }
    >
      <div className="space-y-4">
        <StatusBanner tone="success" message={success} />
        <StatusBanner tone="error" message={error} />
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <InputField label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" />
        <InputField label="OTP" type="text" placeholder="6 chữ số" inputMode="numeric" value={form.otp} onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))} autoComplete="one-time-code" />
        <button className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white" type="submit" disabled={loading}>{loading ? 'Đang xác thực...' : 'Xác thực OTP'}</button>
      </form>
    </AuthCardLayout>
  );
}
