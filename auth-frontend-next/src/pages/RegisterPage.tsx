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
    <AuthSplitLayout image={registerImage.src} heroTitle="Unlimited creation." heroSubtitle="Unlock your creative potential with advanced AI tools that turn every idea into polished reality.">
      <div className="space-y-2 text-center lg:text-left">
        <p className="font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-[-0.04em] text-[#d2bbff] sm:text-6xl">SIGN UP</p>
        <h1 className="mt-4 font-['Plus_Jakarta_Sans'] text-[30px] font-semibold leading-[38px] text-white">Start your creative journey</h1>
        <p className="text-[16px] leading-6 text-[#ccc3d8]">Join a community of millions of photographers and creators.</p>
      </div>

      <div className="mt-4">
        <StatusBanner tone="error" message={error} />
      </div>

      <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
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
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          autoComplete="new-password"
        />

        <div className="flex items-start gap-3 pt-1">
          <input className="mt-1 rounded border-[#4a4455] bg-[#171f33] text-[#7c3aed] focus:ring-[#7c3aed]" id="terms" type="checkbox" />
          <label className="text-sm leading-6 text-[#ccc3d8]" htmlFor="terms">
            I agree to Lumina Studio's <a className="text-[#d2bbff] hover:underline" href="#">Terms</a> and <a className="text-[#d2bbff] hover:underline" href="#">Privacy Policy</a>.
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white shadow-lg shadow-[#7c3aed]/20 transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#ccc3d8]">
          Already have an account? <Link className="font-bold text-[#d2bbff] hover:underline" href="/login">Sign in</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default RegisterPage;
