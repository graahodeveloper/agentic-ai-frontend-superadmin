// components/subscription-model/plan/PlansManagement.tsx
"use client";
import React, { useState } from 'react';
import {
  useGetPlansQuery,
  useDeletePlanMutation,
  useDuplicatePlanMutation,
  Plan,
} from '@/features/subscriptionModel/billing/billingApi';
import CreateEditPlanDrawer from './CreateEditPlanDrawer';
import PlanDetailsModal from './PlanDetailsModal';


const PlansManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [planTypeFilter, setPlanTypeFilter] = useState<string>('all');
  const [billingModeFilter, setBillingModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Build query params
  const queryParams: any = {};
  if (searchTerm) queryParams.search = searchTerm;
  if (planTypeFilter !== 'all') queryParams.plan_type = planTypeFilter;
  if (billingModeFilter !== 'all') queryParams.billing_mode = billingModeFilter;
  if (statusFilter === 'active') queryParams.is_active = true;
  if (statusFilter === 'inactive') queryParams.is_active = false;

  const { data: plansData, isLoading, refetch } = useGetPlansQuery(queryParams);
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation();
  const [duplicatePlan, { isLoading: isDuplicating }] = useDuplicatePlanMutation();

  const plans = plansData?.results || [];
  const totalCount = plansData?.count || 0;

  const handleDelete = async (planId: string, planName: string) => {
    if (window.confirm(`Delete "${planName}"? This cannot be undone.`)) {
      try {
        await deletePlan(planId).unwrap();
        refetch();
      } catch (error) {
        console.error('Failed to delete plan:', error);
        alert('Failed to delete plan');
      }
    }
  };

  const handleDuplicate = async (planId: string) => {
    try {
      await duplicatePlan(planId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to duplicate plan:', error);
      alert('Failed to duplicate plan');
    }
  };

  const getBadgeColor = (planType: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-indigo-100 text-indigo-800',
      custom: 'bg-pink-100 text-pink-800',
    };
    return colors[planType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                Subscription Plans
              </h1>
              <p className="text-gray-600 mt-2">
                Manage subscription plans ({totalCount} total)
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPlan(null);
                setIsEditMode(false);
                setIsCreateDrawerOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Plan</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <select
              value={planTypeFilter}
              onChange={(e) => setPlanTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px]"
            >
              <option value="all">All Types</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={billingModeFilter}
              onChange={(e) => setBillingModeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px]"
            >
              <option value="all">All Modes</option>
              <option value="prepaid">Prepaid</option>
              <option value="postpaid">Postpaid</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Plans Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading plans...</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No plans found</h3>
                <p className="mt-2 text-gray-600">Get started by creating your first plan</p>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setIsEditMode(false);
                    setIsCreateDrawerOpen(true);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create First Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Plan Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Pricing</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Inclusions</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-semibold text-gray-900">{plan.name}</div>
                          {plan.featured && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                        {plan.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">{plan.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(plan.plan_type)}`}>
                          {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">${parseFloat(plan.base_price).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Base / {plan.billing_period}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>{plan.included_components?.length || 0} Components</div>
                          <div>{plan.included_agents?.length || 0} Agents</div>
                          <div className={`font-medium ${plan.billing_mode === 'prepaid' ? 'text-green-600' : 'text-blue-600'}`}>
                            {plan.billing_mode.charAt(0).toUpperCase() + plan.billing_mode.slice(1)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {plan.is_public && (
                          <div className="mt-2">
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Public</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDuplicate(plan.id)}
                            disabled={isDuplicating}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Duplicate"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button> */}
                          <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              setIsEditMode(true);
                              setIsCreateDrawerOpen(true);
                            }}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id, plan.name)}
                            disabled={isDeleting}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
          )}
        </div>
      </div>

      <CreateEditPlanDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => {
          setIsCreateDrawerOpen(false);
          setSelectedPlan(null);
          setIsEditMode(false);
        }}
        plan={selectedPlan}
        isEditMode={isEditMode}
        onSuccess={() => refetch()}
      />

      {isDetailsModalOpen && selectedPlan && (
        <PlanDetailsModal
          plan={selectedPlan}
          onClose={() => setIsDetailsModalOpen(false)}
          onEdit={() => {
            setIsDetailsModalOpen(false);
            setIsEditMode(true);
            setIsCreateDrawerOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default PlansManagement;