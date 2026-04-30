import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQueryWithAuth";

// Types for Performance Analytics
export interface PerformanceOverview {
  total_requests: number;
  total_requests_change: number;
  avg_response_time_ms: number;
  avg_response_time_change: number;
  max_response_time_ms: number;
  min_response_time_ms: number;
  error_rate: number;
  error_rate_change: number;
  total_errors: number;
  total_queries: number;
  avg_query_time_ms: number;
  slow_requests: number;
  period: string;
  start_date: string;
  end_date: string;
}

export interface ResponseTimeTrendPoint {
  timestamp: string;
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
  request_count: number;
  error_count: number;
  avg_query_count: number;
}

export interface EndpointPerformance {
  endpoint: string;
  method: string;
  path: string;
  request_count: number;
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  error_rate: number;
  avg_query_count: number;
  total_errors: number;
}

export interface StatusDistribution {
  categories: {
    "2xx": number;
    "3xx": number;
    "4xx": number;
    "5xx": number;
  };
  detailed: Array<{
    status_code: number;
    count: number;
    percentage: number;
  }>;
  total: number;
}

export interface SlowRequest {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  path: string;
  response_time_ms: number;
  query_count: number;
  query_time_ms: number;
  status_code: number;
  user_id: string | null;
  user_email: string | null;
  organization_id: string | null;
  organization_name: string | null;
  agent_id: string | null;
  agent_name: string | null;
  ip_address: string | null;
  error_message: string | null;
}

export interface OrganizationBreakdown {
  organization_id: string;
  organization_name: string;
  request_count: number;
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
  error_rate: number;
  error_count: number;
  total_queries: number;
  slow_requests: number;
}

export interface AgentBreakdown {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  organization_id: string;
  organization_name: string;
  request_count: number;
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
  error_rate: number;
  error_count: number;
  total_queries: number;
  slow_requests: number;
}

export interface QueryPerformancePoint {
  timestamp: string;
  avg_query_count: number;
  max_query_count: number;
  avg_query_time: number;
  max_query_time: number;
  total_queries: number;
  slow_queries: number;
}

export interface PerformanceSummary {
  id: string;
  period_start: string;
  period_end: string | null;
  total_requests: number;
  total_errors: number;
  avg_response_time_ms: number;
  max_response_time_ms: number;
  min_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  avg_query_count: number;
  total_queries: number;
  user_id: string | null;
  organization_id: string | null;
  agent_id: string | null;
}

export interface RealtimeMetrics {
  stats: {
    request_count: number;
    avg_response_time_ms: number;
    error_count: number;
    requests_per_minute: number;
    active_users: number;
    active_organizations: number;
  };
  recent_requests: Array<{
    id: string;
    timestamp: string;
    endpoint: string;
    method: string;
    response_time_ms: number;
    status_code: number;
    organization_name: string | null;
    agent_name: string | null;
  }>;
  health_status: "healthy" | "degraded" | "critical";
  timestamp: string;
}

// Organization list for filtering
export interface OrganizationListItem {
  id: string;
  name: string;
  request_count: number;
}

// Agent list for filtering
export interface AgentListItem {
  id: string;
  name: string;
  type: string;
  organization_id: string;
  organization_name: string;
  request_count: number;
}

// Enhanced date range params with filtering
interface DateRangeParams {
  period?: "1h" | "6h" | "24h" | "7d" | "30d" | "90d";
  start_date?: string;
  end_date?: string;
}

interface FilterParams extends DateRangeParams {
  organization_id?: string;
  agent_id?: string;
  user_id?: string;
}

interface EndpointFilterParams extends FilterParams {
  limit?: number;
  sort_by?: "request_count" | "avg_response_time" | "max_response_time" | "error_rate";
  sort_order?: "asc" | "desc";
  method?: string;
  search?: string;
}

interface SlowRequestsParams extends FilterParams {
  threshold?: number;
  limit?: number;
  offset?: number;
  status_code?: number;
  endpoint?: string;
}

