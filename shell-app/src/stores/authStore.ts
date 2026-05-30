import { create } from 'zustand';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { AuthState, User } from '../types';

const COOKIE_ACCESS_TOKEN = 'auth_access_token';
const COOKIE_REFRESH_TOKEN = 'auth_refresh_token';
const COOKIE_USER = 'auth_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  login: (accessToken, refreshToken = null, user = null) => {
    // 1. Update Zustand state
    set({
      accessToken,
      refreshToken: refreshToken || null,
      user,
      isAuthenticated: true,
    });

    // 2. Save tokens to secure cookies (readable by Edge middleware)
    const cookieOptions = {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    };

    setCookie(COOKIE_ACCESS_TOKEN, accessToken, cookieOptions);
    if (refreshToken) {
      setCookie(COOKIE_REFRESH_TOKEN, refreshToken, cookieOptions);
    } else {
      deleteCookie(COOKIE_REFRESH_TOKEN, { path: '/' });
    }
    if (user) {
      setCookie(COOKIE_USER, JSON.stringify(user), cookieOptions);
    }

    // 3. Fallback to localStorage for hybrid client resilience
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_access_token', accessToken);
      localStorage.setItem('authToken', accessToken); // Support legacy/standalone microfrontend keys
      if (refreshToken) {
        localStorage.setItem('auth_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('auth_refresh_token');
      }
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('authUser', JSON.stringify(user)); // Support dashboard-ui key
      }
    }
  },

  logout: () => {
    // 1. Reset Zustand state
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });

    // 2. Clear cookies
    deleteCookie(COOKIE_ACCESS_TOKEN, { path: '/' });
    deleteCookie(COOKIE_REFRESH_TOKEN, { path: '/' });
    deleteCookie(COOKIE_USER, { path: '/' });

    // 3. Clear localStorage — all keys used across all microfrontends
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_access_token');   // shell-app
      localStorage.removeItem('authToken');            // auth-frontend-next / legacy
      localStorage.removeItem('auth_refresh_token');  // shell-app
      localStorage.removeItem('authRefreshToken');     // auth-frontend-next
      localStorage.removeItem('auth_user');            // shell-app
      localStorage.removeItem('authUser');             // auth-frontend-next / dashboard-ui
      localStorage.removeItem('authProvider');         // auth-frontend-next
    }
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;

    try {
      // Try to load from cookies first (most reliable for SSR alignment)
      let accessToken = getCookie(COOKIE_ACCESS_TOKEN) as string | null;
      let refreshToken = getCookie(COOKIE_REFRESH_TOKEN) as string | null;
      let userCookie = getCookie(COOKIE_USER) as string | null;
      let user: User | null = null;

      if (userCookie) {
        user = JSON.parse(userCookie) as User;
      }

      // LocalStorage fallbacks
      if (!accessToken) {
        accessToken = localStorage.getItem('auth_access_token');
        refreshToken = localStorage.getItem('auth_refresh_token');
        const userStorage = localStorage.getItem('auth_user');
        if (userStorage) {
          user = JSON.parse(userStorage) as User;
        }
      }

      if (accessToken && user) {
        set({
          accessToken,
          refreshToken: refreshToken || null,
          user,
          isAuthenticated: true,
        });
      } else {
        // Clear everything to ensure clean state
        get().logout();
      }
    } catch (e) {
      console.error('Failed to hydrate auth store', e);
      get().logout();
    }
  },
}));
