import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authApi } from '../api/authApi';
import { authStorage } from '../store/authStorage';
import { setSession } from '../store/authSlice';
import { clearCookie, readCookie } from '../utils/cookies';
import AuthCardLayout from '../layouts/AuthCardLayout';

export default function CallbackPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [status, setStatus] = useState('Dang hoan tat dang nhap Google...');
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;

        async function finishGoogleAuth() {
            try {
                const accessToken = readCookie('accessToken');
                const tempUserInfo = readCookie('tempUserInfo');

                const session = accessToken ? await authApi.verifyToken(accessToken) : await authApi.verifySession();

                const user = tempUserInfo ? JSON.parse(tempUserInfo) : session.user;
                const resolvedAccessToken = accessToken || session.accessToken || '';

                if (!resolvedAccessToken) throw new Error('Khong tim thay access token sau callback');

                authStorage.saveSession(resolvedAccessToken, user);
                dispatch(setSession({ accessToken: resolvedAccessToken, user }));
                clearCookie('accessToken');
                clearCookie('tempUserInfo');

                if (alive) {
                    setStatus('Dang nhap Google thanh cong. Dang chuyen toi dashboard...');
                    setTimeout(() => navigate('/dashboard', { replace: true }), 800);
                }
            } catch (callbackError) {
                if (alive) {
                    setError(callbackError.message);
                    setStatus('Khong the hoan tat dang nhap Google');
                }
            }
        }

        finishGoogleAuth();

        return () => {
            alive = false;
        };
    }, [dispatch, navigate]);

    return (
        <AuthCardLayout
            eyebrow="Google sign-in"
            title="Dang hoan tat callback"
            subtitle="Frontend dang lay token do auth-service tra ve va luu phien dang nhap"
        >
            {error ? <div className="mb-4 rounded-xl border border-[#ffb4ab]/20 bg-[#93000a]/20 px-4 py-3 text-sm text-[#ffdad6]">{error}</div> : null}
            <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-300" />
                {status}
            </div>
        </AuthCardLayout>
    );
}
