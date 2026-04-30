"use client";

import React, { useState } from "react";
import {
  useGetEndpointPerformanceQuery,
  useGetPerformanceOverviewQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { PageHeader, FilterBar, StatCard, ChartCard } from "@/components/performance-analytics/shared";

type Period = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";
type SortBy = "request_count" | "avg_response_time" | "max_response_time" | "error_rate";
type SortOrder = "asc" | "desc";

export default function EndpointPerformancePage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<SortBy>("request_count");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filterParams = {
    period,
    organization_id: organizationId,
    agent_id: agentId,
    limit: 50,
    sort_by: sortBy,
    sort_order: sortOrder,
    method: methodFilter || undefined,
    search: searchQuery || undefined,
  };

  const { data: overview, isLoading: overviewLoading, refetch } = useGetPerformanceOverviewQuery({
    period,
    organization_id: organizationId,
    agent_id: agentId,
  });
  const { data: endpoints, isLoading: endpointsLoading } = useGetEndpointPerformanceQuery(filterParams);

  const handleSort = (field: SortBy) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

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

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return "text-green-600";
    if (time < 300) return "text-blue-600";
    if (time < 500) return "text-yellow-600";
    if (time < 1000) return "text-orange-600";
    return "text-red-600";
  };

  const getResponseTimeLabel = (time: number) => {
    if (time < 100) return "Excellent";
    if (time < 300) return "Good";
    if (time < 500) return "Fair";
    if (time < 1000) return "Slow";
    return "Very Slow";
  };

  const getErrorRateColor = (rate: number) => {
    if (rate < 1) return "text-green-600";
    if (rate < 3) return "text-yellow-600";
    if (rate < 5) return "text-orange-600";
    return "text-red-600";
  };

  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Endpoint Performance"
        description="Detailed performance metrics for each API endpoint. Identify slow or problematic endpoints."
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics", href: "/dashboard/performance-analytics" },
          { label: "Endpoint Performance" },
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
            title="Total Endpoints"
            value={endpoints?.total || endpoints?.data?.length || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>}
            color="blue"
            isLoading={endpointsLoading}
            description="Unique API endpoints"
          />
          <StatCard
            title="Total Requests"
            value={overview?.total_requests || 0}
            change={overview?.total_requests_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h2v8zm4 0h-2V7h2v10zm-8 0H6v-5h2v5z"/></svg>}
            color="purple"
            isLoading={overviewLoading}
            description="In selected period"
          />
          <StatCard
            title="Avg Response Time"
            value={overview?.avg_response_time_ms?.toFixed(1) || "0"}
            suffix="ms"
            change={overview?.avg_response_time_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>}
            color="green"
            isLoading={overviewLoading}
            description="Across all endpoints"
          />
          <StatCard
            title="Overall Error Rate"
            value={overview?.error_rate?.toFixed(2) || "0"}
            suffix="%"
            change={overview?.error_rate_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
            color="red"
            isLoading={overviewLoading}
            description="Failed requests percentage"
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Search Endpoint
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by path..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Method Filter */}
            <div className="min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                HTTP Method
              </label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              >
                <option value="">All Methods</option>
                {methods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="min-w-[180px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              >
                <option value="request_count">Request Count</option>
                <option value="avg_response_time">Avg Response Time</option>
                <option value="max_response_time">Max Response Time</option>
                <option value="error_rate">Error Rate</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Order
              </label>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2"
              >
                {sortOrder === "desc" ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Descending
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    Ascending
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="px-6 mt-6 mb-8">
        <ChartCard
          title="All Endpoints"
          description={`Showing ${endpoints?.data?.length || 0} endpoints sorted by ${sortBy.replace("_", " ")}`}
          isLoading={endpointsLoading}
          isEmpty={!endpoints?.data?.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("request_count")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Requests
                      {sortBy === "request_count" && <span>{sortOrder === "desc" ? "↓" : "↑"}</span>}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("avg_response_time")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg Response
                      {sortBy === "avg_response_time" && <span>{sortOrder === "desc" ? "↓" : "↑"}</span>}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("max_response_time")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Max Response
                      {sortBy === "max_response_time" && <span>{sortOrder === "desc" ? "↓" : "↑"}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">P95</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Queries</th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("error_rate")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Error Rate
                      {sortBy === "error_rate" && <span>{sortOrder === "desc" ? "↓" : "↑"}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {endpoints?.data?.map((endpoint, index) => (
                  <tr key={endpoint.endpoint} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded border ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <div>
                          <span className="text-sm font-mono text-gray-900">{endpoint.path}</span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {endpoint.avg_query_count?.toFixed(1) || 0} DB queries per request
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {endpoint.request_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-semibold ${getResponseTimeColor(endpoint.avg_response_time)}`}>
                          {endpoint.avg_response_time.toFixed(1)}ms
                        </span>
                        <span className={`text-xs ${getResponseTimeColor(endpoint.avg_response_time)}`}>
                          {getResponseTimeLabel(endpoint.avg_response_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {endpoint.max_response_time.toFixed(0)}ms
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {endpoint.p95_response_time?.toFixed(0) || "N/A"}ms
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {endpoint.avg_query_count?.toFixed(1) || "0"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-semibold ${getErrorRateColor(endpoint.error_rate)}`}>
                          {endpoint.error_rate.toFixed(2)}%
                        </span>
                        {endpoint.total_errors > 0 && (
                          <span className="text-xs text-gray-400">
                            {endpoint.total_errors} errors
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {endpoint.error_rate < 1 && endpoint.avg_response_time < 300 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Healthy
                        </span>
                      ) : endpoint.error_rate < 5 && endpoint.avg_response_time < 1000 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Critical
                        </span>
                      )}
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
