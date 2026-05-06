"use client";

import React from "react";
import {
  useGetOrganizationsListQuery,
  useGetAgentsListQuery,
} from "@/features/performanceAnalytics/performanceAnalyticsApi";

type Period = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

interface FilterBarProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  organizationId?: string;
  onOrganizationChange?: (orgId: string | undefined) => void;
  agentId?: string;
  onAgentChange?: (agentId: string | undefined) => void;
  showOrganizationFilter?: boolean;
  showAgentFilter?: boolean;
  showRefresh?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
  // Super admin API calls toggle
  includeSuperAdmin?: boolean;
  onIncludeSuperAdminChange?: (include: boolean) => void;
  showSuperAdminToggle?: boolean;
}

const periodOptions: { value: Period; label: string; description: string }[] = [
  { value: "1h", label: "1 Hour", description: "Last 1 hour" },
  { value: "6h", label: "6 Hours", description: "Last 6 hours" },
  { value: "24h", label: "24 Hours", description: "Last 24 hours" },
  { value: "7d", label: "7 Days", description: "Last 7 days" },
  { value: "30d", label: "30 Days", description: "Last 30 days" },
  { value: "90d", label: "90 Days", description: "Last 90 days" },
];

export function FilterBar({
  period,
  onPeriodChange,
  organizationId,
  onOrganizationChange,
  agentId,
  onAgentChange,
  showOrganizationFilter = false,
  showAgentFilter = false,
  showRefresh = true,
  onRefresh,
  isLoading = false,
  className = "",
  includeSuperAdmin = false,
  onIncludeSuperAdminChange,
  showSuperAdminToggle = true,
}: FilterBarProps) {
  const { data: orgsData, isLoading: orgsLoading } = useGetOrganizationsListQuery(
    { include_super_admin: includeSuperAdmin },
    { skip: !showOrganizationFilter }
  );

  // Only show agents when an organization is selected (hierarchical filtering)
  const { data: agentsData, isLoading: agentsLoading } = useGetAgentsListQuery(
    { organization_id: organizationId, include_super_admin: includeSuperAdmin },
    { skip: !showAgentFilter || !organizationId }
  );

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Period Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Time Period
          </label>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onPeriodChange(option.value)}
                title={option.description}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  period === option.value
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Organization Filter */}
        {showOrganizationFilter && onOrganizationChange && (
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Organization
            </label>
            <select
              value={organizationId || ""}
              onChange={(e) => {
                onOrganizationChange(e.target.value || undefined);
                // Reset agent when org changes
                if (onAgentChange) onAgentChange(undefined);
              }}
              disabled={orgsLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">All Organizations</option>
              {orgsData?.data.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.request_count.toLocaleString()} requests)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Agent Filter - Only enabled when organization is selected */}
        {showAgentFilter && onAgentChange && (
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Agent
            </label>
            <select
              value={agentId || ""}
              onChange={(e) => onAgentChange(e.target.value || undefined)}
              disabled={agentsLoading || !organizationId}
              title={!organizationId ? "Select an organization first" : ""}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="">{organizationId ? "All Agents" : "Select org first..."}</option>
              {agentsData?.data.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Include Super Admin Toggle */}
        {showSuperAdminToggle && onIncludeSuperAdminChange && (
          <div className="min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Data Scope
            </label>
            <button
              onClick={() => onIncludeSuperAdminChange(!includeSuperAdmin)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                includeSuperAdmin
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                {includeSuperAdmin ? "All Data" : "User/Org Only"}
              </span>
              <div className={`w-8 h-4 rounded-full transition-colors flex items-center ${
                includeSuperAdmin ? "bg-purple-500 justify-end" : "bg-gray-300 justify-start"
              }`}>
                <div className="w-3 h-3 bg-white rounded-full mx-0.5 shadow-sm"></div>
              </div>
            </button>
          </div>
        )}

        {/* Refresh Button */}
        {showRefresh && onRefresh && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 invisible">
              Action
            </label>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(organizationId || agentId || includeSuperAdmin) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">Active filters:</span>
            {includeSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                Incl. Super Admin
                <button
                  onClick={() => onIncludeSuperAdminChange?.(false)}
                  className="ml-1 hover:text-amber-900"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {organizationId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.707.707L10 12.414l-4.293 4.293A1 1 0 014 16V4z" clipRule="evenodd" />
                </svg>
                Org: {orgsData?.data.find(o => o.id === organizationId)?.name || organizationId}
                <button
                  onClick={() => {
                    onOrganizationChange?.(undefined);
                    onAgentChange?.(undefined);
                  }}
                  className="ml-1 hover:text-purple-900"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {agentId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                Agent: {agentsData?.data.find(a => a.id === agentId)?.name || agentId}
                <button
                  onClick={() => onAgentChange?.(undefined)}
                  className="ml-1 hover:text-blue-900"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
