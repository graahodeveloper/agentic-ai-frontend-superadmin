"use client";

import React, { useState } from "react";
import {
  useGetSlowRequestsQuery,
  useGetPerformanceOverviewQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { PageHeader, FilterBar, StatCard, ChartCard } from "@/components/performance-analytics/shared";

type Period = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

export default function SlowRequestsPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();
  const [threshold, setThreshold] = useState<number>(1000);

  const filterParams = {
    period,
    organization_id: organizationId,
    agent_id: agentId,
    threshold,
    limit: 50,
  };

  const { data: overview, isLoading: overviewLoading, refetch } = useGetPerformanceOverviewQuery({
    period,
    organization_id: organizationId,
    agent_id: agentId,
  });
  const { data: slowRequests, isLoading: slowLoading } = useGetSlowRequestsQuery(filterParams);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-100 text-green-700 border-green-200";
      case "POST": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PUT": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "PATCH": return "bg-purple-100 text-purple-700 border-purple-200";
      case "DELETE": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: number) => {
    if (status < 300) return "bg-green-100 text-green-700";
    if (status < 400) return "bg-blue-100 text-blue-700";
    if (status < 500) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getResponseTimeBarWidth = (time: number) => {
    const maxTime = Math.max(...(slowRequests?.data?.map(r => r.response_time_ms) || [threshold * 3]));
    return `${Math.min((time / maxTime) * 100, 100)}%`;
  };

  const getResponseTimeBarColor = (time: number) => {
    const ratio = time / threshold;
    if (ratio < 1.5) return "bg-yellow-400";
    if (ratio < 2) return "bg-orange-400";
    return "bg-red-400";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Slow Requests"
        description="Identify and analyze API requests that exceed response time thresholds"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics", href: "/dashboard/performance-analytics" },
          { label: "Slow Requests" },
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

      {/* Summary Stats */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Slow Requests"
            value={overview?.slow_requests || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>}
            color="orange"
            isLoading={overviewLoading}
            description={`Requests > ${threshold}ms`}
          />
          <StatCard
            title="Current Threshold"
            value={threshold}
            suffix="ms"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
            color="blue"
            isLoading={false}
            description="Performance threshold"
          />
          <StatCard
            title="Avg Response Time"
            value={overview?.avg_response_time_ms?.toFixed(1) || "0"}
            suffix="ms"
            change={overview?.avg_response_time_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>}
            color="green"
            isLoading={overviewLoading}
            description="Overall average"
          />
          <StatCard
            title="Max Response Time"
            value={overview?.max_response_time_ms?.toFixed(0) || "0"}
            suffix="ms"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>}
            color="red"
            isLoading={overviewLoading}
            description="Worst case"
          />
        </div>
      </div>

      {/* Threshold Selector */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-6">
            <label className="text-sm font-medium text-gray-700">Response Time Threshold:</label>
            <div className="flex items-center gap-2">
              {[500, 1000, 2000, 3000, 5000].map((t) => (
                <button
                  key={t}
                  onClick={() => setThreshold(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    threshold === t
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t >= 1000 ? `${t / 1000}s` : `${t}ms`}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-gray-500">
              Showing requests slower than <strong>{threshold}ms</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Slow Requests Table */}
      <div className="px-6 mt-6 mb-8">
        <ChartCard
          title="Slow Request Details"
          description={`Found ${slowRequests?.total || slowRequests?.data?.length || 0} slow requests in the selected period`}
          isLoading={slowLoading}
          isEmpty={!slowRequests?.data?.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Response Time</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Queries</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Query Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slowRequests?.data?.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded border ${getMethodColor(request.method)}`}>
                          {request.method}
                        </span>
                        <span className="text-sm font-mono text-gray-700 truncate max-w-xs">
                          {request.path}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getResponseTimeBarColor(request.response_time_ms)}`}
                            style={{ width: getResponseTimeBarWidth(request.response_time_ms) }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {request.response_time_ms.toFixed(0)}ms
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status_code)}`}>
                        {request.status_code}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {request.query_count}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {request.query_time_ms.toFixed(0)}ms
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {request.organization_name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {request.organization_name}
                          </span>
                        )}
                        {request.agent_name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            {request.agent_name}
                          </span>
                        )}
                        {request.user_email && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {request.user_email}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
