"use client";

import React, { useState } from "react";
import {
  useGetPerformanceOverviewQuery,
  useGetResponseTimeTrendQuery,
  useGetEndpointPerformanceQuery,
  useGetStatusDistributionQuery,
  useGetSlowRequestsQuery,
  useGetOrganizationBreakdownQuery,
  useGetAgentBreakdownQuery,
  useGetQueryPerformanceQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";
import { StatsCards } from "./StatsCards";
import { ResponseTimeChart } from "./ResponseTimeChart";
import { StatusDistributionChart } from "./StatusDistributionChart";
import { EndpointPerformanceTable } from "./EndpointPerformanceTable";
import { SlowRequestsTable } from "./SlowRequestsTable";
import { QueryPerformanceChart } from "./QueryPerformanceChart";
import { OrganizationBreakdownChart } from "./OrganizationBreakdownChart";

type Period = "24h" | "7d" | "30d" | "90d";

export function PerformanceAnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>("7d");
  const [activeTab, setActiveTab] = useState<
    "overview" | "endpoints" | "slow" | "breakdown"
  >("overview");

  const { data: overview, isLoading: overviewLoading } =
    useGetPerformanceOverviewQuery({ period });
  const { data: responseTrend, isLoading: trendLoading } =
    useGetResponseTimeTrendQuery({ period });
  const { data: statusDist, isLoading: statusLoading } =
    useGetStatusDistributionQuery({ period });
  const { data: endpoints, isLoading: endpointsLoading } =
    useGetEndpointPerformanceQuery({ period, limit: 10 });
  const { data: slowRequests, isLoading: slowLoading } =
    useGetSlowRequestsQuery({ period, threshold: 1000, limit: 20 });
  const { data: orgBreakdown, isLoading: orgLoading } =
    useGetOrganizationBreakdownQuery({ period, limit: 10 });
  const { data: agentBreakdown, isLoading: agentLoading } =
    useGetAgentBreakdownQuery({ period, limit: 10 });
  const { data: queryPerf, isLoading: queryLoading } =
    useGetQueryPerformanceQuery({ period });

  const periodOptions: { value: Period; label: string }[] = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "endpoints", label: "Endpoints", icon: "🔗" },
    { id: "slow", label: "Slow Requests", icon: "🐌" },
    { id: "breakdown", label: "Breakdown", icon: "📈" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Performance Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor API performance, response times, and system health
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Period:</span>
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    period === option.value
                      ? "bg-primary-purple text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards data={overview} isLoading={overviewLoading} />

      {/* Tab Navigation */}
      <div className="mt-6 mb-4">
        <div className="flex bg-white rounded-lg border border-gray-200 p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-5 py-2.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-primary-purple text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time Trend */}
          <div className="lg:col-span-2">
            <ResponseTimeChart
              data={responseTrend?.data || []}
              isLoading={trendLoading}
              period={period}
            />
          </div>

          {/* Status Distribution */}
          <StatusDistributionChart
            data={statusDist}
            isLoading={statusLoading}
          />

          {/* Query Performance */}
          <QueryPerformanceChart
            data={queryPerf?.data || []}
            isLoading={queryLoading}
            period={period}
          />
        </div>
      )}

      {activeTab === "endpoints" && (
        <EndpointPerformanceTable
          data={endpoints?.data || []}
          isLoading={endpointsLoading}
        />
      )}

      {activeTab === "slow" && (
        <SlowRequestsTable
          data={slowRequests?.data || []}
          isLoading={slowLoading}
          threshold={slowRequests?.threshold_ms || 1000}
        />
      )}

      {activeTab === "breakdown" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrganizationBreakdownChart
            data={orgBreakdown?.data || []}
            isLoading={orgLoading}
            title="Performance by Organization"
          />
          <OrganizationBreakdownChart
            data={
              agentBreakdown?.data.map((a) => ({
                organization_id: a.agent_id,
                organization_name: a.agent_name,
                request_count: a.request_count,
                avg_response_time: a.avg_response_time,
                error_rate: a.error_rate,
              })) || []
            }
            isLoading={agentLoading}
            title="Performance by Agent"
          />
        </div>
      )}
    </div>
  );
}
