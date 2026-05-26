import axios from 'axios';

const stripTrailingSlash = (value) => value.replace(/\/$/, '');

export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000'
);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unexpected error';

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
