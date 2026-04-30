"use client";

import React, { useState, useEffect } from "react";
import {
  useGetRealtimeMetricsQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { PageHeader, ChartCard } from "@/components/performance-analytics/shared";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface HistoricalPoint {
  time: string;
  requests: number;
  avgResponse: number;
  errors: number;
}

export default function RealtimeMonitoringPage() {
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const { data: realtime, isLoading, refetch } = useGetRealtimeMetricsQuery(undefined, {
    pollingInterval: isAutoRefresh ? 5000 : undefined, // Poll every 5 seconds
  });

  // Update historical data when new data arrives
  useEffect(() => {
    if (realtime) {
      const newPoint: HistoricalPoint = {
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        requests: realtime.stats.request_count,
        avgResponse: realtime.stats.avg_response_time_ms,
        errors: realtime.stats.error_count,
      };

      setHistoricalData(prev => {
        const updated = [...prev, newPoint];
        // Keep only last 60 data points (5 minutes at 5 second intervals)
        return updated.slice(-60);
      });
    }
  }, [realtime?.timestamp]);

  const getStatusColor = (status: number) => {
    if (status < 300) return "bg-green-100 text-green-700";
    if (status < 400) return "bg-blue-100 text-blue-700";
    if (status < 500) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-500";
      case "POST": return "bg-blue-500";
      case "PUT": return "bg-yellow-500";
      case "PATCH": return "bg-purple-500";
      case "DELETE": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getHealthStatusInfo = (status: string | undefined) => {
    switch (status) {
      case "healthy":
        return {
          label: "All Systems Operational",
          description: "All services are running normally with optimal performance",
          bgClass: "bg-gradient-to-r from-green-500 to-emerald-600",
          icon: "✓",
        };
      case "degraded":
        return {
          label: "Performance Degraded",
          description: "Some services are experiencing higher than normal latency",
          bgClass: "bg-gradient-to-r from-yellow-500 to-orange-500",
          icon: "⚠",
        };
      case "critical":
        return {
          label: "System Issues Detected",
          description: "Critical issues affecting service availability",
          bgClass: "bg-gradient-to-r from-red-500 to-rose-600",
          icon: "✕",
        };
      default:
        return {
          label: "Checking Status...",
          description: "Waiting for system status",
          bgClass: "bg-gradient-to-r from-gray-500 to-gray-600",
          icon: "...",
        };
    }
  };

  const healthInfo = getHealthStatusInfo(realtime?.health_status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Real-time Monitoring"
        description="Live view of your system's performance metrics and recent API activity"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Performance Analytics", href: "/dashboard/performance-analytics" },
          { label: "Real-time Monitor" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isAutoRefresh}
                onChange={(e) => setIsAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Auto-refresh (5s)
            </label>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Now
            </button>
          </div>
        }
      />

      {/* System Health Banner */}
      <div className="mx-6 mt-6">
        <div className={`rounded-xl p-6 shadow-lg ${healthInfo.bgClass}`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-white animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-white animate-ping"></div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{healthInfo.icon}</span>
                  <h2 className="text-2xl font-bold">{healthInfo.label}</h2>
                </div>
                <p className="text-white/80 mt-1">{healthInfo.description}</p>
                <p className="text-white/60 text-sm mt-2">
                  Last updated: {realtime?.timestamp ? new Date(realtime.timestamp).toLocaleString() : "Loading..."}
                </p>
              </div>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center bg-white/10 rounded-xl p-4 min-w-[120px]">
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Active Users</p>
                <p className="text-3xl font-bold">{realtime?.stats?.active_users || 0}</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl p-4 min-w-[120px]">
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Organizations</p>
                <p className="text-3xl font-bold">{realtime?.stats?.active_organizations || 0}</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl p-4 min-w-[120px]">
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Requests/Min</p>
                <p className="text-3xl font-bold">{realtime?.stats?.requests_per_minute?.toFixed(1) || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Metrics Cards */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Requests (Last 5 min)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {realtime?.stats?.request_count?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {realtime?.stats?.requests_per_minute?.toFixed(1) || 0} per minute
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h2v8zm4 0h-2V7h2v10zm-8 0H6v-5h2v5z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {realtime?.stats?.avg_response_time_ms?.toFixed(0) || 0}
                  <span className="text-lg font-normal text-gray-400">ms</span>
                </p>
                <div className={`text-xs mt-1 ${
                  (realtime?.stats?.avg_response_time_ms || 0) < 100 ? "text-green-500" :
                  (realtime?.stats?.avg_response_time_ms || 0) < 500 ? "text-yellow-500" : "text-red-500"
                }`}>
                  {(realtime?.stats?.avg_response_time_ms || 0) < 100 ? "Excellent" :
                   (realtime?.stats?.avg_response_time_ms || 0) < 500 ? "Good" : "Slow"}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Errors (Last 5 min)</p>
                <p className={`text-3xl font-bold mt-1 ${
                  (realtime?.stats?.error_count || 0) === 0 ? "text-green-600" :
                  (realtime?.stats?.error_count || 0) < 5 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {realtime?.stats?.error_count || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {realtime?.stats?.request_count && realtime.stats.request_count > 0
                    ? ((realtime.stats.error_count / realtime.stats.request_count) * 100).toFixed(2)
                    : 0}% error rate
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Throughput</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {realtime?.stats?.requests_per_minute?.toFixed(1) || 0}
                  <span className="text-lg font-normal text-gray-400">/min</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ~{((realtime?.stats?.requests_per_minute || 0) * 60).toFixed(0)} per hour
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Charts */}
      <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume Chart */}
        <ChartCard
          title="Request Volume (Live)"
          description="Real-time request count over time"
          isEmpty={historicalData.length === 0}
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="requests" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorRequests)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Response Time Chart */}
        <ChartCard
          title="Response Time (Live)"
          description="Real-time average response time"
          isEmpty={historicalData.length === 0}
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                formatter={(value: number) => [`${value.toFixed(1)}ms`, "Avg Response"]}
              />
              <Line type="monotone" dataKey="avgResponse" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Requests Table */}
      <div className="px-6 mt-6 mb-8">
        <ChartCard
          title="Recent API Requests"
          description="Live feed of the most recent API calls across your system"
          isEmpty={!realtime?.recent_requests?.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Response Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {realtime?.recent_requests?.map((request, index) => (
                  <tr key={request.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(request.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold text-white ${getMethodColor(request.method)}`}>
                        {request.method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-700 truncate block max-w-xs">
                        {request.endpoint}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status_code)}`}>
                        {request.status_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${
                        request.response_time_ms < 100 ? "text-green-600" :
                        request.response_time_ms < 500 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {request.response_time_ms.toFixed(0)}ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[150px]">
                      {request.organization_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[150px]">
                      {request.agent_name || "-"}
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
