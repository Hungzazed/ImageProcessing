import apiClient, { API_BASE_URL } from './client';

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };
export type ResetPasswordPayload = { email: string; token: string; newPassword: string };

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },
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
  logout: async () => {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },
  verifyToken: async (accessToken: string) => {
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
