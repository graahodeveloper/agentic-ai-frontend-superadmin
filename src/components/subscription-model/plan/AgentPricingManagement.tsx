// components/subscription-model/plan/AgentPricingManagement.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  useGetAgentPricingQuery,
  useCreateAgentPricingMutation,
  useUpdateAgentPricingMutation,
  useDeleteAgentPricingMutation,
  AgentPricing,
} from '@/features/subscriptionModel/billing/billingApi';
import { useGetAgentTemplatesByAdminIdQuery } from '@/features/agentTemplateApi/agentTemplateApi';

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

const defaultFormData: FormData = {
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

const billingPeriodOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one_time', label: 'One-Time' },
  { value: 'per_use', label: 'Per Use' },
];

const billingMethodOptions = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'postpaid', label: 'Postpaid' },
  { value: 'pay_as_you_go', label: 'Pay As You Go' },
  { value: 'subscription', label: 'Subscription' },
];

const AgentPricingManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<AgentPricing | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminUser = localStorage.getItem('superAdminUser');
      if (adminUser) {
        try {
          const parsed = JSON.parse(adminUser);
          setAdminId(parsed.id);
        } catch (error) {
          console.error('Failed to parse admin user:', error);
        }
      }
    }
  }, []);

  const { data: agentTemplatesData } = useGetAgentTemplatesByAdminIdQuery(adminId!, {
    skip: !adminId,
  });

  const queryParams: Record<string, any> = {};
  if (searchTerm) queryParams.search = searchTerm;
  if (statusFilter === 'active') queryParams.is_active = true;
  if (statusFilter === 'inactive') queryParams.is_active = false;

  const { data: pricingResponse, isLoading, isError, isFetching } = useGetAgentPricingQuery(queryParams);
  const [createPricing, { isLoading: isCreating }] = useCreateAgentPricingMutation();
  const [updatePricing, { isLoading: isUpdating }] = useUpdateAgentPricingMutation();
  const [deletePricing, { isLoading: isDeleting }] = useDeleteAgentPricingMutation();

  const pricingOptions = pricingResponse?.results || [];
  const agentTemplates: AgentTemplate[] = agentTemplatesData?.results || [];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.agent_id) {
      newErrors.agent_id = 'Agent is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Pricing name is required';
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }
    if (formData.discount_percentage) {
      const discount = parseFloat(formData.discount_percentage);
      if (discount < 0 || discount > 100) {
        newErrors.discount_percentage = 'Discount must be between 0 and 100';
      }
    }
    if (formData.promotion_valid_from && formData.promotion_valid_until) {
      const startDate = new Date(formData.promotion_valid_from);
      const endDate = new Date(formData.promotion_valid_until);
      if (endDate < startDate) {
        newErrors.promotion_valid_until = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildApiData = () => ({
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
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await createPricing(buildApiData()).unwrap();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to create agent pricing:', error);
      if (error.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(error.data).forEach((key) => {
          const errorValue = error.data[key];
          apiErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setErrors(apiErrors);
      } else {
        alert(`Failed to create agent pricing: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPricing) return;
    if (!validateForm()) return;
    try {
      await updatePricing({ id: selectedPricing.id, data: buildApiData() }).unwrap();
      setIsEditModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to update agent pricing:', error);
      if (error.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(error.data).forEach((key) => {
          const errorValue = error.data[key];
          apiErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setErrors(apiErrors);
      } else {
        alert(`Failed to update agent pricing: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        await deletePricing(id).unwrap();
      } catch (error: any) {
        console.error('Failed to delete agent pricing:', error);
        alert(`Failed to delete agent pricing: ${error.data?.message || error.message || 'Unknown error'}`);
      }
    }
  };

  const handleEdit = (pricing: AgentPricing) => {
    setSelectedPricing(pricing);
    setFormData({
      agent_id: pricing.agent_id,
      name: pricing.name,
      description: pricing.description || '',
      price: pricing.price,
      billing_period: (pricing as any).billing_period || 'monthly',
      billing_method: (pricing as any).billing_method || 'prepaid',
      promotion_code: pricing.promotion_code || '',
      promotion_valid_from: pricing.promotion_valid_from
        ? pricing.promotion_valid_from.split('T')[0]
        : '',
      promotion_valid_until: pricing.promotion_valid_until
        ? pricing.promotion_valid_until.split('T')[0]
        : '',
      discount_percentage: pricing.discount_percentage?.toString() || '',
      estimated_tokens_per_use: pricing.estimated_tokens_per_use,
      estimated_storage_mb: pricing.estimated_storage_mb,
      is_active: pricing.is_active,
      is_default: pricing.is_default,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setSelectedPricing(null);
    setErrors({});
  };

  const getBillingPeriodLabel = (value: string) =>
    billingPeriodOptions.find((o) => o.value === value)?.label || value;

  const isOperating = isCreating || isUpdating || isDeleting;

  return (
    <div className="w-full min-h-screen p-8">
      <div className="max-w-7xl mx-auto">

        {/* ─── Header ─────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                Agent Pricing
              </h1>
              <p className="text-gray-600 mt-2">
                Manage pricing options for AI agents ({pricingResponse?.count || 0} total)
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isOperating}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Pricing</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <input
              type="text"
              placeholder="Search agent pricing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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

        {/* ─── Table ──────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading agent pricing...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait</p>
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Error loading pricing options</h3>
                <p className="mt-2 text-gray-600">Please try again later</p>
              </div>
            </div>
          ) : pricingOptions.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No pricing options found</h3>
                <p className="mt-2 text-gray-600">Get started by creating your first pricing option</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create First Pricing
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Agent</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Pricing Option</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Billing Period</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Billing Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Promotion</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pricingOptions.map((pricing) => (
                    <tr key={pricing.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{pricing.agent_name}</div>
                        <div className="text-xs text-gray-500">ID: {pricing.agent_id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{pricing.name}</div>
                        {pricing.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">{pricing.description}</div>
                        )}
                        {pricing.is_default && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          ${parseFloat(pricing.price).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {getBillingPeriodLabel((pricing as any).billing_period || 'monthly')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                          {((pricing as any).billing_method || 'prepaid').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {pricing.promotion_code ? (
                          <div className="text-xs">
                            <div className="font-semibold text-purple-600">{pricing.promotion_code}</div>
                            {pricing.discount_percentage && (
                              <div className="text-green-600">-{pricing.discount_percentage}%</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No promotion</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          pricing.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {pricing.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(pricing)}
                            disabled={isOperating}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(pricing.id, pricing.name)}
                            disabled={isOperating}
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
          )}
        </div>
      </div>

      {/* ─── Create / Edit Modal ─────────────────────────────────────────────── */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditModalOpen ? 'Edit Agent Pricing' : 'Create New Agent Pricing'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditModalOpen ? 'Update pricing details' : 'Define a new pricing option for an agent'}
                </p>
              </div>
              <button
                onClick={() => {
                  isCreateModalOpen ? setIsCreateModalOpen(false) : setIsEditModalOpen(false);
                  resetForm();
                }}
                disabled={isOperating}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-6">

              {/* Agent Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Agent Template <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  disabled={isEditModalOpen || isOperating}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.agent_id ? 'border-red-300' : 'border-gray-200'
                  }`}
                  required
                >
                  <option value="">-- Select an Agent --</option>
                  {agentTemplates.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.agent_type})
                    </option>
                  ))}
                </select>
                {errors.agent_id && <p className="mt-1 text-sm text-red-600">{errors.agent_id}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Choose the agent template this pricing option applies to
                </p>
              </div>

              {/* Pricing Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pricing Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isOperating}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g., Basic, Pro, Enterprise"
                  required
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isOperating}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Brief description of this pricing tier..."
                />
              </div>

              {/* Price + Billing Period + Billing Method — three columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      disabled={isOperating}
                      className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.price ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                {/* Billing Period */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Billing Period <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.billing_period}
                    onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                    disabled={isOperating}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {billingPeriodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">How often this pricing is billed</p>
                </div>

                {/* Billing Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Billing Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.billing_method}
                    onChange={(e) => setFormData({ ...formData, billing_method: e.target.value })}
                    disabled={isOperating}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {billingMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Payment collection method</p>
                </div>

              </div>

              {/* Promotion Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Promotional Pricing{' '}
                  <span className="text-gray-500 font-normal ml-1">(Optional)</span>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Promotion Code</label>
                      <input
                        type="text"
                        value={formData.promotion_code}
                        onChange={(e) =>
                          setFormData({ ...formData, promotion_code: e.target.value.toUpperCase() })
                        }
                        disabled={isOperating}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                          onChange={(e) =>
                            setFormData({ ...formData, discount_percentage: e.target.value })
                          }
                          disabled={isOperating}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            errors.discount_percentage ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="20"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                      {errors.discount_percentage && (
                        <p className="mt-1 text-sm text-red-600">{errors.discount_percentage}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Valid From</label>
                      <input
                        type="date"
                        value={formData.promotion_valid_from}
                        onChange={(e) =>
                          setFormData({ ...formData, promotion_valid_from: e.target.value })
                        }
                        disabled={isOperating}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Valid Until</label>
                      <input
                        type="date"
                        value={formData.promotion_valid_until}
                        onChange={(e) =>
                          setFormData({ ...formData, promotion_valid_until: e.target.value })
                        }
                        disabled={isOperating}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.promotion_valid_until ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                      {errors.promotion_valid_until && (
                        <p className="mt-1 text-sm text-red-600">{errors.promotion_valid_until}</p>
                      )}
                    </div>
                  </div>

                  {/* Promotion preview */}
                  {formData.discount_percentage && formData.price && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Discounted Price</p>
                          <p className="text-2xl font-bold text-purple-600">
                            $
                            {(
                              parseFloat(formData.price) *
                              (1 - parseFloat(formData.discount_percentage) / 100)
                            ).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 line-through">
                            ${parseFloat(formData.price).toFixed(2)}
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            Save {formData.discount_percentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={isOperating}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-900">Active</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    disabled={isOperating}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-900">Default Pricing</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    isCreateModalOpen ? setIsCreateModalOpen(false) : setIsEditModalOpen(false);
                    resetForm();
                  }}
                  disabled={isOperating}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOperating}
                  className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-[#4318ff] to-[#7c75ff] text-white rounded-lg font-medium hover:from-[#3610d9] hover:to-[#6b63e6] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOperating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      {isEditModalOpen ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isEditModalOpen ? 'Update Pricing' : 'Create Pricing'}
                    </>
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

export default AgentPricingManagement;