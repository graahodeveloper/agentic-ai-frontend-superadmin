// components/subscription-model/plan/PlansManagement.tsx
"use client";
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetPlansQuery,
  useDeletePlanMutation,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  Plan,
  CreatePlanRequest,
} from '@/features/subscriptionModel/billing/billingApi';

// ============================================
// TYPES
// ============================================
interface PlansQueryParams {
  search?: string;
  plan_type?: string;
  billing_mode?: string;
  is_active?: boolean;
  ordering?: string;
  limit?: number;
  offset?: number;
}

interface ApiError {
  data?: Record<string, string | string[]>;
  status?: number;
  message?: string;
}

// ============================================
// LOADING COMPONENTS
// ============================================
const LoadingSpinner = () => (
  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center px-6 py-5 border-b border-gray-100">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
        <div className="w-24 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-20 h-8 bg-gray-200 rounded mx-4"></div>
        <div className="w-16 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-20 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
    <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-xl shadow-lg border border-indigo-100">
      <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <span className="text-indigo-700 font-medium">Updating...</span>
    </div>
  </div>
);

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plan: Plan | null;
  isDeleting: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  plan,
  isDeleting,
}) => {
  if (!isOpen || !plan) return null;

  const componentCount = plan.components_count ?? plan.included_components?.length ?? 0;
  const agentCount = plan.agents_count ?? plan.included_agents?.length ?? 0;
  const hasChildData = componentCount > 0 || agentCount > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Plan</h3>
                <p className="text-red-100 text-sm">This action cannot be undone</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold text-gray-900">&quot;{plan.name}&quot;</span>?
            </p>

            {hasChildData && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-2">Associated Data Warning</h4>
                    <p className="text-sm text-amber-700 mb-3">
                      The following linked data will also be removed:
                    </p>
                    <div className="space-y-2">
                      {componentCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-amber-700">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span><strong>{componentCount}</strong> component inclusion{componentCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {agentCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-amber-700">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span><strong>{agentCount}</strong> agent inclusion{agentCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-700 mb-2">Plan Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Type:</div>
                <div className="font-medium text-gray-900 capitalize">{plan.plan_type}</div>
                <div className="text-gray-500">Base Price:</div>
                <div className="font-medium text-gray-900">${parseFloat(plan.base_price).toFixed(2)}</div>
                <div className="text-gray-500">Status:</div>
                <div className={`font-medium ${plan.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 rounded-b-2xl px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// CREATE/EDIT PLAN MODAL
// ============================================
interface CreateEditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  isEditMode: boolean;
  onSuccess?: () => void;
}

const CreateEditPlanModal: React.FC<CreateEditPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  isEditMode,
  onSuccess,
}) => {
  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_type: 'starter' as 'free' | 'starter' | 'professional' | 'enterprise' | 'custom',
    base_price: '',
    billing_period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    billing_mode: 'prepaid' as 'prepaid' | 'postpaid',
    grace_period_days: '7',
    has_trial: false,
    trial_period_days: '0',
    is_active: true,
    is_public: false,
    display_order: '',
    featured: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        plan_type: plan.plan_type,
        base_price: plan.base_price.toString(),
        billing_period: plan.billing_period,
        billing_mode: plan.billing_mode,
        grace_period_days: plan.grace_period_days?.toString() || '7',
        has_trial: plan.has_trial || false,
        trial_period_days: plan.trial_period_days?.toString() || '0',
        is_active: plan.is_active,
        is_public: plan.is_public,
        display_order: plan.display_order?.toString() || '',
        featured: plan.featured,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        plan_type: 'starter',
        base_price: '',
        billing_period: 'monthly',
        billing_mode: 'prepaid',
        grace_period_days: '7',
        has_trial: false,
        trial_period_days: '0',
        is_active: true,
        is_public: false,
        display_order: '',
        featured: false,
      });
    }
    setErrors({});
  }, [isEditMode, plan, isOpen]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    // Price validation - skip for free plans (auto-set to 0)
    if (formData.plan_type !== 'free') {
      if (!formData.base_price || parseFloat(formData.base_price) < 0) {
        newErrors.base_price = 'Valid price is required';
      }

      if (formData.grace_period_days && parseInt(formData.grace_period_days) < 0) {
        newErrors.grace_period_days = 'Grace period cannot be negative';
      }
    }

    // Validate trial period days when trial is enabled
    if (formData.has_trial) {
      const trialDays = parseInt(formData.trial_period_days);
      if (!formData.trial_period_days || trialDays <= 0) {
        newErrors.trial_period_days = 'Trial period must be at least 1 day';
      } else if (trialDays > 365) {
        newErrors.trial_period_days = 'Trial period cannot exceed 365 days';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // For free plans, auto-set pricing fields
      const isFreePlan = formData.plan_type === 'free';

      const planData: CreatePlanRequest = {
        name: formData.name,
        description: formData.description || undefined,
        plan_type: formData.plan_type,
        base_price: isFreePlan ? 0 : parseFloat(formData.base_price || '0'),
        billing_period: isFreePlan ? 'monthly' : formData.billing_period,
        billing_mode: isFreePlan ? 'prepaid' : formData.billing_mode,
        grace_period_days: isFreePlan ? 0 : (formData.grace_period_days ? parseInt(formData.grace_period_days) : 7),
        has_trial: formData.has_trial,
        trial_period_days: formData.has_trial ? parseInt(formData.trial_period_days) : 0,
        is_active: formData.is_active,
        is_public: formData.is_public,
        display_order: formData.display_order ? parseInt(formData.display_order) : 0,
        featured: formData.featured,
      };

      if (isEditMode && plan) {
        await updatePlan({ id: plan.id, data: planData }).unwrap();
      } else {
        await createPlan(planData).unwrap();
      }

      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save plan:', error);
      const apiError = error as ApiError;
      if (apiError.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(apiError.data).forEach((key) => {
          const errorValue = apiError.data![key];
          apiErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setErrors(apiErrors);
      }
    }
  }, [formData, isEditMode, plan, validateForm, createPlan, updatePlan, onSuccess, onClose]);

  const handleInputChange = useCallback((field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {isEditMode ? 'Edit Plan' : 'Create New Plan'}
                  </h3>
                  <p className="text-indigo-100 text-sm">
                    {isEditMode ? 'Update plan details and configuration' : 'Configure a new subscription plan'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Plan Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g., Professional Plan"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                placeholder="Brief description of this plan..."
              />
            </div>

            {/* Plan Type & Display Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Plan Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => {
                    handleInputChange('plan_type', e.target.value);
                    // Auto-set defaults for free plan
                    if (e.target.value === 'free') {
                      handleInputChange('base_price', '0');
                      handleInputChange('billing_mode', 'prepaid');
                      handleInputChange('billing_period', 'monthly');
                      handleInputChange('grace_period_days', '0');
                      // Enable trial by default for free plans
                      if (!formData.has_trial) {
                        handleInputChange('has_trial', true);
                        handleInputChange('trial_period_days', '14');
                      }
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* FREE PLAN: Trial Period Settings (Shown at Top for Free Plans) */}
            {formData.plan_type === 'free' && (
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-5 border border-emerald-200/60">
                {/* Header with Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Free Trial Duration</h3>
                      <p className="text-xs text-gray-500">Set how long users can access this free plan</p>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('has_trial', !formData.has_trial);
                      if (!formData.has_trial && formData.trial_period_days === '0') {
                        handleInputChange('trial_period_days', '14');
                      }
                    }}
                    disabled={isLoading}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.has_trial
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                        formData.has_trial ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Trial Duration Options */}
                {formData.has_trial ? (
                  <div className="space-y-4">
                    {/* Quick Presets */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Quick Select
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { days: 7, label: '7 days' },
                          { days: 14, label: '14 days' },
                          { days: 30, label: '30 days' },
                          { days: 60, label: '60 days' },
                        ].map((option) => {
                          const isSelected = parseInt(formData.trial_period_days) === option.days;
                          return (
                            <button
                              key={option.days}
                              type="button"
                              onClick={() => handleInputChange('trial_period_days', option.days.toString())}
                              disabled={isLoading}
                              className={`relative px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                                isSelected
                                  ? 'bg-white border-emerald-500 text-emerald-700 shadow-md'
                                  : 'bg-white/60 border-transparent text-gray-600 hover:border-emerald-200 hover:bg-white'
                              } disabled:opacity-50`}
                            >
                              {option.days === 14 && (
                                <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-bold rounded-full">
                                  POPULAR
                                </span>
                              )}
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Manual Input */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Or Enter Custom Days
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.trial_period_days}
                          onChange={(e) => handleInputChange('trial_period_days', e.target.value)}
                          disabled={isLoading}
                          className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            errors.trial_period_days ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="Enter number of days"
                          min="1"
                          max="365"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                          days
                        </span>
                      </div>
                      {errors.trial_period_days && (
                        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.trial_period_days}
                        </p>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="bg-white/80 rounded-lg p-3 border border-emerald-100">
                      <p className="text-sm text-gray-700">
                        Users will have <span className="font-bold text-emerald-600">{formData.trial_period_days} days</span> of free access.
                        After the trial expires, they&apos;ll need to upgrade to continue.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">Unlimited access:</span> Without a trial period, users can use this free plan forever. Enable trial to set a time limit.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PAID PLANS: Pricing Section */}
            {formData.plan_type !== 'free' && (
              <>
                {/* Base Price & Billing Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Base Price (USD) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.base_price}
                        onChange={(e) => handleInputChange('base_price', e.target.value)}
                        disabled={isLoading}
                        className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.base_price ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    {errors.base_price && <p className="mt-1 text-sm text-red-600">{errors.base_price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Billing Period <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.billing_period}
                      onChange={(e) => handleInputChange('billing_period', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Billing Mode & Grace Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Billing Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.billing_mode}
                      onChange={(e) => handleInputChange('billing_mode', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="prepaid">Prepaid (Pay first, use later)</option>
                      <option value="postpaid">Postpaid (Use first, pay later)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Grace Period (Days)
                    </label>
                    <input
                      type="number"
                      value={formData.grace_period_days}
                      onChange={(e) => handleInputChange('grace_period_days', e.target.value)}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.grace_period_days ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="7"
                      min="0"
                    />
                    {errors.grace_period_days && <p className="mt-1 text-sm text-red-600">{errors.grace_period_days}</p>}
                  </div>
                </div>
              </>
            )}

            {/* PAID PLANS: Trial Period Settings */}
            {formData.plan_type !== 'free' && (
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-5 space-y-4 border border-violet-200/60">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Free Trial Period</h3>
                      <p className="text-xs text-gray-500">Let users try before they buy</p>
                    </div>
                  </div>
                  {/* Master Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('has_trial', !formData.has_trial);
                      if (!formData.has_trial && formData.trial_period_days === '0') {
                        handleInputChange('trial_period_days', '14');
                      }
                    }}
                    disabled={isLoading}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.has_trial
                        ? 'bg-gradient-to-r from-violet-500 to-indigo-600 shadow-lg shadow-violet-200'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                        formData.has_trial ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Trial Configuration - Animated Expansion */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  formData.has_trial ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="pt-4 space-y-4">
                    {/* Quick Duration Presets */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Quick Select
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { days: 7, label: '7 days' },
                          { days: 14, label: '14 days' },
                          { days: 30, label: '30 days' },
                          { days: 60, label: '60 days' },
                        ].map((option) => {
                          const isSelected = parseInt(formData.trial_period_days) === option.days;
                          return (
                            <button
                              key={option.days}
                              type="button"
                              onClick={() => handleInputChange('trial_period_days', option.days.toString())}
                              disabled={isLoading}
                              className={`relative px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                                isSelected
                                  ? 'bg-white border-violet-500 text-violet-700 shadow-md'
                                  : 'bg-white/50 border-transparent text-gray-600 hover:border-violet-200 hover:bg-white'
                              } disabled:opacity-50`}
                            >
                              {option.days === 14 && (
                                <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-bold rounded-full">
                                  POPULAR
                                </span>
                              )}
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Manual Input */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Or Enter Custom Days
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.trial_period_days}
                          onChange={(e) => handleInputChange('trial_period_days', e.target.value)}
                          disabled={isLoading}
                          className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            errors.trial_period_days ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="Enter number of days"
                          min="1"
                          max="365"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                          days
                        </span>
                      </div>
                      {errors.trial_period_days && (
                        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.trial_period_days}
                        </p>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="bg-white/80 rounded-lg p-3 border border-violet-100">
                      <p className="text-sm text-gray-700">
                        Users will have <span className="font-bold text-violet-600">{formData.trial_period_days} days</span> of free access
                        before billing starts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collapsed State Info */}
                {!formData.has_trial && (
                  <p className="text-xs text-gray-500 pl-13">
                    Enable to offer a free trial period for new subscribers
                  </p>
                )}
              </div>
            )}

            {/* Status Toggles */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Plan Status</h3>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Active</p>
                  <p className="text-sm text-gray-500">Plan is available for subscription</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('is_active', !formData.is_active)}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.is_active ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Public</p>
                  <p className="text-sm text-gray-500">Visible to all users</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('is_public', !formData.is_public)}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.is_public ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_public ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Featured</p>
                  <p className="text-sm text-gray-500">Highlight this plan in listings</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('featured', !formData.featured)}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.featured ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.featured ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-indigo-900 mb-1">Next Steps</h4>
                  <p className="text-sm text-indigo-800">
                    After creating the plan, you can add components and agents to build the complete offering.
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 rounded-b-2xl px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{isEditMode ? 'Update Plan' : 'Create Plan'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const PlansManagement = () => {
  const router = useRouter();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [planTypeFilter, setPlanTypeFilter] = useState<string>('all');
  const [billingModeFilter, setBillingModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Build query params with proper typing
  const queryParams = useMemo<PlansQueryParams>(() => {
    const params: PlansQueryParams = {
      ordering: '-created_at',
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    };
    if (searchTerm) params.search = searchTerm;
    if (planTypeFilter !== 'all') params.plan_type = planTypeFilter;
    if (billingModeFilter !== 'all') params.billing_mode = billingModeFilter;
    if (statusFilter === 'active') params.is_active = true;
    if (statusFilter === 'inactive') params.is_active = false;
    return params;
  }, [searchTerm, planTypeFilter, billingModeFilter, statusFilter, currentPage, pageSize]);

  const { data: plansData, isLoading, isFetching, refetch } = useGetPlansQuery(queryParams);
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation();

  const plans = useMemo(() => plansData?.results || [], [plansData]);
  const totalCount = plansData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, planTypeFilter, billingModeFilter, statusFilter, pageSize]);

  // Handlers
  const handleOpenDeleteModal = useCallback((plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setPlanToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!planToDelete) return;

    try {
      await deletePlan(planToDelete.id).unwrap();
      handleCloseDeleteModal();
      refetch();
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  }, [planToDelete, deletePlan, handleCloseDeleteModal, refetch]);

  const handleOpenCreateModal = useCallback(() => {
    setSelectedPlan(null);
    setIsEditMode(false);
    setIsCreateModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((plan: Plan) => {
    setSelectedPlan(plan);
    setIsEditMode(true);
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setSelectedPlan(null);
    setIsEditMode(false);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Memoized badge colors
  const getBadgeColor = useCallback((planType: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-indigo-100 text-indigo-800',
      custom: 'bg-pink-100 text-pink-800',
    };
    return colors[planType] || 'bg-gray-100 text-gray-800';
  }, []);

  // Pagination info
  const paginationInfo = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return { start, end };
  }, [currentPage, pageSize, totalCount]);

  return (
    <div className="w-full min-h-screen p-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                Subscription Plans
              </h1>
              <p className="text-gray-600 mt-2">
                Manage subscription plans ({totalCount} total)
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Plan</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <select
              value={planTypeFilter}
              onChange={(e) => setPlanTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px] bg-white"
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
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px] bg-white"
            >
              <option value="all">All Modes</option>
              <option value="prepaid">Prepaid</option>
              <option value="postpaid">Postpaid</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px] bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Plans Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          {/* Loading overlay for refetch */}
          {isFetching && !isLoading && <LoadingOverlay />}

          {isLoading ? (
            <TableSkeleton rows={pageSize} />
          ) : plans.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No plans found</h3>
                <p className="mt-2 text-gray-600">Get started by creating your first plan</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create First Plan
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pricing</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trial</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Inclusions</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-semibold text-gray-900">{plan.name}</div>
                            {plan.featured && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Featured
                              </span>
                            )}
                          </div>
                          {plan.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">{plan.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(plan.plan_type)}`}>
                            {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-bold text-gray-900">${parseFloat(plan.base_price).toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Base / {plan.billing_period}</div>
                        </td>
                        <td className="px-6 py-5">
                          {plan.has_trial && plan.trial_period_days > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-violet-700">{plan.trial_period_days} days</div>
                                <div className="text-xs text-gray-500">Free trial</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No trial</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs text-gray-600 space-y-1.5">
                            <button
                              onClick={() => router.push(`/dashboard/subscription/link-components?plan=${plan.id}`)}
                              className="flex items-center gap-2 hover:text-indigo-600 transition-colors group w-full"
                            >
                              <div className="w-5 h-5 rounded bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                                <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                              </div>
                              <span className="group-hover:underline">{plan.components_count ?? plan.included_components?.length ?? 0} Components</span>
                              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/subscription/link-agents?plan=${plan.id}`)}
                              className="flex items-center gap-2 hover:text-purple-600 transition-colors group w-full"
                            >
                              <div className="w-5 h-5 rounded bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="group-hover:underline">{plan.agents_count ?? plan.included_agents?.length ?? 0} Agents</span>
                              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              plan.billing_mode === 'prepaid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {plan.billing_mode.charAt(0).toUpperCase() + plan.billing_mode.slice(1)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-2">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              plan.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {plan.is_public && (
                              <div>
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-medium">
                                  Public
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(plan)}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(plan)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

              {/* Pagination */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Left side - Results info */}
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{paginationInfo.start}</span> to{' '}
                    <span className="font-semibold text-gray-900">{paginationInfo.end}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalCount}</span> results
                  </div>

                  {/* Center - Page size selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {/* Right side - Pagination controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                              currentPage === pageNum
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateEditPlanModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        plan={selectedPlan}
        isEditMode={isEditMode}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        plan={planToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default PlansManagement;
