import apiClient, { API_BASE_URL } from './client';

export const authApi = {
  login: async (payload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },

  register: async (payload) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },

  verifyOtp: async (payload) => {
    const { data } = await apiClient.post('/auth/verify-otp', payload);
    return data;
  },

  forgotPassword: async (payload) => {
    const { data } = await apiClient.post('/auth/forgot-password', payload);
    return data;
  },

  resetPassword: async (payload) => {
    const { data } = await apiClient.post('/auth/reset-password', payload);
    return data;
  },

  logout: async () => {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },

  verifyToken: async (accessToken) => {
    const { data } = await apiClient.get('/auth/verify', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return data;
  },

  verifySession: async () => {
    const { data } = await apiClient.get('/auth/verify');
    return data;
  },

  googleAuthUrl: `${API_BASE_URL}/auth/google`,
};
