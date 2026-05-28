import axios from 'axios';

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');

export const API_BASE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://18.138.103.214/api/v1'
);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach authToken from localStorage (supports both stand-alone and shell-orchestrated access tokens)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('authToken') || window.localStorage.getItem('auth_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || error?.message || 'Unexpected error';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
