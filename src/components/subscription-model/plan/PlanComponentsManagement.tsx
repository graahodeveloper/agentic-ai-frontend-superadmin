// components/subscription-model/plan/PlanComponentsManagement.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  useGetPlanComponentsQuery,
  useCreatePlanComponentMutation,
  useUpdatePlanComponentMutation,
  useDeletePlanComponentMutation,
  PlanComponent,
} from '@/features/subscriptionModel/billing/billingApi';

// Unit label options based on component type
const unitLabelOptions: Record<string, Array<{ value: string; label: string }>> = {
  compute_tokens: [
    { value: 'tokens', label: 'Tokens' },
    { value: 'thousand_tokens', label: 'Thousand Tokens' },
    { value: 'million_tokens', label: 'Million Tokens' },
  ],
  storage_gb: [
    { value: 'MB', label: 'Megabytes (MB)' },
    { value: 'GB', label: 'Gigabytes (GB)' },
    { value: 'TB', label: 'Terabytes (TB)' },
  ],
  api_calls: [
    { value: 'calls', label: 'Calls' },
    { value: 'thousand_calls', label: 'Thousand Calls' },
    { value: 'million_calls', label: 'Million Calls' },
  ],
  agent_instances: [
    { value: 'instances', label: 'Instances' },
    { value: 'concurrent_instances', label: 'Concurrent Instances' },
  ],
  active_agents: [
    { value: 'agents', label: 'Agents' },
    { value: 'active_agents', label: 'Active Agents' },
  ],
  custom: [
    { value: 'units', label: 'Units' },
    { value: 'items', label: 'Items' },
    { value: 'seats', label: 'Seats' },
  ],
};

const PlanComponentsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [componentTypeFilter, setComponentTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<PlanComponent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    component_type: 'compute_tokens' as PlanComponent['component_type'],
    description: '',
    // Removed quantity and price - now optional
    unit_label: 'tokens',
    // NEW FIELDS
    cost_per_unit: '',
    promotion_code: '',
    promotion_valid_from: '',
    promotion_valid_until: '',
    discount_percentage: '',
    is_active: true,
    is_renewable: false,
  });
  
  // Available unit labels based on selected component type
  const [availableUnitLabels, setAvailableUnitLabels] = useState(unitLabelOptions.compute_tokens);
  
  // Loading states for different operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Update available unit labels when component type changes
  useEffect(() => {
    setAvailableUnitLabels(unitLabelOptions[formData.component_type] || unitLabelOptions.custom);
    // Set default unit label based on component type
    if (unitLabelOptions[formData.component_type]?.length > 0) {
      setFormData(prev => ({
        ...prev,
        unit_label: unitLabelOptions[formData.component_type][0].value
      }));
    }
  }, [formData.component_type]);

  const queryParams: any = {};
  if (searchTerm) queryParams.search = searchTerm;
  if (componentTypeFilter !== 'all') queryParams.component_type = componentTypeFilter;
  if (statusFilter === 'active') queryParams.is_active = true;
  if (statusFilter === 'inactive') queryParams.is_active = false;

  const { data: componentsResponse, isLoading, refetch } = useGetPlanComponentsQuery(queryParams);
  const [createComponent] = useCreatePlanComponentMutation();
  const [updateComponent] = useUpdatePlanComponentMutation();
  const [deleteComponent] = useDeletePlanComponentMutation();

  const components = componentsResponse?.results || [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // Prepare data - quantity and price are not sent as they're now optional
      const submitData = {
        ...formData,
        // Convert empty strings to null for optional fields
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        promotion_valid_from: formData.promotion_valid_from || null,
        promotion_valid_until: formData.promotion_valid_until || null,
        promotion_code: formData.promotion_code || null,
      };
      
      // Remove any fields that shouldn't be sent
      delete (submitData as any).quantity;
      delete (submitData as any).price;
      
      await createComponent(submitData).unwrap();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create component:', error);
      alert('Failed to create component. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComponent) return;
    setIsUpdating(true);
    try {
      // Prepare data - quantity and price are not sent as they're now optional
      const submitData = {
        ...formData,
        // Convert empty strings to null for optional fields
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        promotion_valid_from: formData.promotion_valid_from || null,
        promotion_valid_until: formData.promotion_valid_until || null,
        promotion_code: formData.promotion_code || null,
      };
      
      // Remove any fields that shouldn't be sent
      delete (submitData as any).quantity;
      delete (submitData as any).price;
      
      await updateComponent({ id: selectedComponent.id, data: submitData }).unwrap();
      setIsEditModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to update component:', error);
      alert('Failed to update component. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    
    setDeletingId(id);
    try {
      await deleteComponent(id).unwrap();
    } catch (error) {
      console.error('Failed to delete component:', error);
      alert('Failed to delete component. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (component: PlanComponent) => {
    setSelectedComponent(component);
    setFormData({
      name: component.name,
      component_type: component.component_type,
      description: component.description || '',
      // Removed quantity and price
      unit_label: component.unit_label,
      // NEW FIELDS
      cost_per_unit: component.cost_per_unit?.toString() || '',
      promotion_code: component.promotion_code || '',
      promotion_valid_from: component.promotion_valid_from || '',
      promotion_valid_until: component.promotion_valid_until || '',
      discount_percentage: component.discount_percentage?.toString() || '',
      is_active: component.is_active,
      is_renewable: component.is_renewable,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      component_type: 'compute_tokens',
      description: '',
      // Removed quantity and price
      unit_label: 'tokens',
      // NEW FIELDS
      cost_per_unit: '',
      promotion_code: '',
      promotion_valid_from: '',
      promotion_valid_until: '',
      discount_percentage: '',
      is_active: true,
      is_renewable: false,
    });
    setSelectedComponent(null);
  };

  const componentTypeOptions = [
    { value: 'compute_tokens', label: 'Compute Tokens' },
    { value: 'storage_gb', label: 'Storage (GB)' },
    { value: 'api_calls', label: 'API Calls' },
    { value: 'agent_instances', label: 'Agent Instances' },
    { value: 'active_agents', label: 'Active Agents' },
    { value: 'custom', label: 'Custom' },
  ];

  // Helper function to format currency
  const formatCurrency = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `$${num.toFixed(6)}`;
  };

  // Helper function to check if promotion is valid
  const isPromotionValid = (component: PlanComponent) => {
    if (!component.promotion_code) return false;
    
    const now = new Date();
    const validFrom = component.promotion_valid_from ? new Date(component.promotion_valid_from) : null;
    const validUntil = component.promotion_valid_until ? new Date(component.promotion_valid_until) : null;
    
    if (validFrom && now < validFrom) return false;
    if (validUntil && now > validUntil) return false;
    
    return true;
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                Plan Components
              </h1>
              <p className="text-gray-600 mt-2">
                Manage the building blocks of subscription plans ({componentsResponse?.count || 0} total)
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isCreating}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Component</span>
                </>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <select
              value={componentTypeFilter}
              onChange={(e) => setComponentTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[180px]"
            >
              <option value="all">All Types</option>
              {componentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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

        {/* Components Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-ping rounded-full h-8 w-8 bg-indigo-100"></div>
                </div>
              </div>
              <span className="mt-4 text-gray-600 font-medium">Loading components...</span>
              <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
            </div>
          ) : components.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No components found</h3>
                <p className="mt-2 text-gray-600">Get started by creating your first component</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={isCreating}
                  className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create First Component'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Component</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Unit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Cost/Unit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Promotion</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {components.map((component) => {
                    const promotionValid = isPromotionValid(component);
                    
                    return (
                      <tr key={component.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{component.name}</div>
                          {component.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">{component.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {component.component_type.replace('_', ' ').toUpperCase()}
                          </span>
                          {component.is_renewable && (
                            <span className="ml-2 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Renewable
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {component.unit_label || 'units'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(component.cost_per_unit)}
                          </div>
                          {component.price_per_unit && (
                            <div className="text-xs text-gray-500">
                              Price/unit: {formatCurrency(component.price_per_unit)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {component.promotion_code ? (
                            <div>
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                promotionValid ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {component.promotion_code}
                              </span>
                              {component.discount_percentage && (
                                <div className="text-xs mt-1 text-gray-600">
                                  {component.discount_percentage}% off
                                </div>
                              )}
                              {promotionValid ? (
                                <span className="text-xs text-green-600 mt-1 block">Active</span>
                              ) : (
                                <span className="text-xs text-gray-500 mt-1 block">Inactive</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No promotion</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            component.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {component.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500">
                            {new Date(component.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(component)}
                              disabled={isUpdating || isCreating}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(component.id, component.name)}
                              disabled={deletingId === component.id}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-lg transition-colors relative"
                              title="Delete"
                            >
                              {deletingId === component.id ? (
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditModalOpen ? 'Edit Component' : 'Create New Component'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditModalOpen ? 'Update component details' : 'Define a new plan component'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isCreating && !isUpdating) {
                    isCreateModalOpen ? setIsCreateModalOpen(false) : setIsEditModalOpen(false);
                    resetForm();
                  }
                }}
                disabled={isCreating || isUpdating}
                className="p-2 rounded-full hover:bg-gray-100 disabled:hover:bg-transparent disabled:opacity-50 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Component Type *
                  </label>
                  <select
                    value={formData.component_type}
                    onChange={(e) => setFormData({ ...formData, component_type: e.target.value as PlanComponent['component_type'] })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                  >
                    {componentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isCreating || isUpdating}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit Label *
                  </label>
                  <select
                    value={formData.unit_label}
                    onChange={(e) => setFormData({ ...formData, unit_label: e.target.value })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                  >
                    {availableUnitLabels.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cost Per Unit ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                      disabled={isCreating || isUpdating}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="0.000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Cost per single unit for usage-based billing</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Promotion Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Promotion Code
                    </label>
                    <input
                      type="text"
                      value={formData.promotion_code}
                      onChange={(e) => setFormData({ ...formData, promotion_code: e.target.value })}
                      disabled={isCreating || isUpdating}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="e.g., SUMMER2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      disabled={isCreating || isUpdating}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="0-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valid From
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.promotion_valid_from}
                      onChange={(e) => setFormData({ ...formData, promotion_valid_from: e.target.value })}
                      disabled={isCreating || isUpdating}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valid Until
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.promotion_valid_until}
                      onChange={(e) => setFormData({ ...formData, promotion_valid_until: e.target.value })}
                      disabled={isCreating || isUpdating}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={isCreating || isUpdating}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-900">Active</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_renewable}
                    onChange={(e) => setFormData({ ...formData, is_renewable: e.target.checked })}
                    disabled={isCreating || isUpdating}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-900">Renewable</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (!isCreating && !isUpdating) {
                      isCreateModalOpen ? setIsCreateModalOpen(false) : setIsEditModalOpen(false);
                      resetForm();
                    }
                  }}
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#4318ff] to-[#7c75ff] text-white rounded-lg font-medium hover:from-[#3610d9] hover:to-[#6b63e6] disabled:from-indigo-400 disabled:to-indigo-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  {isCreating || isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditModalOpen ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{isEditModalOpen ? 'Update Component' : 'Create Component'}</span>
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

export default PlanComponentsManagement;