"use client";

import React, { useState } from "react";
import {
  useGetResponseTimeTrendQuery,
  useGetPerformanceOverviewQuery,
  useGetEndpointPerformanceQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { PageHeader, FilterBar, StatCard, ChartCard } from "@/components/performance-analytics/shared";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
} from "recharts";

type Period = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

export default function ResponseTimeAnalysisPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();

  const filterParams = { period, organization_id: organizationId, agent_id: agentId };

  const { data: overview, isLoading: overviewLoading, refetch } = useGetPerformanceOverviewQuery(filterParams);
  const { data: responseTrend, isLoading: trendLoading } = useGetResponseTimeTrendQuery(filterParams);
  const { data: endpoints, isLoading: endpointsLoading } = useGetEndpointPerformanceQuery({
    ...filterParams,
    limit: 10,
    sort_by: "avg_response_time",
    sort_order: "desc",
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (period === "1h" || period === "6h") {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    if (period === "24h") {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate percentiles from data
  const calculatePercentiles = () => {
    if (!responseTrend?.data?.length) return { p50: 0, p95: 0, p99: 0 };
    const sortedTimes = [...responseTrend.data].map(d => d.avg_response_time).sort((a, b) => a - b);
    const len = sortedTimes.length;
    return {
      p50: sortedTimes[Math.floor(len * 0.5)] || 0,
      p95: sortedTimes[Math.floor(len * 0.95)] || 0,
      p99: sortedTimes[Math.floor(len * 0.99)] || 0,
    };
  };

  const percentiles = calculatePercentiles();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Response Time Analysis"
        description="Detailed analysis of API response times, latency patterns, and performance trends"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics", href: "/dashboard/performance-analytics" },
          { label: "Response Time Analysis" },
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
          onRefresh={() => refetch()}
          isLoading={overviewLoading}
        />
      </div>

      {/* Key Metrics */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <StatCard
            title="Average"
            value={overview?.avg_response_time_ms?.toFixed(1) || "0"}
            suffix="ms"
            change={overview?.avg_response_time_change}
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            color="blue"
            isLoading={overviewLoading}
            description="Mean response time"
            size="sm"
          />
          <StatCard
            title="Maximum"
            value={overview?.max_response_time_ms?.toFixed(0) || "0"}
            suffix="ms"
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>}
            color="red"
            isLoading={overviewLoading}
            description="Slowest response"
            size="sm"
          />
          <StatCard
            title="Minimum"
            value={overview?.min_response_time_ms?.toFixed(0) || "0"}
            suffix="ms"
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 12l-5-5-10 10"/></svg>}
            color="green"
            isLoading={overviewLoading}
            description="Fastest response"
            size="sm"
          />
          <StatCard
            title="P50 (Median)"
            value={percentiles.p50.toFixed(1)}
            suffix="ms"
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
            color="purple"
            isLoading={trendLoading}
            description="50% of requests"
            size="sm"
          />
          <StatCard
            title="P95"
            value={percentiles.p95.toFixed(1)}
            suffix="ms"
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>}
            color="orange"
            isLoading={trendLoading}
            description="95% of requests"
            size="sm"
          />
          <StatCard
            title="P99"
            value={percentiles.p99.toFixed(1)}
            suffix="ms"
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/></svg>}
            color="pink"
            isLoading={trendLoading}
            description="99% of requests"
            size="sm"
          />
          <StatCard
            title="Total Requests"
            value={overview?.total_requests || 0}
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>}
            color="teal"
            isLoading={overviewLoading}
            description="In selected period"
            size="sm"
          />
          <StatCard
            title="Slow Requests"
            value={overview?.slow_requests || 0}
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            color="red"
            isLoading={overviewLoading}
            description="> 1000ms"
            size="sm"
          />
        </div>
      </div>

      {/* Main Response Time Chart */}
      <div className="px-6 mt-6">
        <ChartCard
          title="Response Time Trend"
          description="Average, maximum, and minimum response times over the selected period. The shaded area represents the average response time."
          isLoading={trendLoading}
          isEmpty={!responseTrend?.data?.length}
        >
          <div className="mb-4 flex items-center justify-end gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded bg-purple-500"></div>
              <span className="text-gray-600">Average Response Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-400" style={{ borderTop: "2px dashed #F87171" }}></div>
              <span className="text-gray-600">Maximum</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-400" style={{ borderTop: "2px dashed #4ADE80" }}></div>
              <span className="text-gray-600">Minimum</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={responseTrend?.data?.map(d => ({ ...d, time: formatTimestamp(d.timestamp) })) || []}>
              <defs>
                <linearGradient id="colorAvgResponse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}ms`,
                  name === "avg_response_time" ? "Average" : name === "max_response_time" ? "Maximum" : "Minimum"
                ]}
              />
              <Area type="monotone" dataKey="avg_response_time" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorAvgResponse)" />
              <Line type="monotone" dataKey="max_response_time" stroke="#F87171" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="min_response_time" stroke="#4ADE80" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Request Count Chart */}
      <div className="px-6 mt-6">
        <ChartCard
          title="Request Volume Over Time"
          description="Number of API requests and errors over time. Higher volume may correlate with response time changes."
          isLoading={trendLoading}
          isEmpty={!responseTrend?.data?.length}
        >
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={responseTrend?.data?.map(d => ({ ...d, time: formatTimestamp(d.timestamp) })) || []}>
              <defs>
                <linearGradient id="colorReqVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === "request_count" ? "Requests" : "Errors"
                ]}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="request_count" name="Requests" stroke="#3B82F6" strokeWidth={2} fill="url(#colorReqVolume)" />
              <Bar yAxisId="right" dataKey="error_count" name="Errors" fill="#EF4444" opacity={0.8} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Slowest Endpoints */}
      <div className="px-6 mt-6 mb-8">
        <ChartCard
          title="Slowest Endpoints"
          description="API endpoints with the highest average response times. Consider optimizing these for better performance."
          isLoading={endpointsLoading}
          isEmpty={!endpoints?.data?.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Response</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Max Response</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Min Response</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">P95</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Requests</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Error Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {endpoints?.data?.map((endpoint, index) => {
                  const getMethodColor = (method: string) => {
                    switch (method) {
                      case "GET": return "bg-green-100 text-green-700";
                      case "POST": return "bg-blue-100 text-blue-700";
                      case "PUT": return "bg-yellow-100 text-yellow-700";
                      case "PATCH": return "bg-purple-100 text-purple-700";
                      case "DELETE": return "bg-red-100 text-red-700";
                      default: return "bg-gray-100 text-gray-700";
                    }
                  };

                  return (
                    <tr key={endpoint.endpoint} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm ${
                          index === 0 ? "bg-red-500" : index === 1 ? "bg-orange-500" : index === 2 ? "bg-yellow-500" : "bg-gray-400"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <span className="text-sm font-mono text-gray-700 truncate max-w-md">{endpoint.path}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-semibold ${
                          endpoint.avg_response_time < 100 ? "text-green-600" :
                          endpoint.avg_response_time < 500 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {endpoint.avg_response_time.toFixed(1)}ms
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600">
                        {endpoint.max_response_time.toFixed(0)}ms
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600">
                        {endpoint.min_response_time?.toFixed(0) || "N/A"}ms
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600">
                        {endpoint.p95_response_time?.toFixed(0) || "N/A"}ms
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                        {endpoint.request_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm font-medium ${
                          endpoint.error_rate < 1 ? "text-green-600" :
                          endpoint.error_rate < 5 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {endpoint.error_rate.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
