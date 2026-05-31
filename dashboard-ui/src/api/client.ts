import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getSharedSession, saveSharedSession } from '@/utils/session';
import { getProdGatewayBaseUrl } from '@/utils/gatewayUrls';

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');
type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const API_BASE_URL = typeof window !== 'undefined' ? '/api/gateway' : stripTrailingSlash(`${getProdGatewayBaseUrl()}`);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token || '');
    }
  });
  failedQueue = [];
};

// Auto-attach authToken from localStorage (supports both stand-alone and shell-orchestrated access tokens)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const { accessToken } = getSharedSession();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
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
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, user } = getSharedSession();

      if (refreshToken) {
        try {
          const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );
          const nextRefreshToken = data.refreshToken || refreshToken;

          saveSharedSession(data.accessToken, user, nextRefreshToken);
          processQueue(null, data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          isRefreshing = false;
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
        }
      } else {
        isRefreshing = false;
      }
    }

    const message = error?.response?.data?.message || error?.message || 'Unexpected error';
    const err = new Error(message) as Error & {
      response?: {
        status: number;
        headers: unknown;
        data: unknown;
      };
    };
    // Attach original axios response for richer debugging (status, headers, body)
    if (error?.response) {
      err.response = {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
      };
    }
    return Promise.reject(err);
  }
);

export default apiClient;
