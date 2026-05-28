'use client';

import { useEffect, useState } from 'react';
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
    email: searchParams?.get('email') || '',
    otp: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (form.email) return;

    const pendingEmail = sessionStorage.getItem('pendingRegistrationEmail');
    if (pendingEmail) {
      setForm((current) => ({ ...current, email: pendingEmail }));
    }
  }, [form.email]);

  const readPendingRegistration = () => {
    const rawData = sessionStorage.getItem('pendingRegistrationData');
    if (!rawData) return null;

    try {
      return JSON.parse(rawData) as { name?: string; email?: string; phoneNumber?: string };
    } catch {
      return null;
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.verifyOtp(form);

      const pendingRegistration = readPendingRegistration();
      const name = pendingRegistration?.name?.trim() || '';
      const phoneNumber = pendingRegistration?.phoneNumber?.trim() || '';

      if (!name || !phoneNumber) {
        throw new Error('Không tìm thấy thông tin đăng ký tạm để tạo hồ sơ người dùng.');
      }

      try {
        await authApi.createUser({
          ...authApi.prepareUserPayload({
            name,
            email: form.email,
            password: '',
            phoneNumber,
          }),
          phoneNumber,
        });
      } catch (createUserError: any) {
        const message = createUserError?.message || '';
        const isDuplicate = /exists|tồn tại|already/i.test(message);

        if (!isDuplicate) {
          throw createUserError;
        }
      }

      sessionStorage.removeItem('pendingRegistrationEmail');
      sessionStorage.removeItem('pendingRegistrationData');
      setSuccess('Xác thực và tạo hồ sơ người dùng thành công. Đang chuyển về màn hình đăng nhập...');
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
      title="Verify OTP"
      subtitle="Enter the OTP sent by auth-service to complete account creation."
      footer={
        <div className="flex items-center justify-between text-sm text-[#ccc3d8]">
          <Link href="/register">Back to sign up</Link>
          <Link href="/login">Back to sign in</Link>
        </div>
      }
    >
      <div className="space-y-4">
        <StatusBanner tone="success" message={success} />
        <StatusBanner tone="error" message={error} />
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <InputField label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" />
        <InputField label="OTP" type="text" placeholder="6 digits" inputMode="numeric" value={form.otp} onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))} autoComplete="one-time-code" />
        <button className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
      </form>
    </AuthCardLayout>
  );
}

export default function Page() {
  return null;
}
