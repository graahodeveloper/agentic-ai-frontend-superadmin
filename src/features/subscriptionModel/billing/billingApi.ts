// features/billing/billingApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Helper function to get admin_id from localStorage
const getAdminId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const adminUser = localStorage.getItem('superAdminUser');
  if (!adminUser) return null;
  
  try {
    const parsed = JSON.parse(adminUser);
    return parsed.id || null;
  } catch (error) {
    console.error('Failed to parse superAdminUser from localStorage:', error);
    return null;
  }
};

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
  agent_id: string;
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

export interface PlanComponentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PlanComponent[];
}

export interface AgentPricingResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AgentPricing[];
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

export interface PlanAgentsResponse {
  plan_id: string;
  plan_name: string;
  agents: Array<{
    id: string;
    agent_pricing: {
      id: string;
      agent_id: string;
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
    };
    included_instances: number;
    effective_price: string;
    is_featured: boolean;
    display_order: number;
  }>;
  count: number;
}

// ============================================
// NEW: PLAN SUMMARY TYPES
// ============================================

export interface PlanSummaryComponentItem {
  inclusion_id: string;
  component_id: string;
  component_name: string;
  component_type: string;
  component_type_display: string;
  base_quantity: number;
  quantity_multiplier: number;
  total_quantity: number;
  unit_label: string;
  base_price: number;
  total_price: number;
  price_per_unit: number;
  is_renewable: boolean;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
}

export interface PlanSummaryAgentItem {
  inclusion_id: string;
  agent_id: string;
  agent_name: string;
  agent_category: string;
  agent_pricing_id: string | null;
  pricing_name: string | null;
  pricing_description: string | null;
  unit_price: number;
  included_instances: number;
  total_price: number;
  estimated_tokens_per_use: number;
  estimated_storage_mb: number;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
}

export interface PlanSummaryResponse {
  plan: {
    id: string;
    name: string;
    description: string | null;
    plan_type: string;
    plan_type_display: string;
    base_price: number;
    billing_period: string;
    billing_period_display: string;
    billing_mode: string;
    billing_mode_display: string;
    grace_period_days: number;
    is_active: boolean;
    is_public: boolean;
    featured: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
  };
  components: {
    items: PlanSummaryComponentItem[];
    count: number;
    total_value: number;
  };
  agents: {
    items: PlanSummaryAgentItem[];
    count: number;
    total_value: number;
  };
  pricing_summary: {
    base_price: number;
    components_value: number;
    agents_value: number;
    total_plan_value: number;
    currency: string;
  };
  statistics: {
    active_subscriptions: number;
    total_subscriptions: number;
    total_inclusions: number;
  };
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
  tagTypes: ['Plan', 'PlanComponent', 'AgentPricing', 'Stats', 'PlanComponentInclusion', 'PlanAgentInclusion', 'PlanSummary'],
  // Keep cached data for 5 minutes (300 seconds) for better UX when switching between plans
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({
    // ============================================
    // PLANS
    // ============================================
    getPlans: builder.query<PlansResponse, void | Record<string, any>>({
      query: (params) => {
        const adminId = getAdminId();
        const queryParams = new URLSearchParams();
        
        // Add admin_id
        if (adminId) {
          queryParams.append('admin_id', adminId);
        }
        
        // Add other params
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, String(value));
            }
          });
        }
        
