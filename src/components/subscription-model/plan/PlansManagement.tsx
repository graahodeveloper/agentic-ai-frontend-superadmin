"use client";
import React, { useState, useEffect } from 'react';
import {
  useGetPlansQuery,
  useActivatePlanMutation,
  useDeactivatePlanMutation,
  useDuplicatePlanMutation,
  useDeletePlanMutation,
  Plan,
  GetPlansParams,
} from '@/features/plan/planApi';
import CreateEditPlanDrawer from './CreateEditPlanDrawer';


const PlansManagement = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [searchTerm, setSearchTerm] = useState('');
  const [planTypeFilter, setPlanTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // ============================================
  // BUILD QUERY PARAMS
  // ============================================
  const queryParams: GetPlansParams = {
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    plan_type: planTypeFilter !== 'all' ? planTypeFilter : undefined,
    is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
  };

  // ============================================
  // API HOOKS
  // ============================================
  const {
    data: plansData,
    isLoading,
    error,
    refetch,
  } = useGetPlansQuery(queryParams);

  const [activatePlan, { isLoading: isActivating }] = useActivatePlanMutation();
  const [deactivatePlan, { isLoading: isDeactivating }] = useDeactivatePlanMutation();
  const [duplicatePlan, { isLoading: isDuplicating }] = useDuplicatePlanMutation();
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation();

  // ============================================
  // HANDLE SEARCH WITH DEBOUNCE
  // ============================================
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      refetch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, planTypeFilter, statusFilter, refetch]);

  // ============================================
  // EVENT HANDLERS
  // ============================================
  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await deactivatePlan(planId).unwrap();
      } else {
        await activatePlan(planId).unwrap();
      }
      refetch();
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
      alert('Failed to toggle plan status. Please try again.');
    }
  };

  const handleDuplicate = async (planId: string) => {
    try {
      await duplicatePlan(planId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to duplicate plan:', error);
      alert('Failed to duplicate plan. Please try again.');
    }
  };

  const handleDelete = async (planId: string, planName: string) => {
    const confirmMessage = `Are you sure you want to delete "${planName}"? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        await deletePlan(planId).unwrap();
        refetch();
      } catch (error) {
        console.error('Failed to delete plan:', error);
        alert('Failed to delete plan. Please try again.');
      }
    }
  };

  const handleViewDetails = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDetailsModalOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsEditMode(true);
    setIsCreateDrawerOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedPlan(null);
    setIsEditMode(false);
    setIsCreateDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsCreateDrawerOpen(false);
    setSelectedPlan(null);
    setIsEditMode(false);
  };

  const handleDrawerSuccess = () => {
    refetch();
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getPlanTypeBadgeColor = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'starter':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'custom':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBillingPeriodDisplay = (period: string) => {
    const periodMap: Record<string, string> = {
      hourly: 'Hour',
      daily: 'Day',
      weekly: 'Week',
      monthly: 'Month',
      yearly: 'Year',
      one_time: 'One-Time',
    };
    return periodMap[period] || period;
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // ============================================
  // DATA EXTRACTION
  // ============================================
  const plans = plansData?.results || [];
  const totalCount = plansData?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="w-full min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* ============================================ */}
        {/* HEADER SECTION */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                Subscription Plans
              </h1>
              <p className="text-[#424754] mt-2">
                Manage and configure subscription plans for the platform ({totalCount} total plans)
              </p>
            </div>

            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Plan</span>
            </button>
          </div>

          {/* ============================================ */}
          {/* SEARCH AND FILTER CONTROLS */}
          {/* ============================================ */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search plans by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200 bg-white"
              />
            </div>

            <select
              value={planTypeFilter}
              onChange={(e) => setPlanTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200 bg-white min-w-[140px]"
            >
              <option value="all">All Types</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200 bg-white min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* ============================================ */}
        {/* PLANS TABLE */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            // ============================================
            // LOADING STATE
            // ============================================
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4318ff]"></div>
              <span className="ml-3 text-[#424754]">Loading plans...</span>
            </div>
          ) : error ? (
            // ============================================
            // ERROR STATE
            // ============================================
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load plans</h3>
                <p className="mt-2 text-gray-600">There was an error loading the plans. Please try again.</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-[#4318ff] text-white rounded-lg hover:bg-[#3610d9] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : plans.length === 0 ? (
            // ============================================
            // EMPTY STATE
            // ============================================
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No plans found</h3>
                <p className="mt-2 text-gray-600">
                  {searchTerm || planTypeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by creating your first plan'}
                </p>
                {!searchTerm && planTypeFilter === 'all' && statusFilter === 'all' && (
                  <button
                    onClick={handleCreateNew}
                    className="mt-4 px-4 py-2 bg-[#4318ff] text-white rounded-lg hover:bg-[#3610d9] transition-colors"
                  >
                    Create First Plan
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ============================================ */}
              {/* TABLE */}
              {/* ============================================ */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#f4f7fe] to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">
                        Plan Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">
                        Pricing
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">
                        Resources
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#424754] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#424754] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {plans.map((plan: Plan) => (
                      <tr key={plan.id} className="hover:bg-[#f4f7fe]/50 transition-colors duration-150">
                        {/* ============================================ */}
                        {/* PLAN DETAILS COLUMN */}
                        {/* ============================================ */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-semibold text-gray-900">{plan.name}</div>
                              {plan.featured && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                            {plan.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">
                                {plan.description}
                              </div>
                            )}
                            {plan.badge_text && (
                              <div className="text-xs text-indigo-600 font-medium mt-1">
                                {plan.badge_text}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* ============================================ */}
                        {/* TYPE COLUMN */}
                        {/* ============================================ */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanTypeBadgeColor(plan.plan_type)}`}>
                            {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)}
                          </span>
                        </td>

                        {/* ============================================ */}
                        {/* PRICING COLUMN */}
                        {/* ============================================ */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${formatPrice(plan.price)}
                          </div>
                          <div className="text-xs text-gray-500">
                            per {getBillingPeriodDisplay(plan.billing_period)}
                          </div>
                          {plan.has_trial && (
                            <div className="text-xs text-green-600 font-medium mt-0.5">
                              {plan.trial_period_days} day trial
                            </div>
                          )}
                        </td>

                        {/* ============================================ */}
                        {/* RESOURCES COLUMN */}
                        {/* ============================================ */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="3"/>
                              </svg>
                              <span>{plan.max_agent_instances ?? 0} Agent Instances</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="3"/>
                              </svg>
                              <span>{plan.max_active_agents ?? 0} Active Agents</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="3"/>
                              </svg>
                              <span>{formatNumber(plan.compute_tokens ?? 0)} Tokens</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="3"/>
                              </svg>
                              <span>{formatPrice(plan.storage_gb ?? '0')} GB Storage</span>
                            </div>
                          </div>
                        </td>

                        {/* ============================================ */}
                        {/* STATUS COLUMN */}
                        {/* ============================================ */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                            disabled={isActivating || isDeactivating}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                              plan.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } ${(isActivating || isDeactivating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className={`w-2 h-2 rounded-full mr-2 ${plan.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <div className="flex items-center space-x-1 mt-2">
                            {plan.is_public && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                Public
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ============================================ */}
                        {/* ACTIONS COLUMN */}
                        {/* ============================================ */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Details */}
                            <button
                              onClick={() => handleViewDetails(plan)}
                              className="p-2 text-gray-600 hover:text-[#4318ff] hover:bg-[#4318ff]/10 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(plan.id)}
                              disabled={isDuplicating}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Duplicate"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(plan.id, plan.name)}
                              disabled={isDeleting}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ============================================ */}
              {/* PAGINATION */}
              {/* ============================================ */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  {/* Mobile Pagination */}
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>

                  {/* Desktop Pagination */}
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> of{' '}
                        <span className="font-medium">{totalCount}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {/* Previous Button */}
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        {/* Page Numbers */}
                        {(() => {
                          const pageNumbers = [];
                          const maxVisiblePages = 5;
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                          const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                          // Adjust start if we're near the end
                          if (endPage - startPage < maxVisiblePages - 1) {
                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pageNumbers.push(
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === i
                                    ? 'z-10 bg-[#4318ff] border-[#4318ff] text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }
                          return pageNumbers;
                        })()}

                        {/* Next Button */}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* CREATE/EDIT PLAN DRAWER */}
      {/* ============================================ */}
      <CreateEditPlanDrawer
        isOpen={isCreateDrawerOpen}
        onClose={handleCloseDrawer}
        plan={selectedPlan}
        isEditMode={isEditMode}
        onSuccess={handleDrawerSuccess}
      />

      {/* ============================================ */}
      {/* PLAN DETAILS MODAL */}
      {/* ============================================ */}
      {isDetailsModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanTypeBadgeColor(selectedPlan.plan_type)}`}>
                    {selectedPlan.plan_type.charAt(0).toUpperCase() + selectedPlan.plan_type.slice(1)}
                  </span>
                  {selectedPlan.featured && (
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      ⭐ Featured
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Pricing</h3>
                <div className="text-3xl font-bold text-indigo-600">
                  ${formatPrice(selectedPlan.price)}
                  <span className="text-lg text-gray-600 font-normal ml-2">
                    / {getBillingPeriodDisplay(selectedPlan.billing_period)}
                  </span>
                </div>
                {selectedPlan.has_trial && (
                  <p className="text-sm text-green-700 mt-2 font-medium">
                    ✓ {selectedPlan.trial_period_days} day free trial included
                  </p>
                )}
              </div>

              {/* Description */}
              {selectedPlan.description && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedPlan.description}</p>
                </div>
              )}

              {/* Resources */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Resources & Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Agent Instances</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPlan.max_agent_instances || 'Unlimited'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Active Agents</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPlan.max_active_agents || 'Unlimited'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Compute Tokens</p>
                    <p className="text-lg font-semibold text-gray-900">{formatNumber(selectedPlan.compute_tokens || 0)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Storage</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPrice(selectedPlan.storage_gb || '0')} GB</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">API Calls</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPlan.api_calls_limit || 'Unlimited'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Workspaces</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPlan.max_workspaces || 1}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPlan.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedPlan.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPlan.is_public
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedPlan.is_public ? '🌐 Public' : '🔒 Private'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleEditPlan(selectedPlan);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#4318ff] to-[#7c75ff] text-white rounded-lg font-medium hover:from-[#3610d9] hover:to-[#6b63e6] transition-all shadow-sm hover:shadow-md"
              >
                Edit Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManagement;