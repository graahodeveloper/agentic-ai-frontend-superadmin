// components/subscription-model/plan/PlanSummary.tsx
"use client";
import React, { useState } from 'react';
import {
  useGetPlansQuery,
  useGetPlanSummaryQuery,
  PlanSummaryResponse,
} from '@/features/subscriptionModel/billing/billingApi';

// Define local interfaces that match your usage (optional - can also use imported types)
interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  base_price: string;
  billing_period: string;
  billing_mode: string;
  grace_period_days: number;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
  featured: boolean;
}

const PlanSummary = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'agents' | 'agent-details'>('overview');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Fetch all plans for dropdown
  const { data: plansResponse, isLoading: isLoadingPlans } = useGetPlansQuery({});
  const plans: Plan[] = (plansResponse?.results || []) as Plan[];

  // Fetch summary for selected plan using RTK Query
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    isFetching: isFetchingSummary,
    error: summaryError,
    refetch: refetchSummary
  } = useGetPlanSummaryQuery(selectedPlanId, {
    skip: !selectedPlanId,
  });

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Handle plan change
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    setActiveTab('overview');
    setSelectedAgentId(null);
  };

  // Handle agent selection for detailed view
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab('agent-details');
  };

  // Handle back from agent details
  const handleBackToAgents = () => {
    setSelectedAgentId(null);
    setActiveTab('agents');
  };

  // Helper function to format price with null safety
  const formatPrice = (price: string | number | null | undefined) => {
    if (price === null || price === undefined) return '$0.00';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  // Helper function to get component type color
  const getComponentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'compute_tokens': 'from-blue-100 to-blue-200 text-blue-800',
      'storage_gb': 'from-green-100 to-green-200 text-green-800',
      'api_calls': 'from-purple-100 to-purple-200 text-purple-800',
      'agent_instances': 'from-orange-100 to-orange-200 text-orange-800',
      'active_agents': 'from-pink-100 to-pink-200 text-pink-800',
      'custom': 'from-gray-100 to-gray-200 text-gray-800',
    };
    return colors[type] || colors['custom'];
  };

  // Handle error display
  const errorMessage = summaryError 
    ? 'data' in summaryError 
      ? JSON.stringify(summaryError.data)
      : 'error' in summaryError
        ? summaryError.error
        : 'Failed to fetch plan summary'
    : null;

  // Determine if we should show loading state
  const isLoading = isFetchingSummary && !summaryData;

  // Get selected agent data
  const selectedAgent = selectedAgentId 
    ? summaryData?.agents.items.find(agent => agent.agent_id === selectedAgentId)
    : null;

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                Plan Summary
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Comprehensive overview of plan details, components, and agents
              </p>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Plan <span className="text-red-500">*</span>
            </label>
            <div className="flex-1 relative">
              <select
                value={selectedPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white"
                disabled={isLoadingPlans || isFetchingSummary}
              >
                <option value="">-- Select a Plan --</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.plan_type}) - {formatPrice(plan.base_price)}/{plan.billing_period}
                  </option>
                ))}
              </select>
              {(isLoadingPlans || isFetchingSummary) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Error Loading Summary</h3>
                <p className="mt-2 text-gray-600">{errorMessage}</p>
                <button
                  onClick={() => refetchSummary()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {selectedPlanId && isLoading && !errorMessage && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Loading Plan Summary</h3>
              <p className="mt-2 text-gray-600 text-center">
                Fetching comprehensive details for {selectedPlan?.name}...
              </p>
            </div>
          </div>
        )}

        {/* Summary Content */}
        {selectedPlanId && !errorMessage && summaryData && (
          <>
            {/* Subtle loading indicator when refetching */}
            {isFetchingSummary && (
              <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm text-indigo-700">Updating plan data...</span>
              </div>
            )}

            {/* Plan Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">
                        {summaryData.plan.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">{summaryData.plan.name}</h2>
                      <p className="text-sm text-gray-600 mt-1">{summaryData.plan.description || 'No description available'}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {summaryData.plan.plan_type_display}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {summaryData.plan.billing_mode_display}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {summaryData.plan.billing_period_display}
                        </span>
                        {summaryData.plan.featured && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⭐ Featured
                          </span>
                        )}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${summaryData.plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {summaryData.plan.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                        {summaryData.plan.is_public && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl">
                  <div className="text-sm text-indigo-600 font-medium mb-1">Base Price</div>
                  <div className="text-2xl font-bold text-indigo-900">
                    {formatPrice(summaryData.pricing_summary.base_price)}
                  </div>
                  <div className="text-xs text-indigo-600 mt-1">per {summaryData.plan.billing_period}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                  <div className="text-sm text-green-600 font-medium mb-1">Total Value</div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatPrice(summaryData.pricing_summary.total_plan_value)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">{summaryData.pricing_summary.currency}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                  <div className="text-sm text-purple-600 font-medium mb-1">Active Subscriptions</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {summaryData.statistics.active_subscriptions}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    of {summaryData.statistics.total_subscriptions} total
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                  <div className="text-sm text-orange-600 font-medium mb-1">Inclusions</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {summaryData.statistics.total_inclusions}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    {summaryData.components.count} components, {summaryData.agents.count} agents
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Pricing Breakdown</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {summaryData.pricing_summary.currency}
                </span>
              </div>
              <div className="space-y-1">
                {/* Base Price */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <span className="text-gray-700">Base Price</span>
                    <div className="text-xs text-gray-400 mt-0.5">per {summaryData.plan.billing_period}</div>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(summaryData.pricing_summary.base_price)}
                  </span>
                </div>

                {/* Effective Base Price — only show if different from base price */}
                {summaryData.pricing_summary.effective_base_price !== summaryData.pricing_summary.base_price && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <span className="text-gray-700">Effective Base Price</span>
                      <div className="text-xs text-gray-400 mt-0.5">After plan-level discount</div>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatPrice(summaryData.pricing_summary.effective_base_price)}
                    </span>
                  </div>
                )}

                {/* Plan Discount — only show if > 0 */}
                {summaryData.pricing_summary.base_price_discount > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-green-700 font-medium">Plan Discount</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Applied</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      − {formatPrice(summaryData.pricing_summary.base_price_discount)}
                    </span>
                  </div>
                )}

                {/* Components Value — per component breakdown */}
                <div className="py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-gray-700">Components Value</span>
                      <div className="text-xs text-gray-400 mt-0.5">{summaryData.components.count} component{summaryData.components.count !== 1 ? 's' : ''} included</div>
                    </div>
                    {/* <span className="font-semibold text-gray-900">
                      {formatPrice(summaryData.pricing_summary.components_value)}
                    </span> */}
                  </div>
                  {summaryData.components.items.length > 0 && (
                    <div className="mt-2 space-y-2 pl-3 border-l-2 border-green-100">
                      {summaryData.components.items.map((component) => (
                        <div key={component.inclusion_id} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-700 font-medium truncate block">{component.component_name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {formatPrice(component.cost_per_unit)} / {component.unit_label}
                              </span>
                              {component.quantity_multiplier && component.quantity_multiplier !== 1 && (
                                <span className="text-xs text-gray-400">
                                  × {component.quantity_multiplier} multiplier
                                </span>
                              )}
                              <span className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
                                {component.component_type_display}
                              </span>
                              {component.has_promotion && (
                                <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                                  {component.discount_percentage}% off
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-green-600 ml-4 whitespace-nowrap">
                            {formatPrice(component.price_per_unit)}
                            <span className="text-xs font-normal text-gray-400 ml-1">/ {component.unit_label}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agents Value — per agent breakdown */}
                <div className="py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-gray-700">Agents Value</span>
                      <div className="text-xs text-gray-400 mt-0.5">{summaryData.agents.count} agent{summaryData.agents.count !== 1 ? 's' : ''} included</div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(summaryData.pricing_summary.agents_value)}
                    </span>
                  </div>
                  {summaryData.agents.items.length > 0 && (
                    <div className="mt-2 space-y-2 pl-3 border-l-2 border-indigo-100">
                      {summaryData.agents.items.map((agent) => (
                        <div key={agent.inclusion_id} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-700 font-medium truncate block">{agent.agent_name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {formatPrice(agent.unit_price)} × {agent.included_instances} instance{(agent.included_instances ?? 0) !== 1 ? 's' : ''}
                              </span>
                              {agent.billing_method && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                  {agent.billing_method}
                                </span>
                              )}
                              {agent.unit && (
                                <span className="text-xs text-gray-400">
                                  / {agent.unit}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-indigo-600 ml-4 whitespace-nowrap">
                            {formatPrice(agent.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Plan Value */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-700">Total Plan Value</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(summaryData.pricing_summary.total_plan_value)}
                  </span>
                </div>

                {/* Total With Discounts — final amount */}
                <div className="flex items-center justify-between py-4 bg-gradient-to-r from-indigo-50 to-purple-50 -mx-6 px-6 mt-2">
                  <div>
                    <span className="text-lg font-bold text-gray-900">Total With Discounts</span>
                    <div className="text-xs text-gray-500 mt-0.5">Final billable amount</div>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatPrice(summaryData.pricing_summary.total_with_discounts)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    setSelectedAgentId(null);
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => {
                    setActiveTab('components');
                    setSelectedAgentId(null);
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'components'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Components ({summaryData.components.count})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('agents');
                    setSelectedAgentId(null);
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'agents' || activeTab === 'agent-details'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Agents ({summaryData.agents.count})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Components Summary */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-900">Components</h4>
                          <span className="text-2xl font-bold text-indigo-600">
                            {summaryData.components.count}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Total Value</span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(summaryData.components.total_value)}
                            </span>
                          </div>
                          {summaryData.components.items.slice(0, 3).map((comp) => (
                            <div key={comp.inclusion_id} className="flex justify-between text-sm">
                              <span className="text-gray-600 truncate mr-2">{comp.component_name}</span>
                              <span className="text-gray-900 font-medium whitespace-nowrap">
                                {formatPrice(comp.cost_per_unit)}/unit
                              </span>
                            </div>
                          ))}
                          {summaryData.components.count > 3 && (
                            <div className="text-xs text-indigo-600 font-medium pt-2">
                              + {summaryData.components.count - 3} more components
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Agents Summary */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-900">Agents</h4>
                          <span className="text-2xl font-bold text-purple-600">
                            {summaryData.agents.count}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Total Value</span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(summaryData.agents.total_value)}
                            </span>
                          </div>
                          {summaryData.agents.items.slice(0, 3).map((agent) => (
                            <div key={agent.inclusion_id} className="flex justify-between text-sm">
                              <span className="text-gray-600 truncate mr-2">{agent.agent_name}</span>
                              <span className="text-gray-900 font-medium whitespace-nowrap">
                                {formatPrice(agent.total_price)}
                              </span>
                            </div>
                          ))}
                          {summaryData.agents.count > 3 && (
                            <div className="text-xs text-purple-600 font-medium pt-2">
                              + {summaryData.agents.count - 3} more agents
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Plan Metadata */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Plan Metadata</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Display Order</div>
                          <div className="text-sm font-medium text-gray-900">{summaryData.plan.display_order}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Grace Period</div>
                          <div className="text-sm font-medium text-gray-900">{summaryData.plan.grace_period_days} days</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Created</div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(summaryData.plan.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(summaryData.plan.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Components Tab */}
                {activeTab === 'components' && (
                  <div>
                    {summaryData.components.count === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No Components</h3>
                        <p className="mt-2 text-gray-600">This plan doesn't have any components yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {summaryData.components.items.map((component) => (
                          <div
                            key={component.inclusion_id}
                            className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getComponentTypeColor(component.component_type)} flex items-center justify-center`}>
                                  <span className="font-bold text-lg">
                                    {component.component_type.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900">{component.component_name}</h4>
                                    {component.is_featured && (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                        ⭐ Featured
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 mb-3">
                                    {component.component_type_display}
                                  </div>

                                  {/* Component Pricing Info */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <div className="text-xs text-gray-500">Cost Per Unit</div>
                                      <div className="font-semibold text-indigo-600">
                                        {formatPrice(component.cost_per_unit)}
                                        <span className="text-xs text-gray-500 ml-1">/ {component.unit_label}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500">Price Per Unit</div>
                                      <div className="font-medium text-gray-900">
                                        {formatPrice(component.price_per_unit)}
                                        <span className="text-xs text-gray-500 ml-1">/ {component.unit_label}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500">Multiplier</div>
                                      <div className="font-medium text-indigo-600">×{component.quantity_multiplier ?? 1}</div>
                                    </div>
                                  </div>

                                  {/* Promotion Info */}
                                  {component.has_promotion && (
                                    <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-green-700 font-medium">Promotion:</span>
                                        <span className="text-green-600">{component.promotion_code}</span>
                                        <span className="text-green-600">{component.discount_percentage}% off</span>
                                        {component.promotion_valid_until && (
                                          <span className="text-gray-500">
                                            Valid until {new Date(component.promotion_valid_until).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 mt-3">
                                    {component.is_renewable && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        Renewable
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      Order: {component.display_order}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Agents Tab */}
                {activeTab === 'agents' && (
                  <div>
                    {summaryData.agents.count === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No Agents</h3>
                        <p className="mt-2 text-gray-600">This plan doesn't have any agents yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {summaryData.agents.items.map((agent) => (
                          <div
                            key={agent.inclusion_id}
                            className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleAgentSelect(agent.agent_id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M17 10H20C21.1 10 22 10.9 22 12V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V12C2 10.9 2.9 10 4 10H7V8C7 6.9 7.9 6 9 6H12.3C12.1 6.6 12 7.3 12 8V10H9C8.4 10 8 10.4 8 11V20H16V11C16 10.4 15.6 10 15 10H14V8C14 7.3 13.9 6.6 13.7 6H15C16.1 6 17 6.9 17 8V10Z"/>
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900">{agent.agent_name}</h4>
                                    {agent.is_featured && (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                        ⭐ Featured
                                      </span>
                                    )}
                                  </div>
                                  {agent.pricing_name && (
                                    <div className="text-sm text-gray-600 mb-1">{agent.pricing_name}</div>
                                  )}
                                  {agent.pricing_description && (
                                    <div className="text-xs text-gray-500 mb-3">{agent.pricing_description}</div>
                                  )}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <div className="text-xs text-gray-500">Unit Price</div>
                                      <div className="font-medium text-gray-900">
                                        {formatPrice(agent.unit_price)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500">Instances</div>
                                      <div className="font-medium text-indigo-600">×{agent.included_instances ?? 0}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500">Total Price</div>
                                      <div className="font-semibold text-green-600">
                                        {formatPrice(agent.total_price)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Component Consumption Summary */}
                                  {agent.component_consumption && agent.component_consumption.count > 0 && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-700">
                                          Component Consumption ({agent.component_consumption.count} items)
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {agent.component_consumption.items.slice(0, 3).map((comp) => (
                                          <span key={comp.component_id} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                            {comp.component_name}: {comp.consumption_rate} {comp.unit_label}
                                          </span>
                                        ))}
                                        {agent.component_consumption.count > 3 && (
                                          <span className="text-xs text-gray-500">
                                            +{agent.component_consumption.count - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Promotion Info */}
                                  {agent.has_promotion && (
                                    <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-green-700 font-medium">Promotion:</span>
                                        <span className="text-green-600">{agent.promotion_code}</span>
                                        <span className="text-green-600">{agent.discount_percentage}% off</span>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 mt-3">
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      {agent.agent_category}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Order: {agent.display_order}
                                    </span>
                                    <span className="text-xs text-indigo-600 ml-auto">
                                      Click for details →
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Agent Details Tab */}
                {activeTab === 'agent-details' && selectedAgent && (
                  <div>
                    <button
                      onClick={handleBackToAgents}
                      className="mb-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Agents
                    </button>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M17 10H20C21.1 10 22 10.9 22 12V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V12C2 10.9 2.9 10 4 10H7V8C7 6.9 7.9 6 9 6H12.3C12.1 6.6 12 7.3 12 8V10H9C8.4 10 8 10.4 8 11V20H16V11C16 10.4 15.6 10 15 10H14V8C14 7.3 13.9 6.6 13.7 6H15C16.1 6 17 6.9 17 8V10Z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900">{selectedAgent.agent_name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              {selectedAgent.agent_category}
                            </span>
                            {selectedAgent.pricing_name && (
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                                {selectedAgent.pricing_name}
                              </span>
                            )}
                            {selectedAgent.billing_method && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {selectedAgent.billing_method}
                              </span>
                            )}
                            {selectedAgent.unit && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                {selectedAgent.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Unit Price</div>
                        <div className="text-2xl font-bold text-gray-900">{formatPrice(selectedAgent.unit_price)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Included Instances</div>
                        <div className="text-2xl font-bold text-gray-900">{selectedAgent.included_instances}</div>
                      </div>
                    </div>

                    {/* Agent Description */}
                    {selectedAgent.pricing_description && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
                        <div className="text-sm text-gray-500 mb-2">Description</div>
                        <p className="text-gray-700">{selectedAgent.pricing_description}</p>
                      </div>
                    )}

                    {/* Component Consumption */}
                    {selectedAgent.component_consumption && selectedAgent.component_consumption.count > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <h4 className="font-semibold text-gray-900">Component Consumption</h4>
                        </div>

                        {/* Component List */}
                        <div className="p-4">
                          <div className="space-y-3">
                            {selectedAgent.component_consumption.items.map((comp) => (
                              <div key={comp.component_id} className="border border-gray-100 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900">{comp.component_name}</h5>
                                    <div className="text-xs text-gray-500 mt-1">{comp.component_type_display}</div>
                                  </div>
                                  <span className="text-sm font-semibold text-purple-600">
                                    {formatPrice(comp.cost_per_execution)}/exec
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs">
                                  <div>
                                    <span className="text-gray-500">Consumption:</span>
                                    <span className="ml-1 font-medium">{comp.consumption_rate} {comp.unit_label}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Base price:</span>
                                    <span className="ml-1 font-medium">{formatPrice(comp.base_price_per_unit)}</span>
                                  </div>
                                  {comp.override_price_per_unit && (
                                    <div>
                                      <span className="text-gray-500">Override:</span>
                                      <span className="ml-1 font-medium text-green-600">{formatPrice(comp.override_price_per_unit)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* No Plan Selected State */}
        {!selectedPlanId && !isLoadingPlans && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto h-20 w-20 text-gray-400 mb-6">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Select a Plan</h3>
              <p className="mt-2 text-gray-600">
                Choose a plan from the dropdown above to view its comprehensive summary
              </p>
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">What you'll see:</div>
                  <ul className="text-left space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Complete plan details and pricing breakdown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>All included components with cost per unit and pricing info</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Agent pricing and instance information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Detailed agent component consumption breakdown</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Plans State */}
        {isLoadingPlans && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Loading Plans</h3>
              <p className="mt-2 text-gray-600">Fetching available subscription plans...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanSummary;