"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  useGetAgentBreakdownQuery,
  useGetAgentAnalyticsQuery,
  useGetOrganizationsListQuery,
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

export default function AgentsPage() {
  const searchParams = useSearchParams();
  const preselectedAgentId = searchParams.get("id");

  const [period, setPeriod] = useState<Period>("7d");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(preselectedAgentId || undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentEpPage, setAgentEpPage] = useState(1);
  const [agentEpSort, setAgentEpSort] = useState<"request_count" | "avg_response_time" | "error_rate">("request_count");
  const AGENT_EP_PAGE_SIZE = 20;
  const agentEpTableRef = useRef<HTMLDivElement>(null);

  // Reset endpoint page when agent or period changes
  useEffect(() => { setAgentEpPage(1); }, [selectedAgentId, period]);

  // Scroll to top on page change
  useEffect(() => {
    if (agentEpTableRef.current) {
      agentEpTableRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [agentEpPage]);

  // Organization list available for filtering if needed
  useGetOrganizationsListQuery();

  const { data: agentBreakdown, isLoading: breakdownLoading, refetch } = useGetAgentBreakdownQuery({
    period,
    organization_id: organizationId,
    limit: 50,
    search: searchQuery || undefined,
  });

  const { data: agentAnalytics, isLoading: analyticsLoading } = useGetAgentAnalyticsQuery(
    { agent_id: selectedAgentId!, period },
    { skip: !selectedAgentId }
  );

  // Full paginated endpoints for selected agent
  const { data: agentEndpoints, isLoading: agentEpLoading, isFetching: agentEpFetching } = useGetEndpointPerformanceQuery(
    {
      period,
      agent_id: selectedAgentId,
      limit: AGENT_EP_PAGE_SIZE,
      offset: (agentEpPage - 1) * AGENT_EP_PAGE_SIZE,
      sort_by: agentEpSort,
      sort_order: "desc",
    },
    { skip: !selectedAgentId }
  );

  const agentEpTotal = agentEndpoints?.total ?? 0;
  const agentEpTotalPages = Math.max(1, Math.ceil(agentEpTotal / AGENT_EP_PAGE_SIZE));

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

  const getAgentTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "support": return "💬";
      case "sales": return "💰";
      case "technical": return "🔧";
      case "general": return "🤖";
      default: return "🤖";
    }
  };

  // Calculate totals
  const totalRequests = agentBreakdown?.data?.reduce((sum, agent) => sum + agent.request_count, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Agent Analytics"
        description="Performance breakdown by AI agent - monitor usage and identify issues"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M17 10H20C21.1 10 22 10.9 22 12V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V12C2 10.9 2.9 10 4 10H7V8C7 6.9 7.9 6 9 6H15C16.1 6 17 6.9 17 8V10M9.5 12C10.3 12 11 12.7 11 13.5C11 14.3 10.3 15 9.5 15C8.7 15 8 14.3 8 13.5C8 12.7 8.7 12 9.5 12M14.5 12C15.3 12 16 12.7 16 13.5C16 14.3 15.3 15 14.5 15C13.7 15 13 14.3 13 13.5C13 12.7 13.7 12 14.5 12M10 17H14C14 18.1 13.1 19 12 19C10.9 19 10 18.1 10 17Z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics", href: "/dashboard/performance-analytics" },
          { label: "Agents" },
        ]}
      />

      {/* Filter Bar */}
      <div className="px-6 mt-6">
        <FilterBar
          period={period}
          onPeriodChange={setPeriod}
          organizationId={organizationId}
          onOrganizationChange={setOrganizationId}
          showOrganizationFilter
          onRefresh={() => refetch()}
          isLoading={breakdownLoading}
        />
      </div>

      {/* Summary Stats */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Agents"
            value={agentBreakdown?.total || agentBreakdown?.data?.length || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M17 10H7V8C7 6.9 7.9 6 9 6H15C16.1 6 17 6.9 17 8V10Z"/></svg>}
            color="purple"
            isLoading={breakdownLoading}
            description="Active AI agents"
          />
          <StatCard
            title="Total Requests"
            value={totalRequests}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h2v8zm4 0h-2V7h2v10zm-8 0H6v-5h2v5z"/></svg>}
            color="blue"
            isLoading={breakdownLoading}
            description="Across all agents"
          />
          <StatCard
            title="Avg Response Time"
            value={agentBreakdown?.data?.length ? (agentBreakdown.data.reduce((sum, agent) => sum + agent.avg_response_time, 0) / agentBreakdown.data.length).toFixed(0) : "0"}
            suffix="ms"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>}
            color="green"
            isLoading={breakdownLoading}
            description="Average across agents"
          />
          <StatCard
            title="High Error Agents"
            value={agentBreakdown?.data?.filter(agent => agent.error_rate > 5).length || 0}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
            color="red"
            isLoading={breakdownLoading}
            description="Error rate > 5%"
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Agents"
            description={`${agentBreakdown?.data?.length || 0} agents found`}
            isLoading={breakdownLoading}
            isEmpty={!agentBreakdown?.data?.length}
          >
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {agentBreakdown?.data?.map((agent) => (
                <button
                  key={agent.agent_id}
                  onClick={() => setSelectedAgentId(agent.agent_id)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedAgentId === agent.agent_id
                      ? "bg-purple-50 border-2 border-purple-500"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getAgentTypeIcon(agent.agent_type)}</span>
                      <div>
                        <span className="font-semibold text-gray-900 truncate block max-w-[160px]">
                          {agent.agent_name}
                        </span>
                        <span className="text-xs text-gray-500">{agent.organization_name}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${getErrorRateColor(agent.error_rate)}`}>
                      {agent.error_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{agent.request_count.toLocaleString()} requests</span>
                    <span>{agent.avg_response_time.toFixed(0)}ms avg</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((agent.request_count / (agentBreakdown?.data?.[0]?.request_count || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </button>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Agent Details */}
        <div className="lg:col-span-2">
          {selectedAgentId && agentAnalytics ? (
            <div className="space-y-6">
              {/* Agent Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">{getAgentTypeIcon(agentAnalytics.agent_info?.type)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{agentAnalytics.agent_info?.name}</h3>
                      <p className="text-sm text-gray-500">{agentAnalytics.agent_info?.organization_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                          {agentAnalytics.agent_info?.type || "General"}
                        </span>
                        <span className="text-xs text-gray-400">
                          Created: {agentAnalytics.agent_info?.created_at ? new Date(agentAnalytics.agent_info.created_at).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Requests"
                  value={agentAnalytics.overview?.total_requests || 0}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>}
                  color="purple"
                  isLoading={analyticsLoading}
                />
                <StatCard
                  title="Avg Response"
                  value={agentAnalytics.overview?.avg_response_time_ms?.toFixed(0) || "0"}
                  suffix="ms"
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/></svg>}
                  color="green"
                  isLoading={analyticsLoading}
                />
                <StatCard
                  title="Error Rate"
                  value={agentAnalytics.overview?.error_rate?.toFixed(2) || "0"}
                  suffix="%"
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
                  color="red"
                  isLoading={analyticsLoading}
                />
                <StatCard
                  title="Slow Requests"
                  value={agentAnalytics.overview?.slow_requests || 0}
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
                isEmpty={!agentAnalytics.response_trend?.length}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={agentAnalytics.response_trend?.map(d => ({ ...d, time: formatTimestamp(d.timestamp) })) || []}>
                    <defs>
                      <linearGradient id="colorAgentResp" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="avg_response_time" stroke="#8B5CF6" fill="url(#colorAgentResp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Top Endpoints — full paginated */}
              <div ref={agentEpTableRef}>
                <ChartCard
                  title={`Top Endpoints${agentEpTotal > 0 ? ` (${agentEpTotal} total)` : ""}`}
                  description={`All endpoints used by this agent sorted by ${agentEpSort.replace("_", " ")} — page ${agentEpPage} of ${agentEpTotalPages}`}
                  isLoading={agentEpLoading}
                  isEmpty={!agentEndpoints?.data?.length && !agentEpFetching}
                >
                  {/* Sort controls */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 mr-1">Sort by:</span>
                    {(["request_count", "avg_response_time", "error_rate"] as const).map(s => (
                      <button key={s} onClick={() => { setAgentEpSort(s); setAgentEpPage(1); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          agentEpSort === s ? "bg-purple-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}>
                        {s === "request_count" ? "Most Requests" : s === "avg_response_time" ? "Slowest" : "Error Rate"}
                      </button>
                    ))}
                  </div>

                  <div className="relative overflow-x-auto">
                    {agentEpFetching && !agentEpLoading && (
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
                        {agentEndpoints?.data?.map((ep, idx) => {
                          const globalRank = (agentEpPage - 1) * AGENT_EP_PAGE_SIZE + idx + 1;
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
                  {agentEpTotalPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-3 border-t border-gray-100 mt-2">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{(agentEpPage - 1) * AGENT_EP_PAGE_SIZE + 1}–{Math.min(agentEpPage * AGENT_EP_PAGE_SIZE, agentEpTotal)}</span> of <span className="font-medium text-gray-700">{agentEpTotal}</span>
                        {agentEpFetching && <span className="ml-2 inline-flex items-center gap-1 text-purple-600"><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Updating...</span>}
                      </p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setAgentEpPage(p => Math.max(1, p - 1))} disabled={agentEpPage === 1 || agentEpFetching}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">‹</button>
                        {Array.from({ length: agentEpTotalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === agentEpTotalPages || Math.abs(p - agentEpPage) <= 1)
                          .reduce((acc: (number | "...")[], p, i, arr) => {
                            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                            acc.push(p); return acc;
                          }, [])
                          .map((item, i) => item === "..." ? (
                            <span key={`e${i}`} className="w-6 text-center text-gray-400 text-xs">…</span>
                          ) : (
                            <button key={item} onClick={() => setAgentEpPage(item as number)} disabled={agentEpFetching}
                              className={`w-6 h-6 text-xs font-medium rounded-lg transition-all ${
                                agentEpPage === item ? "bg-purple-600 text-white ring-2 ring-purple-200" : "border border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                              }`}>{item}</button>
                          ))}
                        <button onClick={() => setAgentEpPage(p => Math.min(agentEpTotalPages, p + 1))} disabled={agentEpPage === agentEpTotalPages || agentEpFetching}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">›</button>
                      </div>
                    </div>
                  )}
                </ChartCard>
              </div>
            </div>
          ) : (
            <ChartCard
              title="Select an Agent"
              description="Click on an agent from the list to view detailed analytics"
              isEmpty
            >
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-6xl mb-4">🤖</span>
                <p className="text-sm">Select an agent to view analytics</p>
              </div>
            </ChartCard>
          )}
        </div>
      </div>

      {/* Request Distribution Chart */}
      <div className="px-6 mt-6 mb-8">
        <ChartCard
          title="Request Distribution by Agent"
          description="Visualizing API usage across AI agents"
          isLoading={breakdownLoading}
          isEmpty={!agentBreakdown?.data?.length}
        >
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="40%" height={300}>
              <PieChart>
                <Pie
                  data={agentBreakdown?.data?.slice(0, 10).map((agent, index) => ({
                    name: agent.agent_name,
                    value: agent.request_count,
                    color: COLORS[index % COLORS.length],
                  })) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {agentBreakdown?.data?.slice(0, 10).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), "Requests"]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={agentBreakdown?.data?.slice(0, 10).map((agent, index) => ({
                    name: agent.agent_name.length > 15 ? agent.agent_name.substring(0, 15) + "..." : agent.agent_name,
                    fullName: agent.agent_name,
                    requests: agent.request_count,
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
                    {agentBreakdown?.data?.slice(0, 10).map((_, index) => (
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
