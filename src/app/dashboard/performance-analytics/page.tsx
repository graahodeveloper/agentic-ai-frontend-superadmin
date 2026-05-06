"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useGetPerformanceOverviewQuery,
  useGetResponseTimeTrendQuery,
  useGetStatusDistributionQuery,
  useGetOrganizationBreakdownQuery,
  useGetAgentBreakdownQuery,
  useGetEndpointPerformanceQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { PageHeader, FilterBar, StatCard, ChartCard } from "@/components/performance-analytics/shared";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

type Period = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

const STATUS_COLORS: Record<string, string> = {
  "2xx": "#10B981",
  "3xx": "#3B82F6",
  "4xx": "#F59E0B",
  "5xx": "#EF4444",
};

export default function PerformanceOverviewPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();
  const [includeSuperAdmin, setIncludeSuperAdmin] = useState<boolean>(false);

  // Common filter params used across all queries
  const filterParams = useMemo(() => ({
    period,
    organization_id: organizationId,
    agent_id: agentId,
    include_super_admin: includeSuperAdmin,
  }), [period, organizationId, agentId, includeSuperAdmin]);

  // All queries use the same filter params for consistent filtering
  const {
    data: overview,
    isLoading: overviewLoading,
    isFetching: overviewFetching,
    refetch: refetchOverview
  } = useGetPerformanceOverviewQuery(filterParams);

  const {
    data: responseTrend,
    isLoading: trendLoading,
    isFetching: trendFetching
  } = useGetResponseTimeTrendQuery(filterParams);

  const {
    data: statusDist,
    isLoading: statusLoading,
    isFetching: statusFetching
  } = useGetStatusDistributionQuery(filterParams);

  // Organization breakdown - only show when NO organization is selected
  const {
    data: orgBreakdown,
    isLoading: orgLoading,
    isFetching: orgFetching
  } = useGetOrganizationBreakdownQuery(
    { period, limit: 5, include_super_admin: includeSuperAdmin },
    { skip: !!organizationId } // Skip when org is already selected
  );

  // Agent breakdown - filter by selected org/agent
  const {
    data: agentBreakdown,
    isLoading: agentLoading,
    isFetching: agentFetching
  } = useGetAgentBreakdownQuery({
    period,
    organization_id: organizationId,
    limit: 8,
    include_super_admin: includeSuperAdmin,
  });

  // Top endpoints - filter by selected org/agent
  const {
    data: endpointData,
    isLoading: endpointLoading,
    isFetching: endpointFetching
  } = useGetEndpointPerformanceQuery({
    ...filterParams,
    limit: 5,
    sort_by: "request_count",
  });

  // Combined loading state for refresh button
  const isAnyLoading = overviewLoading || trendLoading || statusLoading || orgLoading || agentLoading;
  const isAnyFetching = overviewFetching || trendFetching || statusFetching || orgFetching || agentFetching;

  const handleRefresh = () => {
    refetchOverview();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (period === "1h" || period === "6h" || period === "24h") {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get active filter description for context
  const getFilterContext = () => {
    if (organizationId && agentId) {
      const agent = agentBreakdown?.data?.find(a => a.agent_id === agentId);
      return agent ? `Filtered by: ${agent.agent_name}` : "Filtered by selected agent";
    }
    if (organizationId) {
      const org = orgBreakdown?.data?.find(o => o.organization_id === organizationId);
      return org ? `Filtered by: ${org.organization_name}` : "Filtered by selected organization";
    }
    return "All organizations and agents";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Performance Overview"
        description="Monitor your API performance, response times, and system health at a glance"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics" },
        ]}
      />

      {/* Filter Bar */}
      <div className="px-6 mt-6">
        <FilterBar
          period={period}
          onPeriodChange={setPeriod}
          organizationId={organizationId}
          onOrganizationChange={setOrganizationId}
          agentId={agentId}
          onAgentChange={setAgentId}
          showOrganizationFilter
          showAgentFilter
          onRefresh={handleRefresh}
          isLoading={isAnyLoading || isAnyFetching}
          includeSuperAdmin={includeSuperAdmin}
          onIncludeSuperAdminChange={setIncludeSuperAdmin}
          showSuperAdminToggle
        />
      </div>

      {/* Filter Context Banner - shows when filters are active */}
      {(organizationId || agentId) && (
        <div className="px-6 mt-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-purple-800">
                {getFilterContext()}
              </span>
            </div>
            <span className="text-xs text-purple-600">
              All metrics below are filtered accordingly
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Requests"
            value={overview?.total_requests || 0}
            change={overview?.total_requests_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h2v8zm4 0h-2V7h2v10zm-8 0H6v-5h2v5z"/></svg>}
            color="blue"
            isLoading={overviewLoading || overviewFetching}
            description="API calls in selected period"
          />
          <StatCard
            title="Avg Response Time"
            value={overview?.avg_response_time_ms?.toFixed(1) || "0"}
            suffix="ms"
            change={overview?.avg_response_time_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>}
            color="green"
            isLoading={overviewLoading || overviewFetching}
            description="Average API response time"
          />
          <StatCard
            title="Error Rate"
            value={overview?.error_rate?.toFixed(2) || "0"}
            suffix="%"
            change={overview?.error_rate_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
            color="red"
            isLoading={overviewLoading || overviewFetching}
            description="Percentage of failed requests"
          />
          <StatCard
            title="Total Queries"
            value={overview?.total_queries || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zm6 12c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17z"/></svg>}
            color="purple"
            isLoading={overviewLoading || overviewFetching}
            description="Database queries executed"
          />
          <StatCard
            title="Avg Query Time"
            value={overview?.avg_query_time_ms?.toFixed(1) || "0"}
            suffix="ms"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>}
            color="teal"
            isLoading={overviewLoading || overviewFetching}
            description="Average DB query duration"
          />
          <StatCard
            title="Slow Requests"
            value={overview?.slow_requests || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>}
            color="orange"
            isLoading={overviewLoading || overviewFetching}
            description="Requests > 1000ms"
          />
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { href: "/dashboard/performance-analytics/response-time", label: "Response Time", icon: "⚡", color: "from-yellow-500 to-orange-500" },
            { href: "/dashboard/performance-analytics/endpoints", label: "Endpoints", icon: "🔗", color: "from-blue-500 to-indigo-600" },
            { href: "/dashboard/performance-analytics/slow-requests", label: "Slow Requests", icon: "🐌", color: "from-orange-500 to-red-500" },
            { href: "/dashboard/performance-analytics/status-codes", label: "Status Codes", icon: "📋", color: "from-green-500 to-emerald-600" },
            { href: "/dashboard/performance-analytics/database-queries", label: "DB Queries", icon: "🗄️", color: "from-purple-500 to-violet-600" },
            { href: "/dashboard/performance-analytics/organizations", label: "Organizations", icon: "🏢", color: "from-cyan-500 to-blue-600" },
            { href: "/dashboard/performance-analytics/agents", label: "Agents", icon: "🤖", color: "from-pink-500 to-rose-600" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 p-4 hover:shadow-lg transition-all hover:scale-105"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <div className="flex flex-col items-center text-center">
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trend - Full Width */}
        <ChartCard
          title="Response Time Trend"
          description="Average, max, and min response times over the selected period"
          isLoading={trendLoading || trendFetching}
          isEmpty={!responseTrend?.data?.length}
          className="lg:col-span-2"
          actions={
            <Link href="/dashboard/performance-analytics/response-time" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View Details →
            </Link>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={responseTrend?.data?.map(d => ({ ...d, time: formatTimestamp(d.timestamp) })) || []}>
              <defs>
                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}ms`,
                  name === "avg_response_time" ? "Average" : name === "max_response_time" ? "Maximum" : "Minimum"
                ]}
              />
              <Area type="monotone" dataKey="avg_response_time" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorAvg)" />
              <Area type="monotone" dataKey="max_response_time" stroke="#EF4444" strokeWidth={1} fill="none" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="min_response_time" stroke="#10B981" strokeWidth={1} fill="none" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard
          title="HTTP Status Distribution"
          description="Breakdown of response status codes"
          isLoading={statusLoading || statusFetching}
          isEmpty={!statusDist?.total}
          actions={
            <Link href="/dashboard/performance-analytics/status-codes" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View Details →
            </Link>
          }
        >
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={statusDist ? Object.entries(statusDist.categories).map(([name, value]) => ({ name, value })).filter(d => d.value > 0) : []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {statusDist && Object.entries(statusDist.categories).filter(([, value]) => value > 0).map(([name], index) => (
                    <Cell key={index} fill={STATUS_COLORS[name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), "Requests"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {statusDist && Object.entries(statusDist.categories).map(([name, value]) => (
                <div key={name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[name] }}></div>
                    <span className="text-sm font-semibold text-gray-800">{name}</span>
                    <span className="text-xs text-gray-500">
                      {name === "2xx" ? "Success" : name === "3xx" ? "Redirect" : name === "4xx" ? "Client Error" : "Server Error"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{value.toLocaleString()}</span>
                    <span className="text-sm text-gray-600 ml-1">
                      ({statusDist.total > 0 ? ((value / statusDist.total) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Top Endpoints - Always shown, filtered by org/agent */}
        <ChartCard
          title={organizationId ? "Top Endpoints (Filtered)" : "Top Endpoints"}
          description="Most frequently called API endpoints"
          isLoading={endpointLoading || endpointFetching}
          isEmpty={!endpointData?.data?.length}
          actions={
            <Link href="/dashboard/performance-analytics/endpoints" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View All →
            </Link>
          }
        >
          <div className="space-y-3">
            {endpointData?.data?.slice(0, 5).map((endpoint, index) => (
              <div
                key={endpoint.endpoint}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? "bg-purple-500" : index === 1 ? "bg-blue-500" : index === 2 ? "bg-green-500" : "bg-gray-400"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm text-gray-900 truncate">{endpoint.path}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        endpoint.method === "GET" ? "bg-green-100 text-green-700" :
                        endpoint.method === "POST" ? "bg-blue-100 text-blue-700" :
                        endpoint.method === "PUT" ? "bg-yellow-100 text-yellow-700" :
                        endpoint.method === "DELETE" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {endpoint.method}
                      </span>
                      <span className="text-xs text-gray-500">{endpoint.request_count.toLocaleString()} calls</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium text-gray-900">{endpoint.avg_response_time.toFixed(0)}ms</p>
                  <p className={`text-xs ${endpoint.error_rate < 1 ? "text-green-500" : endpoint.error_rate < 5 ? "text-yellow-500" : "text-red-500"}`}>
                    {endpoint.error_rate.toFixed(1)}% errors
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Conditional Sections based on filter state */}
      <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Organizations - Only show when NO organization is selected */}
        {!organizationId && (
          <ChartCard
            title="Top Organizations"
            description="Organizations with highest API usage"
            isLoading={orgLoading || orgFetching}
            isEmpty={!orgBreakdown?.data?.length}
            actions={
              <Link href="/dashboard/performance-analytics/organizations" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View All →
              </Link>
            }
          >
            <div className="space-y-3">
              {orgBreakdown?.data?.slice(0, 5).map((org, index) => (
                <button
                  key={org.organization_id}
                  onClick={() => setOrganizationId(org.organization_id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 transition-colors text-left border border-transparent hover:border-purple-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? "bg-purple-500" : index === 1 ? "bg-blue-500" : index === 2 ? "bg-green-500" : "bg-gray-400"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{org.organization_name}</p>
                      <p className="text-xs text-gray-500">{org.request_count.toLocaleString()} requests</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{org.avg_response_time.toFixed(0)}ms</p>
                    <p className={`text-xs ${org.error_rate < 1 ? "text-green-500" : org.error_rate < 5 ? "text-yellow-500" : "text-red-500"}`}>
                      {org.error_rate.toFixed(1)}% errors
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Top Agents - Always shown, filtered by org when selected */}
        <ChartCard
          title={organizationId ? "Agents in Selected Organization" : "Top Agents"}
          description={organizationId ? "AI agents in the selected organization" : "AI agents with highest API usage"}
          isLoading={agentLoading || agentFetching}
          isEmpty={!agentBreakdown?.data?.length}
          className={!organizationId ? "" : "lg:col-span-2"}
          actions={
            <Link href="/dashboard/performance-analytics/agents" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View All →
            </Link>
          }
        >
          {organizationId ? (
            // When org is selected, show as a list (more detail)
            <div className="space-y-3">
              {agentBreakdown?.data?.slice(0, 8).map((agent, index) => (
                <button
                  key={agent.agent_id}
                  onClick={() => setAgentId(agent.agent_id === agentId ? undefined : agent.agent_id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left border ${
                    agent.agent_id === agentId
                      ? "bg-purple-50 border-purple-300"
                      : "hover:bg-gray-50 border-transparent hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      agent.agent_id === agentId ? "bg-purple-600" :
                      index === 0 ? "bg-purple-500" : index === 1 ? "bg-blue-500" : index === 2 ? "bg-green-500" : "bg-gray-400"
                    }`}>
                      {agent.agent_id === agentId ? "✓" : index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{agent.agent_name}</p>
                      <p className="text-xs text-gray-500">{agent.request_count.toLocaleString()} requests</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{agent.avg_response_time.toFixed(0)}ms</p>
                    <p className={`text-xs ${agent.error_rate < 1 ? "text-green-500" : agent.error_rate < 5 ? "text-yellow-500" : "text-red-500"}`}>
                      {agent.error_rate.toFixed(1)}% errors
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Default bar chart view
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={agentBreakdown?.data?.slice(0, 8).map(a => ({
                  name: a.agent_name.length > 15 ? a.agent_name.substring(0, 15) + "..." : a.agent_name,
                  fullName: a.agent_name,
                  requests: a.request_count,
                  avgTime: a.avg_response_time,
                  errorRate: a.error_rate,
                })) || []}
                layout="vertical"
                margin={{ left: 20, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                  formatter={(value: number, name: string) => [
                    name === "requests" ? value.toLocaleString() + " requests" : name === "avgTime" ? value.toFixed(1) + "ms" : value.toFixed(1) + "%",
                    name === "requests" ? "Requests" : name === "avgTime" ? "Avg Response" : "Error Rate"
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="requests" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
}
