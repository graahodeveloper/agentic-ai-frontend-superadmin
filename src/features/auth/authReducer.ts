import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '@/types/auth';

const initialState: AuthState = {
  access: '',
  email: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUser: (state, action: PayloadAction<{ access: string; email: string }>) => {
      state.access = action.payload.access;
      state.email = action.payload.email;
    },
    logout: (state) => {
      state.access = '';
      state.email = '';
    },
  },
});

export const { loginUser, logout } = authSlice.actions;
export default authSlice.reducer;
