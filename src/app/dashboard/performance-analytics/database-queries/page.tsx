"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useGetQueryPerformanceQuery,
  useGetPerformanceOverviewQuery,
  useGetEndpointPerformanceQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { PageHeader, FilterBar, StatCard, ChartCard } from "@/components/performance-analytics/shared";
import EndpointRequestsDrawer from "@/components/performance-analytics/EndpointRequestsDrawer";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
} from "recharts";

type Period = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

export default function DatabaseQueriesPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();
  const [endpointPage, setEndpointPage] = useState(1);
  const PAGE_SIZE = 20;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ path: string; method: string } | null>(null);

  const resetPage = () => setEndpointPage(1);

  const filterParams = { period, organization_id: organizationId, agent_id: agentId };

  const { data: overview, isLoading: overviewLoading, refetch } = useGetPerformanceOverviewQuery(filterParams);
  const { data: queryPerf, isLoading: queryLoading } = useGetQueryPerformanceQuery(filterParams);
  const { data: endpoints, isLoading: endpointsLoading, isFetching: endpointsFetching } = useGetEndpointPerformanceQuery({
    ...filterParams,
    limit: PAGE_SIZE,
    offset: (endpointPage - 1) * PAGE_SIZE,
    sort_by: "avg_response_time",
    sort_order: "desc",
  });

  const totalEndpoints = endpoints?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalEndpoints / PAGE_SIZE));
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tableRef.current) tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [endpointPage]);

  const handleEndpointClick = (path: string, method: string) => {
    setSelectedEndpoint({ path, method });
    setDrawerOpen(true);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (period === "1h" || period === "6h" || period === "24h") {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const topQueryEndpoints = endpoints?.data
    ?.filter(e => e.avg_query_count > 0)
    .sort((a, b) => b.avg_query_count - a.avg_query_count)
    .slice(0, 8) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Database Query Performance"
        description="Monitor database query counts, execution times, and identify query-heavy endpoints"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zm6 12c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-5c0 .5-2.13 2-6 2s-6-1.5-6-2V9.77c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V12z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics", href: "/dashboard/performance-analytics" },
          { label: "Database Queries" },
        ]}
      />

      {/* Filter Bar */}
      <div className="px-6 mt-6">
        <FilterBar
          period={period}
          onPeriodChange={(p) => { setPeriod(p); resetPage(); }}
          organizationId={organizationId}
          onOrganizationChange={(o) => { setOrganizationId(o); resetPage(); }}
          agentId={agentId}
          onAgentChange={(a) => { setAgentId(a); resetPage(); }}
          showOrganizationFilter
          showAgentFilter
          onRefresh={() => refetch()}
          isLoading={overviewLoading}
        />
      </div>

      {/* Summary Stats */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Queries"
            value={overview?.total_queries || queryPerf?.summary?.total_queries || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4z"/></svg>}
            color="purple"
            isLoading={overviewLoading || queryLoading}
            description="Total DB queries executed"
          />
          <StatCard
            title="Avg Query Time"
            value={overview?.avg_query_time_ms?.toFixed(1) || queryPerf?.summary?.avg_query_time?.toFixed(1) || "0"}
            suffix="ms"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>}
            color="teal"
            isLoading={overviewLoading || queryLoading}
            description="Average execution time"
          />
          <StatCard
            title="Avg Queries/Request"
            value={queryPerf?.summary?.avg_query_count?.toFixed(1) || "0"}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h2v8zm4 0h-2V7h2v10zm-8 0H6v-5h2v5z"/></svg>}
            color="blue"
            isLoading={queryLoading}
            description="Queries per API request"
          />
          <StatCard
            title="Total Requests"
            value={overview?.total_requests || 0}
            change={overview?.total_requests_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>}
            color="green"
            isLoading={overviewLoading}
            description="API requests in period"
          />
          <StatCard
            title="Slow Queries"
            value={queryPerf?.data?.reduce((sum, d) => sum + (d.slow_queries || 0), 0) || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>}
            color="orange"
            isLoading={queryLoading}
            description="Queries > 100ms"
          />
        </div>
      </div>

      {/* Query Performance Charts */}
      <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Volume & Time Trend */}
        <ChartCard
          title="Query Volume & Time Trend"
          description="Database query count and average execution time over time"
          isLoading={queryLoading}
          isEmpty={!queryPerf?.data?.length}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={queryPerf?.data?.map(d => ({ ...d, time: formatTimestamp(d.timestamp) })) || []}>
              <defs>
                <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                formatter={(value: number, name: string) => [
                  name === "total_queries" ? value.toLocaleString() : `${value.toFixed(1)}ms`,
                  name === "total_queries" ? "Total Queries" : name === "avg_query_time" ? "Avg Query Time" : name === "max_query_time" ? "Max Query Time" : name
                ]}
              />
              <Area yAxisId="left" type="monotone" dataKey="total_queries" stroke="#8B5CF6" fill="url(#colorQueries)" />
              <Line yAxisId="right" type="monotone" dataKey="avg_query_time" stroke="#14B8A6" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="max_query_time" stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Queries per Request */}
        <ChartCard
          title="Queries per Request Over Time"
          description="Average and max database queries per API request"
          isLoading={queryLoading}
          isEmpty={!queryPerf?.data?.length}
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={queryPerf?.data?.map(d => ({ ...d, time: formatTimestamp(d.timestamp) })) || []}>
              <defs>
                <linearGradient id="colorAvgCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                formatter={(value: number, name: string) => [
                  value.toFixed(1),
                  name === "avg_query_count" ? "Avg Queries/Request" : "Max Queries/Request"
                ]}
              />
              <Area type="monotone" dataKey="avg_query_count" stroke="#3B82F6" fill="url(#colorAvgCount)" />
              <Area type="monotone" dataKey="max_query_count" stroke="#F59E0B" fill="none" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Query-Heavy Endpoints */}
        <ChartCard
          title="Query-Heavy Endpoints"
          description="Endpoints with highest average queries per request"
          isLoading={endpointsLoading}
          isEmpty={!topQueryEndpoints.length}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={topQueryEndpoints.map(e => ({
                name: e.path.length > 25 ? e.path.substring(0, 25) + "..." : e.path,
                fullPath: e.path,
                queries: e.avg_query_count,
                method: e.method,
              }))}
              layout="vertical"
              margin={{ left: 20, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} width={140} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                formatter={(value: number) => [`${value.toFixed(1)} queries`, "Avg Queries"]}
              />
              <Bar dataKey="queries" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Endpoint Query Details */}
      <div className="px-6 mt-6 mb-8" ref={tableRef}>
        <ChartCard
          title={`Endpoint Query Analysis${totalEndpoints > 0 ? ` (${totalEndpoints} total)` : ""}`}
          description={`Click any row to inspect individual request logs — page ${endpointPage} of ${totalPages}`}
          isLoading={endpointsLoading}
          isEmpty={!endpoints?.data?.length && !endpointsFetching}
        >
          <div className="relative overflow-x-auto">
            {endpointsFetching && !endpointsLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-3 bg-white border border-gray-200 shadow-md rounded-xl px-5 py-3">
                  <svg className="w-5 h-5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Loading...</span>
                </div>
              </div>
            )}
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Requests</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Queries</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Response</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Query Impact</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {endpoints?.data?.map((endpoint, idx) => {
                  const globalRank = (endpointPage - 1) * PAGE_SIZE + idx + 1;
                  const queryImpact = endpoint.avg_query_count > 10 ? "high" : endpoint.avg_query_count > 5 ? "medium" : "low";
                  return (
                    <tr
                      key={endpoint.endpoint}
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                      onClick={() => handleEndpointClick(endpoint.path, endpoint.method)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-5 flex-shrink-0">{globalRank}.</span>
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            endpoint.method === "GET" ? "bg-green-100 text-green-700" :
                            endpoint.method === "POST" ? "bg-blue-100 text-blue-700" :
                            endpoint.method === "PUT" ? "bg-yellow-100 text-yellow-700" :
                            endpoint.method === "DELETE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                          }`}>{endpoint.method}</span>
                          <span className="text-sm font-mono text-gray-900 truncate max-w-xs">{endpoint.path}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">{endpoint.request_count.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm font-semibold ${
                          endpoint.avg_query_count > 10 ? "text-red-600" :
                          endpoint.avg_query_count > 5 ? "text-yellow-600" : "text-green-600"
                        }`}>{endpoint.avg_query_count?.toFixed(1) || 0}</span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600">{endpoint.avg_response_time.toFixed(0)}ms</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${
                              queryImpact === "high" ? "bg-red-500" : queryImpact === "medium" ? "bg-yellow-500" : "bg-green-500"
                            }`} style={{ width: `${Math.min((endpoint.avg_query_count / 15) * 100, 100)}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 capitalize w-14">{queryImpact}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {queryImpact === "high" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Needs Review</span>
                        ) : queryImpact === "medium" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Consider</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Optimal</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          Inspect
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-700">{(endpointPage - 1) * PAGE_SIZE + 1}–{Math.min(endpointPage * PAGE_SIZE, totalEndpoints)}</span> of <span className="font-medium text-gray-700">{totalEndpoints}</span> endpoints
                {endpointsFetching && (
                  <span className="ml-2 inline-flex items-center gap-1 text-purple-600 text-xs">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    Updating...
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setEndpointPage(p => Math.max(1, p - 1))} disabled={endpointPage === 1 || endpointsFetching}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - endpointPage) <= 1)
                    .reduce((acc: (number | "...")[], p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p); return acc;
                    }, [])
                    .map((item, i) => item === "..." ? (
                      <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                    ) : (
                      <button key={item} onClick={() => setEndpointPage(item as number)} disabled={endpointsFetching}
                        className={`w-8 h-8 text-sm font-medium rounded-lg transition-all ${
                          endpointPage === item ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-200" : "border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
                        }`}>{item}</button>
                    ))}
                </div>
                <button onClick={() => setEndpointPage(p => Math.min(totalPages, p + 1))} disabled={endpointPage === totalPages || endpointsFetching}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Endpoint Requests Drawer */}
      <EndpointRequestsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        path={selectedEndpoint?.path ?? ""}
        method={selectedEndpoint?.method ?? ""}
        period={period}
        organizationId={organizationId}
        agentId={agentId}
      />
    </div>
  );
}
