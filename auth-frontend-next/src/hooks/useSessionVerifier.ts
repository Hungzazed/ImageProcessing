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
    const storedSession = authStorage.loadSession();
    if (!storedSession.accessToken && !storedSession.refreshToken) {
      dispatch(clearSession());
      onInvalidSessionRef.current();
      setLoading(false);
      return;
    }

    let alive = true;

    async function renewAccessToken(refreshToken: string) {
      const refreshed = await authApi.refreshAccessToken(refreshToken);
      const nextAccessToken = refreshed.accessToken;
      authStorage.saveSession(nextAccessToken, refreshed.refreshToken || refreshToken, storedSession.user);
      dispatch(setSession({ accessToken: nextAccessToken, user: storedSession.user }));
      return nextAccessToken;
    }

    async function verify() {
      try {
        let token = storedSession.accessToken;

        if (!token && storedSession.refreshToken) {
          token = await renewAccessToken(storedSession.refreshToken);
        }

        if (!token) {
          throw new Error('No access token available');
        }

        let payload;

        try {
          payload = await authApi.verifyToken(token);
        } catch (error) {
          if (storedSession.refreshToken) {
            token = await renewAccessToken(storedSession.refreshToken);
            payload = await authApi.verifyToken(token);
          } else {
            throw error;
          }
        }

        if (!alive) return;

        const email = payload.user && payload.user.email ? String(payload.user.email) : '';
        const profile = await authApi.getUserByEmail(email);
        const mergedUser = authApi.mergeAuthAndProfile(payload.user, profile);

        authStorage.saveSession(token, storedSession.refreshToken, mergedUser);
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
