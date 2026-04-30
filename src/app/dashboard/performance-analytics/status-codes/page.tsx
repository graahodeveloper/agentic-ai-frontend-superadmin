"use client";

import React, { useState } from "react";
import {
  useGetStatusDistributionQuery,
  useGetPerformanceOverviewQuery,
  useGetErrorAnalysisQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { PageHeader, FilterBar, StatCard, ChartCard } from "@/components/performance-analytics/shared";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Period = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

const STATUS_COLORS: Record<string, string> = {
  "2xx": "#10B981",
  "3xx": "#3B82F6",
  "4xx": "#F59E0B",
  "5xx": "#EF4444",
};

const STATUS_CODE_COLORS: Record<number, string> = {
  200: "#10B981",
  201: "#059669",
  204: "#047857",
  301: "#3B82F6",
  302: "#2563EB",
  304: "#1D4ED8",
  400: "#F59E0B",
  401: "#D97706",
  403: "#B45309",
  404: "#92400E",
  422: "#78350F",
  500: "#EF4444",
  502: "#DC2626",
  503: "#B91C1C",
  504: "#991B1B",
};

export default function StatusCodesPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();

  const filterParams = { period, organization_id: organizationId, agent_id: agentId };

  const { data: overview, isLoading: overviewLoading, refetch } = useGetPerformanceOverviewQuery(filterParams);
  const { data: statusDist, isLoading: statusLoading } = useGetStatusDistributionQuery(filterParams);
  const { data: errorAnalysis, isLoading: errorLoading } = useGetErrorAnalysisQuery(filterParams);

  const getCategoryData = () => {
    if (!statusDist?.categories) return [];
    return Object.entries(statusDist.categories)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percentage: statusDist.total > 0 ? ((value / statusDist.total) * 100).toFixed(1) : 0,
      }));
  };

  const getStatusCodeColor = (code: number): string => {
    return STATUS_CODE_COLORS[code] || (code < 300 ? "#10B981" : code < 400 ? "#3B82F6" : code < 500 ? "#F59E0B" : "#EF4444");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="HTTP Status Codes"
        description="Analyze the distribution of HTTP response status codes across your API"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h2v8zm4 0h-2V7h2v10zm-8 0H6v-5h2v5z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics", href: "/dashboard/performance-analytics" },
          { label: "Status Codes" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Requests"
            value={overview?.total_requests || 0}
            change={overview?.total_requests_change}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h2v8zm4 0h-2V7h2v10zm-8 0H6v-5h2v5z"/></svg>}
            color="blue"
            isLoading={overviewLoading}
          />
          <StatCard
            title="Success (2xx)"
            value={statusDist?.categories["2xx"] || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
            color="green"
            isLoading={statusLoading}
            description={statusDist?.total ? `${((statusDist.categories["2xx"] / statusDist.total) * 100).toFixed(1)}%` : "0%"}
          />
          <StatCard
            title="Redirects (3xx)"
            value={statusDist?.categories["3xx"] || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 15l-6 6-1.42-1.42L15.17 16H4V4h2v10h9.17l-3.59-3.58L13 9l6 6z"/></svg>}
            color="blue"
            isLoading={statusLoading}
            description={statusDist?.total ? `${((statusDist.categories["3xx"] / statusDist.total) * 100).toFixed(1)}%` : "0%"}
          />
          <StatCard
            title="Client Errors (4xx)"
            value={statusDist?.categories["4xx"] || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>}
            color="orange"
            isLoading={statusLoading}
            description={statusDist?.total ? `${((statusDist.categories["4xx"] / statusDist.total) * 100).toFixed(1)}%` : "0%"}
          />
          <StatCard
            title="Server Errors (5xx)"
            value={statusDist?.categories["5xx"] || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
            color="red"
            isLoading={statusLoading}
            description={statusDist?.total ? `${((statusDist.categories["5xx"] / statusDist.total) * 100).toFixed(1)}%` : "0%"}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie Chart */}
        <ChartCard
          title="Status Category Distribution"
          description="Breakdown by HTTP status code category"
          isLoading={statusLoading}
          isEmpty={!statusDist?.total}
        >
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={getCategoryData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={2}
                  label={({ name }) => `${name}`}
                >
                  {getCategoryData().map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), "Requests"]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-4">
              {getCategoryData().map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[cat.name] }}
                    ></div>
                    <div>
                      <span className="font-semibold text-gray-900">{cat.name}</span>
                      <p className="text-xs text-gray-500">
                        {cat.name === "2xx" ? "Success" : cat.name === "3xx" ? "Redirect" : cat.name === "4xx" ? "Client Error" : "Server Error"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{Number(cat.value).toLocaleString()}</span>
                    <p className="text-xs text-gray-500">{cat.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Detailed Status Codes */}
        <ChartCard
          title="Detailed Status Code Breakdown"
          description="Individual HTTP status code distribution"
          isLoading={statusLoading}
          isEmpty={!statusDist?.detailed?.length}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusDist?.detailed || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis
                type="category"
                dataKey="status_code"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                width={60}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), "Count"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {statusDist?.detailed?.map((entry, index) => (
                  <Cell key={index} fill={getStatusCodeColor(entry.status_code)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Error Analysis */}
      {errorAnalysis && (
        <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Errors by Endpoint */}
          <ChartCard
            title="Errors by Endpoint"
            description="Which endpoints are generating the most errors"
            isLoading={errorLoading}
            isEmpty={!errorAnalysis?.errors_by_endpoint?.length}
          >
            <div className="space-y-3">
              {errorAnalysis.errors_by_endpoint?.slice(0, 8).map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-gray-900 truncate">{endpoint.endpoint}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-red-500 h-1.5 rounded-full"
                        style={{ width: `${endpoint.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="font-semibold text-gray-900">{endpoint.count.toLocaleString()}</span>
                    <p className="text-xs text-gray-500">{endpoint.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Recent Errors */}
          <ChartCard
            title="Recent Errors"
            description="Most recent error responses"
            isLoading={errorLoading}
            isEmpty={!errorAnalysis?.recent_errors?.length}
          >
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {errorAnalysis.recent_errors?.slice(0, 10).map((error, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      error.status_code >= 500 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {error.status_code}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-mono text-gray-900 truncate">{error.path}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(error.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-2">
                    {error.response_time_ms.toFixed(0)}ms
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* All Status Codes Table */}
      <div className="px-6 mt-6 mb-8">
        <ChartCard
          title="Complete Status Code List"
          description="All HTTP status codes with request counts"
          isLoading={statusLoading}
          isEmpty={!statusDist?.detailed?.length}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {statusDist?.detailed?.map((status) => (
              <div
                key={status.status_code}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: getStatusCodeColor(status.status_code) }}
                  >
                    {status.status_code}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusCodeColor(status.status_code) }}
                  ></div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {status.count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {status.percentage?.toFixed(2) || 0}% of total
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
