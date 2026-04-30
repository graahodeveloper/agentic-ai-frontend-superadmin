"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "purple" | "orange" | "teal" | "indigo" | "pink";
  description?: string;
  isLoading?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    iconBg: "bg-blue-100",
    gradient: "from-blue-500 to-blue-600",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-600",
    iconBg: "bg-green-100",
    gradient: "from-green-500 to-green-600",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    iconBg: "bg-red-100",
    gradient: "from-red-500 to-red-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-600",
    iconBg: "bg-purple-100",
    gradient: "from-purple-500 to-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-600",
    iconBg: "bg-orange-100",
    gradient: "from-orange-500 to-orange-600",
  },
  teal: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-600",
    iconBg: "bg-teal-100",
    gradient: "from-teal-500 to-teal-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-600",
    iconBg: "bg-indigo-100",
    gradient: "from-indigo-500 to-indigo-600",
  },
  pink: {
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-600",
    iconBg: "bg-pink-100",
    gradient: "from-pink-500 to-pink-600",
  },
};

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs previous period",
  suffix,
  prefix,
  icon,
  color,
  description,
  isLoading = false,
  onClick,
  size = "md",
}: StatCardProps) {
  const colors = colorClasses[color];
  const sizeClasses = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };
  const valueSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 ${sizeClasses[size]} shadow-sm`}>
        <div className="animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border ${colors.border} ${sizeClasses[size]} shadow-sm hover:shadow-md transition-all ${
        onClick ? "cursor-pointer hover:scale-[1.02]" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <p className={`${valueSizeClasses[size]} font-bold text-gray-900 truncate`}>
            {prefix && <span className="text-lg font-normal">{prefix}</span>}
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix && <span className="text-base font-normal ml-1 text-gray-500">{suffix}</span>}
          </p>

          {change !== undefined && (
            <div className="flex items-center mt-2 text-sm">
              <span
                className={`inline-flex items-center ${
                  change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-500"
                }`}
              >
                {change > 0 ? (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : change < 0 ? (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-1.5">{changeLabel}</span>
            </div>
          )}

          {description && (
            <p className="text-xs text-gray-400 mt-2 truncate">{description}</p>
          )}
        </div>

        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} text-white shadow-lg flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Skeleton loading state
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
