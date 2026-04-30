"use client";

import React from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  children,
  actions,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available for this period",
  emptyIcon,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footer,
}: ChartCardProps) {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
        <div className={`px-6 py-4 border-b border-gray-100 ${headerClassName}`}>
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
            {description && <div className="h-3 bg-gray-100 rounded w-64"></div>}
          </div>
        </div>
        <div className={`p-6 ${bodyClassName}`}>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-100 ${headerClassName}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Body */}
      <div className={`p-6 ${bodyClassName}`}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            {emptyIcon || (
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <p className="text-center font-medium">{emptyMessage}</p>
            <p className="text-sm text-gray-400 mt-1">Try selecting a different time period</p>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}

// Info tooltip component for charts
export function ChartTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative inline-block">
      <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <div className="invisible group-hover:visible absolute z-50 w-64 p-3 mt-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg shadow-lg -left-28 top-full">
        {children}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
      </div>
    </div>
  );
}
