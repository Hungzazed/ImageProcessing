import axios from 'axios';

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');

const normalizeAuthBaseUrl = (value: string) => {
  const base = stripTrailingSlash(value);

  if (!base) {
    return '';
  }

  if (base.includes('execute-api') && !base.endsWith('/prod')) {
    return `${base}/prod`;
  }

  return base;
};

const configuredAuthBaseUrl = normalizeAuthBaseUrl(
  process.env.NEXT_PUBLIC_AUTH_API_URL || ''
);

const isLocalDevHost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

export const API_BASE_URL =
  isLocalDevHost && (!configuredAuthBaseUrl || configuredAuthBaseUrl.includes('execute-api'))
    ? 'http://localhost:3001'
    : configuredAuthBaseUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // withCredentials chỉ dùng nếu backend hỗ trợ CORS credential (Access-Control-Allow-Credentials)
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || error?.message || 'Unexpected error';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
