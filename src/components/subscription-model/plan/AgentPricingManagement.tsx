// components/subscription-model/plan/AgentPricingManagement.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useGetAgentPricingQuery,
  useCreateAgentPricingMutation,
  useUpdateAgentPricingMutation,
  useDeleteAgentPricingMutation,
  AgentPricing,
} from '@/features/subscriptionModel/billing/billingApi';
import { useGetAgentTemplatesByAdminIdQuery } from '@/features/agentTemplateApi/agentTemplateApi';

// ============================================
// TYPES
// ============================================
interface AgentTemplate {
  id: string;
  name: string;
  agent_type: string;
  agent_category?: string;
}

interface FormData {
  agent_id: string;
  name: string;
  description: string;
  price: string;
  billing_period: string;
  billing_method: string;
  promotion_code: string;
  promotion_valid_from: string;
  promotion_valid_until: string;
  discount_percentage: string;
  estimated_tokens_per_use: number;
  estimated_storage_mb: string;
  is_active: boolean;
  is_default: boolean;
}

interface ApiError {
  data?: Record<string, string | string[]>;
  message?: string;
}

type ExtendedAgentPricing = AgentPricing & {
  billing_period?: string;
  billing_method?: 'prepaid' | 'postpaid' | 'pay_as_you_go' | 'subscription';
};

// ============================================
// CONSTANTS
// ============================================
const DEFAULT_FORM_DATA: FormData = {
  agent_id: '',
  name: '',
  description: '',
  price: '',
  billing_period: 'monthly',
  billing_method: 'prepaid',
  promotion_code: '',
  promotion_valid_from: '',
  promotion_valid_until: '',
  discount_percentage: '',
  estimated_tokens_per_use: 0,
  estimated_storage_mb: '',
  is_active: true,
  is_default: false,
};

const BILLING_PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one_time', label: 'One-Time' },
  { value: 'per_use', label: 'Per Use' },
];

