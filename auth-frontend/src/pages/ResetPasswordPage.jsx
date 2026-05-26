import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import AuthCardLayout from '../layouts/AuthCardLayout';
import InputField from '../components/common/InputField';
import StatusBanner from '../components/common/StatusBanner';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const token = searchParams.get('token') || '';

    const [form, setForm] = useState({ email, token, newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setForm((current) => ({ ...current, email, token }));
    }, [email, token]);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError('');

        if (form.newPassword !== form.confirmPassword) {
            setLoading(false);
            setError('Mat khau xac nhan khong khop');
            return;
        }

        if (!form.email || !form.token) {
            setLoading(false);
            setError('Thieu email hoac token reset');
            return;
        }

        try {
            await authApi.resetPassword({
                email: form.email,
                token: form.token,
                newPassword: form.newPassword,
            });

            setSuccess('Dat lai mat khau thanh cong. Dang quay ve dang nhap...');
            setTimeout(() => navigate('/login?reset=1', { replace: true }), 900);
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthCardLayout
            eyebrow="Reset password"
            title="Dat lai mat khau"
            subtitle="Nhap mat khau moi de hoan tat quy trinh khoi phuc"
            footer={
                <div className="flex items-center justify-between text-sm text-[#ccc3d8]">
                    <Link to="/login">Ve dang nhap</Link>
                    <Link to="/forgot-password">Gui lai email reset</Link>
                </div>
            }
        >
            <div className="space-y-4">
                <StatusBanner tone="success" message={success} />
                <StatusBanner tone="error" message={error} />
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <InputField label="Email" type="email" value={form.email} readOnly />
                <InputField
                    label="Mat khau moi"
                    type="password"
                    placeholder="Nhap mat khau moi"
                    value={form.newPassword}
                    onChange={(event) => setForm((c) => ({ ...c, newPassword: event.target.value }))}
                />
                <InputField
                    label="Xac nhan mat khau"
                    type="password"
                    placeholder="Nhap lai mat khau moi"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((c) => ({ ...c, confirmPassword: event.target.value }))}
                />
                <button className="w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white" type="submit" disabled={loading}>
                    {loading ? 'Dang cap nhat...' : 'Dat lai mat khau'}
                </button>
            </form>
        </AuthCardLayout>
    );
}