        return `/plans/?${queryParams.toString()}`;
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
      query: (id) => {
        const adminId = getAdminId();
        return `/plans/${id}/?admin_id=${adminId}`;
      },
      providesTags: (result, error, id) => [{ type: 'Plan', id }],
    }),

    createPlan: builder.mutation<Plan, CreatePlanRequest>({
      query: (data) => {
        const adminId = getAdminId();
        return {
          url: `/plans/?admin_id=${adminId}`,
          method: 'POST',
          body: data,
        };
      },
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'Stats'],
    }),

    updatePlan: builder.mutation<Plan, { id: string; data: Partial<CreatePlanRequest> }>({
      query: ({ id, data }) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${id}/?admin_id=${adminId}`,
          method: 'PATCH',
          body: data,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Plan', id },
        { type: 'Plan', id: 'LIST' },
        { type: 'PlanSummary', id },
        'Stats',
      ],
    }),

    deletePlan: builder.mutation<void, string>({
      query: (id) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${id}/?admin_id=${adminId}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'Stats'],
    }),

    duplicatePlan: builder.mutation<Plan, string>({
      query: (id) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${id}/duplicate/?admin_id=${adminId}`,
          method: 'POST',
        };
      },
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'Stats'],
    }),

    getPlanStats: builder.query<any, void>({
      query: () => {
        const adminId = getAdminId();
        return `/plans/stats/?admin_id=${adminId}`;
      },
      providesTags: ['Stats'],
    }),

    // ============================================
    // NEW: PLAN SUMMARY ENDPOINT (OPTIMIZED)
    // ============================================
    getPlanSummary: builder.query<PlanSummaryResponse, string>({
      query: (planId) => {
        const adminId = getAdminId();
        return `/plans/${planId}/summary/?admin_id=${adminId}`;
      },
      providesTags: (result, error, planId) => [
        { type: 'PlanSummary', id: planId },
        { type: 'Plan', id: planId },
      ],
      // Keep this data cached for 5 minutes for smooth transitions between plans
      keepUnusedDataFor: 300,
    }),

    // ============================================
    // PLAN COMPONENTS
    // ============================================
    getPlanComponents: builder.query<PlanComponentsResponse, void | { component_type?: string; is_active?: boolean }>({
      query: (params) => {
        const adminId = getAdminId();
        const queryParams = new URLSearchParams();
        
        // Add admin_id
        if (adminId) {
          queryParams.append('admin_id', adminId);
        }
        
        // Add other params
        if (params?.component_type) {
          queryParams.append('component_type', params.component_type);
        }
        if (params?.is_active !== undefined) {
          queryParams.append('is_active', String(params.is_active));
        }
        
        return `/plan-components/?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'PlanComponent' as const, id })),
              { type: 'PlanComponent', id: 'LIST' },
            ]
          : [{ type: 'PlanComponent', id: 'LIST' }],
    }),

    getPlanComponent: builder.query<PlanComponent, string>({
      query: (id) => {
        const adminId = getAdminId();
        return `/plan-components/${id}/?admin_id=${adminId}`;
      },
      providesTags: (result, error, id) => [{ type: 'PlanComponent', id }],
    }),

    createPlanComponent: builder.mutation<PlanComponent, Partial<PlanComponent>>({
      query: (data) => {
        const adminId = getAdminId();
        return {
          url: `/plan-components/?admin_id=${adminId}`,
          method: 'POST',
          body: data,
        };
      },
      invalidatesTags: [{ type: 'PlanComponent', id: 'LIST' }],
    }),

    updatePlanComponent: builder.mutation<PlanComponent, { id: string; data: Partial<PlanComponent> }>({
      query: ({ id, data }) => {
        const adminId = getAdminId();
        return {
          url: `/plan-components/${id}/?admin_id=${adminId}`,
          method: 'PATCH',
          body: data,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'PlanComponent', id },
        { type: 'PlanComponent', id: 'LIST' },
      ],
    }),

    deletePlanComponent: builder.mutation<void, string>({
      query: (id) => {
        const adminId = getAdminId();
        return {
          url: `/plan-components/${id}/?admin_id=${adminId}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: [{ type: 'PlanComponent', id: 'LIST' }],
    }),

    // ============================================
    // PLAN COMPONENT INCLUSIONS
    // ============================================
    getPlanComponentsInPlan: builder.query<PlanComponentInclusion[], string>({
      query: (planId) => {
        const adminId = getAdminId();
        return `/plans/${planId}/components/?admin_id=${adminId}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PlanComponentInclusion' as const, id })),
              { type: 'PlanComponentInclusion', id: 'LIST' },
            ]
          : [{ type: 'PlanComponentInclusion', id: 'LIST' }],
    }),

    addComponentToPlan: builder.mutation<PlanComponentInclusion, { planId: string; data: any }>({
      query: ({ planId, data }) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${planId}/components/?admin_id=${adminId}`,
          method: 'POST',
          body: data,
        };
      },
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanComponentInclusion', id: 'LIST' },
        { type: 'PlanSummary', id: planId },
      ],
    }),

    updatePlanComponentInclusion: builder.mutation<PlanComponentInclusion, { planId: string; inclusionId: string; data: any }>({
      query: ({ planId, inclusionId, data }) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${planId}/components/${inclusionId}/?admin_id=${adminId}`,
          method: 'PUT',
          body: data,
        };
      },
      invalidatesTags: (result, error, { planId, inclusionId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanComponentInclusion', id: inclusionId },
        { type: 'PlanComponentInclusion', id: 'LIST' },
        { type: 'PlanSummary', id: planId },
      ],
    }),

    removeComponentFromPlan: builder.mutation<void, { planId: string; componentId: string }>({
      query: ({ planId, componentId }) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${planId}/components/${componentId}/?admin_id=${adminId}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanComponentInclusion', id: 'LIST' },
        { type: 'PlanSummary', id: planId },
      ],
    }),

    // ============================================
    // AGENT PRICING
    // ============================================
    getAgentPricing: builder.query<AgentPricingResponse, void | { agent?: string; is_active?: boolean }>({
      query: (params) => {
        const adminId = getAdminId();
        const queryParams = new URLSearchParams();
        
        // Add admin_id
        if (adminId) {
          queryParams.append('admin_id', adminId);
        }
        
        // Add other params
        if (params?.agent) {
          queryParams.append('agent', params.agent);
        }
        if (params?.is_active !== undefined) {
          queryParams.append('is_active', String(params.is_active));
        }
        
        return `/agent-pricing/?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'AgentPricing' as const, id })),
              { type: 'AgentPricing', id: 'LIST' },
            ]
          : [{ type: 'AgentPricing', id: 'LIST' }],
    }),

    getAgentPricingByAgent: builder.query<AgentPricingResponse, string>({
      query: (agentId) => {
        const adminId = getAdminId();
        return `/agent-pricing/by-agent/${agentId}/?admin_id=${adminId}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'AgentPricing' as const, id })),
              { type: 'AgentPricing', id: 'LIST' },
            ]
          : [{ type: 'AgentPricing', id: 'LIST' }],
    }),

    getAgentPricingById: builder.query<AgentPricing, string>({
      query: (id) => {
        const adminId = getAdminId();
        return `/agent-pricing/${id}/?admin_id=${adminId}`;
      },
      providesTags: (result, error, id) => [{ type: 'AgentPricing', id }],
    }),

    createAgentPricing: builder.mutation<AgentPricing, Partial<AgentPricing>>({
      query: (data) => {
        const adminId = getAdminId();
        return {
          url: `/agent-pricing/?admin_id=${adminId}`,
          method: 'POST',
          body: data,
        };
      },
      invalidatesTags: [{ type: 'AgentPricing', id: 'LIST' }],
    }),

    updateAgentPricing: builder.mutation<AgentPricing, { id: string; data: Partial<AgentPricing> }>({
      query: ({ id, data }) => {
        const adminId = getAdminId();
        return {
          url: `/agent-pricing/${id}/?admin_id=${adminId}`,
          method: 'PATCH',
          body: data,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'AgentPricing', id },
        { type: 'AgentPricing', id: 'LIST' },
      ],
    }),

    deleteAgentPricing: builder.mutation<void, string>({
      query: (id) => {
        const adminId = getAdminId();
        return {
          url: `/agent-pricing/${id}/?admin_id=${adminId}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: [{ type: 'AgentPricing', id: 'LIST' }],
    }),

    // ============================================
    // PLAN AGENT INCLUSIONS
    // ============================================
    getPlanAgentsInPlan: builder.query<PlanAgentsResponse, string>({
      query: (planId) => {
        const adminId = getAdminId();
        return `/plans/${planId}/agents/?admin_id=${adminId}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.agents.map(({ id }) => ({ type: 'PlanAgentInclusion' as const, id })),
              { type: 'PlanAgentInclusion', id: 'LIST' },
            ]
          : [{ type: 'PlanAgentInclusion', id: 'LIST' }],
    }),

    addAgentToPlan: builder.mutation<PlanAgentInclusion, { planId: string; data: any }>({
      query: ({ planId, data }) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${planId}/agents/?admin_id=${adminId}`,
          method: 'POST',
          body: data,
        };
      },
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanAgentInclusion', id: 'LIST' },
        { type: 'PlanSummary', id: planId },
      ],
    }),

    updatePlanAgentInclusion: builder.mutation<PlanAgentInclusion, { planId: string; inclusionId: string; data: any }>({
      query: ({ planId, inclusionId, data }) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${planId}/agents/${inclusionId}/?admin_id=${adminId}`,
          method: 'PUT',
          body: data,
        };
      },
      invalidatesTags: (result, error, { planId, inclusionId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanAgentInclusion', id: inclusionId },
        { type: 'PlanAgentInclusion', id: 'LIST' },
        { type: 'PlanSummary', id: planId },
      ],
    }),

    removeAgentFromPlan: builder.mutation<void, { planId: string; agentId: string }>({
      query: ({ planId, agentId }) => {
        const adminId = getAdminId();
        return {
          url: `/plans/${planId}/agents/${agentId}/?admin_id=${adminId}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'PlanAgentInclusion', id: 'LIST' },
        { type: 'PlanSummary', id: planId },
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
  
  // NEW: Plan Summary Hook
  useGetPlanSummaryQuery,
  
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