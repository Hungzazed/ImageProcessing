import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { authStorage } from './authStorage';

const session = authStorage.loadSession();

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      accessToken: session.accessToken,
      user: session.user,
    },
  },
});