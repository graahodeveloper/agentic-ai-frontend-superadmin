"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  useGetOrganizationBreakdownQuery,
  useGetOrganizationAnalyticsQuery,
  useGetEndpointPerformanceQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { PageHeader, FilterBar, StatCard, ChartCard } from "@/components/performance-analytics/shared";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

type Period = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#6366F1", "#F97316", "#84CC16"];

export default function OrganizationsPage() {
  const searchParams = useSearchParams();
  const preselectedOrgId = searchParams.get("id");

  const [period, setPeriod] = useState<Period>("7d");
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(preselectedOrgId || undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [orgEndpointPage, setOrgEndpointPage] = useState(1);
  const [orgEndpointSort, setOrgEndpointSort] = useState<"request_count" | "avg_response_time" | "error_rate">("request_count");
  const ORG_EP_PAGE_SIZE = 20;
  const orgEndpointTableRef = useRef<HTMLDivElement>(null);

  // Reset endpoint page when org changes
  useEffect(() => { setOrgEndpointPage(1); }, [selectedOrgId, period]);

  // Scroll endpoint table to top on page change
  useEffect(() => {
    if (orgEndpointTableRef.current) {
      orgEndpointTableRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [orgEndpointPage]);

  const { data: orgBreakdown, isLoading: breakdownLoading, refetch } = useGetOrganizationBreakdownQuery({
    period,
    limit: 50,
    search: searchQuery || undefined,
  });

  const { data: orgAnalytics, isLoading: analyticsLoading } = useGetOrganizationAnalyticsQuery(
    { organization_id: selectedOrgId!, period },
    { skip: !selectedOrgId }
  );

  // Full paginated endpoints for selected org
  const { data: orgEndpoints, isLoading: orgEndpointsLoading, isFetching: orgEndpointsFetching } = useGetEndpointPerformanceQuery(
    {
      period,
      organization_id: selectedOrgId,
      limit: ORG_EP_PAGE_SIZE,
      offset: (orgEndpointPage - 1) * ORG_EP_PAGE_SIZE,
      sort_by: orgEndpointSort,
      sort_order: "desc",
    },
    { skip: !selectedOrgId }
  );

  const orgEpTotal = orgEndpoints?.total ?? 0;
  const orgEpTotalPages = Math.max(1, Math.ceil(orgEpTotal / ORG_EP_PAGE_SIZE));

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (period === "1h" || period === "6h" || period === "24h") {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getErrorRateColor = (rate: number) => {
    if (rate < 1) return "text-green-600";
    if (rate < 3) return "text-yellow-600";
    if (rate < 5) return "text-orange-600";
    return "text-red-600";
  };

  // Calculate totals
  const totalRequests = orgBreakdown?.data?.reduce((sum, org) => sum + org.request_count, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Organization Analytics"
        description="Performance breakdown by organization - identify usage patterns and issues"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics", href: "/dashboard/performance-analytics" },
          { label: "Organizations" },
        ]}
      />

      {/* Filter Bar */}
      <div className="px-6 mt-6">
        <FilterBar
          period={period}
          onPeriodChange={setPeriod}
          onRefresh={() => refetch()}
          isLoading={breakdownLoading}
        />
      </div>

      {/* Summary Stats */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Organizations"
            value={orgBreakdown?.total || orgBreakdown?.data?.length || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2z"/></svg>}
            color="blue"
            isLoading={breakdownLoading}
            description="Active organizations"
          />
          <StatCard
            title="Total Requests"
            value={totalRequests}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h2v8zm4 0h-2V7h2v10zm-8 0H6v-5h2v5z"/></svg>}
            color="purple"
            isLoading={breakdownLoading}
            description="Across all organizations"
          />
          <StatCard
            title="Avg Response Time"
            value={orgBreakdown?.data?.length ? (orgBreakdown.data.reduce((sum, org) => sum + org.avg_response_time, 0) / orgBreakdown.data.length).toFixed(0) : "0"}
            suffix="ms"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>}
            color="green"
            isLoading={breakdownLoading}
            description="Average across orgs"
          />
          <StatCard
            title="High Error Orgs"
            value={orgBreakdown?.data?.filter(org => org.error_rate > 5).length || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
            color="red"
            isLoading={breakdownLoading}
            description="Error rate > 5%"
          />
        </div>
      </div>

      {/* Search and Organization List */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization List */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Organizations"
            description={`${orgBreakdown?.data?.length || 0} organizations found`}
            isLoading={breakdownLoading}
            isEmpty={!orgBreakdown?.data?.length}
          >
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {orgBreakdown?.data?.map((org, index) => (
                <button
                  key={org.organization_id}
                  onClick={() => setSelectedOrgId(org.organization_id)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedOrgId === org.organization_id
                      ? "bg-purple-50 border-2 border-purple-500"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-semibold text-gray-900 truncate max-w-[180px]">
                        {org.organization_name}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${getErrorRateColor(org.error_rate)}`}>
                      {org.error_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{org.request_count.toLocaleString()} requests</span>
                    <span>{org.avg_response_time.toFixed(0)}ms avg</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((org.request_count / (orgBreakdown?.data?.[0]?.request_count || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </button>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Organization Details */}
        <div className="lg:col-span-2">
          {selectedOrgId && orgAnalytics ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Requests"
                  value={orgAnalytics.overview?.total_requests || 0}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>}
                  color="purple"
                  isLoading={analyticsLoading}
                />
                <StatCard
                  title="Avg Response"
                  value={orgAnalytics.overview?.avg_response_time_ms?.toFixed(0) || "0"}
                  suffix="ms"
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/></svg>}
                  color="green"
                  isLoading={analyticsLoading}
                />
                <StatCard
                  title="Error Rate"
                  value={orgAnalytics.overview?.error_rate?.toFixed(2) || "0"}
                  suffix="%"
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
                  color="red"
                  isLoading={analyticsLoading}
                />
                <StatCard
                  title="Slow Requests"
                  value={orgAnalytics.overview?.slow_requests || 0}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73s-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>}
                  color="orange"
                  isLoading={analyticsLoading}
                />
              </div>

              {/* Response Trend */}
              <ChartCard
                title="Response Time Trend"
                description="Response time over the selected period"
                isLoading={analyticsLoading}
                isEmpty={!orgAnalytics.response_trend?.length}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={orgAnalytics.response_trend?.map(d => ({ ...d, time: formatTimestamp(d.timestamp) })) || []}>
                    <defs>
                      <linearGradient id="colorResp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#6B7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `${v}ms`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value.toFixed(1)}ms`, "Avg Response"]}
                    />
                    <Area type="monotone" dataKey="avg_response_time" stroke="#8B5CF6" fill="url(#colorResp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

                {/* Top Endpoints — full paginated */}
                <div ref={orgEndpointTableRef}>
                  <ChartCard
                    title={`Top Endpoints${orgEpTotal > 0 ? ` (${orgEpTotal} total)` : ""}`}
                    description={`All endpoints used by this organization sorted by ${orgEndpointSort.replace("_", " ")} — page ${orgEndpointPage} of ${orgEpTotalPages}`}
                    isLoading={orgEndpointsLoading}
                    isEmpty={!orgEndpoints?.data?.length && !orgEndpointsFetching}
                  >
                    {/* Sort controls */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500 mr-1">Sort by:</span>
                      {(["request_count", "avg_response_time", "error_rate"] as const).map(s => (
                        <button key={s} onClick={() => { setOrgEndpointSort(s); setOrgEndpointPage(1); }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            orgEndpointSort === s ? "bg-purple-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}>
                          {s === "request_count" ? "Most Requests" : s === "avg_response_time" ? "Slowest" : "Error Rate"}
                        </button>
                      ))}
                    </div>

                    <div className="relative overflow-x-auto">
                      {orgEndpointsFetching && !orgEndpointsLoading && (
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
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Requests</th>
                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Resp</th>
                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Error %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orgEndpoints?.data?.map((ep, idx) => {
                            const globalRank = (orgEndpointPage - 1) * ORG_EP_PAGE_SIZE + idx + 1;
                            return (
                              <tr key={ep.endpoint} className="hover:bg-purple-50/30 transition-colors">
                                <td className="px-3 py-3 text-xs text-gray-400 font-medium">{globalRank}</td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded flex-shrink-0 ${
                                      ep.method === "GET" ? "bg-green-100 text-green-700" :
                                      ep.method === "POST" ? "bg-blue-100 text-blue-700" :
                                      ep.method === "PUT" ? "bg-amber-100 text-amber-700" :
                                      ep.method === "DELETE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                    }`}>{ep.method}</span>
                                    <span className="text-xs font-mono text-gray-800 truncate max-w-[220px]">{ep.path}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-right text-sm font-semibold text-gray-900">{ep.request_count.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right text-sm text-gray-600">{ep.avg_response_time.toFixed(0)}ms</td>
                                <td className="px-3 py-3 text-right">
                                  <span className={`text-sm font-medium ${
                                    ep.error_rate < 1 ? "text-emerald-600" :
                                    ep.error_rate < 5 ? "text-amber-600" : "text-red-600"
                                  }`}>{ep.error_rate.toFixed(1)}%</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {orgEpTotalPages > 1 && (
                      <div className="flex items-center justify-between px-3 py-3 border-t border-gray-100 mt-2">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{(orgEndpointPage - 1) * ORG_EP_PAGE_SIZE + 1}–{Math.min(orgEndpointPage * ORG_EP_PAGE_SIZE, orgEpTotal)}</span> of <span className="font-medium text-gray-700">{orgEpTotal}</span>
                          {orgEndpointsFetching && <span className="ml-2 inline-flex items-center gap-1 text-purple-600"><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Updating...</span>}
                        </p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setOrgEndpointPage(p => Math.max(1, p - 1))} disabled={orgEndpointPage === 1 || orgEndpointsFetching}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">‹</button>
                          {Array.from({ length: orgEpTotalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === orgEpTotalPages || Math.abs(p - orgEndpointPage) <= 1)
                            .reduce((acc: (number | "...")[], p, i, arr) => {
                              if (i > 0 && (p as number) - ((arr as number[])[i - 1]) > 1) acc.push("...");
                              acc.push(p); return acc;
                            }, [])
                            .map((item, i) => item === "..." ? (
                              <span key={`e${i}`} className="w-6 text-center text-gray-400 text-xs">…</span>
                            ) : (
                              <button key={item} onClick={() => setOrgEndpointPage(item as number)} disabled={orgEndpointsFetching}
                                className={`w-6 h-6 text-xs font-medium rounded-lg transition-all ${
                                  orgEndpointPage === item ? "bg-purple-600 text-white ring-2 ring-purple-200" : "border border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                                }`}>{item}</button>
                            ))}
                          <button onClick={() => setOrgEndpointPage(p => Math.min(orgEpTotalPages, p + 1))} disabled={orgEndpointPage === orgEpTotalPages || orgEndpointsFetching}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">›</button>
                        </div>
                      </div>
                    )}
                  </ChartCard>
                </div>

                <ChartCard
                  title="Active Agents"
                  description="Agents used by this organization"
                  isLoading={analyticsLoading}
                  isEmpty={!orgAnalytics.top_agents?.length}
                >
                  <div className="space-y-2">
                    {orgAnalytics.top_agents?.slice(0, 5).map((agent, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🤖</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{agent.agent_name}</p>
                            <p className="text-xs text-gray-500">{agent.request_count.toLocaleString()} requests</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${getErrorRateColor(agent.error_rate)}`}>
                          {agent.error_rate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
            </div>
          ) : (
            <ChartCard
              title="Select an Organization"
              description="Click on an organization from the list to view detailed analytics"
              isEmpty
            >
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                </svg>
                <p className="text-sm">Select an organization to view analytics</p>
              </div>
            </ChartCard>
          )}
        </div>
      </div>

      {/* Request Distribution Chart */}
      <div className="px-6 mt-6 mb-8">
        <ChartCard
          title="Request Distribution by Organization"
          description="Visualizing API usage across organizations"
          isLoading={breakdownLoading}
          isEmpty={!orgBreakdown?.data?.length}
        >
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="40%" height={300}>
              <PieChart>
                <Pie
                  data={orgBreakdown?.data?.slice(0, 10).map((org, index) => ({
                    name: org.organization_name,
                    value: org.request_count,
                    color: COLORS[index % COLORS.length],
                  })) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {orgBreakdown?.data?.slice(0, 10).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), "Requests"]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={orgBreakdown?.data?.slice(0, 10).map((org, index) => ({
                    name: org.organization_name.length > 15 ? org.organization_name.substring(0, 15) + "..." : org.organization_name,
                    fullName: org.organization_name,
                    requests: org.request_count,
                    color: COLORS[index % COLORS.length],
                  })) || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} width={120} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Requests"]}
                  />
                  <Bar dataKey="requests" radius={[0, 4, 4, 0]}>
                    {orgBreakdown?.data?.slice(0, 10).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
