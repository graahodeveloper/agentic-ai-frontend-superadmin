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
  Cell,
} from "recharts";
// Simplified interface for chart data - works for both Organization and Agent breakdown
interface BreakdownItem {
  organization_id: string;
  organization_name: string;
  request_count: number;
  avg_response_time: number;
  error_rate: number;
}

interface OrganizationBreakdownChartProps {
  data: BreakdownItem[];
  isLoading: boolean;
  title: string;
}

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#84CC16",
];

export function OrganizationBreakdownChart({
  data,
  isLoading,
  title,
}: OrganizationBreakdownChartProps) {
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

  const chartData = data.map((item, index) => ({
    ...item,
    name:
      item.organization_name.length > 15
        ? item.organization_name.substring(0, 15) + "..."
        : item.organization_name,
    fullName: item.organization_name,
    color: COLORS[index % COLORS.length],
  }));

  // Calculate totals
  const totalRequests = data.reduce((sum, d) => sum + d.request_count, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Request distribution and performance metrics
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase">Total Requests</p>
          <p className="text-xl font-bold text-primary-purple">
            {totalRequests.toLocaleString()}
          </p>
        </div>
      </div>

      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: number) => [
                  value.toLocaleString(),
                  "Requests",
                ]}
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.fullName || label
                }
              />
              <Bar
                dataKey="request_count"
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Detailed Stats */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {data.map((item, index) => (
                <div
                  key={item.organization_id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                      {item.organization_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {item.request_count.toLocaleString()}
                      </span>
                      <span className="text-gray-500 ml-1">req</span>
                    </div>
                    <div className="text-right w-20">
                      <span className="font-semibold text-blue-600">
                        {item.avg_response_time.toFixed(0)}
                      </span>
                      <span className="text-gray-500 ml-1">ms</span>
                    </div>
                    <div
                      className={`text-right w-16 font-semibold ${
                        item.error_rate < 1
                          ? "text-green-600"
                          : item.error_rate < 5
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.error_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <p>No data available for this period</p>
          </div>
        </div>
      )}
    </div>
  );
}
