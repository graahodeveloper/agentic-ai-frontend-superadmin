// src/features/demoUsers/demoUsersApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQueryWithAuth';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DemoUser {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  interest?: string;
  source?: string;
  status?: 'new' | 'engaged' | 'converted' | 'inactive';
  demo_accessed_at?: string | null;
  last_activity_at?: string | null;
  demo_sessions_count?: number;
  is_converted?: boolean;
  converted_user?: string | null;
  converted_user_email?: string | null;
  converted_at?: string | null;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DemoUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DemoUser[];
}

export interface GetDemoUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'new' | 'engaged' | 'converted' | 'inactive';
  source?: string;
  ordering?: string;
}

export interface UpdateDemoUserPayload {
  id: string;
  status?: 'new' | 'engaged' | 'converted' | 'inactive';
  admin_notes?: string;
}

export interface UpdateDemoUserResponse extends DemoUser {
  message?: string;
}

export interface DemoUserStatsResponse {
  total: number;
  by_status: Record<string, number>;
  by_source: Record<string, number>;
  recent_7_days: number;
  recent_30_days: number;
  conversion_rate: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const demoUsersApi = createApi({
  reducerPath: 'demoUsersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['DemoUsers', 'DemoUsersStats'],
  endpoints: (builder) => ({
    // List demo/guest users with optional filters
    getDemoUsers: builder.query<DemoUsersResponse, GetDemoUsersParams>({
      query: ({ page = 1, limit = 10, search, status, source, ordering }) => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (source) params.append('source', source);
        if (ordering) params.append('ordering', ordering);
        return `guest-users/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((u) => ({ type: 'DemoUsers' as const, id: u.id })),
              { type: 'DemoUsers', id: 'LIST' },
            ]
          : [{ type: 'DemoUsers', id: 'LIST' }],
    }),

    // Get statistics for demo users
    getDemoUsersStats: builder.query<DemoUserStatsResponse, void>({
      query: () => 'guest-users/stats/',
      providesTags: ['DemoUsersStats'],
    }),

    // Update a demo/guest user (status, notes, etc.)
    updateDemoUser: builder.mutation<UpdateDemoUserResponse, UpdateDemoUserPayload>({
      query: ({ id, ...body }) => ({
        url: `guest-users/${id}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DemoUsers', id },
        { type: 'DemoUsers', id: 'LIST' },
        'DemoUsersStats',
      ],
    }),

    // Mark guest as engaged
    markAsEngaged: builder.mutation<{ message: string; guest: DemoUser }, string>({
      query: (id) => ({
        url: `guest-users/${id}/mark-engaged/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'DemoUsers', id },
        { type: 'DemoUsers', id: 'LIST' },
        'DemoUsersStats',
      ],
    }),

    // Add admin note
    addAdminNote: builder.mutation<{ message: string; guest: DemoUser }, { id: string; note: string }>({
      query: ({ id, note }) => ({
        url: `guest-users/${id}/add-note/`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DemoUsers', id },
      ],
    }),

    // Delete a demo/guest user
    deleteDemoUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `guest-users/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'DemoUsers', id: 'LIST' }, 'DemoUsersStats'],
    }),
  }),
});

export const {
  useGetDemoUsersQuery,
  useGetDemoUsersStatsQuery,
  useUpdateDemoUserMutation,
  useMarkAsEngagedMutation,
  useAddAdminNoteMutation,
  useDeleteDemoUserMutation,
} = demoUsersApi;
