// components/subscription-model/plan/PlanComponentInclusionManagement.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  useGetPlansQuery,
  useGetPlanComponentsQuery,
  useAddComponentToPlanMutation,
  useUpdatePlanComponentInclusionMutation,
  useRemoveComponentFromPlanMutation,
} from '@/features/subscriptionModel/billing/billingApi';

// Define local interfaces that match the actual API response structure
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

interface PlanComponent {
  id: string;
  name: string;
  component_type: 'compute_tokens' | 'storage_gb' | 'api_calls' | 'agent_instances' | 'active_agents' | 'custom';
  component_type_display: string;
  description: string | null;
  quantity: string | null;
  price: string | null;
  unit_label: string;
  cost_per_unit: string;
  price_per_unit: string;
  effective_price: string;
  promotion_code: string | null;
  promotion_valid_from: string | null;
  promotion_valid_until: string | null;
  discount_percentage: string | null;
  is_promotion_valid: boolean;
  is_active: boolean;
  is_renewable: boolean;
  created_at: string;
  updated_at: string;
}

interface PlanComponentInclusion {
  id: string;
  component: PlanComponent;
  quantity_multiplier: string;
  total_quantity: string;
  total_price: string;
  is_featured: boolean;
  display_order: number;
}

interface PlanComponentsResponse {
  plan_id: string;
  plan_name: string;
  components: PlanComponentInclusion[];
  count: number;
}

// API Error Response interface
interface ApiErrorResponse {
  data?: {
    detail?: string;
    message?: string;
    error?: string;
  };
}

