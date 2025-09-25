// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { userApi } from '@/features/user/userApi';
import { agentApi } from '@/features/agent/agentApi';
import { authApi } from '@/features/auth/authApi';
import { activationApi } from '@/features/activation/activationApi';
import { fileApi } from './features/fileApi';
import { agentTemplateApi } from './features/agentTemplateApi/agentTemplateApi';

export const store = configureStore({
  reducer: {
    // RTK Query APIs
    [userApi.reducerPath]: userApi.reducer,
    [agentApi.reducerPath]: agentApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [activationApi.reducerPath]: activationApi.reducer,
    [agentTemplateApi.reducerPath]: agentTemplateApi.reducer, // Add this line
    [fileApi.reducerPath]: fileApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    })
    .concat(userApi.middleware)
    .concat(agentApi.middleware)
    .concat(authApi.middleware)
    .concat(activationApi.middleware)
    .concat(agentTemplateApi.middleware) // Add this line
    .concat(fileApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;