const BILLING_METHOD_OPTIONS = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'postpaid', label: 'Postpaid' },
  { value: 'pay_as_you_go', label: 'Pay As You Go' },
  { value: 'subscription', label: 'Subscription' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

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
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-100 rounded w-1/4"></div>
        </div>
        <div className="w-32 space-y-2 mx-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-100 rounded w-2/3"></div>
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded mx-4"></div>
        <div className="w-24 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-24 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-20 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-16 h-6 bg-gray-200 rounded-full mx-4"></div>
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
  pricing: ExtendedAgentPricing | null;
  isDeleting: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pricing,
  isDeleting,
}) => {
  if (!isOpen || !pricing) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Agent Pricing</h3>
                <p className="text-red-100 text-sm">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold text-gray-900">&quot;{pricing.name}&quot;</span>?
            </p>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-700 mb-2">Pricing Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Agent:</div>
                <div className="font-medium text-gray-900">{pricing.agent_name}</div>
                <div className="text-gray-500">Price:</div>
                <div className="font-medium text-gray-900">${parseFloat(pricing.price).toFixed(2)}</div>
                <div className="text-gray-500">Status:</div>
                <div className={`font-medium ${pricing.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {pricing.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

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
                  <span>Delete Pricing</span>
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
// CREATE/EDIT MODAL
// ============================================
interface CreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricing: ExtendedAgentPricing | null;
  isEditMode: boolean;
  agentTemplates: AgentTemplate[];
  onSuccess: () => void;
}

const CreateEditModal: React.FC<CreateEditModalProps> = ({
  isOpen,
  onClose,
  pricing,
  isEditMode,
  agentTemplates,
  onSuccess,
}) => {
  const [createPricing, { isLoading: isCreating }] = useCreateAgentPricingMutation();
  const [updatePricing, { isLoading: isUpdating }] = useUpdateAgentPricingMutation();
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && pricing) {
      setFormData({
        agent_id: pricing.agent_id,
        name: pricing.name,
        description: pricing.description || '',
        price: pricing.price,
        billing_period: pricing.billing_period || 'monthly',
        billing_method: pricing.billing_method || 'prepaid',
        promotion_code: pricing.promotion_code || '',
        promotion_valid_from: pricing.promotion_valid_from ? pricing.promotion_valid_from.split('T')[0] : '',
        promotion_valid_until: pricing.promotion_valid_until ? pricing.promotion_valid_until.split('T')[0] : '',
        discount_percentage: pricing.discount_percentage?.toString() || '',
        estimated_tokens_per_use: pricing.estimated_tokens_per_use,
        estimated_storage_mb: pricing.estimated_storage_mb,
        is_active: pricing.is_active,
        is_default: pricing.is_default,
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
    setErrors({});
  }, [isEditMode, pricing, isOpen]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.agent_id) newErrors.agent_id = 'Agent is required';
    if (!formData.name.trim()) newErrors.name = 'Pricing name is required';
    if (!formData.price || parseFloat(formData.price) < 0) newErrors.price = 'Valid price is required';

    if (formData.discount_percentage) {
      const discount = parseFloat(formData.discount_percentage);
      if (discount < 0 || discount > 100) newErrors.discount_percentage = 'Discount must be between 0 and 100';
    }

    if (formData.promotion_valid_from && formData.promotion_valid_until) {
      if (new Date(formData.promotion_valid_until) < new Date(formData.promotion_valid_from)) {
        newErrors.promotion_valid_until = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const apiData = {
      agent: formData.agent_id,
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      billing_period: formData.billing_period,
      billing_method: formData.billing_method as 'prepaid' | 'postpaid' | 'pay_as_you_go' | 'subscription',
      promotion_code: formData.promotion_code || null,
      promotion_valid_from: formData.promotion_valid_from || null,
      promotion_valid_until: formData.promotion_valid_until || null,
      discount_percentage: formData.discount_percentage || null,
      estimated_tokens_per_use: formData.estimated_tokens_per_use || 0,
      estimated_storage_mb: formData.estimated_storage_mb || '0',
      is_active: formData.is_active,
      is_default: formData.is_default,
    };

    try {
      if (isEditMode && pricing) {
        await updatePricing({ id: pricing.id, data: apiData }).unwrap();
      } else {
        await createPricing(apiData).unwrap();
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save agent pricing:', error);
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
  }, [formData, isEditMode, pricing, validateForm, createPricing, updatePricing, onSuccess, onClose]);

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
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {isEditMode ? 'Edit Agent Pricing' : 'Create Agent Pricing'}
                  </h3>
                  <p className="text-indigo-100 text-sm">
                    {isEditMode ? 'Update pricing configuration' : 'Define pricing for an agent'}
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
            {/* Agent Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent Template <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.agent_id}
                onChange={(e) => handleInputChange('agent_id', e.target.value)}
                disabled={isEditMode || isLoading}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.agent_id ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">-- Select an Agent --</option>
                {agentTemplates.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.agent_type})
                  </option>
                ))}
              </select>
              {errors.agent_id && <p className="mt-1 text-sm text-red-600">{errors.agent_id}</p>}
            </div>

            {/* Pricing Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pricing Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100 ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g., Basic, Pro, Enterprise"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100 resize-none"
                placeholder="Brief description of this pricing tier..."
              />
            </div>

            {/* Price, Billing Period, Billing Method */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    disabled={isLoading}
                    className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100 ${
                      errors.price ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Billing Period</label>
                <select
                  value={formData.billing_period}
                  onChange={(e) => handleInputChange('billing_period', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
                >
                  {BILLING_PERIOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Billing Method</label>
                <select
                  value={formData.billing_method}
                  onChange={(e) => handleInputChange('billing_method', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
                >
                  {BILLING_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Promotion Section */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Promotional Pricing <span className="text-gray-500 font-normal ml-1">(Optional)</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Promotion Code</label>
                    <input
                      type="text"
                      value={formData.promotion_code}
                      onChange={(e) => handleInputChange('promotion_code', e.target.value.toUpperCase())}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:bg-gray-100"
                      placeholder="LAUNCH50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => handleInputChange('discount_percentage', e.target.value)}
                        disabled={isLoading}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:bg-gray-100 ${
                          errors.discount_percentage ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    {errors.discount_percentage && <p className="mt-1 text-sm text-red-600">{errors.discount_percentage}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Valid From</label>
                    <input
                      type="date"
                      value={formData.promotion_valid_from}
                      onChange={(e) => handleInputChange('promotion_valid_from', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Valid Until</label>
                    <input
                      type="date"
                      value={formData.promotion_valid_until}
                      onChange={(e) => handleInputChange('promotion_valid_until', e.target.value)}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:bg-gray-100 ${
                        errors.promotion_valid_until ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {errors.promotion_valid_until && <p className="mt-1 text-sm text-red-600">{errors.promotion_valid_until}</p>}
                  </div>
                </div>

                {/* Promotion Preview */}
                {formData.discount_percentage && formData.price && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Discounted Price</p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${(parseFloat(formData.price) * (1 - parseFloat(formData.discount_percentage) / 100)).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 line-through">${parseFloat(formData.price).toFixed(2)}</p>
                        <p className="text-sm font-semibold text-green-600">Save {formData.discount_percentage}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Toggles */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Status Settings</h3>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Active</p>
                  <p className="text-sm text-gray-500">Pricing is available for use</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('is_active', !formData.is_active)}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    formData.is_active ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Default Pricing</p>
                  <p className="text-sm text-gray-500">Use as default for this agent</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('is_default', !formData.is_default)}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    formData.is_default ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_default ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
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
                  <span>{isEditMode ? 'Update Pricing' : 'Create Pricing'}</span>
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
const AgentPricingManagement = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingMethodFilter, setBillingMethodFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<ExtendedAgentPricing | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pricingToDelete, setPricingToDelete] = useState<ExtendedAgentPricing | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get admin ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminUser = localStorage.getItem('superAdminUser');
      if (adminUser) {
        try {
          setAdminId(JSON.parse(adminUser).id);
        } catch (error) {
          console.error('Failed to parse admin user:', error);
        }
      }
    }
  }, []);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      ordering: '-created_at',
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    };
    if (searchTerm) params.search = searchTerm;
    if (statusFilter === 'active') params.is_active = true;
    if (statusFilter === 'inactive') params.is_active = false;
    if (billingMethodFilter !== 'all') params.billing_method = billingMethodFilter;
    return params;
  }, [searchTerm, statusFilter, billingMethodFilter, currentPage, pageSize]);

  // API Hooks
  const { data: agentTemplatesData } = useGetAgentTemplatesByAdminIdQuery(adminId!, { skip: !adminId });
  const { data: pricingResponse, isLoading, isFetching, refetch } = useGetAgentPricingQuery(queryParams);
  const [deletePricing, { isLoading: isDeleting }] = useDeleteAgentPricingMutation();

  const agentTemplates: AgentTemplate[] = useMemo(() => agentTemplatesData?.results || [], [agentTemplatesData]);
  const pricingOptions = useMemo(() => (pricingResponse?.results || []) as ExtendedAgentPricing[], [pricingResponse]);
  const totalCount = pricingResponse?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, billingMethodFilter, pageSize]);

  // Handlers
  const handleOpenCreateModal = useCallback(() => {
    setSelectedPricing(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((pricing: ExtendedAgentPricing) => {
    setSelectedPricing(pricing);
    setIsEditMode(true);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPricing(null);
    setIsEditMode(false);
  }, []);

  const handleOpenDeleteModal = useCallback((pricing: ExtendedAgentPricing) => {
    setPricingToDelete(pricing);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setPricingToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!pricingToDelete) return;
    try {
      await deletePricing(pricingToDelete.id).unwrap();
      handleCloseDeleteModal();
      refetch();
    } catch (error) {
      console.error('Failed to delete pricing:', error);
    }
  }, [pricingToDelete, deletePricing, handleCloseDeleteModal, refetch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Helpers
  const getBillingPeriodLabel = useCallback((value: string) =>
    BILLING_PERIOD_OPTIONS.find((o) => o.value === value)?.label || value,
  []);

  const getBillingMethodLabel = useCallback((value: string) =>
    BILLING_METHOD_OPTIONS.find((o) => o.value === value)?.label || value.replace(/_/g, ' '),
  []);

  // Pagination info
  const paginationInfo = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return { start, end };
  }, [currentPage, pageSize, totalCount]);

  const showOverlay = isFetching && !isLoading;

  return (
    <div className="w-full min-h-screen p-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                Agent Pricing
              </h1>
              <p className="text-gray-600 mt-2">
                Manage pricing options for AI agents ({totalCount} total)
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Pricing</span>
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
                placeholder="Search agent pricing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px] bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={billingMethodFilter}
              onChange={(e) => setBillingMethodFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[160px] bg-white"
            >
              <option value="all">All Methods</option>
              {BILLING_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          {showOverlay && <LoadingOverlay />}

          {isLoading ? (
            <TableSkeleton rows={pageSize} />
          ) : pricingOptions.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No pricing options found</h3>
                <p className="mt-2 text-gray-600">Get started by creating your first pricing option</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create First Pricing
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pricing</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Billing Period</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Promotion</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pricingOptions.map((pricing) => (
                      <tr key={pricing.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="text-sm font-semibold text-gray-900">{pricing.agent_name}</div>
                          <div className="text-xs text-gray-500">ID: {pricing.agent_id.substring(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900">{pricing.name}</div>
                            {pricing.is_default && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          {pricing.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-xs">{pricing.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-bold text-gray-900">${parseFloat(pricing.price).toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {getBillingPeriodLabel(pricing.billing_period || 'monthly')}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {getBillingMethodLabel(pricing.billing_method || 'prepaid')}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {pricing.promotion_code ? (
                            <div className="text-xs">
                              <div className="font-semibold text-purple-600">{pricing.promotion_code}</div>
                              {pricing.discount_percentage && (
                                <div className="text-green-600 font-medium">-{pricing.discount_percentage}%</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No promotion</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            pricing.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {pricing.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(pricing)}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(pricing)}
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
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{paginationInfo.start}</span> to{' '}
                    <span className="font-semibold text-gray-900">{paginationInfo.end}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalCount}</span> results
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

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
      <CreateEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pricing={selectedPricing}
        isEditMode={isEditMode}
        agentTemplates={agentTemplates}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        pricing={pricingToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AgentPricingManagement;
