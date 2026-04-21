// features/plan/planApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQueryWithAuth';

// ============================================
// INTERFACES & TYPES
// ============================================

// Type for JSON values that can be stored in features/cost_variables
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: 'free' | 'starter' | 'enterprise' | 'custom';
  price: string;
  billing_period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one_time';
  compute_tokens: number;
  storage_gb: string;
  api_calls_limit: number;
  max_agent_instances: number;
  max_active_agents: number;
  max_agent_activations: number;
  max_workspaces: number;
  max_workspace_members: number;
  is_active: boolean;
  is_public: boolean;
  has_trial: boolean;
  trial_period_days: number;
  features: Record<string, JsonValue>;
  cost_variables: Record<string, JsonValue>;
  display_order: number;
  featured: boolean;
  badge_text: string | null;
  created_at: string;
  updated_at: string;
  display_price?: string;
  is_free?: boolean;
}

export interface PlansResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Plan[];
}

export interface PlanFeature {
  id: string;
  plan: string;
  feature_key: string;
  feature_name: string;
  feature_type: 'resource' | 'limit' | 'access' | 'support' | 'feature' | 'integration' | 'custom';
  value: JsonValue;
  description: string | null;
  display_order: number;
  is_highlighted: boolean;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanAgent {
  id: string;
  plan: string;
  agent: string;
  agent_pricing: string | null;
  included_instances: number;
  included_usage_hours: string;
  included_compute_tokens: number;
  override_price: string | null;
  override_pricing_model: string | null;
  is_featured: boolean;
  is_highlighted: boolean;
  display_order: number;
  feature_description: string | null;
  effective_price?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanRequest {
  name: string;
  description?: string;
  plan_type: string;
  price: string | number;
  billing_period: string;
  compute_tokens?: number;
  storage_gb?: string | number;
  api_calls_limit?: number;
  max_agent_instances?: number;
  max_active_agents?: number;
  max_agent_activations?: number;
  max_workspaces?: number;
  max_workspace_members?: number;
  is_active?: boolean;
  is_public?: boolean;
  has_trial?: boolean;
  trial_period_days?: number;
  features?: Record<string, JsonValue>;
  cost_variables?: Record<string, JsonValue>;
  display_order?: number;
  featured?: boolean;
  badge_text?: string;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  plan_type?: string;
  price?: string | number;
  billing_period?: string;
  compute_tokens?: number;
  storage_gb?: string | number;
  api_calls_limit?: number;
  max_agent_instances?: number;
  max_active_agents?: number;
  max_agent_activations?: number;
  max_workspaces?: number;
  max_workspace_members?: number;
  is_active?: boolean;
  is_public?: boolean;
  has_trial?: boolean;
  trial_period_days?: number;
  features?: Record<string, JsonValue>;
  cost_variables?: Record<string, JsonValue>;
  display_order?: number;
  featured?: boolean;
  badge_text?: string;
}

export interface PlanStats {
  total_plans: number;
  active_plans: number;
  public_plans: number;
  legacy_plans: number;
  plan_type_distribution: Record<string, { display_name: string; count: number }>;
  billing_period_distribution: Record<string, { display_name: string; count: number }>;
}

export interface GetPlansParams {
  page?: number;
  limit?: number;
  plan_type?: string;
  billing_period?: string;
  is_active?: boolean;
  is_public?: boolean;
  has_trial?: boolean;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
  search?: string;
}

// ============================================
// API DEFINITION
// ============================================
export const getAdminIdFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;

  // Get admin_id from superAdminUser object (consistent with billingApi)
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

export const planApi = createApi({
  reducerPath: 'planApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Plan', 'PlanFeature', 'PlanAgent', 'PlanStats'],
  endpoints: (builder) => ({
    // ============================================
    // GET ALL PLANS (with pagination & filters)
    // ============================================
    getPlans: builder.query<PlansResponse, GetPlansParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        const p = params || {};
        
        if (p.page) queryParams.append('page', p.page.toString());
        if (p.limit) queryParams.append('limit', p.limit.toString());
        if (p.plan_type) queryParams.append('plan_type', p.plan_type);
        if (p.billing_period) queryParams.append('billing_period', p.billing_period);
        if (p.is_active !== undefined) queryParams.append('is_active', p.is_active.toString());
        if (p.is_public !== undefined) queryParams.append('is_public', p.is_public.toString());
        if (p.has_trial !== undefined) queryParams.append('has_trial', p.has_trial.toString());
        if (p.min_price) queryParams.append('min_price', p.min_price.toString());
        if (p.max_price) queryParams.append('max_price', p.max_price.toString());
        if (p.featured !== undefined) queryParams.append('featured', p.featured.toString());
        if (p.search) queryParams.append('search', p.search);

        // Add admin_id if available
        const adminId = getAdminIdFromStorage();
        if (adminId) {
          queryParams.append('admin_id', adminId);
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

    // ============================================
    // GET SINGLE PLAN
    // ============================================
    getPlan: builder.query<Plan, string>({
      query: (id) => `/plans/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Plan', id }],
    }),

    // ============================================
    // CREATE PLAN
    // ============================================
    createPlan: builder.mutation<Plan, CreatePlanRequest>({
      query: (data) => {
        const adminId = getAdminIdFromStorage();
        return {
          url: '/plans/',
          method: 'POST',
          body: data,
          headers: adminId ? { 'X-Admin-ID': adminId } : {},
        };
      },
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'PlanStats'],
    }),

    // ============================================
    // UPDATE PLAN
    // ============================================
    updatePlan: builder.mutation<Plan, { id: string; data: UpdatePlanRequest }>({
      query: ({ id, data }) => ({
        url: `/plans/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Plan', id },
        { type: 'Plan', id: 'LIST' },
        'PlanStats',
      ],
    }),

    // ============================================
    // DELETE PLAN
    // ============================================
    deletePlan: builder.mutation<void, string>({
      query: (id) => ({
        url: `/plans/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'PlanStats'],
    }),

    // ============================================
    // GET PUBLIC PLANS
    // ============================================
    getPublicPlans: builder.query<Plan[], void>({
      query: () => '/plans/public/',
      providesTags: [{ type: 'Plan', id: 'PUBLIC' }],
    }),

    // ============================================
    // GET PLANS FOR USER
    // ============================================
    getPlansForUser: builder.query<Plan[], void>({
      query: () => '/plans/for_user/',
      providesTags: [{ type: 'Plan', id: 'USER' }],
    }),

    // ============================================
    // GET PLAN STATS
    // ============================================
    getPlanStats: builder.query<PlanStats, void>({
      query: () => '/plans/stats/',
      providesTags: ['PlanStats'],
    }),

    // ============================================
    // GET PLAN FEATURES
    // ============================================
    getPlanFeatures: builder.query<PlanFeature[], string>({
      query: (planId) => `/plans/${planId}/features/`,
      providesTags: (result, error, planId) => [{ type: 'PlanFeature', id: planId }],
    }),

    // ============================================
    // GET PLAN INCLUDED AGENTS
    // ============================================
    getPlanIncludedAgents: builder.query<PlanAgent[], string>({
      query: (planId) => `/plans/${planId}/included_agents/`,
      providesTags: (result, error, planId) => [{ type: 'PlanAgent', id: planId }],
    }),

    // ============================================
    // DUPLICATE PLAN
    // ============================================
    duplicatePlan: builder.mutation<Plan, string>({
      query: (id) => ({
        url: `/plans/${id}/duplicate/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }, 'PlanStats'],
    }),

    // ============================================
    // ACTIVATE PLAN
    // ============================================
    activatePlan: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/plans/${id}/activate/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Plan', id },
        { type: 'Plan', id: 'LIST' },
        'PlanStats',
      ],
    }),

    // ============================================
    // DEACTIVATE PLAN
    // ============================================
    deactivatePlan: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/plans/${id}/deactivate/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Plan', id },
        { type: 'Plan', id: 'LIST' },
        'PlanStats',
      ],
    }),

    // ============================================
    // MARK PLAN AS LEGACY
    // ============================================
    markPlanAsLegacy: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/plans/${id}/mark_legacy/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Plan', id },
        { type: 'Plan', id: 'LIST' },
        'PlanStats',
      ],
    }),
  }),
});

// ============================================
// EXPORT HOOKS
// ============================================
export const {
  useGetPlansQuery,
  useGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useGetPublicPlansQuery,
  useGetPlansForUserQuery,
  useGetPlanStatsQuery,
  useGetPlanFeaturesQuery,
  useGetPlanIncludedAgentsQuery,
  useDuplicatePlanMutation,
  useActivatePlanMutation,
  useDeactivatePlanMutation,
  useMarkPlanAsLegacyMutation,
} = planApi;