export type AuthUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type AuthProvider = 'backend' | 'supabase';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_REFRESH_TOKEN_KEY = 'authRefreshToken';
const AUTH_USER_KEY = 'authUser';
const AUTH_PROVIDER_KEY = 'authProvider';
const LEGACY_AUTH_USER_KEY = 'authUser';
const LEGACY_AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';

const SHARED_ACCESS_TOKEN_COOKIE = 'auth_access_token';
const SHARED_REFRESH_TOKEN_COOKIE = 'auth_refresh_token';
const SHARED_USER_COOKIE = 'auth_user';

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=strict`;
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=strict`;
}

function clearSharedCookies() {
  clearCookie(SHARED_ACCESS_TOKEN_COOKIE);
  clearCookie(SHARED_REFRESH_TOKEN_COOKIE);
  clearCookie(SHARED_USER_COOKIE);
  clearCookie('authToken');
  clearCookie(LEGACY_AUTH_REFRESH_TOKEN_KEY);
  clearCookie(LEGACY_AUTH_USER_KEY);
}

export const authStorage = {
  saveSession(accessToken: string, refreshToken: string | null, user: AuthUser | null, provider: AuthProvider = 'backend') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    if (refreshToken) {
      window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
    } else {
      window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    }
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    window.localStorage.setItem(AUTH_PROVIDER_KEY, provider);

    // Share auth state across localhost ports so shell-app/dashboard-ui can consume it.
    setCookie(SHARED_ACCESS_TOKEN_COOKIE, accessToken);
    if (refreshToken) {
      setCookie(SHARED_REFRESH_TOKEN_COOKIE, refreshToken);
    } else {
      clearCookie(SHARED_REFRESH_TOKEN_COOKIE);
    }
    if (user) {
      setCookie(SHARED_USER_COOKIE, JSON.stringify(user));
    } else {
      clearCookie(SHARED_USER_COOKIE);
    }
  },

  loadSession() {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null, user: null as AuthUser | null, provider: 'backend' as AuthProvider };

    const accessToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const refreshToken = window.localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
    const rawUser = window.localStorage.getItem(AUTH_USER_KEY);
    const provider = (window.localStorage.getItem(AUTH_PROVIDER_KEY) as AuthProvider | null) || 'backend';

    let user: AuthUser | null = null;
    if (rawUser) {
      try {
        user = JSON.parse(rawUser) as AuthUser;
      } catch {
        user = null;
      }
    }

    return { accessToken, refreshToken, user, provider };
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    // Keys used by auth-frontend-next
    window.localStorage.removeItem(AUTH_TOKEN_KEY);          // 'authToken'
    window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);  // 'authRefreshToken'
    window.localStorage.removeItem(AUTH_USER_KEY);           // 'authUser'
    window.localStorage.removeItem(AUTH_PROVIDER_KEY);       // 'authProvider'
    // Keys used by shell-app
    window.localStorage.removeItem('auth_access_token');
    window.localStorage.removeItem('auth_refresh_token');
    window.localStorage.removeItem('auth_user');
    // Legacy / cross-app aliases
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem(LEGACY_AUTH_REFRESH_TOKEN_KEY); // 'auth_refresh_token'
    window.localStorage.removeItem(LEGACY_AUTH_USER_KEY);          // 'authUser'

    clearSharedCookies();
  },
};
