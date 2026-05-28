import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { emitEvent } from '../events/eventBus';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queue to hold requests while refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Automatic Refresh Flow
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Guard: Prevent loops and non-401 errors
    if (!originalRequest || error.response?.status !== 401 || (originalRequest as any)._retry) {
      return Promise.reject(error);
    }

    // Guard: Do not attempt to refresh if the request was the refresh request itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      useAuthStore.getState().logout();
      emitEvent('token-expired', undefined);
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue requests until refresh is complete
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Mark request as retried
    (originalRequest as any)._retry = true;
    isRefreshing = true;

    const { refreshToken } = useAuthStore.getState();

    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      emitEvent('token-expired', undefined);
      return Promise.reject(error);
    }

    try {
      // Call token refresh API
      const response = await axios.post<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>(`${API_URL}/auth/refresh`, { refreshToken });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = response.data;

      // Update Zustand and Cookies
      useAuthStore.getState().login(newAccessToken, newRefreshToken, user);

      // Resolve pending requests
      processQueue(null, newAccessToken);

      // Update current request headers and retry
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      
      isRefreshing = false;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh token is expired or invalid
      processQueue(refreshError, null);
      isRefreshing = false;
      
      useAuthStore.getState().logout();
      emitEvent('token-expired', undefined);
      emitEvent('auth-logout', undefined);
      
      return Promise.reject(refreshError);
    }
  }
);
