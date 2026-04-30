"use client";

import React from "react";
import { RealtimeMetrics as RealtimeMetricsType } from "@/features/performanceAnalytics/performanceAnalyticsApi";

interface RealtimeMetricsProps {
  data: RealtimeMetricsType | undefined;
  isLoading: boolean;
}

export function RealtimeMetrics({ data, isLoading }: RealtimeMetricsProps) {
  if (isLoading) {
    return (
      <div className="mb-6 bg-gradient-to-r from-primary-purple to-purple-600 rounded-xl p-4 shadow-lg">
        <div className="animate-pulse flex items-center justify-between">
          <div className="h-6 bg-white/20 rounded w-48"></div>
          <div className="flex gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 w-24 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const lastUpdated = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString()
    : "--";

  return (
    <div className="mb-6 bg-gradient-to-r from-primary-purple via-purple-600 to-indigo-600 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <div>
            <h3 className="text-white font-semibold">Real-time Monitoring</h3>
            <p className="text-purple-200 text-sm">
              Last 5 minutes • Updated {lastUpdated}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-purple-200 text-xs uppercase tracking-wider mb-1">
              Requests
            </p>
            <p className="text-2xl font-bold text-white">
              {stats?.request_count?.toLocaleString() || 0}
            </p>
          </div>

          <div className="h-10 w-px bg-purple-400/30"></div>

          <div className="text-center">
            <p className="text-purple-200 text-xs uppercase tracking-wider mb-1">
              Avg Response
            </p>
            <p className="text-2xl font-bold text-white">
              {stats?.avg_response_time_ms?.toFixed(0) || 0}
              <span className="text-sm font-normal ml-1">ms</span>
            </p>
          </div>

          <div className="h-10 w-px bg-purple-400/30"></div>

          <div className="text-center">
            <p className="text-purple-200 text-xs uppercase tracking-wider mb-1">
              Errors
            </p>
            <p
              className={`text-2xl font-bold ${
                (stats?.error_count || 0) > 0 ? "text-red-300" : "text-green-300"
              }`}
            >
              {stats?.error_count || 0}
            </p>
          </div>

          <div className="h-10 w-px bg-purple-400/30"></div>

          <div className="text-center">
            <p className="text-purple-200 text-xs uppercase tracking-wider mb-1">
              Req/Min
            </p>
            <p className="text-2xl font-bold text-white">
              {stats?.requests_per_minute?.toFixed(1) || 0}
            </p>
          </div>
        </div>

        {/* Recent Requests Indicator */}
        <div className="flex items-center gap-2">
          {data?.recent_requests?.slice(0, 5).map((req, index) => (
            <div
              key={index}
              className={`w-2 h-6 rounded-full transition-all ${
                req.status_code < 400
                  ? "bg-green-400"
                  : req.status_code < 500
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
              style={{
                height: `${Math.min(
                  Math.max(req.response_time_ms / 50, 10),
                  40
                )}px`,
              }}
              title={`${req.endpoint} - ${req.response_time_ms.toFixed(0)}ms`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
