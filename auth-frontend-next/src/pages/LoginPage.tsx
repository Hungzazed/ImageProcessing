'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import AuthSplitLayout from '@/layouts/AuthSplitLayout';
import InputField from '@/components/common/InputField';
import StatusBanner from '@/components/common/StatusBanner';
import GoogleIcon from '@/components/icons/GoogleIcon';
import loginImage from '@/../public/login.png';
import { authApi } from '@/api/authApi';
import { authStorage } from '@/store/authStorage';
import { useDispatch } from 'react-redux';
import { setSession } from '@/store/authSlice';

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusMessage = useMemo(() => {
    if (searchParams.get('verified') === '1') return 'Email đã xác thực. Bạn có thể đăng nhập ngay.';
    if (searchParams.get('reset') === '1') return 'Mật khẩu đã được đặt lại. Hãy đăng nhập lại.';
    return '';
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authApi.login(form);
      authStorage.saveSession(result.accessToken, result.user);
      dispatch(setSession({ accessToken: result.accessToken, user: result.user }));
      router.push('/dashboard');
    } catch (submitError: any) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout image={loginImage.src} heroTitle="Tầm nhìn nghệ thuật." heroSubtitle="Trải nghiệm quyền năng của AI trong việc tái định nghĩa vẻ đẹp và sự hoàn mỹ trong từng khung hình.">
      <div className="mb-8 text-center lg:text-left">
        <p className="font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-[-0.04em] text-[#d2bbff] sm:text-6xl">ĐĂNG NHẬP</p>
        <h1 className="mt-4 font-['Plus_Jakarta_Sans'] text-[30px] font-semibold leading-[38px] text-[#dae2fd]">Chào mừng trở lại</h1>
        <p className="mt-2 text-[16px] leading-6 text-[#ccc3d8]">Đăng nhập để tiếp tục sáng tạo những tác phẩm tuyệt đẹp</p>
      </div>

      <div className="space-y-4">
        <StatusBanner tone="success" message={statusMessage} />
        <StatusBanner tone="error" message={error} />
      </div>

      <button
        type="button"
        onClick={() => {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const googleUrl = `${authApi.googleAuthUrl}?origin=${encodeURIComponent(origin)}`;
          window.location.assign(googleUrl);
        }}
        className="mb-6 mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#2d3449] bg-[#1e293b]/80 px-6 text-sm font-semibold text-[#dae2fd] transition-all duration-300 hover:bg-[#1e293b]"
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        Tiếp tục với Google
      </button>

      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#4a4455]/40" />
        <span className="text-xs font-medium uppercase tracking-[0.28em] text-[#ccc3d8]">Hoặc</span>
        <div className="h-px flex-1 bg-[#4a4455]/40" />
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <InputField
          label="Email"
          type="email"
          placeholder="name@lumina.studio"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          autoComplete="email"
        />

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-[#ccc3d8]" htmlFor="password">Mật khẩu</label>
            <Link className="text-xs font-medium text-[#d2bbff] transition-all hover:underline" href="/forgot-password">Quên mật khẩu?</Link>
          </div>
          <div className="relative">
            <input
              id="password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-[#dae2fd] placeholder:text-[#ccc3d8]/60 outline-none transition focus:border-[#d2bbff] focus:shadow-[0_0_15px_rgba(210,187,255,0.2)]"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ccc3d8] transition hover:text-[#d2bbff]"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#d2bbff] py-3 text-sm font-semibold text-[#3f008e] shadow-lg shadow-[#7c3aed]/20 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#ccc3d8]">
          Bạn chưa có tài khoản? <Link className="font-bold text-[#d2bbff] transition-all hover:underline" href="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
