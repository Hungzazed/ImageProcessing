import axios from 'axios';
import apiClient from './client';
import { getSharedSession } from '@/utils/session';

export type PipelineOptions = {
  resize?: {
    width: number;
    height: number;
    fit: 'cover' | 'contain' | 'fill';
  };
  filter?: {
    type: 'sepia' | 'grayscale' | 'blur' | 'brightness';
    value?: number;
  };
  watermark?: {
    type: 'text' | 'image';
    text?: string;
    position?: string;
    opacity?: number;
  };
  compression?: {
    format: 'webp' | 'png' | 'jpeg';
    quality: number;
  };
};

export type ProcessPayload = {
  userId: string;
  s3Key: string;
  options: PipelineOptions;
};

export type SubscriptionPayload = {
  userId: string;
  id: string;
  channel: 'email' | 'webhook';
  destination: string;
  events: string[];
  isActive: boolean;
};

type ApiError = {
  message?: string;
};

export const pipelineApi = {
  // Auth endpoints (Public)
  login: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },
  
  register: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },

  verifyOtp: async (payload: { email: string; otp: string }) => {
    const { data } = await apiClient.post('/auth/verify-otp', payload);
    return data;
  },

  verifyToken: async () => {
    const { data } = await apiClient.get('/auth/verify');
    return data;
  },

  logout: async () => {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },

  // Protected Image Processing trigger
  startProcess: async (payload: ProcessPayload) => {
    const { accessToken } = getSharedSession();
    const { data } = await apiClient.post('/process', payload, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return data;
  },

  // Protected user subscriptions (routed to notification-serverless API gateway)
  getSubscriptions: async (userId: string) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:4000'}/users/${userId}/subscriptions`;
      const { data } = await axios.get(url);
      return data;
    } catch (err: unknown) {
      const error = err as ApiError;
      console.warn('Notification API getSubscriptions failed, falling back to local storage:', error.message);
      return JSON.parse(localStorage.getItem(`subs_${userId}`) || '[]');
    }
  },

  saveSubscription: async (userId: string, payload: SubscriptionPayload) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:4000'}/users/${userId}/subscriptions`;
      const { data } = await axios.post(url, payload);
      return data;
    } catch (err: unknown) {
      const error = err as ApiError;
      console.warn('Notification API saveSubscription failed, falling back to local storage:', error.message);
      const current = JSON.parse(localStorage.getItem(`subs_${userId}`) || '[]') as SubscriptionPayload[];
      const index = current.findIndex((item) => item.id === payload.id);
      if (index >= 0) {
        current[index] = payload;
      } else {
        current.push(payload);
      }
      localStorage.setItem(`subs_${userId}`, JSON.stringify(current));
      return { success: true, item: payload };
    }
  }
};
