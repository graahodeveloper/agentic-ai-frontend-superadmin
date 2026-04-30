"use client";

import React, { useState } from "react";
import { EndpointPerformance } from "@/features/performanceAnalytics/performanceAnalyticsApi";

interface EndpointPerformanceTableProps {
  data: EndpointPerformance[];
  isLoading: boolean;
}

type SortField =
  | "request_count"
  | "avg_response_time"
  | "max_response_time"
  | "error_rate";

export function EndpointPerformanceTable({
  data,
  isLoading,
}: EndpointPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>("request_count");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return (a[sortField] - b[sortField]) * multiplier;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-700";
      case "POST":
        return "bg-blue-100 text-blue-700";
      case "PUT":
        return "bg-amber-100 text-amber-700";
      case "PATCH":
        return "bg-purple-100 text-purple-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return "text-green-600";
    if (time < 500) return "text-amber-600";
    return "text-red-600";
  };

  const getErrorRateColor = (rate: number) => {
    if (rate < 1) return "text-green-600";
    if (rate < 5) return "text-amber-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Endpoint Performance
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Top endpoints sorted by {sortField.replace("_", " ")}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Endpoint
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("request_count")}
              >
                <div className="flex items-center justify-end gap-1">
                  Requests
                  {sortField === "request_count" && (
                    <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("avg_response_time")}
              >
                <div className="flex items-center justify-end gap-1">
                  Avg Response
                  {sortField === "avg_response_time" && (
                    <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("max_response_time")}
              >
                <div className="flex items-center justify-end gap-1">
                  Max Response
                  {sortField === "max_response_time" && (
                    <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("error_rate")}
              >
                <div className="flex items-center justify-end gap-1">
                  Error Rate
                  {sortField === "error_rate" && (
                    <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Avg Queries
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((endpoint, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getMethodColor(
                        endpoint.method
                      )}`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="text-sm font-mono text-gray-700 truncate max-w-md">
                      {endpoint.path}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-gray-900">
                    {endpoint.request_count.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-semibold ${getResponseTimeColor(
                      endpoint.avg_response_time
                    )}`}
                  >
                    {endpoint.avg_response_time.toFixed(1)}ms
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-semibold ${getResponseTimeColor(
                      endpoint.max_response_time
                    )}`}
                  >
                    {endpoint.max_response_time.toFixed(1)}ms
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-semibold ${getErrorRateColor(
                      endpoint.error_rate
                    )}`}
                  >
                    {endpoint.error_rate.toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-600">
                    {endpoint.avg_query_count.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <p>No endpoint data available for this period.</p>
        </div>
      )}
    </div>
  );
}
