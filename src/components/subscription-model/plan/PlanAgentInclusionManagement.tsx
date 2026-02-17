// components/subscription-model/plan/PlanAgentInclusionManagement.tsx
"use client";
import React, { useState } from 'react';
import {
  useGetPlansQuery,
  useGetAgentPricingQuery,
  useGetPlanAgentsInPlanQuery,
  useAddAgentToPlanMutation,
  useUpdatePlanAgentInclusionMutation,
  useRemoveAgentFromPlanMutation,
  Plan,
  AgentPricing,
  PlanAgentInclusion,
} from '@/features/subscriptionModel/billing/billingApi';

const PlanAgentInclusionManagement = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInclusion, setSelectedInclusion] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    agent_pricing: '',
    included_instances: 1,
    is_featured: false,
    display_order: 0,
  });

  // Loading states
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [removingAgentId, setRemovingAgentId] = useState<string | null>(null);

  // Fetch all plans for dropdown
  const { data: plansData, isLoading: isLoadingPlans } = useGetPlansQuery({});
  const plans = plansData?.results || [];

  // Fetch all agent pricing for dropdown
  const { data: agentPricingData, isLoading: isLoadingAgentPricing } = useGetAgentPricingQuery({ is_active: true });
  const agentPricingOptions = agentPricingData?.results || [];

  // Fetch inclusions for selected plan
  const { data: planAgentsData, isLoading: isLoadingInclusions, refetch } = useGetPlanAgentsInPlanQuery(selectedPlanId, {
    skip: !selectedPlanId,
  });

  const [addAgentToPlan] = useAddAgentToPlanMutation();
  const [updateInclusion] = useUpdatePlanAgentInclusionMutation();
  const [removeAgent] = useRemoveAgentFromPlanMutation();

  // Extract agents array from response
  const inclusions = planAgentsData?.agents || [];
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Helper function to format price
  const formatPrice = (price: string | number | null | undefined) => {
    if (price === null || price === undefined) return '$0.00';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    setIsAdding(true);
    try {
      await addAgentToPlan({
        planId: selectedPlanId,
        data: {
          agents: [
            {
              agent_pricing_id: formData.agent_pricing,
              included_instances: formData.included_instances,
              is_featured: formData.is_featured,
              display_order: formData.display_order,
            }
          ]
        },
      }).unwrap();

      setIsAddModalOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error('Failed to add agent to plan:', error);
      alert(error?.data?.detail || 'Failed to add agent');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedInclusion) return;

    setIsUpdating(true);
    try {
      await updateInclusion({
        planId: selectedPlanId,
        inclusionId: selectedInclusion.id,
        data: {
          included_instances: formData.included_instances,
          is_featured: formData.is_featured,
          display_order: formData.display_order,
        },
      }).unwrap();

      setIsEditModalOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error('Failed to update inclusion:', error);
      alert(error?.data?.detail || 'Failed to update inclusion');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (inclusionId: string, agentId: string, agentName: string) => {
    if (!selectedPlanId) return;
    
    if (!window.confirm(`Remove "${agentName}" from this plan? This cannot be undone.`)) return;

    setRemovingAgentId(inclusionId);
    try {
      await removeAgent({ planId: selectedPlanId, agentId }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to remove agent:', error);
      alert('Failed to remove agent from plan');
    } finally {
      setRemovingAgentId(null);
    }
  };

  const handleEdit = (inclusion: any) => {
    setSelectedInclusion(inclusion);
    setFormData({
      agent_pricing: inclusion.agent_pricing?.id || '',
      included_instances: inclusion.included_instances,
      is_featured: inclusion.is_featured,
      display_order: inclusion.display_order,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      agent_pricing: '',
      included_instances: 1,
      is_featured: false,
      display_order: 0,
    });
    setSelectedInclusion(null);
  };

  // Get available agent pricing (not already in plan)
  const getAvailableAgentPricing = () => {
    const includedAgentIds = inclusions.map((i: any) => i.agent_pricing?.agent_id);
    return agentPricingOptions.filter(ap => !includedAgentIds.includes(ap.agent_id));
  };

  // Combined loading state for initial data
  const isLoadingInitialData = isLoadingPlans || isLoadingAgentPricing;

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                Link Agents to Plans
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Add and manage agents included in subscription plans
              </p>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Plan <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <select
                  value={selectedPlanId}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value);
                    resetForm();
                  }}
                  disabled={isLoadingInitialData}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select a Plan --</option>
                  {isLoadingPlans ? (
                    <option value="" disabled>Loading plans...</option>
                  ) : (
                    plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.plan_type}) - {formatPrice(plan.base_price)}/{plan.billing_period}
                      </option>
                    ))
                  )}
                </select>
                {isLoadingInitialData && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </div>
              {selectedPlanId && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={getAvailableAgentPricing().length === 0 || isAdding || isLoadingInclusions}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {isAdding || isLoadingInclusions ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Agent</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="mt-4 sm:mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedPlan.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {selectedPlan.plan_type.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Base: {formatPrice(selectedPlan.base_price)}/{selectedPlan.billing_period}
                    </span>
                    {selectedPlan.featured && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⭐ Featured Plan
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-2xl font-bold text-indigo-600">{inclusions.length}</div>
                  <div className="text-sm text-gray-600">Agent{inclusions.length !== 1 ? 's' : ''} Included</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inclusions Table */}
        {selectedPlanId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoadingInclusions ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Loading Agents</h3>
                <p className="mt-2 text-gray-600 text-center">Fetching agent data for selected plan</p>
              </div>
            ) : inclusions.length === 0 ? (
              <div className="flex items-center justify-center py-12 sm:py-20">
                <div className="text-center max-w-md px-4">
                  <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No Agents Added</h3>
                  <p className="mt-2 text-gray-600">This plan doesn't have any agents yet. Start building it by adding agents.</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={getAvailableAgentPricing().length === 0 || isAdding}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {getAvailableAgentPricing().length === 0 ? 'No Agents Available' : 'Add First Agent'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Agent</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Pricing Tier</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Instances</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Billing</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inclusions.map((inclusion: any) => (
                      <tr key={inclusion.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M17 10H20C21.1 10 22 10.9 22 12V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V12C2 10.9 2.9 10 4 10H7V8C7 6.9 7.9 6 9 6H12.3C12.1 6.6 12 7.3 12 8V10H9C8.4 10 8 10.4 8 11V20H16V11C16 10.4 15.6 10 15 10H14V8C14 7.3 13.9 6.6 13.7 6H15C16.1 6 17 6.9 17 8V10Z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{inclusion.agent_pricing?.agent_name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {inclusion.agent_pricing?.agent_category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <div className="text-sm text-gray-900">{inclusion.agent_pricing?.name || 'Default'}</div>
                          {inclusion.agent_pricing?.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{inclusion.agent_pricing.description}</div>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                            {inclusion.included_instances} {inclusion.included_instances === 1 ? 'instance' : 'instances'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatPrice(inclusion.effective_price)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(inclusion.agent_pricing?.price)} / {inclusion.agent_pricing?.unit}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                          <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {inclusion.agent_pricing?.billing_method}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {inclusion.is_featured && (
                              <span className="inline-flex w-fit px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded text-xs font-medium">
                                ⭐ Featured
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Order: {inclusion.display_order}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(inclusion)}
                              disabled={isUpdating || removingAgentId !== null}
                              className="p-1.5 sm:p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit"
                            >
                              {isUpdating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleRemove(inclusion.id, inclusion.agent_pricing?.agent_id, inclusion.agent_pricing?.agent_name)}
                              disabled={removingAgentId === inclusion.id || isUpdating}
                              className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Remove"
                            >
                              {removingAgentId === inclusion.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* No Plan Selected State */}
        {!selectedPlanId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto h-20 w-20 text-gray-400 mb-6">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Select a Plan</h3>
              <p className="mt-2 text-gray-600">Choose a plan from the dropdown above to manage its agents</p>
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">Quick Tips:</div>
                  <ul className="text-left space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Select a plan to view and manage its agents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Add multiple agents to build comprehensive plans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Configure instances and pricing for each agent</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Agent to Plan</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure how this agent will be included in {selectedPlan?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isAdding) {
                    setIsAddModalOpen(false);
                    resetForm();
                  }
                }}
                disabled={isAdding}
                className="p-2 rounded-full hover:bg-gray-100 disabled:hover:bg-transparent disabled:opacity-50 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-6">
              {/* Agent Pricing Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Agent Pricing <span className="text-red-500">*</span>
                </label>
                {isLoadingAgentPricing ? (
                  <div className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span className="text-sm text-gray-600">Loading agents...</span>
                  </div>
                ) : (
                  <select
                    value={formData.agent_pricing}
                    onChange={(e) => setFormData({ ...formData, agent_pricing: e.target.value })}
                    disabled={isAdding}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">-- Select an Agent --</option>
                    {getAvailableAgentPricing().map((pricing) => (
                      <option key={pricing.id} value={pricing.id}>
                        {pricing.agent_name} - {pricing.name} @ {formatPrice(pricing.price)} / {pricing.unit}
                      </option>
                    ))}
                  </select>
                )}
                {getAvailableAgentPricing().length === 0 && (
                  <p className="text-xs text-red-500 mt-1">All available agents are already added to this plan.</p>
                )}
              </div>

              {/* Preview selected agent pricing */}
              {formData.agent_pricing && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Selected Agent Details:</div>
                  {(() => {
                    const selectedPricing = agentPricingOptions.find(p => p.id === formData.agent_pricing);
                    if (!selectedPricing) return null;
                    return (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">Category:</span> {selectedPricing.agent_category}</div>
                        <div><span className="font-medium">Price:</span> {formatPrice(selectedPricing.price)} / {selectedPricing.unit}</div>
                        <div><span className="font-medium">Billing:</span> {selectedPricing.billing_method}</div>
                        {selectedPricing.description && (
                          <div className="text-xs text-gray-500 mt-2">{selectedPricing.description}</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Instances */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Included Instances <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.included_instances}
                  onChange={(e) => setFormData({ ...formData, included_instances: parseInt(e.target.value) || 1 })}
                  disabled={isAdding}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of agent instances included (0 = unlimited)
                </p>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  disabled={isAdding}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Order in which this agent appears (lower numbers first)
                </p>
              </div>

              {/* Featured Toggle */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  disabled={isAdding}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium text-gray-900">Mark as Featured Agent</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAdding) {
                      setIsAddModalOpen(false);
                      resetForm();
                    }
                  }}
                  disabled={isAdding}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !formData.agent_pricing}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#4318ff] to-[#7c75ff] text-white rounded-lg font-medium hover:from-[#3610d9] hover:to-[#6b63e6] disabled:from-indigo-400 disabled:to-indigo-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Agent</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Inclusion Modal */}
      {isEditModalOpen && selectedInclusion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Agent Inclusion</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update: {selectedInclusion.agent_pricing?.agent_name}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isUpdating) {
                    setIsEditModalOpen(false);
                    resetForm();
                  }
                }}
                disabled={isUpdating}
                className="p-2 rounded-full hover:bg-gray-100 disabled:hover:bg-transparent disabled:opacity-50 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Current Agent Info */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="text-sm font-semibold text-gray-900 mb-2">Current Agent:</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="font-medium">{selectedInclusion.agent_pricing?.agent_name}</div>
                  <div>{selectedInclusion.agent_pricing?.name}</div>
                  <div className="text-indigo-600 font-medium">
                    {formatPrice(selectedInclusion.agent_pricing?.price)} / {selectedInclusion.agent_pricing?.unit}
                  </div>
                </div>
              </div>

              {/* Instances */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Included Instances <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.included_instances}
                  onChange={(e) => setFormData({ ...formData, included_instances: parseInt(e.target.value) || 1 })}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Featured Toggle */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  disabled={isUpdating}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium text-gray-900">Mark as Featured</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (!isUpdating) {
                      setIsEditModalOpen(false);
                      resetForm();
                    }
                  }}
                  disabled={isUpdating}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#4318ff] to-[#7c75ff] text-white rounded-lg font-medium hover:from-[#3610d9] hover:to-[#6b63e6] disabled:from-indigo-400 disabled:to-indigo-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Inclusion</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanAgentInclusionManagement;