"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import { QueryPerformancePoint } from "@/features/performanceAnalytics/performanceAnalyticsApi";

interface QueryPerformanceChartProps {
  data: QueryPerformancePoint[];
  isLoading: boolean;
  period: string;
}

function formatTimestamp(timestamp: string, period: string): string {
  const date = new Date(timestamp);
  if (period === "24h") {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function QueryPerformanceChart({
  data,
  isLoading,
  period,
}: QueryPerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    time: formatTimestamp(point.timestamp, period),
  }));

  // Calculate summary stats
  const totalQueries = data.reduce((sum, p) => sum + p.total_queries, 0);
  const avgQueryCount =
    data.length > 0
      ? data.reduce((sum, p) => sum + p.avg_query_count, 0) / data.length
      : 0;
  const avgQueryTime =
    data.length > 0
      ? data.reduce((sum, p) => sum + p.avg_query_time, 0) / data.length
      : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Database Query Performance
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Query count and execution time trends
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Total Queries</p>
            <p className="text-lg font-bold text-purple-600">
              {totalQueries.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Avg Count/Req</p>
            <p className="text-lg font-bold text-blue-600">
              {avgQueryCount.toFixed(1)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Avg Query Time</p>
            <p className="text-lg font-bold text-teal-600">
              {avgQueryTime.toFixed(1)}ms
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            label={{
              value: "Query Count",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "#6B7280", fontSize: 12 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={(value) => `${value}ms`}
            label={{
              value: "Query Time (ms)",
              angle: 90,
              position: "insideRight",
              style: { textAnchor: "middle", fill: "#6B7280", fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number, name: string) => {
              if (name === "avg_query_count")
                return [value.toFixed(2), "Avg Queries/Request"];
              if (name === "max_query_count")
                return [value, "Max Queries/Request"];
              if (name === "avg_query_time")
                return [`${value.toFixed(2)}ms`, "Avg Query Time"];
              return [value, name];
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="avg_query_count"
            fill="#8B5CF6"
            opacity={0.8}
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avg_query_time"
            stroke="#14B8A6"
            strokeWidth={2}
            dot={{ fill: "#14B8A6", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500 opacity-80"></div>
          <span className="text-gray-600">Avg Queries per Request</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded bg-teal-500"></div>
          <span className="text-gray-600">Avg Query Time</span>
        </div>
      </div>
    </div>
  );
}
