import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authStorage, AuthUser } from './authStorage';

const persisted = authStorage.loadSession();

export type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
};

const initialState: AuthState = {
  accessToken: persisted.accessToken,
  user: persisted.user,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ accessToken: string; user: AuthUser | null }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    clearSession() {
      return { accessToken: null, user: null };
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
