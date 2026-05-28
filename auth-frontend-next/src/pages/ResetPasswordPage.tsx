'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/api/authApi';
import AuthCardLayout from '@/layouts/AuthCardLayout';
import InputField from '@/components/common/InputField';
import StatusBanner from '@/components/common/StatusBanner';

export function ResetPasswordPage({ searchParams }: { searchParams?: { email?: string; token?: string } }) {
  const router = useRouter();
  const email = searchParams?.email || '';
  const token = searchParams?.token || '';
  const [form, setForm] = useState({ email, token, newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setForm((current) => ({ ...current, email, token }));
  }, [email, token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setLoading(false);
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!form.email || !form.token) {
      setLoading(false);
      setError('Thiếu email hoặc token reset');
      return;
    }

    try {
      await authApi.resetPassword({ email: form.email, token: form.token, newPassword: form.newPassword });
      setSuccess('Đặt lại mật khẩu thành công. Đang quay về đăng nhập...');
      setTimeout(() => router.push('/login?reset=1'), 900);
    } catch (submitError: any) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardLayout
      eyebrow="Reset password"
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới để hoàn tất quy trình khôi phục"
      footer={
        <div className="flex items-center justify-between text-sm text-[#ccc3d8]">
          <Link href="/login">Về đăng nhập</Link>
          <Link href="/forgot-password">Gửi lại email reset</Link>
        </div>
      }
    >
      <div className="space-y-4">
        <StatusBanner tone="success" message={success} />
        <StatusBanner tone="error" message={error} />
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <InputField label="Email" type="email" value={form.email} readOnly />
        <InputField label="Mật khẩu mới" type="password" placeholder="Nhập mật khẩu mới" value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} />
        <InputField label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu mới" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
        <button className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white" type="submit" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</button>
      </form>
    </AuthCardLayout>
  );
}

export default function Page() {
  return null;
}
