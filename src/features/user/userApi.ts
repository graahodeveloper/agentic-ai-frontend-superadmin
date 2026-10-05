// src/features/user/userApi.ts
import { User } from '@/types/auth';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQueryWithAuth';

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  sub_id?: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  mobile?: string;
  is_active?: boolean;
  country?: string;
}

// New interface for admin user creation
export interface CreateAdminUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  password: string;
  country?: string;
}

// User Access Summary Interfaces
export interface UserAccessSummaryDetails {
  id: string;
  sub_id: string | null;
  full_name: string;
  email: string;
  role: string;
  is_admin?: boolean;    // Made optional
  is_active: boolean;
  created_by?: string;   // Made optional
}

export interface AgentDetails {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  agent_variant: string;
  is_active: boolean;
  is_public: boolean;
}


export interface GrantedByDetails {
  id: string;
  sub_id: string;
  full_name: string;
  email: string;
  role: string;
}


export interface AgentAccess {
  id: string;
  user: string;
  agent: string;
  granted_by: string;
  access_type: 'view' | 'use' | 'manage' | 'full';
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
  user_details: UserAccessSummaryDetails;
  agent_details: AgentDetails;
  granted_by_details: GrantedByDetails;
  granted_by_name: string;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}
export interface ApiAccess {
  id: string;
  user: string;
  api_endpoint: string;
  access_type: string;
  granted_by: string;
  granted_by_name: string;
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface UserAccessSummaryResponse {
  user_details: UserAccessSummaryDetails;
  agent_access: AgentAccess[];
  api_access: ApiAccess[];  // Now uses the defined ApiAccess interface
  total_agent_access: number;
  total_api_access: number;
  active_agent_access: number;
  active_api_access: number;
  accessible_agents_count: number;
}

// Agent interfaces for agent access functionality
export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  agent_type: string;
  agent_variant: string;
  website: string;
  user_sub_id: string;
  created_by: string | null;
  creator_name: string;
  created_by_details: unknown;
  is_system_agent: boolean;
  is_user_created: boolean;
  is_active: boolean;
  is_public: boolean;
  activations_count: number;
  active_activations_count: number;
  user_access_count: number;
  created_at: string;
  updated_at: string;
}

export interface AgentsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Agent[];
}

export interface GrantAccessRequest {
  user: string;
  agent: string;
  access_type: 'view' | 'use' | 'manage' | 'full';
}

export interface GrantAccessResponse {
  id: string;
  user: string;
  agent: string;
  access_type: string;
  granted_at: string;
  granted_by: string;
  message?: string;
}

export interface UserResponse {
  user: User;
  message?: string;
}

export interface UsersListResponse {
  users: User[];
  total?: number;
  page?: number;
  limit?: number;
  results?: User[];
  count?: number;
}

// New interface for admin created users response
export interface AdminCreatedUsersResponse {
  results: User[];
  count: number;
  admin_info?: {
    id: string;
    sub_id?: string;
    full_name?: string;
    email?: string;
  };
}

// Updated interface to match the actual API response
export interface ActivationDataUser {
  id: string;
  sub_id: string;
  activation_code: string | null;
  full_name: string;
  email: string;
  country: string | null;
  role: string;
  customer_used_token: number;
  password_set: boolean;
  is_active: boolean;
}

