// src/lib/api/baseQueryWithAuth.ts
import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

// ─── Token Cache ──────────────────────────────────────────────────────────────
// In-memory cache to avoid excessive localStorage reads
let tokenCache: {
  token: string | null;
  expiry: number;
} = {
  token: null,
  expiry: 0,
};

const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ─── Token Storage Keys ───────────────────────────────────────────────────────
export const TOKEN_STORAGE_KEY = 'superAdminToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'superAdminRefreshToken';
export const USER_STORAGE_KEY = 'superAdminUser';

// ─── Public Endpoints (no auth required) ──────────────────────────────────────
const PUBLIC_ENDPOINTS: string[] = [
  'login/',
  'cms-settings/login-page/',
];

const isPublicEndpoint = (url: string): boolean => {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// ─── Token Management Functions ───────────────────────────────────────────────

/**
 * Get the current access token from localStorage
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Get the current refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

/**
 * Store tokens in localStorage
 */
export const setTokens = (accessToken: string, refreshToken?: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
  // Update cache
  tokenCache = {
    token: accessToken,
    expiry: Date.now() + TOKEN_CACHE_DURATION,
  };
};

/**
 * Clear all auth tokens
 */
export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem('isSuperAdminLoggedIn');
  // Clear cache
  tokenCache = { token: null, expiry: 0 };
};

/**
 * Get cached token or fetch from localStorage
 */
const getCachedToken = (): string | null => {
  const now = Date.now();

  // Return cached token if still valid
  if (tokenCache.token && tokenCache.expiry > now) {
    return tokenCache.token;
  }

  // Fetch from localStorage
  const token = getAccessToken();

  if (token) {
    tokenCache = {
      token,
      expiry: now + TOKEN_CACHE_DURATION,
    };
  }

  return token;
};

/**
 * Clear the token cache (useful after token refresh)
 */
export const clearTokenCache = (): void => {
  tokenCache = { token: null, expiry: 0 };
};

// ─── Base URL ─────────────────────────────────────────────────────────────────

export const getBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    console.error('NEXT_PUBLIC_API_BASE_URL environment variable is not set');
    throw new Error('API base URL not configured. Please set NEXT_PUBLIC_API_BASE_URL in your environment.');
  }
  return baseUrl;
};

// ─── Base Query with Authentication ───────────────────────────────────────────

export const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  mode: 'cors',
  credentials: 'include',
  prepareHeaders: (headers, { endpoint }) => {
    const url = typeof endpoint === 'string' ? endpoint : '';

    // Skip token for public endpoints
    if (!isPublicEndpoint(url)) {
      const token = getCachedToken();

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Set default headers if not already set (for FormData, browser sets it)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('Accept', 'application/json');

    return headers;
  },
});

// ─── Base Query with Re-authentication ────────────────────────────────────────

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQueryWithAuth(args, api, extraOptions);

  // Check for 401 Unauthorized
  if (result.error && result.error.status === 401) {
    const url = typeof args === 'string' ? args : args.url;

    // Don't retry for public endpoints or if already trying to refresh
    if (!isPublicEndpoint(url) && !url.includes('refresh')) {
      console.log('[Auth] 401 received, attempting token refresh...');

      // Try to refresh the token
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const refreshResult = await baseQueryWithAuth(
            {
              url: 'token/refresh/',
              method: 'POST',
              body: { refresh: refreshToken },
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            const { access, refresh } = refreshResult.data as { access: string; refresh?: string };

            // Store new tokens
            setTokens(access, refresh);

            console.log('[Auth] Token refreshed successfully');

            // Retry the original request
            result = await baseQueryWithAuth(args, api, extraOptions);
          } else {
            // Refresh failed - clear tokens and redirect to login
            console.log('[Auth] Token refresh failed, clearing tokens');
            clearTokens();

            // Redirect to login page
            if (typeof window !== 'undefined') {
              window.location.href = '/auth';
            }
          }
        } catch (error) {
          console.error('[Auth] Error during token refresh:', error);
          clearTokens();
        }
      } else {
        // No refresh token available - clear tokens and redirect
        console.log('[Auth] No refresh token available');
        clearTokens();

        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
      }
    }
  }

  return result;
};

// ─── Base Query without Auth (for public endpoints) ──────────────────────────

export const baseQueryWithoutAuth = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  mode: 'cors',
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    return headers;
  },
});

// ─── Helper to check if user is authenticated ─────────────────────────────────

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  const isLoggedIn = localStorage.getItem('isSuperAdminLoggedIn');
  return Boolean(token && isLoggedIn === 'true');
};

// ─── Get current user from storage ────────────────────────────────────────────

export interface StoredUser {
  id: string;
  sub_id?: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role?: string;
}

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === 'undefined') return null;

  try {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (userJson) {
      return JSON.parse(userJson) as StoredUser;
    }
    return null;
  } catch (error) {
    console.error('[Auth] Error parsing stored user:', error);
    return null;
  }
};

export const setStoredUser = (user: StoredUser): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};
