"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { StatusDistribution } from "@/features/performanceAnalytics/performanceAnalyticsApi";

interface StatusDistributionChartProps {
  data: StatusDistribution | undefined;
  isLoading: boolean;
}

const COLORS = {
  "2xx": "#10B981", // green
  "3xx": "#3B82F6", // blue
  "4xx": "#F59E0B", // yellow/amber
  "5xx": "#EF4444", // red
};

export function StatusDistributionChart({
  data,
  isLoading,
}: StatusDistributionChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-full mx-auto w-64"></div>
        </div>
      </div>
    );
  }

  const chartData = data
    ? Object.entries(data.categories)
        .map(([name, value]) => ({
          name,
          value,
          color: COLORS[name as keyof typeof COLORS],
        }))
        .filter((item) => item.value > 0)
    : [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Status Code Distribution
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          HTTP response status breakdown
        </p>
      </div>

      <div className="flex items-center">
        <ResponsiveContainer width="60%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} (${((value / total) * 100).toFixed(
                  1
                )}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-3">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div>
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <p className="text-xs text-gray-500">
                    {item.name === "2xx"
                      ? "Success"
                      : item.name === "3xx"
                      ? "Redirect"
                      : item.name === "4xx"
                      ? "Client Error"
                      : "Server Error"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900">
                  {item.value.toLocaleString()}
                </span>
                <p className="text-xs text-gray-500">
                  {((item.value / total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Status Codes */}
      {data?.detailed && data.detailed.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-3">
            Detailed Breakdown
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.detailed.slice(0, 8).map((item) => (
              <div
                key={item.status_code}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  item.status_code < 300
                    ? "bg-green-100 text-green-700"
                    : item.status_code < 400
                    ? "bg-blue-100 text-blue-700"
                    : item.status_code < 500
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {item.status_code}: {item.count.toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
