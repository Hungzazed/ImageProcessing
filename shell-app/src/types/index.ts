export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken?: string | null, user?: User | null) => void;
  logout: () => void;
  hydrate: () => void;
}

export interface EventBusMap {
  'auth-login': { accessToken: string; refreshToken?: string | null; user: User };
  'auth-logout': undefined;
  'navigate': { path: string };
  'notification': { message: string; type: Notification['type'] };
  'token-expired': undefined;
}
