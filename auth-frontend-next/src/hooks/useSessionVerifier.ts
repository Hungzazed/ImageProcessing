'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authApi } from '@/api/authApi';
import { authStorage } from '@/store/authStorage';
import { clearSession, setSession } from '@/store/authSlice';
import type { RootState } from '@/store/store';

export default function useSessionVerifier(onInvalidSession: () => void) {
  const dispatch = useDispatch();
  const state = useSelector((store: RootState) => store.auth);
  const [loading, setLoading] = useState(true);
  const onInvalidSessionRef = useRef(onInvalidSession);

  useEffect(() => {
    onInvalidSessionRef.current = onInvalidSession;
  }, [onInvalidSession]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      dispatch(clearSession());
      onInvalidSessionRef.current();
      setLoading(false);
      return;
    }

    const token = storedToken!;

    let alive = true;

    async function verify() {
      try {
        const payload = await authApi.verifyToken(token as string);
        if (!alive) return;

        const email = payload.user && payload.user.email ? String(payload.user.email) : '';
        const profile = await authApi.getUserByEmail(email);
        const mergedUser = authApi.mergeAuthAndProfile(payload.user, profile);

        authStorage.saveSession(token, mergedUser);
        dispatch(setSession({ accessToken: token, user: mergedUser }));
      } catch {
        authStorage.clearSession();
        dispatch(clearSession());
        if (alive) onInvalidSessionRef.current();
      } finally {
        if (alive) setLoading(false);
      }
    }

    verify();

    return () => {
      alive = false;
    };
  }, [dispatch]);

  return { state, loading };
}
