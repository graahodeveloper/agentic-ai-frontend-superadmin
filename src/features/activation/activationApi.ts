// src/features/activation/activationApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { fetchAuthSession } from 'aws-amplify/auth';

// Activation interfaces
export interface ActivationData {
  id: string;
  user: {
    id: string;
    sub_id: string;
    activation_code: string | null;
    full_name: string;
    email: string;
    is_active: boolean;
  };
  status: boolean;
  context: string;
  agent_roles?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActivationRequest {
  user_id: string;
  agent_id: string;
  status: boolean;
  context?: string;
}

export interface UpdateActivationRequest {
  user_id: string;
  agent_id: string;
  status: boolean;
  context?: string;
  agent_roles?: string;
}

export interface ActivationResponse {
  id: string;
  user_id: string;
  agent_id: string;
  status: boolean;
  context: string;
  agent_roles?: string;
  created_at: string;
  updated_at: string;
}

// Get base URL from environment variables
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
};

// Base query with authentication
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  prepareHeaders: async (headers) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      headers.set('Content-Type', 'application/json');
      return headers;
    } catch (error) {
      console.error('Error getting auth session:', error);
      return headers;
    }
  },
});

export const activationApi = createApi({
  reducerPath: 'activationApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Activation', 'Agent'],
  endpoints: (builder) => ({
    // Create new activation
    createActivation: builder.mutation<ActivationResponse, CreateActivationRequest>({
      query: (activationData) => ({
        url: 'activations/',
        method: 'POST',
        body: activationData,
      }),
      // Fix: Properly type the invalidatesTags function
      invalidatesTags: (result, error, { agent_id, user_id }) => {
        const tags: Array<{ type: 'Activation' | 'Agent'; id?: string } | 'Activation' | 'Agent'> = [
          { type: 'Activation', id: agent_id },
          { type: 'Agent', id: user_id },
          'Activation', // General invalidation for all activations
          'Agent'      // General invalidation for all agents
        ];
        console.log('Invalidating tags for create:', tags);
        return tags;
      },
      transformResponse: (response: ActivationResponse) => {
        console.log('Create activation response:', response);
        return response;
      },
    }),

    // Update existing activation
    updateActivation: builder.mutation<ActivationResponse, { id: string; data: UpdateActivationRequest }>({
      query: ({ id, data }) => ({
        url: `activations/${id}/`,
        method: 'PUT',
        body: data,
      }),
      // Fix: Properly type the invalidatesTags function
      invalidatesTags: (result, error, { data }) => {
        const tags: Array<{ type: 'Activation' | 'Agent'; id?: string } | 'Activation' | 'Agent'> = [
          { type: 'Activation', id: data.agent_id },
          { type: 'Agent', id: data.user_id },
          'Activation',
          'Agent'
        ];
        console.log('Invalidating tags for update:', tags);
        return tags;
      },
      transformResponse: (response: ActivationResponse) => {
        console.log('Update activation response:', response);
        return response;
      },
    }),

    // Get activation by agent_id (helper query)
    getActivationByAgentId: builder.query<ActivationResponse, string>({
      query: (agentId) => ({
        url: `activations/?agent_id=${encodeURIComponent(agentId)}`,
        method: 'GET',
      }),
      providesTags: (result, error, agentId) => [
        { type: 'Activation', id: agentId }
      ],
    }),
  }),
});

export const {
  useCreateActivationMutation,
  useUpdateActivationMutation,
  useGetActivationByAgentIdQuery,
} = activationApi;