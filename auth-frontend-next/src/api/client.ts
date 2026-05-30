import axios from 'axios';

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');

const normalizeAuthBaseUrl = (value: string) => {
  return stripTrailingSlash(value);
};

const configuredAuthBaseUrl = normalizeAuthBaseUrl(
  process.env.NEXT_PUBLIC_AUTH_API_URL || ''
);

export const API_BASE_URL = configuredAuthBaseUrl;

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
