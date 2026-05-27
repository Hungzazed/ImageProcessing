import apiClient from './client';

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

export const pipelineApi = {
  // Auth endpoints (Public)
  login: async (payload: any) => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },
  
  register: async (payload: any) => {
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
    const { data } = await apiClient.post('/process', payload);
    return data;
  },

  // Protected user subscriptions (routed to user service via API gateway)
  getSubscriptions: async (userId: string) => {
    try {
      const { data } = await apiClient.get(`/users/${userId}/subscriptions`);
      return data;
    } catch {
      // Fallback for demo purposes if DynamoDB subscription endpoint is not yet created
      return JSON.parse(localStorage.getItem(`subs_${userId}`) || '[]');
    }
  },

  saveSubscription: async (userId: string, payload: SubscriptionPayload) => {
    try {
      const { data } = await apiClient.post(`/users/${userId}/subscriptions`, payload);
      return data;
    } catch {
      // Fallback to local storage if endpoint is not fully ready
      const current = JSON.parse(localStorage.getItem(`subs_${userId}`) || '[]');
      const index = current.findIndex((s: any) => s.id === payload.id);
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
