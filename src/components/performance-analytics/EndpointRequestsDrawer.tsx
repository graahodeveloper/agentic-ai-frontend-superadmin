"use client";
import React, { useState, useEffect } from "react";
import { useGetEndpointRequestsQuery } from "@/features/performanceAnalytics/performanceAnalyticsApi";

type SortBy = "query_count" | "response_time" | "timestamp" | "query_time";

interface Props {
  open: boolean;
  onClose: () => void;
  path: string;
  method: string;
  period: "1h" | "6h" | "24h" | "7d" | "30d" | "90d";
  organizationId?: string;
  agentId?: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 border-emerald-200",
  POST: "bg-blue-100 text-blue-700 border-blue-200",
  PUT: "bg-amber-100 text-amber-700 border-amber-200",
  PATCH: "bg-purple-100 text-purple-700 border-purple-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_COLOR = (s: number) =>
  s < 300 ? "bg-emerald-100 text-emerald-700" :
  s < 400 ? "bg-blue-100 text-blue-700" :
  s < 500 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

const PAGE_SIZE = 20;

function PaginationBar({
  current, total, fetching, onChange,
}: { current: number; total: number; fetching: boolean; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1)
    .filter(p => p === 1 || p === total || Math.abs(p - current) <= 1)
    .reduce((acc: (number | "...")[], p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1 || fetching}
        className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">‹</button>
      {pages.map((item, idx) =>
        item === "..." ? <span key={`e${idx}`} className="w-7 text-center text-gray-400 text-sm">…</span> :
        <button key={item} onClick={() => onChange(item as number)} disabled={fetching}
          className={`w-7 h-7 text-sm font-medium rounded-lg transition-all ${current === item ? "bg-purple-600 text-white ring-2 ring-purple-200" : "border border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-700"}`}>
          {item}
        </button>
      )}
      <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total || fetching}
        className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">›</button>
    </div>
  );
}

export default function EndpointRequestsDrawer({ open, onClose, path, method, period, organizationId, agentId }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>("query_count");
  const [page, setPage] = useState(1);

  // Reset on open
  useEffect(() => { if (open) { setSortBy("query_count"); setPage(1); } }, [open, path, method]);

  const { data, isLoading, isFetching } = useGetEndpointRequestsQuery(
    { path, method, period, organization_id: organizationId, agent_id: agentId, sort_by: sortBy, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
    { skip: !open || !path }
  );

  const stats = data?.stats;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const SortButton = ({ field, label }: { field: SortBy; label: string }) => (
    <button onClick={() => { setSortBy(field); setPage(1); }}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${sortBy === field ? "bg-purple-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
      {label}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 text-xs font-bold rounded border ${METHOD_COLORS[method] || "bg-gray-100 text-gray-700 border-gray-200"}`}>{method}</span>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest">Request Logs</span>
            </div>
            <p className="text-sm font-mono text-gray-800 truncate font-semibold">{path}</p>
            <p className="text-xs text-gray-500 mt-1">{data?.total ?? 0} total requests in period</p>
          </div>
          <button onClick={onClose} className="ml-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Stats strip */}
        {stats && (
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 flex-shrink-0">
            {[
              { label: "Avg Queries", value: stats.avg_query_count, color: stats.avg_query_count > 10 ? "text-red-600" : stats.avg_query_count > 5 ? "text-amber-600" : "text-emerald-600" },
              { label: "Max Queries", value: stats.max_query_count, color: "text-gray-900" },
              { label: "Avg Response", value: `${stats.avg_response_time_ms.toFixed(0)}ms`, color: "text-gray-900" },
              { label: "Error Rate", value: `${stats.total_requests > 0 ? ((stats.error_count / stats.total_requests) * 100).toFixed(1) : 0}%`, color: stats.error_count > 0 ? "text-red-600" : "text-emerald-600" },
            ].map(s => (
              <div key={s.label} className="px-4 py-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Sort controls */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-500 mr-1">Sort by:</span>
          <SortButton field="query_count" label="Most Queries" />
          <SortButton field="response_time" label="Slowest" />
          <SortButton field="query_time" label="Query Time" />
          <SortButton field="timestamp" label="Latest" />
          {isFetching && (
            <svg className="w-4 h-4 animate-spin text-purple-500 ml-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto relative">
          {(isLoading || (isFetching && !isLoading)) && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="flex items-center gap-3 bg-white border border-gray-200 shadow-md rounded-xl px-5 py-3">
                <svg className="w-5 h-5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Loading...</span>
              </div>
            </div>
          )}

          {!isLoading && !data?.data?.length && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <p className="text-sm">No request logs found</p>
            </div>
          )}

          {data?.data && data.data.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Queries</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Q. Time</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Response</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((req, idx) => {
                  const rank = (page - 1) * PAGE_SIZE + idx + 1;
                  const qHigh = req.query_count > 10;
                  const qMed = req.query_count > 5;
                  return (
                    <tr key={req.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-400 mr-2">{rank}.</span>
                        <div className="inline-block">
                          <div className="text-sm text-gray-800">{new Date(req.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                          <div className="text-xs text-gray-400">{new Date(req.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold text-sm ${qHigh ? "text-red-600" : qMed ? "text-amber-600" : "text-emerald-600"}`}>{req.query_count}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{req.query_time_ms.toFixed(1)}ms</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{req.response_time_ms.toFixed(0)}ms</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR(req.status_code)}`}>{req.status_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {req.organization_name && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{req.organization_name}</span>}
                          {req.agent_name && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">{req.agent_name}</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <p className="text-xs text-gray-500">
              Showing <span className="font-medium text-gray-700">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data?.total ?? 0)}</span> of <span className="font-medium text-gray-700">{data?.total ?? 0}</span>
            </p>
            <PaginationBar current={page} total={totalPages} fetching={isFetching} onChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}