// Custom hook to fetch plan components
const useGetPlanComponentsInPlan = (planId: string) => {
  const [data, setData] = useState<PlanComponentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminId = (): string | null => {
    if (typeof window === 'undefined') return null;
    const adminUser = localStorage.getItem('superAdminUser');
    if (!adminUser) return null;
    try {
      const parsed = JSON.parse(adminUser);
      return parsed.id || null;
    } catch (error) {
      console.error('Failed to parse superAdminUser from localStorage:', error);
      return null;
    }
  };

  const fetchData = async () => {
    if (!planId) return;

    setIsLoading(true);
    setError(null);

    try {
      const adminId = getAdminId();
      if (!adminId) {
        throw new Error('Admin ID not found');
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/plans/${planId}/components/?admin_id=${adminId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PlanComponentsResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch plan components:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch components');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (planId) {
      fetchData();
    } else {
      setData(null);
    }
  }, [planId]);

  const refetch = () => {
    if (planId) {
      fetchData();
    }
  };

  return { data, isLoading, error, refetch };
};

const PlanComponentInclusionManagement = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInclusion, setSelectedInclusion] = useState<PlanComponentInclusion | null>(null);
  const [isPlanChanging, setIsPlanChanging] = useState(false);
  const [formData, setFormData] = useState({
    component: '',
    is_featured: false,
    display_order: 0,
  });

  // Fetch all plans for dropdown
  const { data: plansResponse, isLoading: isLoadingPlans } = useGetPlansQuery({});
  const plans: Plan[] = (plansResponse?.results || []) as unknown as Plan[];

  // Fetch all components for dropdown
  const { data: componentsResponse, isLoading: isLoadingComponents } = useGetPlanComponentsQuery({ is_active: true });
  const components = (componentsResponse?.results || []) as unknown as PlanComponent[];

  // Fetch inclusions for selected plan using custom hook
  const {
    data: inclusionsData,
    isLoading: isLoadingInclusions,
    error: inclusionsError,
    refetch: refetchInclusions
  } = useGetPlanComponentsInPlan(selectedPlanId);

  const [addComponentToPlan, { isLoading: isAdding }] = useAddComponentToPlanMutation();
  const [updateInclusion, { isLoading: isUpdating }] = useUpdatePlanComponentInclusionMutation();
  const [removeComponent, { isLoading: isRemoving }] = useRemoveComponentFromPlanMutation();

  const inclusions = inclusionsData?.components || [];
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  
  // Handle plan change with loading state
  const handlePlanChange = (planId: string) => {
    setIsPlanChanging(true);
    setSelectedPlanId(planId);
    resetForm();
  };

  // Reset loading state when inclusions are loaded
  useEffect(() => {
    if (!isLoadingInclusions) {
      setIsPlanChanging(false);
    }
  }, [isLoadingInclusions]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    try {
      await addComponentToPlan({
        planId: selectedPlanId,
        data: {
          components: [
            {
              component_id: formData.component,
              quantity_multiplier: 1,
              is_included: true,
            }
          ]
        },
      }).unwrap();

      setIsAddModalOpen(false);
      resetForm();
      refetchInclusions();
    } catch (error: unknown) {
      console.error('Failed to add component to plan:', error);
      const apiError = error as ApiErrorResponse;
      console.error('Error details:', apiError?.data);
      alert(apiError?.data?.detail || apiError?.data?.message || apiError?.data?.error || 'Failed to add component');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedInclusion) return;

    try {
      await removeComponent({ 
        planId: selectedPlanId, 
        componentId: selectedInclusion.id 
      }).unwrap();

      await addComponentToPlan({
        planId: selectedPlanId,
        data: {
          components: [
            {
              component_id: selectedInclusion.component.id,
              quantity_multiplier: parseFloat(selectedInclusion.quantity_multiplier),
              is_included: true,
            }
          ]
        },
      }).unwrap();

      setIsEditModalOpen(false);
      resetForm();
      refetchInclusions();
    } catch (error: unknown) {
      console.error('Failed to update inclusion:', error);
      const apiError = error as ApiErrorResponse;
      alert(apiError?.data?.detail || apiError?.data?.message || 'Failed to update inclusion');
    }
  };

  const handleRemove = async (inclusionId: string, componentName: string) => {
    if (!selectedPlanId) return;

    if (window.confirm(`Remove "${componentName}" from this plan? This cannot be undone.`)) {
      try {
        await removeComponent({ 
          planId: selectedPlanId, 
          componentId: inclusionId 
        }).unwrap();
        refetchInclusions();
      } catch (error: unknown) {
        console.error('Failed to remove component:', error);
        const apiError = error as ApiErrorResponse;
        alert(apiError?.data?.detail || apiError?.data?.message || 'Failed to remove component from plan');
      }
    }
  };

  const handleEdit = (inclusion: PlanComponentInclusion) => {
    setSelectedInclusion(inclusion);
    setFormData({
      component: inclusion.component.id,
      is_featured: inclusion.is_featured,
      display_order: inclusion.display_order,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      component: '',
      is_featured: false,
      display_order: 0,
    });
    setSelectedInclusion(null);
  };

  // Get available components (not already in plan)
  const getAvailableComponents = () => {
    const includedComponentIds = inclusions.map(i => i.component.id);
    return components.filter(c => !includedComponentIds.includes(c.id));
  };

  const availableComponents = getAvailableComponents();

  // Helper function to format price - NULL SAFE
  const formatPrice = (price: string | number | null | undefined) => {
    if (price === null || price === undefined) {
      return '$0.00';
    }
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) {
      return '$0.00';
    }
    return `$${num.toFixed(2)}`;
  };

  // Helper function to safely display description
  const getDescription = (desc: string | null | undefined): string => {
    return desc || 'No description';
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                Plan Components Management
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Add and manage components included in subscription plans
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
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white"
                  disabled={isLoadingPlans}
                >
                  <option value="">-- Select a Plan --</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.plan_type}) - {formatPrice(plan.base_price)}/{plan.billing_period}
                    </option>
                  ))}
                </select>
                {isLoadingPlans && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </div>
              {selectedPlanId && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={availableComponents.length === 0 || isLoadingInclusions || isPlanChanging}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {isLoadingInclusions ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Component</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="mt-4 sm:mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              {isPlanChanging ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-600">Loading plan details...</span>
                </div>
              ) : (
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedPlan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedPlan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-2xl font-bold text-indigo-600">{inclusions.length}</div>
                    <div className="text-sm text-gray-600">Components Included</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {inclusionsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Error Loading Components</h3>
                <p className="mt-2 text-gray-600">{inclusionsError}</p>
                <button
                  onClick={() => refetchInclusions()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {selectedPlanId && (isLoadingInclusions || isPlanChanging) && !inclusionsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Loading Components</h3>
              <p className="mt-2 text-gray-600 text-center">
                Loading components for {selectedPlan?.name}...
              </p>
            </div>
          </div>
        )}

        {/* Inclusions Table */}
        {selectedPlanId && !isLoadingInclusions && !isPlanChanging && !inclusionsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {inclusions.length === 0 ? (
              <div className="flex items-center justify-center py-12 sm:py-20">
                <div className="text-center max-w-md px-4">
                  <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No Components Added</h3>
                  <p className="mt-2 text-gray-600">
                    This plan doesn&apos;t have any components yet. Start building it by adding components.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={availableComponents.length === 0}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {availableComponents.length === 0 ? 'No Components Available' : 'Add First Component'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 border-b border-gray-100">
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-indigo-700">{inclusions.length}</div>
                    <div className="text-sm text-indigo-600 font-medium">Total Components</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-green-700">{inclusions.length}</div>
                    <div className="text-sm text-green-600 font-medium">Components Included</div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Component</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Cost Per Unit</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Price Per Unit</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Multiplier</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inclusions.map((inclusion) => (
                        <tr key={inclusion.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-bold">
                                  {inclusion.component.component_type.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{inclusion.component.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {inclusion.component.component_type_display}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(inclusion.component.cost_per_unit)}
                              <span className="text-xs text-gray-500 ml-1">/ {inclusion.component.unit_label}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm font-semibold text-indigo-600">
                              {formatPrice(inclusion.component.price_per_unit)}
                              <span className="text-xs text-gray-500 ml-1">/ {inclusion.component.unit_label}</span>
                            </div>
                            {inclusion.component.is_promotion_valid && (
                              <div className="text-xs text-green-600 mt-1">
                                {inclusion.component.discount_percentage}% off
                              </div>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                              ×{inclusion.quantity_multiplier}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {inclusion.is_featured && (
                                <span className="inline-flex w-fit px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded text-xs font-medium">
                                  ⭐ Featured
                                </span>
                              )}
                              {inclusion.component.is_renewable && (
                                <span className="inline-flex w-fit px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  Renewable
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
                                disabled={isUpdating || isRemoving}
                                className="p-1.5 sm:p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
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
                                onClick={() => handleRemove(inclusion.id, inclusion.component.name)}
                                disabled={isUpdating || isRemoving}
                                className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Remove"
                              >
                                {isRemoving ? (
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
              </>
            )}
          </div>
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
                Choose a plan from the dropdown above to manage its included components
              </p>
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">Quick Tips:</div>
                  <ul className="text-left space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Select a plan to view and manage its components</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Add multiple components to build comprehensive plans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>View cost per unit and pricing details for each component</span>
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

      {/* Add Component Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Component to Plan</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select a component to include in {selectedPlan?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isAdding}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-6">
              {/* Component Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Component <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.component}
                  onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                  disabled={isAdding || isLoadingComponents}
                >
                  <option value="">-- Select a Component --</option>
                  {availableComponents.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} ({comp.component_type_display}) - {formatPrice(comp.cost_per_unit)}/{comp.unit_label}
                    </option>
                  ))}
                </select>
                {availableComponents.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">All available components are already added to this plan.</p>
                )}
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="0"
                  disabled={isAdding}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Order in which this component appears (lower numbers first)
                </p>
              </div>

              {/* Featured Toggle */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  disabled={isAdding}
                />
                <span className="text-sm font-medium text-gray-900">Mark as Featured Component</span>
              </label>

              {/* Component Details Preview */}
              {formData.component && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Component Details:</div>
                  {(() => {
                    const selectedComp = components.find(c => c.id === formData.component);
                    if (!selectedComp) return null;
                    return (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">Type:</span> {selectedComp.component_type_display}</div>
                        <div><span className="font-medium">Cost per Unit:</span> {formatPrice(selectedComp.cost_per_unit)}/{selectedComp.unit_label}</div>
                        <div className="font-semibold text-indigo-700">
                          Price per Unit: {formatPrice(selectedComp.price_per_unit)}/{selectedComp.unit_label}
                        </div>
                        {selectedComp.is_promotion_valid && (
                          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block mt-1">
                            {selectedComp.discount_percentage}% discount active
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#4318ff] to-[#7c75ff] text-white rounded-lg font-medium hover:from-[#3610d9] hover:to-[#6b63e6] transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                  disabled={isAdding || !formData.component || availableComponents.length === 0}
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    'Add Component'
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Component Inclusion</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update: {selectedInclusion.component.name}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Note: Only display order and featured status can be edited. To change multiplier, remove and re-add the component.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isUpdating}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Current Component Info */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="text-sm font-semibold text-gray-900 mb-2">Current Component:</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="font-medium">{selectedInclusion.component.name}</div>
                  <div>{selectedInclusion.component.component_type_display}</div>
                  <div className="text-indigo-600 font-medium">
                    Cost: {formatPrice(selectedInclusion.component.cost_per_unit)}/{selectedInclusion.component.unit_label}
                  </div>
                  <div className="text-indigo-600 font-medium">
                    Price: {formatPrice(selectedInclusion.component.price_per_unit)}/{selectedInclusion.component.unit_label}
                  </div>
                </div>
              </div>

              {/* Display Current Multiplier (Read-only) */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Current Multiplier</div>
                <div className="text-lg font-semibold text-gray-900">×{selectedInclusion.quantity_multiplier}</div>
                <div className="text-xs text-gray-500 mt-1">Multiplier cannot be edited</div>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  disabled={isUpdating}
                />
              </div>

              {/* Featured Toggle */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  disabled={isUpdating}
                />
                <span className="text-sm font-medium text-gray-900">Mark as Featured</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#4318ff] to-[#7c75ff] text-white rounded-lg font-medium hover:from-[#3610d9] hover:to-[#6b63e6] transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Update Inclusion'
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

export default PlanComponentInclusionManagement;