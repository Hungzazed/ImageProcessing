import axios, { type InternalAxiosRequestConfig } from 'axios';
import { authStorage } from '@/store/authStorage';

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');
type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

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

apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = authStorage.loadSession();
    const headers = config.headers as Record<string, unknown>;
    const hasExplicitAuthorization = Boolean(headers.Authorization || headers.authorization);

    if (accessToken && !hasExplicitAuthorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error?.response?.status;
    const isAuthError = status === 401 || status === 403;

    if (originalRequest && isAuthError && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh-token')) {
      const { refreshToken, user, provider } = authStorage.loadSession();

      if (refreshToken) {
        try {
          originalRequest._retry = true;
          const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );
          const nextRefreshToken = data.refreshToken || refreshToken;

          authStorage.saveSession(data.accessToken, nextRefreshToken, user, provider);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          authStorage.clearSession();
          return Promise.reject(refreshError);
        }
      }
    }

    const message =
      error?.response?.data?.message || error?.message || 'Unexpected error';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
