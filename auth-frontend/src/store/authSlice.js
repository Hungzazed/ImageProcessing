import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    clearSession() {
      return initialState;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;