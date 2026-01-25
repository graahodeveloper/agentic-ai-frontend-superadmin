// components/plans/CreateEditPlanDrawer.tsx
import React, { useState, useEffect } from 'react';
import {
  useCreatePlanMutation,
  useUpdatePlanMutation,
  Plan,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '@/features/plan/planApi';

interface CreateEditPlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  isEditMode: boolean;
  onSuccess?: () => void;
}

const CreateEditPlanDrawer: React.FC<CreateEditPlanDrawerProps> = ({
  isOpen,
  onClose,
  plan,
  isEditMode,
  onSuccess,
}) => {
  // ============================================
  // API HOOKS
  // ============================================
  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();

  // ============================================
  // FORM STATE
  // ============================================
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_type: 'starter' as 'free' | 'starter' | 'enterprise' | 'custom',
    price: '',
    billing_period: 'monthly' as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one_time',
    compute_tokens: '',
    storage_gb: '',
    api_calls_limit: '',
    max_agent_instances: '',
    max_active_agents: '',
    max_agent_activations: '',
    max_workspaces: '',
    max_workspace_members: '',
    is_active: true,
    is_public: false,
    has_trial: false,
    trial_period_days: '',
    display_order: '',
    featured: false,
    badge_text: '',
  });

  const [activeSection, setActiveSection] = useState<'basic' | 'resources' | 'settings'>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================
  // INITIALIZE FORM WITH PLAN DATA (EDIT MODE)
  // ============================================
  useEffect(() => {
    if (isEditMode && plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        plan_type: plan.plan_type,
        price: plan.price.toString(),
        billing_period: plan.billing_period,
        compute_tokens: plan.compute_tokens?.toString() || '',
        storage_gb: plan.storage_gb?.toString() || '',
        api_calls_limit: plan.api_calls_limit?.toString() || '',
        max_agent_instances: plan.max_agent_instances?.toString() || '',
        max_active_agents: plan.max_active_agents?.toString() || '',
        max_agent_activations: plan.max_agent_activations?.toString() || '',
        max_workspaces: plan.max_workspaces?.toString() || '',
        max_workspace_members: plan.max_workspace_members?.toString() || '',
        is_active: plan.is_active,
        is_public: plan.is_public,
        has_trial: plan.has_trial,
        trial_period_days: plan.trial_period_days?.toString() || '',
        display_order: plan.display_order?.toString() || '',
        featured: plan.featured,
        badge_text: plan.badge_text || '',
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        plan_type: 'starter',
        price: '',
        billing_period: 'monthly',
        compute_tokens: '',
        storage_gb: '',
        api_calls_limit: '',
        max_agent_instances: '',
        max_active_agents: '',
        max_agent_activations: '',
        max_workspaces: '',
        max_workspace_members: '',
        is_active: true,
        is_public: false,
        has_trial: false,
        trial_period_days: '',
        display_order: '',
        featured: false,
        badge_text: '',
      });
    }
    setErrors({});
    setActiveSection('basic');
  }, [isEditMode, plan, isOpen]);

  // ============================================
  // VALIDATION
  // ============================================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }

    if (formData.has_trial && (!formData.trial_period_days || parseInt(formData.trial_period_days) <= 0)) {
      newErrors.trial_period_days = 'Trial period must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const planData = {
        name: formData.name,
        description: formData.description || undefined,
        plan_type: formData.plan_type,
        price: parseFloat(formData.price),
        billing_period: formData.billing_period,
        compute_tokens: formData.compute_tokens ? parseInt(formData.compute_tokens) : 0,
        storage_gb: formData.storage_gb || '0',
        api_calls_limit: formData.api_calls_limit ? parseInt(formData.api_calls_limit) : 0,
        max_agent_instances: formData.max_agent_instances ? parseInt(formData.max_agent_instances) : 0,
        max_active_agents: formData.max_active_agents ? parseInt(formData.max_active_agents) : 0,
        max_agent_activations: formData.max_agent_activations ? parseInt(formData.max_agent_activations) : 0,
        max_workspaces: formData.max_workspaces ? parseInt(formData.max_workspaces) : 1,
        max_workspace_members: formData.max_workspace_members ? parseInt(formData.max_workspace_members) : 1,
        is_active: formData.is_active,
        is_public: formData.is_public,
        has_trial: formData.has_trial,
        trial_period_days: formData.has_trial && formData.trial_period_days ? parseInt(formData.trial_period_days) : 0,
        display_order: formData.display_order ? parseInt(formData.display_order) : 0,
        featured: formData.featured,
        badge_text: formData.badge_text || undefined,
      };

      if (isEditMode && plan) {
        await updatePlan({ id: plan.id, data: planData as UpdatePlanRequest }).unwrap();
      } else {
        await createPlan(planData as CreatePlanRequest).unwrap();
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      if (error.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(error.data).forEach((key) => {
          apiErrors[key] = Array.isArray(error.data[key]) ? error.data[key][0] : error.data[key];
        });
        setErrors(apiErrors);
      }
    }
  };

  // ============================================
  // INPUT HANDLERS
  // ============================================
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 max-w-3xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ============================================ */}
          {/* HEADER */}
          {/* ============================================ */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                {isEditMode ? 'Edit Plan' : 'Create New Plan'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isEditMode ? 'Update plan details and configuration' : 'Configure a new subscription plan'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-white/80 transition-all duration-200 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ============================================ */}
          {/* SECTION TABS */}
          {/* ============================================ */}
          <div className="bg-white border-b border-gray-200 px-6">
            <div className="flex space-x-1">
              {[
                { id: 'basic', label: 'Basic Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { id: 'resources', label: 'Resources', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                    activeSection === section.id
                      ? 'border-[#4318ff] text-[#4318ff]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                  </svg>
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ============================================ */}
          {/* FORM CONTENT */}
          {/* ============================================ */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-6">
              {/* ============================================ */}
              {/* BASIC INFO SECTION */}
              {/* ============================================ */}
              {activeSection === 'basic' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Plan Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Plan Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200 ${
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
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                      placeholder="Brief description of this plan..."
                    />
                  </div>

                  {/* Plan Type & Featured */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Plan Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.plan_type}
                        onChange={(e) => handleInputChange('plan_type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                      >
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Price & Billing Period */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price (USD) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200 ${
                            errors.price ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="0.00"
                          min="0"
                        />
                      </div>
                      {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Billing Period <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.billing_period}
                        onChange={(e) => handleInputChange('billing_period', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="one_time">One-Time</option>
                      </select>
                    </div>
                  </div>

                  {/* Badge Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.badge_text}
                      onChange={(e) => handleInputChange('badge_text', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                      placeholder="e.g., Most Popular, Best Value"
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional badge to display on pricing cards</p>
                  </div>

                  {/* Trial Settings */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">
                        Offer Free Trial
                      </label>
                      <button
                        type="button"
                        onClick={() => handleInputChange('has_trial', !formData.has_trial)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.has_trial ? 'bg-[#4318ff]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.has_trial ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {formData.has_trial && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trial Period (Days)
                        </label>
                        <input
                          type="number"
                          value={formData.trial_period_days}
                          onChange={(e) => handleInputChange('trial_period_days', e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200 ${
                            errors.trial_period_days ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="7"
                          min="1"
                        />
                        {errors.trial_period_days && (
                          <p className="mt-1 text-sm text-red-600">{errors.trial_period_days}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* RESOURCES SECTION */}
              {/* ============================================ */}
              {activeSection === 'resources' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Agent Limits */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      Agent Limits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Agent Instances
                        </label>
                        <input
                          type="number"
                          value={formData.max_agent_instances}
                          onChange={(e) => handleInputChange('max_agent_instances', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                          placeholder="0 = Unlimited"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Active Agents
                        </label>
                        <input
                          type="number"
                          value={formData.max_active_agents}
                          onChange={(e) => handleInputChange('max_active_agents', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                          placeholder="0 = Unlimited"
                          min="0"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Agent Activations
                        </label>
                        <input
                          type="number"
                          value={formData.max_agent_activations}
                          onChange={(e) => handleInputChange('max_agent_activations', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                          placeholder="0 = Unlimited"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Compute Resources */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      Compute Resources
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Compute Tokens
                        </label>
                        <input
                          type="number"
                          value={formData.compute_tokens}
                          onChange={(e) => handleInputChange('compute_tokens', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Storage (GB)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.storage_gb}
                          onChange={(e) => handleInputChange('storage_gb', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Calls Limit
                        </label>
                        <input
                          type="number"
                          value={formData.api_calls_limit}
                          onChange={(e) => handleInputChange('api_calls_limit', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                          placeholder="0 = Unlimited"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Workspace Limits */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Workspace Limits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Workspaces
                        </label>
                        <input
                          type="number"
                          value={formData.max_workspaces}
                          onChange={(e) => handleInputChange('max_workspaces', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                          placeholder="1"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Workspace Members
                        </label>
                        <input
                          type="number"
                          value={formData.max_workspace_members}
                          onChange={(e) => handleInputChange('max_workspace_members', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4318ff]/20 focus:border-[#4318ff] transition-all duration-200"
                          placeholder="1"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* SETTINGS SECTION */}
              {/* ============================================ */}
              {activeSection === 'settings' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Status Toggles */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Plan Status</h3>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Active</p>
                        <p className="text-sm text-gray-500">Plan is available for subscription</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('is_active', !formData.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Public</p>
                        <p className="text-sm text-gray-500">Visible to all users</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('is_public', !formData.is_public)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Featured</p>
                        <p className="text-sm text-gray-500">Highlight this plan in listings</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('featured', !formData.featured)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.featured ? 'bg-yellow-600' : 'bg-gray-300'
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
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1">Plan Visibility</h4>
                        <p className="text-sm text-blue-800">
                          Active plans can be subscribed to. Public plans are visible to all users. Featured plans appear prominently in the pricing page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* ============================================ */}
          {/* FOOTER */}
          {/* ============================================ */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-[#4318ff] to-[#7c75ff] hover:from-[#3610d9] hover:to-[#6b63e6] text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isEditMode ? 'Update Plan' : 'Create Plan'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </>
  );
};

export default CreateEditPlanDrawer;