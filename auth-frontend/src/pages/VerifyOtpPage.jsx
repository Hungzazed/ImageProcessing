import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import AuthCardLayout from '../layouts/AuthCardLayout';
import InputField from '../components/common/InputField';
import StatusBanner from '../components/common/StatusBanner';

export default function VerifyOtpPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({
        email: searchParams.get('email') || sessionStorage.getItem('pendingRegistrationEmail') || '',
        otp: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authApi.verifyOtp(form);
            sessionStorage.removeItem('pendingRegistrationEmail');
            setSuccess('Xac thuc thanh cong. Dang chuyen ve man hinh dang nhap...');
            setTimeout(() => navigate(`/login?verified=1&email=${encodeURIComponent(form.email)}`, { replace: true }), 900);
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthCardLayout
            eyebrow="Verify email"
            title="Xac thuc OTP"
            subtitle="Nhap ma OTP da gui tu auth-service de hoan tat tao tai khoan"
            footer={
                <div className="flex items-center justify-between text-sm text-[#ccc3d8]">
                    <Link to="/register">Quay lai dang ky</Link>
                    <Link to="/login">Ve dang nhap</Link>
                </div>
            }
        >
            <div className="space-y-4">
                <StatusBanner tone="success" message={success} />
                <StatusBanner tone="error" message={error} />
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <InputField
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    autoComplete="email"
                />
                <InputField
                    label="OTP"
                    type="text"
                    placeholder="6 chu so"
                    inputMode="numeric"
                    value={form.otp}
                    onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))}
                    autoComplete="one-time-code"
                />
                <button className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white" type="submit" disabled={loading}>
                    {loading ? 'Dang xac thuc...' : 'Xac thuc OTP'}
                </button>
            </form>
        </AuthCardLayout>
    );
}
