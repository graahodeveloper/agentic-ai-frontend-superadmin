"use client";

import React from "react";
import { PerformanceOverview } from "@/features/performanceAnalytics/performanceAnalyticsApi";

interface StatsCardsProps {
  data: PerformanceOverview | undefined;
  isLoading: boolean;
}

function StatCard({
  title,
  value,
  change,
  suffix,
  icon,
  color,
  isLoading,
}: {
  title: string;
  value: string | number;
  change?: number;
  suffix?: string;
  icon: string;
  color: "blue" | "green" | "red" | "purple" | "orange" | "teal";
  isLoading: boolean;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
  };

  const iconBgClasses = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    red: "bg-red-100",
    purple: "bg-purple-100",
    orange: "bg-orange-100",
    teal: "bg-teal-100",
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {suffix && <span className="text-base font-medium ml-1 text-gray-700">{suffix}</span>}
          </p>
          {change !== undefined && (
            <div
              className={`flex items-center mt-2 text-sm ${
                change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <span className="mr-1">{change >= 0 ? "↑" : "↓"}</span>
              <span className="font-medium">{Math.abs(change)}%</span>
              <span className="text-gray-600 ml-1">vs previous period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <StatCard
        title="Total Requests"
        value={data?.total_requests?.toLocaleString() || "0"}
        change={data?.total_requests_change}
        icon="📊"
        color="blue"
        isLoading={isLoading}
      />
      <StatCard
        title="Avg Response Time"
        value={data?.avg_response_time_ms?.toFixed(1) || "0"}
        suffix="ms"
        change={data?.avg_response_time_change}
        icon="⚡"
        color="green"
        isLoading={isLoading}
      />
      <StatCard
        title="Error Rate"
        value={data?.error_rate?.toFixed(2) || "0"}
        suffix="%"
        change={data?.error_rate_change}
        icon="⚠️"
        color="red"
        isLoading={isLoading}
      />
      <StatCard
        title="Total Queries"
        value={data?.total_queries?.toLocaleString() || "0"}
        icon="🗄️"
        color="purple"
        isLoading={isLoading}
      />
      <StatCard
        title="Avg Query Time"
        value={data?.avg_query_time_ms?.toFixed(1) || "0"}
        suffix="ms"
        icon="⏱️"
        color="teal"
        isLoading={isLoading}
      />
      <StatCard
        title="Slow Requests"
        value={data?.slow_requests?.toLocaleString() || "0"}
        icon="🐌"
        color="orange"
        isLoading={isLoading}
      />
    </div>
  );
}
