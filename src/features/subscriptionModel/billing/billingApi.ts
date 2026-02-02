// features/billing/billingApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================
// TYPES (Matching your backend models)
// ============================================

export interface PlanComponent {
  id: string;
  name: string;
  component_type: 'compute_tokens' | 'storage_gb' | 'api_calls' | 'agent_instances' | 'active_agents' | 'custom';
  description: string | null;
  quantity: string;
  price: string;
  unit_label: string;
  price_per_unit: string;
  is_active: boolean;
  is_renewable: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanComponentInclusion {
  id: string;
  plan: string;
  component: PlanComponent;
  quantity_multiplier: string;
  total_quantity: string;
  total_price: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AgentPricing {
  id: string;
  agent: string;
  agent_name: string;
  agent_category: string;
  name: string;
  description: string | null;
  price: string;
  estimated_tokens_per_use: number;
  estimated_storage_mb: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanAgentInclusion {
  id: string;
  plan: string;
  agent: string;
  agent_name: string;
  agent_pricing: string | null;
  agent_pricing_name: string | null;
  included_instances: number;
  effective_price: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
  base_price: string;
  billing_period: 'monthly' | 'quarterly' | 'yearly';
  billing_mode: 'prepaid' | 'postpaid';
  grace_period_days: number;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
  featured: boolean;
  included_components: PlanComponentInclusion[];
  included_agents: PlanAgentInclusion[];
  total_components_value: string;
  total_agents_value: string;
  total_plan_value: string;
  created_at: string;
  updated_at: string;
}

export interface PlansResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Plan[];
}

export interface CreatePlanRequest {
  name: string;
  description?: string;
  plan_type: string;
  base_price: number | string;
  billing_period: string;
  billing_mode: string;
  grace_period_days?: number;
  is_active?: boolean;
  is_public?: boolean;
  display_order?: number;
  featured?: boolean;
}

// ============================================
// API
// ============================================

export const billingApi = createApi({
  reducerPath: 'billingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Plan', 'PlanComponent', 'AgentPricing', 'Stats', 'PlanComponentInclusion', 'PlanAgentInclusion'],
  endpoints: (builder) => ({
    // ============================================
    // PLANS
    // ============================================
    getPlans: builder.query<PlansResponse, void | Record<string, any>>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, String(value));
            }
          });
        }
        const queryString = queryParams.toString();
        return queryString ? `/plans/?${queryString}` : '/plans/';
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'Plan' as const, id })),
              { type: 'Plan', id: 'LIST' },
            ]
          : [{ type: 'Plan', id: 'LIST' }],
    }),

    getPlan: builder.query<Plan, string>({
      query: (id) => `/plans/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Plan', id }],
    }),

    createPlan: builder.mutation<Plan, CreatePlanRequest>({
      query: (data) => ({
        url: '/plans/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'Stats'],
    }),

    updatePlan: builder.mutation<Plan, { id: string; data: Partial<CreatePlanRequest> }>({
      query: ({ id, data }) => ({
        url: `/plans/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Plan', id },
        { type: 'Plan', id: 'LIST' },
        'Stats',
      ],
    }),

    deletePlan: builder.mutation<void, string>({
      query: (id) => ({
        url: `/plans/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'Stats'],
    }),

    duplicatePlan: builder.mutation<Plan, string>({
      query: (id) => ({
        url: `/plans/${id}/duplicate/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'Stats'],
    }),

    getPlanStats: builder.query<any, void>({
      query: () => '/plans/stats/',
      providesTags: ['Stats'],
    }),

    // ============================================
    // PLAN COMPONENTS
    // ============================================
    getPlanComponents: builder.query<PlanComponent[], void | { component_type?: string; is_active?: boolean }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.component_type) {
          queryParams.append('component_type', params.component_type);
        }
        if (params?.is_active !== undefined) {
          queryParams.append('is_active', String(params.is_active));
        }
        const queryString = queryParams.toString();
        return queryString ? `/plan-components/?${queryString}` : '/plan-components/';
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PlanComponent' as const, id })),
              { type: 'PlanComponent', id: 'LIST' },
            ]
          : [{ type: 'PlanComponent', id: 'LIST' }],
    }),

    getPlanComponent: builder.query<PlanComponent, string>({
      query: (id) => `/plan-components/${id}/`,
      providesTags: (result, error, id) => [{ type: 'PlanComponent', id }],
    }),

    createPlanComponent: builder.mutation<PlanComponent, Partial<PlanComponent>>({
      query: (data) => ({
        url: '/plan-components/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'PlanComponent', id: 'LIST' }],
    }),

    updatePlanComponent: builder.mutation<PlanComponent, { id: string; data: Partial<PlanComponent> }>({
      query: ({ id, data }) => ({
        url: `/plan-components/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PlanComponent', id },
        { type: 'PlanComponent', id: 'LIST' },
      ],
    }),

    deletePlanComponent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/plan-components/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'PlanComponent', id: 'LIST' }],
    }),

    // ============================================
    // PLAN COMPONENT INCLUSIONS
    // ============================================
    getPlanComponentsInPlan: builder.query<PlanComponentInclusion[], string>({
      query: (planId) => `/plans/${planId}/components/`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PlanComponentInclusion' as const, id })),
              { type: 'PlanComponentInclusion', id: 'LIST' },
            ]
          : [{ type: 'PlanComponentInclusion', id: 'LIST' }],
    }),

    addComponentToPlan: builder.mutation<PlanComponentInclusion, { planId: string; data: any }>({
      query: ({ planId, data }) => ({
        url: `/plans/${planId}/add-component/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanComponentInclusion', id: 'LIST' },
      ],
    }),

    updatePlanComponentInclusion: builder.mutation<PlanComponentInclusion, { planId: string; inclusionId: string; data: any }>({
      query: ({ planId, inclusionId, data }) => ({
        url: `/plans/${planId}/components/${inclusionId}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { planId, inclusionId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanComponentInclusion', id: inclusionId },
        { type: 'PlanComponentInclusion', id: 'LIST' },
      ],
    }),

    removeComponentFromPlan: builder.mutation<void, { planId: string; componentId: string }>({
      query: ({ planId, componentId }) => ({
        url: `/plans/${planId}/remove-component/${componentId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanComponentInclusion', id: 'LIST' },
      ],
    }),

    // ============================================
    // AGENT PRICING
    // ============================================
    getAgentPricing: builder.query<AgentPricing[], void | { agent?: string; is_active?: boolean }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.agent) {
          queryParams.append('agent', params.agent);
        }
        if (params?.is_active !== undefined) {
          queryParams.append('is_active', String(params.is_active));
        }
        const queryString = queryParams.toString();
        return queryString ? `/agent-pricing/?${queryString}` : '/agent-pricing/';
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AgentPricing' as const, id })),
              { type: 'AgentPricing', id: 'LIST' },
            ]
          : [{ type: 'AgentPricing', id: 'LIST' }],
    }),

    getAgentPricingByAgent: builder.query<AgentPricing[], string>({
      query: (agentId) => `/agent-pricing/by-agent/${agentId}/`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AgentPricing' as const, id })),
              { type: 'AgentPricing', id: 'LIST' },
            ]
          : [{ type: 'AgentPricing', id: 'LIST' }],
    }),

    getAgentPricingById: builder.query<AgentPricing, string>({
      query: (id) => `/agent-pricing/${id}/`,
      providesTags: (result, error, id) => [{ type: 'AgentPricing', id }],
    }),

    createAgentPricing: builder.mutation<AgentPricing, Partial<AgentPricing>>({
      query: (data) => ({
        url: '/agent-pricing/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'AgentPricing', id: 'LIST' }],
    }),

    updateAgentPricing: builder.mutation<AgentPricing, { id: string; data: Partial<AgentPricing> }>({
      query: ({ id, data }) => ({
        url: `/agent-pricing/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AgentPricing', id },
        { type: 'AgentPricing', id: 'LIST' },
      ],
    }),

    deleteAgentPricing: builder.mutation<void, string>({
      query: (id) => ({
        url: `/agent-pricing/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'AgentPricing', id: 'LIST' }],
    }),

    // ============================================
    // PLAN AGENT INCLUSIONS
    // ============================================
    getPlanAgentsInPlan: builder.query<PlanAgentInclusion[], string>({
      query: (planId) => `/plans/${planId}/agents/`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PlanAgentInclusion' as const, id })),
              { type: 'PlanAgentInclusion', id: 'LIST' },
            ]
          : [{ type: 'PlanAgentInclusion', id: 'LIST' }],
    }),

    addAgentToPlan: builder.mutation<PlanAgentInclusion, { planId: string; data: any }>({
      query: ({ planId, data }) => ({
        url: `/plans/${planId}/add-agent/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanAgentInclusion', id: 'LIST' },
      ],
    }),

    updatePlanAgentInclusion: builder.mutation<PlanAgentInclusion, { planId: string; inclusionId: string; data: any }>({
      query: ({ planId, inclusionId, data }) => ({
        url: `/plans/${planId}/agents/${inclusionId}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { planId, inclusionId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanAgentInclusion', id: inclusionId },
        { type: 'PlanAgentInclusion', id: 'LIST' },
      ],
    }),

    removeAgentFromPlan: builder.mutation<void, { planId: string; agentId: string }>({
      query: ({ planId, agentId }) => ({
        url: `/plans/${planId}/remove-agent/${agentId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanAgentInclusion', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useDuplicatePlanMutation,
  useGetPlanStatsQuery,
  
  useGetPlanComponentsQuery,
  useGetPlanComponentQuery,
  useCreatePlanComponentMutation,
  useUpdatePlanComponentMutation,
  useDeletePlanComponentMutation,
  
  useGetPlanComponentsInPlanQuery,
  useAddComponentToPlanMutation,
  useUpdatePlanComponentInclusionMutation,
  useRemoveComponentFromPlanMutation,
  
  useGetAgentPricingQuery,
  useGetAgentPricingByAgentQuery,
  useGetAgentPricingByIdQuery,
  useCreateAgentPricingMutation,
  useUpdateAgentPricingMutation,
  useDeleteAgentPricingMutation,
  
  useGetPlanAgentsInPlanQuery,
  useAddAgentToPlanMutation,
  useUpdatePlanAgentInclusionMutation,
  useRemoveAgentFromPlanMutation,
} = billingApi;