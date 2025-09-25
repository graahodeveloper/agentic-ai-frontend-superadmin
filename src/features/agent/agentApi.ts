// src/features/agent/agentApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Agent, ActivationData } from '@/types/agent'; // Assuming Agent type is defined in this path



export interface AgentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Agent[];
}

export interface AgentResponse {
  agent: Agent;
  message?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  context?: string;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  icon?: string;
  agent_variant: string;
  agent_type: string;
  website?: string;
  user_sub_id?: string;
  is_active?: boolean;
}

export interface ToggleActivationRequest {
  agent_id: string;
  status: boolean;
}

export interface ToggleActivationResponse {
  activation_data: ActivationData;
  message?: string;
}

// Get base URL from environment variables
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
};

// Base query with authentication (reuse from userApi pattern)
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

export const agentApi = createApi({
  reducerPath: 'agentApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Agent'],
  endpoints: (builder) => ({
    // Get agents by sub_id (main endpoint for your use case)
    getAgentsBySubId: builder.query<AgentsResponse, string>({
      query: (sub_id) => ({
        url: `agents/?sub_id=${encodeURIComponent(sub_id)}`,
        method: 'GET',
      }),
      providesTags: (result, error, sub_id) => [
        { type: 'Agent', id: sub_id },
        'Agent'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'results' in response
        ) {
          return response as AgentsResponse;
        }
        // Fallback if API returns agents directly
        if (Array.isArray(response)) {
          return {
            count: response.length,
            next: null,
            previous: null,
            results: response as Agent[]
          };
        }
        throw new Error('Invalid response format');
      },
    }),

    // Get single agent by ID
    getAgent: builder.query<AgentResponse, string>({
      query: (agentId) => ({
        url: `agents/${agentId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, agentId) => [
        { type: 'Agent', id: agentId }
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'agent' in response
        ) {
          return response as AgentResponse;
        }
        // If API returns agent directly
        return { agent: response as Agent };
      },
    }),

    // Get all agents (admin/general listing)
    getAgents: builder.query<AgentsResponse, { 
      page?: number; 
      limit?: number; 
      sub_id?: string;
      is_active?: boolean;
    }>({
      query: ({ page = 1, limit = 10, sub_id, is_active }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (sub_id) params.append('sub_id', sub_id);
        if (is_active !== undefined) params.append('is_active', is_active.toString());
        
        return {
          url: `agents/?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Agent'],
    }),

    // Create new agent
    createAgent: builder.mutation<AgentResponse, CreateAgentRequest>({
      query: (agentData) => ({
        url: 'agents/',
        method: 'POST',
        body: agentData,
      }),
      invalidatesTags: ['Agent'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'agent' in response
        ) {
          return response as AgentResponse;
        }
        return { agent: response as Agent, message: 'Agent created successfully' };
      },
    }),

    // Update agent
    updateAgent: builder.mutation<AgentResponse, { id: string; data: UpdateAgentRequest }>({
      query: ({ id, data }) => ({
        url: `agents/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Agent', id },
        'Agent'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'agent' in response
        ) {
          return response as AgentResponse;
        }
        return { agent: response as Agent, message: 'Agent updated successfully' };
      },
    }),

    // Delete agent
    deleteAgent: builder.mutation<{ message: string }, string>({
      query: (agentId) => ({
        url: `agents/${agentId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, agentId) => [
        { type: 'Agent', id: agentId },
        'Agent'
      ],
    }),

    // Toggle agent activation status
    toggleAgentActivation: builder.mutation<ToggleActivationResponse, ToggleActivationRequest>({
      query: ({ agent_id, status }) => ({
        url: `agents/${agent_id}/toggle-activation/`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { agent_id }) => [
        { type: 'Agent', id: agent_id },
        'Agent'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null
        ) {
          return response as ToggleActivationResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    // Update agent configuration (for Facebook tokens, etc.)
    // updateAgentConfiguration: builder.mutation<AgentResponse, { 
    //   id: string; 
    //   configuration: Record<string, any> 
    // }>({
    //   query: ({ id, configuration }) => ({
    //     url: `agents/${id}/configuration/`,
    //     method: 'PATCH',
    //     body: configuration,
    //   }),
    //   invalidatesTags: (result, error, { id }) => [
    //     { type: 'Agent', id },
    //     'Agent'
    //   ],
    // }),

    // Get agent configuration
    // getAgentConfiguration: builder.query<{ configuration: Record<string, any> }, string>({
    //   query: (agentId) => ({
    //     url: `agents/${agentId}/configuration/`,
    //     method: 'GET',
    //   }),
    //   providesTags: (result, error, agentId) => [
    //     { type: 'Agent', id: `${agentId}-config` }
    //   ],
    // }),
  }),
});

export const {
  // Queries
  useGetAgentsBySubIdQuery,
  useGetAgentQuery,
  useGetAgentsQuery,
  // useGetAgentConfigurationQuery,
  
  // Mutations
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
  useToggleAgentActivationMutation,
  // useUpdateAgentConfigurationMutation,
} = agentApi;

// Helper function to extract sub_id and fetch agents
export const getAgentsForCurrentUser = async () => {
  try {
    const session = await fetchAuthSession();
    const sub_id = session.tokens?.accessToken?.payload?.sub as string;
    
    if (!sub_id) {
      throw new Error('No sub_id found in session');
    }
    
    return sub_id;
  } catch (error) {
    console.error('Error getting user session for agents:', error);
    throw error;
  }
};