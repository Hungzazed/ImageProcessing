import axios from 'axios';
import type { AuthUser } from '@/store/authStorage';
import apiClient, { API_BASE_URL } from './client';

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');

const USER_API_BASE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_USER_API_URL || ''
);

const userApiClient = axios.create({
  baseURL: USER_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };
export type ResetPasswordPayload = { email: string; token: string; newPassword: string };
export type LoginResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser | null;
};
export type CreateUserPayload = {
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
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

const normalizeUserList = (data: unknown): UserProfile[] => {
  if (Array.isArray(data)) {
    return data as UserProfile[];
  }

  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)) {
    return (data as { items: UserProfile[] }).items;
  }

  return [];
};

const buildUsername = (name: string, email: string) => {
  const baseFromName = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (baseFromName) {
    return baseFromName;
  }

  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '_');
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
  createUser: async (payload: CreateUserPayload) => {
    const { data } = await userApiClient.post('/users', payload);
    return data;
  },
  getUsers: async (params: { email?: string; phone?: string }) => {
    const { data } = await userApiClient.get('/users', { params });
    return normalizeUserList(data);
  },
  getUserByEmail: async (email: string | null) => {
    if (!email) return null;

    try {
      const users = await authApi.getUsers({ email });
      return users[0] ?? null;
    } catch {
      return null;
    }
  },
  prepareUserPayload: (payload: RegisterPayload & { phoneNumber?: string }) => ({
    username: buildUsername(payload.name, payload.email),
    email: payload.email,
    fullName: payload.name,
    phoneNumber: payload.phoneNumber?.trim() || undefined,
  }),
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
    return `${API_BASE_URL}/auth/google`;
  },
};
