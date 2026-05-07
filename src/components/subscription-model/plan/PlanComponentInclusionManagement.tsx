// components/subscription-model/plan/PlanComponentInclusionManagement.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useGetPlansQuery,
  useGetPlanComponentsQuery,
  useAddComponentToPlanMutation,
  useRemoveComponentFromPlanMutation,
  useUpdatePlanComponentInclusionMutation,
} from '@/features/subscriptionModel/billing/billingApi';

// ============================================
// TYPES
// ============================================
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
  component_type: string;
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

interface ApiErrorResponse {
  data?: {
    detail?: string;
    message?: string;
    error?: string;
  };
}

// ============================================
// CONSTANTS
// ============================================
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

// ============================================
// HELPER COMPONENTS
// ============================================
const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <svg className={`animate-spin ${sizeClasses[size]} ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
};

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-20" />
        <div className="h-4 bg-gray-100 rounded w-20" />
        <div className="h-6 bg-gray-200 rounded-lg w-12" />
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ onAddClick, hasAvailableComponents }: { onAddClick: () => void; hasAvailableComponents: boolean }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
      <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Components Added</h3>
    <p className="text-gray-500 mb-6 text-center max-w-sm">This plan doesn&apos;t have any components yet. Start by adding components to build your subscription plan.</p>
    <button
      onClick={onAddClick}
      disabled={!hasAvailableComponents}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:shadow-none"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      {hasAvailableComponents ? 'Add First Component' : 'No Components Available'}
    </button>
  </div>
);

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50/50 border-t border-gray-100">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span>
        </span>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="px-3 py-1 text-sm font-medium text-gray-700">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ============================================
// CUSTOM HOOK
// ============================================
const useGetPlanComponentsInPlan = (planId: string) => {
  const [data, setData] = useState<PlanComponentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminId = (): string | null => {
    if (typeof window === 'undefined') return null;
    const adminUser = localStorage.getItem('superAdminUser');
    if (!adminUser) return null;
    try {
      return JSON.parse(adminUser).id || null;
    } catch {
      return null;
    }
  };

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!planId) return;

    if (isRefetch) {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const adminId = getAdminId();
      if (!adminId) throw new Error('Admin ID not found');

      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1/';
      const response = await fetch(
        `${BASE_URL}plans/${planId}/components/?admin_id=${adminId}&ordering=-created_at`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('superAdminToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: PlanComponentsResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch components');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [planId]);

  useEffect(() => {
    if (planId) {
      fetchData(false);
    } else {
      setData(null);
    }
  }, [planId, fetchData]);

  const refetch = useCallback(() => {
    if (planId) fetchData(true);
  }, [planId, fetchData]);

  return { data, isLoading, isFetching, error, refetch };
};

// ============================================
// MAIN COMPONENT
// ============================================
const PlanComponentInclusionManagement = () => {
  // Get plan from URL query params
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');

  // State
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInclusion, setSelectedInclusion] = useState<PlanComponentInclusion | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    component: '',
    quantity_multiplier: '1',
    is_featured: false,
  });

  // API Hooks
  const { data: plansResponse, isLoading: isLoadingPlans } = useGetPlansQuery({});
  const plans: Plan[] = (plansResponse?.results || []) as unknown as Plan[];

  // Auto-select plan from URL when plans are loaded
  useEffect(() => {
    if (planFromUrl && plans.length > 0 && !selectedPlanId) {
      const planExists = plans.some(p => p.id === planFromUrl);
      if (planExists) {
        setSelectedPlanId(planFromUrl);
      }
    }
  }, [planFromUrl, plans, selectedPlanId]);

  const { data: componentsResponse, isLoading: isLoadingComponents } = useGetPlanComponentsQuery({ is_active: true, limit: 1000 });
  const allComponents = (componentsResponse?.results || []) as unknown as PlanComponent[];

  const { data: inclusionsData, isLoading: isLoadingInclusions, isFetching, error: inclusionsError, refetch } = useGetPlanComponentsInPlan(selectedPlanId);

  const [addComponentToPlan, { isLoading: isAdding }] = useAddComponentToPlanMutation();
  const [updateComponentInPlan, { isLoading: isUpdating }] = useUpdatePlanComponentInclusionMutation();
  const [removeComponent] = useRemoveComponentFromPlanMutation();

  // Derived state
  const inclusions = inclusionsData?.components || [];
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const showOverlay = isFetching && !isLoadingInclusions;

  // Pagination
  const totalItems = inclusions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedInclusions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return inclusions.slice(start, start + pageSize);
  }, [inclusions, currentPage, pageSize]);

  // Available components (not already in plan)
  const availableComponents = useMemo(() => {
    const includedIds = new Set(inclusions.map(i => i.component.id));
    return allComponents.filter(c => !includedIds.has(c.id));
  }, [allComponents, inclusions]);

  // Handlers
  const handlePlanChange = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    setCurrentPage(1);
    setFormData({ component: '', quantity_multiplier: '1' });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ component: '', quantity_multiplier: '1', is_featured: false });
    setSelectedInclusion(null);
  }, []);

  const handleEdit = useCallback((inclusion: PlanComponentInclusion) => {
    setSelectedInclusion(inclusion);
    setFormData({
      component: inclusion.component.id,
      quantity_multiplier: inclusion.quantity_multiplier,
      is_featured: inclusion.is_featured,
    });
    setIsEditModalOpen(true);
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !formData.component) return;

    try {
      await addComponentToPlan({
        planId: selectedPlanId,
        data: {
          components: [{
            component_id: formData.component,
            quantity_multiplier: parseFloat(formData.quantity_multiplier) || 1,
            is_included: true,
          }]
        },
      }).unwrap();

      setIsAddModalOpen(false);
      resetForm();
      refetch();
    } catch (error: unknown) {
      const apiError = error as ApiErrorResponse;
      alert(apiError?.data?.detail || apiError?.data?.message || 'Failed to add component');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedInclusion) return;

    try {
      await updateComponentInPlan({
        planId: selectedPlanId,
        inclusionId: selectedInclusion.id,
        data: {
          quantity_multiplier: parseFloat(formData.quantity_multiplier) || 1,
          is_featured: formData.is_featured,
        },
      }).unwrap();

      setIsEditModalOpen(false);
      resetForm();
      refetch();
    } catch (error: unknown) {
      const apiError = error as ApiErrorResponse;
      alert(apiError?.data?.detail || apiError?.data?.message || 'Failed to update component');
    }
  };

  const handleRemove = async (inclusionId: string, componentName: string) => {
    if (!selectedPlanId) return;
    if (!window.confirm(`Remove "${componentName}" from this plan?`)) return;

    setRemovingId(inclusionId);
    try {
      await removeComponent({ planId: selectedPlanId, componentId: inclusionId }).unwrap();
      refetch();
    } catch (error: unknown) {
      const apiError = error as ApiErrorResponse;
      alert(apiError?.data?.detail || 'Failed to remove component');
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (price: string | number | null | undefined) => {
    if (price === null || price === undefined) return '$0.00';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(6)}`;
  };

  const formatComponentType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Plan Component Inclusions</h1>
              <p className="text-gray-500 mt-1">Link components to subscription plans</p>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Plan <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  disabled={isLoadingPlans}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="">-- Select a Plan --</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} • {plan.plan_type.toUpperCase()} • {formatPrice(plan.base_price)}/{plan.billing_period}
                    </option>
                  ))}
                </select>
                {isLoadingPlans && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <LoadingSpinner size="sm" className="text-indigo-600" />
                  </div>
                )}
              </div>
              {selectedPlanId && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={availableComponents.length === 0 || isLoadingInclusions}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Component</span>
                </button>
              )}
            </div>
          </div>

          {/* Plan Summary */}
          {selectedPlan && !isLoadingInclusions && (
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedPlan.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {selectedPlan.plan_type.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {formatPrice(selectedPlan.base_price)}/{selectedPlan.billing_period}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      selectedPlan.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedPlan.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {selectedPlan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-3xl font-bold text-indigo-600">{inclusions.length}</div>
                  <div className="text-sm text-gray-500">Components</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {!selectedPlanId && !isLoadingPlans && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Plan</h3>
              <p className="text-gray-500">Choose a plan from the dropdown above to manage its components</p>
            </div>
          </div>
        )}

        {isLoadingPlans && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" className="text-indigo-600" />
              <p className="mt-4 text-gray-600">Loading plans...</p>
            </div>
          </div>
        )}

        {inclusionsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Error Loading Components</h3>
              <p className="text-gray-500 mt-2">{inclusionsError}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {selectedPlanId && !inclusionsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {/* Loading Overlay */}
            {showOverlay && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-lg border border-gray-100">
                  <LoadingSpinner size="sm" className="text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">Updating...</span>
                </div>
              </div>
            )}

            {isLoadingInclusions ? (
              <TableSkeleton rows={pageSize} />
            ) : inclusions.length === 0 ? (
              <EmptyState onAddClick={() => setIsAddModalOpen(true)} hasAvailableComponents={availableComponents.length > 0} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pricing</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Multiplier</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedInclusions.map((inclusion) => (
                        <tr key={inclusion.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 font-bold text-sm">
                                  {inclusion.component.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{inclusion.component.name}</div>
                                <div className="text-sm text-gray-500">{inclusion.component.unit_label}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {formatComponentType(inclusion.component.component_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 w-10">Cost</span>
                                <span className="font-medium text-gray-700">{formatPrice(inclusion.component.cost_per_unit)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 w-10">Price</span>
                                <span className="font-semibold text-indigo-600">{formatPrice(inclusion.component.price_per_unit)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
                              ×{inclusion.quantity_multiplier}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              {/* Active Status - Always shown */}
                              <span className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${
                                inclusion.component.is_active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${inclusion.component.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {inclusion.component.is_active ? 'Active' : 'Inactive'}
                              </span>
                              {/* Optional badges */}
                              {(inclusion.is_featured || inclusion.component.is_renewable || inclusion.component.is_promotion_valid) && (
                                <div className="flex flex-wrap gap-1">
                                  {inclusion.is_featured && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">
                                      Featured
                                    </span>
                                  )}
                                  {inclusion.component.is_renewable && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                                      Renewable
                                    </span>
                                  )}
                                  {inclusion.component.is_promotion_valid && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium border border-purple-100">
                                      {inclusion.component.discount_percentage}% off
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(inclusion)}
                                disabled={isUpdating}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-40 transition-all"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRemove(inclusion.id, inclusion.component.name)}
                                disabled={removingId === inclusion.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 transition-all"
                                title="Remove"
                              >
                                {removingId === inclusion.id ? (
                                  <LoadingSpinner size="sm" className="text-red-500" />
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

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Component Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isAdding && (setIsAddModalOpen(false), resetForm())} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Add Component to Plan</h2>
                    <p className="text-sm text-gray-500">{selectedPlan?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => !isAdding && (setIsAddModalOpen(false), resetForm())}
                  disabled={isAdding}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddSubmit}>
                <div className="px-6 py-5 space-y-5">
                  {/* Component Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Component <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.component}
                      onChange={(e) => setFormData(prev => ({ ...prev, component: e.target.value }))}
                      disabled={isAdding || isLoadingComponents}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 transition-all"
                      required
                    >
                      <option value="">-- Select Component --</option>
                      {availableComponents.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name} • {formatComponentType(comp.component_type)} • {formatPrice(comp.price_per_unit)}/{comp.unit_label}
                        </option>
                      ))}
                    </select>
                    {availableComponents.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">All components are already added to this plan.</p>
                    )}
                  </div>

                  {/* Multiplier Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Quantity Multiplier <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">×</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.quantity_multiplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity_multiplier: e.target.value }))}
                        disabled={isAdding}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 transition-all"
                        placeholder="1"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Multiplier applied to the component quantity (e.g., 1.5 = 150%)</p>
                  </div>

                  {/* Component Preview */}
                  {formData.component && (
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                      <div className="text-sm font-medium text-gray-700 mb-3">Component Preview</div>
                      {(() => {
                        const comp = allComponents.find(c => c.id === formData.component);
                        if (!comp) return null;
                        const multiplier = parseFloat(formData.quantity_multiplier) || 1;
                        return (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Name</span>
                              <span className="font-medium text-gray-900">{comp.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type</span>
                              <span className="text-gray-700">{formatComponentType(comp.component_type)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Unit Price</span>
                              <span className="text-gray-700">{formatPrice(comp.price_per_unit)}/{comp.unit_label}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-indigo-100">
                              <span className="text-gray-700 font-medium">Multiplier</span>
                              <span className="font-bold text-indigo-600">×{multiplier}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => !isAdding && (setIsAddModalOpen(false), resetForm())}
                    disabled={isAdding}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding || !formData.component}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none"
                  >
                    {isAdding && <LoadingSpinner size="sm" />}
                    {isAdding ? 'Adding...' : 'Add Component'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Component Modal */}
      {isEditModalOpen && selectedInclusion && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isUpdating && (setIsEditModalOpen(false), resetForm())} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Edit Component Inclusion</h2>
                    <p className="text-sm text-gray-500">{selectedInclusion.component.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => !isUpdating && (setIsEditModalOpen(false), resetForm())}
                  disabled={isUpdating}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEditSubmit}>
                <div className="px-6 py-5 space-y-5">
                  {/* Component Info (Read-only) */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-sm font-medium text-gray-700 mb-3">Component Details</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name</span>
                        <span className="font-medium text-gray-900">{selectedInclusion.component.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="text-gray-700">{formatComponentType(selectedInclusion.component.component_type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Unit Price</span>
                        <span className="text-gray-700">{formatPrice(selectedInclusion.component.price_per_unit)}/{selectedInclusion.component.unit_label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Multiplier Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Quantity Multiplier <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">×</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.quantity_multiplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity_multiplier: e.target.value }))}
                        disabled={isUpdating}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 transition-all"
                        placeholder="1"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Multiplier applied to the component quantity</p>
                  </div>

                  {/* Featured Toggle */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                          disabled={isUpdating}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-amber-500 peer-disabled:opacity-50 transition-colors" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Featured Component</span>
                        <p className="text-xs text-gray-500">Highlight this component in the plan</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => !isUpdating && (setIsEditModalOpen(false), resetForm())}
                    disabled={isUpdating}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none"
                  >
                    {isUpdating && <LoadingSpinner size="sm" />}
                    {isUpdating ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanComponentInclusionManagement;
