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
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNumber: '' });
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

      sessionStorage.setItem(
        'pendingRegistrationData',
        JSON.stringify({
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber.trim(),
        })
      );

      sessionStorage.setItem('pendingRegistrationEmail', form.email);
      router.push(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch (submitError: any) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout image={registerImage.src} heroTitle="Unlimited creation." heroSubtitle="Unlock your creative potential with advanced AI tools that turn every idea into polished reality.">
      <div className="space-y-1 text-center lg:text-left">
        <p className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-5xl md:text-4xl font-extrabold tracking-[-0.04em] text-[#d2bbff]">SIGN UP</p>
        <h1 className="mt-1 font-['Plus_Jakarta_Sans'] text-base md:text-2xl font-semibold leading-[1.12] text-white">Start your creative journey</h1>
        <p className="text-xs md:text-sm leading-5 text-[#ccc3d8]">Join a community of millions of photographers and creators.</p>
      </div>

      <div className="mt-2">
        <StatusBanner tone="error" message={error} />
      </div>

      <form className="space-y-2.5 pt-2" onSubmit={handleSubmit}>
        <InputField
          label="Full name"
          type="text"
          placeholder="Enter your full name"
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
          label="Số điện thoại"
          type="tel"
          placeholder="0901234567"
          value={form.phoneNumber}
          onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
          autoComplete="tel"
          required
        />
        <InputField
          label="Mật khẩu"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          autoComplete="new-password"
        />

        <div className="flex items-start gap-2.5 pt-0.5">
          <input className="mt-1 rounded border-[#4a4455] bg-[#171f33] text-[#7c3aed] focus:ring-[#7c3aed]" id="terms" type="checkbox" />
          <label className="text-xs md:text-sm leading-5 text-[#ccc3d8]" htmlFor="terms">
            I agree to Lumina Studio's <a className="text-[#d2bbff] hover:underline" href="#">Terms</a> and <a className="text-[#d2bbff] hover:underline" href="#">Privacy Policy</a>.
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#7c3aed] py-2.5 text-sm font-bold text-white shadow-lg shadow-[#7c3aed]/20 transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-3 text-center pb-0">
        <p className="text-xs md:text-sm text-[#ccc3d8]">
          Already have an account? <Link className="font-bold text-[#d2bbff] hover:underline" href="/login">Sign in</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default function Page() {
  return null;
}

