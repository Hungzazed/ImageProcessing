import type { AuthUser } from '@/store/authStorage';
import apiClient, { API_BASE_URL } from './client';
import { getShellBaseUrl } from '@/utils/shellUrl';

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');

const GOOGLE_AUTH_API_BASE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_API_URL || ''
);

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };
export type ResetPasswordPayload = { email: string; token: string; newPassword: string };
export type LoginResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser | null;
};
export type UserProfile = {
  id?: number | string;
  username?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

const mergeAuthAndProfile = (authUser: AuthUser | null, profile: UserProfile | null): AuthUser | null => {
  if (!authUser && !profile) return null;

  return {
    ...authUser,
    ...profile,
    id: profile?.id?.toString?.() ?? authUser?.id,
    name: profile?.fullName ?? authUser?.name,
    email: profile?.email ?? authUser?.email,
  };
};

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data as LoginResponse;
  },
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },
  mergeAuthAndProfile,
  verifyOtp: async (payload: { email: string; otp: string }) => {
    const { data } = await apiClient.post('/auth/verify-otp', payload);
    return data;
  },
  forgotPassword: async (payload: { email: string }) => {
    const { data } = await apiClient.post('/auth/forgot-password', payload);
    return data;
  },
  resetPassword: async (payload: ResetPasswordPayload) => {
    const { data } = await apiClient.post('/auth/reset-password', payload);
    return data;
  },
  refreshAccessToken: async (refreshToken: string) => {
    const { data } = await apiClient.post('/auth/refresh-token', { refreshToken }, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    return data as { accessToken: string; refreshToken: string };
  },
  logout: async (refreshToken?: string | null) => {
    const { data } = await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : undefined, {
      headers: refreshToken ? { Authorization: `Bearer ${refreshToken}` } : undefined,
    });
    return data;
  },
  verifyToken: async (accessToken: string | null) => {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    const { data } = await apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },
  verifySession: async () => {
    const { data } = await apiClient.get('/auth/verify');
    return data;
  },
  get googleAuthUrl() {
    const configuredBase = (GOOGLE_AUTH_API_BASE_URL || API_BASE_URL || '').trim();

    if (!configuredBase) {
      throw new Error('Missing NEXT_PUBLIC_GOOGLE_AUTH_API_URL or NEXT_PUBLIC_AUTH_API_URL');
    }

    const googleUrl = new URL(`${configuredBase}/auth/google`);

    if (typeof window !== 'undefined') {
      googleUrl.searchParams.set('origin', window.location.origin);
    }

    const shellBaseUrl = getShellBaseUrl();
    if (shellBaseUrl) {
      googleUrl.searchParams.set('shellOrigin', shellBaseUrl);
    }

    return googleUrl.toString();
  },
};
