import axios from 'axios';
import { getSharedSession } from '@/utils/session';

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
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Unexpected error';
    const err: any = new Error(message);
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