export interface ActivationData {
  id: string;
  user: ActivationDataUser;
  status: boolean;
  context: string;
  agent_roles: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreatedAgent {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  agent_type: string;
  agent_type_display: string;
  website: string;
  user_sub_id: string;
  created_by: string | null;
  creator_name: string;
  created_by_details: {
    id: string;
    sub_id: string;
    full_name: string;
    email: string;
    country: string | null;
    role: string;
    is_active: boolean;
  }| null;
  is_active: boolean;
  activations_count: number;
  active_activations_count: number;
  created_at: string;
  updated_at: string;
  activation_data: ActivationData;
}

export interface CreateUserCreatedAgentRequest {
  agent_type: string;
  agent_name: string;
  website?: string;
  description?: string;
  is_active?: boolean;
  created_by: string;
}

export interface UserCreatedAgentResponse {
  id: string;
  agent_type: string;
  agent_type_display: string;
  agent_name: string;
  website?: string;
  description?: string;
  is_active: boolean;
  created_by_details: {
    id: string;
    sub_id?: string;
    full_name?: string;
    email?: string;
    country?: string;
    role?: string;
    is_active: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserCreatedAgentsListResponse {
  count: number;
  creator?: {
    id: string;
    sub_id?: string;
    full_name?: string;
    email?: string;
    is_active: boolean;
  };
  agents?: UserCreatedAgent[];
  results?: UserCreatedAgent[];
}

// ============ SETTINGS → SUMMARY SUPPORT (SA-047) ============
//
// `GET users/` is served by `UsersViewSet`, which declares no `pagination_class`,
// so it falls back to the project-wide default `PageNumberPagination` with
// `PAGE_SIZE = 20` and NO `page_size_query_param`. In other words: the server
// always returns 20 rows per page no matter what `limit`/`page_size` the client
// sends, and paging is the only way to see more than one page of rows. The
// existing `getUsers` endpoint above still sends `limit`, which the server
// silently ignores — that is pre-existing behaviour and is left untouched here,
// but the new endpoints below deliberately do not copy that param.
export const USERS_PAGE_SIZE = 20;

// Hard cap on how many pages `getUserDirectorySnapshot` will walk in one call.
// 25 pages * 20 rows/page = 500 users scanned per snapshot. Capped at 25 (not
// higher) because each `users/` page costs 60+ backend DB queries — see
// `UsersSerializer`'s three `SerializerMethodField`s (`get_agent_access`,
// `get_agent_access_count`, `get_workspaces`), each of which runs a fresh
// per-row query and defeats the viewset's `prefetch_related`. The scan's page
// count, not anything on this side, is what dominates this page's load time.
export const DEFAULT_MAX_SNAPSHOT_PAGES = 25;

export interface UserCohortCountParams {
  is_active?: boolean;
  role?: string;
  user_type?: string;
}

export interface UserCohortCountResponse {
  count: number;
}

// Serializer fields documented for `UsersSerializer`. All optional except `id`:
// the API may omit fields depending on the endpoint/version, and this type is
// intentionally separate from the shared `User` type in `@/types/auth` (which
// several other screens depend on and must not be reshaped by this slice).
export interface DirectoryUser {
  id: string;
  sub_id?: string | null;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  mobile?: string | null;
  country?: string | null;
  role?: string;
  customer_used_token?: string | number;
  password_set?: boolean;
  is_active?: boolean;
  user_type?: string;
  organization_name?: string | null;
  creator_name?: string | null;
  agent_access_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserDirectorySnapshot {
  users: DirectoryUser[];
  totalCount: number;
  scannedCount: number;
  truncated: boolean;
  fetchedAt: string;
}

export interface GetUserDirectorySnapshotParams {
  maxPages?: number;
}

// Shape of one raw page of `users/` — this is the untransformed DRF response,
// used only internally while the snapshot endpoint walks pages by hand.
interface UsersPageResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DirectoryUser[];
}

const isUsersPageResponse = (value: unknown): value is UsersPageResponse =>
  typeof value === 'object' &&
  value !== null &&
  'results' in value &&
  Array.isArray((value as { results?: unknown }).results) &&
  'count' in value;


export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'UserCreatedAgent', 'AdminCreatedUser', 'Agent', 'UserAgentAccess', 'UserAccessSummary'],
  endpoints: (builder) => ({
    // NEW: Get User Access Summary - for users with role "user"
    getUserAccessSummary: builder.query<UserAccessSummaryResponse, string>({
      query: (user_id) => ({
        url: `users/${user_id}/access-summary/`,
        method: 'GET',
      }),
      providesTags: (result, error, user_id) => [
        { type: 'UserAccessSummary', id: user_id },
        'UserAccessSummary'
      ],
      transformResponse: (response: unknown) => {
        if (typeof response === 'object' && response !== null) {
          return response as UserAccessSummaryResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    // Create user after email verification
    createUser: builder.mutation<UserResponse, CreateUserRequest>({
      query: (userData) => ({
        url: 'users/',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: User) => {
        // Handle different response formats
        if (
          typeof response === 'object' &&
          response !== null &&
          'user' in response
        ) {
          return response as UserResponse;
        }
        // If the API returns the user directly
        return { user: response as User, message: 'User created successfully' };
      },
    }),

    // Admin create user - CORS-friendly version (sends admin_sub_id in body)
    createUserAsAdmin: builder.mutation<UserResponse, CreateAdminUserRequest & { adminSubId: string }>({
      query: ({ adminSubId, ...userData }) => {
        // Build query params just like in getAdminCreatedUsers
        const params = new URLSearchParams({
          admin_sub_id: adminSubId,
        });

        return {
          url: `users/admin/create-user/?${params.toString()}`, // send as query param
          method: 'POST',
          body: userData, // only user data in body
        };
      },
      invalidatesTags: ['User', 'AdminCreatedUser'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'user' in response
        ) {
          return response as UserResponse;
        }
        return { user: response as User, message: 'User created successfully by admin' };
      },
    }),

    // Get users created by admin - CORS-friendly version (sends admin_sub_id as query param)
    getAdminCreatedUsers: builder.query<AdminCreatedUsersResponse, { 
      page?: number; 
      limit?: number; 
      adminSubId: string;
    }>({
      query: ({ page = 1, limit = 10, adminSubId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          admin_sub_id: adminSubId, // Send as query parameter instead of header
        });
        
        return {
          url: `users/admin/created-users/?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['AdminCreatedUser'],
      transformResponse: (response: unknown) => {
        if (typeof response === 'object' && response !== null) {
          return response as AdminCreatedUsersResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    // NEW: Get agents by user sub_id for assignment
    getAgentsByUserSubId: builder.query<AgentsListResponse, string>({
      query: (user_sub_id) => ({
        url: `agents/by_user_sub_id/?user_sub_id=${encodeURIComponent(user_sub_id)}`,
        method: 'GET',
      }),
      providesTags: (result, error, user_sub_id) => [
        { type: 'Agent', id: user_sub_id },
        'Agent'
      ],
      transformResponse: (response: unknown) => {
        if (typeof response === 'object' && response !== null) {
          return response as AgentsListResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    // NEW: Grant agent access to user
    grantAgentAccess: builder.mutation<GrantAccessResponse, GrantAccessRequest & { adminSubId: string }>({
      query: ({ adminSubId, ...accessData }) => {
        const params = new URLSearchParams({
          admin_sub_id: adminSubId,
        });

        return {
          url: `user-agent-access/grant-access/?${params.toString()}`,
          method: 'POST',
          body: accessData,
        };
      },
      invalidatesTags: ['UserAgentAccess', 'Agent', 'UserAccessSummary'],
      transformResponse: (response: unknown) => {
        if (typeof response === 'object' && response !== null) {
          return response as GrantAccessResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    // Get user profile by sub_id (NEW ENDPOINT)
    getUserProfileBySubId: builder.query<UserResponse, string>({
      query: (sub_id) => ({
        url: `users/by_sub_id/?sub_id=${encodeURIComponent(sub_id)}`,
        method: 'GET',
      }),
      providesTags: (result, error, sub_id) => [
        { type: 'User', id: sub_id },
        'User'
      ],
      transformResponse: (response: unknown) => {
        // Handle different response formats from your API
        if (
          typeof response === 'object' &&
          response !== null
        ) {
          // If API returns user directly
          if ('user' in response) {
            return response as UserResponse;
          }
          // If API returns user object directly
          if ('sub_id' in response || 'email' in response) {
            return { user: response as User, message: 'User found' };
          }
        }
        throw new Error('Invalid response format');
      },
    }),

    // Get user profile (existing endpoint)
    getUserProfile: builder.query<UserResponse, string | void>({
      query: (userId) => ({
        url: userId ? `users/${userId}/` : 'users/me/',
        method: 'GET',
      }),
      providesTags: ['User'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'user' in response
        ) {
          return response as UserResponse;
        }
        return { user: response as User };
      },
    }),

    // Update user profile
    updateUser: builder.mutation<UserResponse, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `users/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'user' in response
        ) {
          return response as UserResponse;
        }
        return { user: response as User, message: 'User updated successfully' };
      },
    }),

    // Get all users (admin) - Updated to support filtering
    getUsers: builder.query<UsersListResponse, { 
      page?: number; 
      limit?: number; 
      sub_id?: string;
      email?: string;
      is_active?: boolean;
    }>({
      query: ({ page = 1, limit = 10, sub_id, email, is_active }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (sub_id) params.append('sub_id', sub_id);
        if (email) params.append('email', email);
        if (is_active !== undefined) params.append('is_active', is_active.toString());
        
        return {
          url: `users/?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['User'],
    }),

    // ============ SETTINGS → SUMMARY SUPPORT (SA-047) ============

    // Count-only cohort query. This hits `users/` with the same filters and
    // reads the same DRF `count` field as `getUsers` above — `is_active: true`
    // is the exact figure Manage User's "Active" filter shows, because it is
    // the identical request shape against the identical tenancy-scoped
    // queryset (superadmin sees everything, an org-scoped actor sees only
    // their org — see `UsersViewSet.get_queryset()`). Summary and Manage User
    // therefore agree by construction, for any actor, not only for a
    // superadmin. `transformResponse` discards `results` so the cache entry
    // stays small — this endpoint only ever needs the count.
    getUserCohortCount: builder.query<UserCohortCountResponse, UserCohortCountParams>({
      query: ({ is_active, role, user_type }) => {
        const params = new URLSearchParams({ page: '1' });
        if (is_active !== undefined) params.append('is_active', is_active.toString());
        if (role) params.append('role', role);
        if (user_type) params.append('user_type', user_type);

        return {
          url: `users/?${params.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: (response: unknown): UserCohortCountResponse => {
        if (typeof response === 'object' && response !== null && 'count' in response) {
          const rawCount = (response as { count: unknown }).count;
          const count = Number(rawCount);
          return { count: Number.isFinite(count) ? count : 0 };
        }
        throw new Error('Invalid response format');
      },
      providesTags: ['User'],
    }),

    // Pages through the user directory to gather real rows for the analytics
    // that a count alone cannot answer (token usage, role/country mix, signup
    // recency). Fetches page 1 ordered by `-customer_used_token` so the
    // heaviest consumers are already in hand even if the scan is capped, then
    // walks the remaining pages in bounded concurrent batches of 4. If any
    // page errors, the whole call fails closed — a half-scan is never
    // returned dressed up as a complete one.
    //
    // Because this and `getUserCohortCount` both carry `providesTags: ['User']`,
    // the existing `toggleUserStatus` / `deleteUser` / `updateUser` mutations
    // (which already `invalidatesTags: ['User']`) refetch both automatically,
    // which is part of why Summary stays in sync with Manage User.
    getUserDirectorySnapshot: builder.query<UserDirectorySnapshot, GetUserDirectorySnapshotParams | void>({
      queryFn: async (arg, api, extraOptions) => {
        const maxPages = Math.max(1, Math.floor(arg?.maxPages ?? DEFAULT_MAX_SNAPSHOT_PAGES));

        const fetchPage = (page: number) => {
          // The sort key MUST be deterministic. `customer_used_token` defaults
          // to 0, so in any real directory most rows tie on it, and LIMIT/OFFSET
          // paging over a non-unique ORDER BY lets the database return rows in a
          // different order for each page — silently skipping some users and
          // repeating others across the scan. `-created_at` breaks the tie.
          // It has to be `created_at` specifically: DRF's OrderingFilter
          // silently DROPS terms outside `ordering_fields`, and `id` is not in
          // that list on `UsersViewSet`, so ordering by it would be a no-op.
          const params = new URLSearchParams({
            page: page.toString(),
            ordering: '-customer_used_token,-created_at',
          });
          return baseQueryWithReauth(
            { url: `users/?${params.toString()}`, method: 'GET' },
            api,
            extraOptions
          );
        };

        const firstPageResult = await fetchPage(1);
        if (firstPageResult.error) {
          return { error: firstPageResult.error };
        }

        if (!isUsersPageResponse(firstPageResult.data)) {
          return {
            error: { status: 'CUSTOM_ERROR', error: 'Invalid response format from users/' },
          };
        }

        const firstPage = firstPageResult.data;
        const totalCount = Number(firstPage.count) || 0;

        // Dedupe by id as well as ordering deterministically. Two users created
        // in the same instant with equal token counts would still tie, and a
        // concurrent insert can shift rows between page requests regardless of
        // sort stability. Counting one user twice would overstate the token
        // total and corrupt `scannedCount`/`truncated`, so identity is enforced
        // here rather than assumed from the server's paging.
        const seenIds = new Set<string>();
        const allUsers: DirectoryUser[] = [];
        const collect = (rows: DirectoryUser[]) => {
          for (const row of rows) {
            if (row.id && seenIds.has(row.id)) continue;
            if (row.id) seenIds.add(row.id);
            allUsers.push(row);
          }
        };

        collect(firstPage.results);

        const pagesNeeded = Math.min(Math.ceil(totalCount / USERS_PAGE_SIZE), maxPages);

        const remainingPages: number[] = [];
        for (let page = 2; page <= pagesNeeded; page += 1) {
          remainingPages.push(page);
        }

        const BATCH_SIZE = 6;
        for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
          const batch = remainingPages.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(batch.map((page) => fetchPage(page)));

          for (const result of batchResults) {
            if (result.error) {
              // Fail closed: one bad page invalidates the whole snapshot.
              return { error: result.error };
            }
            if (isUsersPageResponse(result.data)) {
              collect(result.data.results);
            }
          }
        }

        const scannedCount = allUsers.length;

        return {
          data: {
            users: allUsers,
            totalCount,
            scannedCount,
            truncated: scannedCount < totalCount,
            fetchedAt: new Date().toISOString(),
          },
        };
      },
      // Each scan is expensive (see `DEFAULT_MAX_SNAPSHOT_PAGES` above — tens
      // of backend DB queries per page), so a cached snapshot is kept for 5
      // minutes after the last component unsubscribes. Navigating away from
      // Summary and back within that window reuses the cached scan instead
      // of re-running it.
      keepUnusedDataFor: 300,
      providesTags: ['User'],
    }),

    // Delete user (admin)
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `users/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Activate/Deactivate user
    toggleUserStatus: builder.mutation<UserResponse, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `users/${id}/`,
        method: 'PATCH',
        body: { is_active },
      }),
      invalidatesTags: ['User'],
    }),

    // ============ USER CREATED AGENT ENDPOINTS ============

    // Create User Created Agent
    createUserCreatedAgent: builder.mutation<UserCreatedAgentResponse, CreateUserCreatedAgentRequest>({
      query: (agentData) => ({
        url: 'user-created-agents/',
        method: 'POST',
        body: agentData,
      }),
      invalidatesTags: ['UserCreatedAgent'],
      transformResponse: (response: unknown) => {
        if (typeof response === 'object' && response !== null) {
          return response as UserCreatedAgentResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    // Get User Created Agents by Creator
    getUserCreatedAgentsByCreator: builder.query<UserCreatedAgentsListResponse, string>({
      query: (creator_sub_id) => ({
        url: `user-created-agents/by_creator/?creator_sub_id=${encodeURIComponent(creator_sub_id)}`,
        method: 'GET',
      }),
      providesTags: (result, error, creator_sub_id) => [
        { type: 'UserCreatedAgent', id: creator_sub_id },
        'UserCreatedAgent'
      ],
      transformResponse: (response: unknown) => {
        if (typeof response === 'object' && response !== null) {
          return response as UserCreatedAgentsListResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    // Get all User Created Agents (with filtering)
    getUserCreatedAgents: builder.query<UserCreatedAgentsListResponse, {
      page?: number;
      limit?: number;
      agent_type?: string;
      is_active?: boolean;
      creator_sub_id?: string;
    }>({
      query: ({ page = 1, limit = 10, agent_type, is_active, creator_sub_id }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (agent_type) params.append('agent_type', agent_type);
        if (is_active !== undefined) params.append('active_only', is_active.toString());
        if (creator_sub_id) params.append('creator_sub_id', creator_sub_id);
        
        return {
          url: `user-created-agents/?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['UserCreatedAgent'],
    }),

    // Update User Created Agent
    updateUserCreatedAgent: builder.mutation<UserCreatedAgentResponse, { 
      id: string; 
      data: Partial<CreateUserCreatedAgentRequest> 
    }>({
      query: ({ id, data }) => ({
        url: `user-created-agents/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['UserCreatedAgent'],
    }),

    // Delete User Created Agent
    deleteUserCreatedAgent: builder.mutation<{ message: string }, string>({
      query: (agentId) => ({
        url: `user-created-agents/${agentId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UserCreatedAgent'],
    }),

    // Toggle User Created Agent Status
    toggleUserCreatedAgentStatus: builder.mutation<UserCreatedAgentResponse, { 
      id: string; 
      is_active: boolean 
    }>({
      query: ({ id, is_active }) => ({
        url: `user-created-agents/${id}/`,
        method: 'PATCH',
        body: { is_active },
      }),
      invalidatesTags: ['UserCreatedAgent'],
    }),
  }),
});

export const {
  // NEW hook for user access summary
  useGetUserAccessSummaryQuery,
  useCreateUserMutation,
  useCreateUserAsAdminMutation,
  useGetAdminCreatedUsersQuery,
  // NEW hooks for agent access functionality
  useGetAgentsByUserSubIdQuery,
  useGrantAgentAccessMutation,
  useGetUserProfileBySubIdQuery,
  useGetUserProfileQuery,
  useUpdateUserMutation,
  useGetUsersQuery,
  // Settings → Summary hooks (SA-047)
  useGetUserCohortCountQuery,
  useGetUserDirectorySnapshotQuery,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  // User Created Agent hooks
  useCreateUserCreatedAgentMutation,
  useGetUserCreatedAgentsByCreatorQuery,
  useGetUserCreatedAgentsQuery,
  useUpdateUserCreatedAgentMutation,
  useDeleteUserCreatedAgentMutation,
  useToggleUserCreatedAgentStatusMutation,
} = userApi;

// Helper function to create user after verification
// Note: For Django-based auth, sub_id should be passed explicitly
export const createUserAfterVerification = async (
  email: string,
  name: string,
  mobile?: string,
  sub_id?: string
) => {
  try {
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const userData: CreateUserRequest = {
      first_name,
      last_name,
      email,
      mobile: mobile || '',
      sub_id: sub_id || '',
    };

    return userData;
  } catch (error) {
    console.error('Error preparing user data:', error);
    throw error;
  }
};