export const performanceAnalyticsApi = createApi({
  reducerPath: "performanceAnalyticsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["PerformanceAnalytics", "Organizations", "Agents"],
  endpoints: (builder) => ({
    // Get organizations list for filtering dropdown
    getOrganizationsList: builder.query<{ data: OrganizationListItem[] }, void>({
      query: () => "performance-analytics/organizations-list/",
      providesTags: ["Organizations"],
    }),

    // Get agents list for filtering dropdown
    getAgentsList: builder.query<
      { data: AgentListItem[] },
      { organization_id?: string }
    >({
      query: (params) => ({
        url: "performance-analytics/agents-list/",
        params,
      }),
      providesTags: ["Agents"],
    }),

    // Get overview statistics
    getPerformanceOverview: builder.query<PerformanceOverview, FilterParams>({
      query: (params) => ({
        url: "performance-analytics/overview/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get response time trend for charts
    getResponseTimeTrend: builder.query<
      { data: ResponseTimeTrendPoint[]; period: string },
      FilterParams & { granularity?: "minute" | "hour" | "day" }
    >({
      query: (params) => ({
        url: "performance-analytics/response-time-trend/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get endpoint performance breakdown
    getEndpointPerformance: builder.query<
      { data: EndpointPerformance[]; total: number },
      EndpointFilterParams
    >({
      query: (params) => ({
        url: "performance-analytics/endpoint-performance/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get status code distribution
    getStatusDistribution: builder.query<StatusDistribution, FilterParams>({
      query: (params) => ({
        url: "performance-analytics/status-distribution/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get slow requests
    getSlowRequests: builder.query<
      { data: SlowRequest[]; threshold_ms: number; total: number },
      SlowRequestsParams
    >({
      query: (params) => ({
        url: "performance-analytics/slow-requests/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get organization breakdown
    getOrganizationBreakdown: builder.query<
      { data: OrganizationBreakdown[]; total: number },
      DateRangeParams & { limit?: number; sort_by?: string; search?: string }
    >({
      query: (params) => ({
        url: "performance-analytics/organization-breakdown/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get agent breakdown
    getAgentBreakdown: builder.query<
      { data: AgentBreakdown[]; total: number },
      FilterParams & { limit?: number; sort_by?: string; search?: string }
    >({
      query: (params) => ({
        url: "performance-analytics/agent-breakdown/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get query performance metrics
    getQueryPerformance: builder.query<
      { data: QueryPerformancePoint[]; summary: { total_queries: number; avg_query_count: number; avg_query_time: number } },
      FilterParams & { granularity?: "minute" | "hour" | "day" }
    >({
      query: (params) => ({
        url: "performance-analytics/query-performance/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get weekly/monthly summaries
    getPerformanceSummaries: builder.query<
      { data: PerformanceSummary[]; period_type: string },
      FilterParams & { period_type?: "hourly" | "daily" | "weekly" | "monthly"; limit?: number }
    >({
      query: (params) => ({
        url: "performance-analytics/summaries/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get real-time metrics
    getRealtimeMetrics: builder.query<RealtimeMetrics, FilterParams | void>({
      query: (params) => ({
        url: "performance-analytics/realtime/",
        params: params || {},
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get single organization analytics
    getOrganizationAnalytics: builder.query<
      {
        overview: PerformanceOverview;
        response_trend: ResponseTimeTrendPoint[];
        top_endpoints: EndpointPerformance[];
        top_agents: AgentBreakdown[];
        status_distribution: StatusDistribution;
        recent_slow_requests: SlowRequest[];
      },
      { organization_id: string } & DateRangeParams
    >({
      query: ({ organization_id, ...params }) => ({
        url: `performance-analytics/organizations/${organization_id}/`,
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get single agent analytics
    getAgentAnalytics: builder.query<
      {
        overview: PerformanceOverview;
        response_trend: ResponseTimeTrendPoint[];
        top_endpoints: EndpointPerformance[];
        status_distribution: StatusDistribution;
        recent_slow_requests: SlowRequest[];
        agent_info: {
          id: string;
          name: string;
          type: string;
          organization_id: string;
          organization_name: string;
          created_at: string;
        };
      },
      { agent_id: string } & DateRangeParams
    >({
      query: ({ agent_id, ...params }) => ({
        url: `performance-analytics/agents/${agent_id}/`,
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Get error analysis
    getErrorAnalysis: builder.query<
      {
        error_trend: Array<{ timestamp: string; count: number; error_rate: number }>;
        errors_by_status: Array<{ status_code: number; count: number; percentage: number }>;
        errors_by_endpoint: Array<{ endpoint: string; count: number; percentage: number }>;
        recent_errors: SlowRequest[];
      },
      FilterParams
    >({
      query: (params) => ({
        url: "performance-analytics/error-analysis/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),

    // Compare performance between periods
    getPerformanceComparison: builder.query<
      {
        current: PerformanceOverview;
        previous: PerformanceOverview;
        changes: {
          total_requests_change: number;
          avg_response_time_change: number;
          error_rate_change: number;
          total_queries_change: number;
        };
      },
      FilterParams & { compare_with?: "previous_period" | "previous_week" | "previous_month" }
    >({
      query: (params) => ({
        url: "performance-analytics/comparison/",
        params,
      }),
      providesTags: ["PerformanceAnalytics"],
    }),
  }),
});

export const {
  useGetOrganizationsListQuery,
  useGetAgentsListQuery,
  useGetPerformanceOverviewQuery,
  useGetResponseTimeTrendQuery,
  useGetEndpointPerformanceQuery,
  useGetStatusDistributionQuery,
  useGetSlowRequestsQuery,
  useGetOrganizationBreakdownQuery,
  useGetAgentBreakdownQuery,
  useGetQueryPerformanceQuery,
  useGetPerformanceSummariesQuery,
  useGetRealtimeMetricsQuery,
  useGetOrganizationAnalyticsQuery,
  useGetAgentAnalyticsQuery,
  useGetErrorAnalysisQuery,
  useGetPerformanceComparisonQuery,
} = performanceAnalyticsApi;
