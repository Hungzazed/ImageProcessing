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

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export const authStorage = {
  saveSession(accessToken: string, user: AuthUser | null) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  loadSession() {
    if (typeof window === 'undefined') return { accessToken: null, user: null as AuthUser | null };

    const accessToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const rawUser = window.localStorage.getItem(AUTH_USER_KEY);

    let user: AuthUser | null = null;
    if (rawUser) {
      try {
        user = JSON.parse(rawUser) as AuthUser;
      } catch {
        user = null;
      }
    }

    return { accessToken, user };
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  },
};
