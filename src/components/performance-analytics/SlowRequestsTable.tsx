"use client";

import React from "react";
import { SlowRequest } from "@/features/performanceAnalytics/performanceAnalyticsApi";

interface SlowRequestsTableProps {
  data: SlowRequest[];
  isLoading: boolean;
  threshold: number;
}

export function SlowRequestsTable({
  data,
  isLoading,
  threshold,
}: SlowRequestsTableProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode < 300) return "bg-green-100 text-green-700";
    if (statusCode < 400) return "bg-blue-100 text-blue-700";
    if (statusCode < 500) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getResponseTimeBar = (time: number, maxTime: number) => {
    const percentage = Math.min((time / maxTime) * 100, 100);
    let color = "bg-amber-400";
    if (time > threshold * 2) color = "bg-red-500";
    else if (time > threshold * 1.5) color = "bg-orange-500";
    return { percentage, color };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const maxResponseTime = Math.max(...data.map((r) => r.response_time_ms), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Slow Requests
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Requests exceeding {threshold}ms threshold
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-3 h-3 rounded bg-amber-400"></span>
            <span>&gt; {threshold}ms</span>
            <span className="ml-2 w-3 h-3 rounded bg-orange-500"></span>
            <span>&gt; {threshold * 1.5}ms</span>
            <span className="ml-2 w-3 h-3 rounded bg-red-500"></span>
            <span>&gt; {threshold * 2}ms</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Endpoint
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Queries
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Query Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Context
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((request) => {
              const { percentage, color } = getResponseTimeBar(
                request.response_time_ms,
                maxResponseTime
              );
              return (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(request.timestamp)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-700 truncate block max-w-xs">
                      {request.endpoint}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-gray-900 whitespace-nowrap">
                        {request.response_time_ms.toFixed(0)}ms
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                        request.status_code
                      )}`}
                    >
                      {request.status_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-600">
                      {request.query_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-600">
                      {request.query_time_ms.toFixed(1)}ms
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {request.user_id && (
                        <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">
                          User
                        </span>
                      )}
                      {request.organization_id && (
                        <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-600 rounded">
                          Org
                        </span>
                      )}
                      {request.agent_id && (
                        <span className="px-2 py-0.5 text-xs bg-teal-50 text-teal-600 rounded">
                          Agent
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-600 font-medium">No slow requests found!</p>
          <p className="text-sm text-gray-500 mt-1">
            All requests are under {threshold}ms threshold
          </p>
        </div>
      )}
    </div>
  );
}
