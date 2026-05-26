import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authApi } from '../api/authApi';
import { authStorage } from '../store/authStorage';
import { clearSession, setSession } from '../store/authSlice';

export default function useSessionVerifier(onInvalidSession) {
  const dispatch = useDispatch();
  const state = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(true);
  const onInvalidSessionRef = useRef(onInvalidSession);

  useEffect(() => {
    onInvalidSessionRef.current = onInvalidSession;
  }, [onInvalidSession]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      dispatch(clearSession());
      onInvalidSessionRef.current();
      setLoading(false);
      return;
    }

    let alive = true;

    async function verify() {
      try {
        const payload = await authApi.verifyToken(token);
        if (!alive) return;
        authStorage.saveSession(token, payload.user);
        dispatch(setSession({ accessToken: token, user: payload.user }));
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
