'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthSplitLayout from '@/layouts/AuthSplitLayout';
import InputField from '@/components/common/InputField';
import StatusBanner from '@/components/common/StatusBanner';
import registerImage from '@/../public/register.png';
import { authApi } from '@/api/authApi';

export function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      sessionStorage.setItem('pendingRegistrationEmail', form.email);
      router.push(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch (submitError: any) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout image={registerImage.src} heroTitle="Sáng tạo không giới hạn." heroSubtitle="Khám phá tiềm năng sáng tạo của bạn với bộ công cụ AI tiên tiến nhất. Biến mọi ý tưởng thành hiện thực với độ chính xác và nghệ thuật tuyệt đối.">
      <div className="space-y-2 text-center lg:text-left">
        <p className="font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-[-0.04em] text-[#d2bbff] sm:text-6xl">ĐĂNG KÝ</p>
        <h1 className="mt-4 font-['Plus_Jakarta_Sans'] text-[30px] font-semibold leading-[38px] text-white">Bắt đầu hành trình sáng tạo</h1>
        <p className="text-[16px] leading-6 text-[#ccc3d8]">Tham gia cộng đồng hàng triệu nhiếp ảnh gia và nhà sáng tạo</p>
      </div>

      <div className="mt-4">
        <StatusBanner tone="error" message={error} />
      </div>

      <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
        <InputField
          label="Họ tên"
          type="text"
          placeholder="Nhập họ tên của bạn"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          autoComplete="name"
        />
        <InputField
          label="Email"
          type="email"
          placeholder="example@lumina.studio"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          autoComplete="email"
        />
        <InputField
          label="Mật khẩu"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          autoComplete="new-password"
        />

        <div className="flex items-start gap-3 pt-1">
          <input className="mt-1 rounded border-[#4a4455] bg-[#171f33] text-[#7c3aed] focus:ring-[#7c3aed]" id="terms" type="checkbox" />
          <label className="text-sm leading-6 text-[#ccc3d8]" htmlFor="terms">
            Tôi đồng ý với <a className="text-[#d2bbff] hover:underline" href="#">Điều khoản</a> và <a className="text-[#d2bbff] hover:underline" href="#">Chính sách</a> bảo mật của Lumina Studio.
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white shadow-lg shadow-[#7c3aed]/20 transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#ccc3d8]">
          Đã có tài khoản? <Link className="font-bold text-[#d2bbff] hover:underline" href="/login">Đăng nhập</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default RegisterPage;
