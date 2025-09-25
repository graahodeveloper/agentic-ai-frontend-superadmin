// src/features/user/userApi.ts
import { User } from '@/types/auth';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { fetchAuthSession } from 'aws-amplify/auth';

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

// Get base URL from environment variables
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
};

// Base query with enhanced CORS handling
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  mode: 'cors', // Explicitly set CORS mode
  credentials: 'include', // Include credentials for CORS requests
  prepareHeaders: async (headers) => {
    try {
      // const session = await fetchAuthSession();
      // const token = session.tokens?.accessToken?.toString();
      
      // if (token) {
      //   headers.set('Authorization', `Bearer ${token}`);
      // }
      
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      return headers;
    } catch (error) {
      console.error('Error getting auth session:', error);
      return headers;
    }
  },
});

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithAuth,
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

// Helper function to create user after email verification
export const createUserAfterVerification = async (
  email: string,
  name: string,
  mobile?: string
) => {
  try {
    // Get Cognito user sub_id
    const session = await fetchAuthSession();
    const sub_id = session.tokens?.accessToken?.payload?.sub as string;

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const userData: CreateUserRequest = {
      first_name,
      last_name,
      email,
      mobile: mobile || '',
      sub_id,
    };

    return userData;
  } catch (error) {
    console.error('Error preparing user data:', error);
    throw error;
  }
};