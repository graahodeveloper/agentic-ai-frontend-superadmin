// components/subscription-model/plan/AgentComponentPricingManagement.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  useGetAgentTemplatesByAdminIdQuery,
  AgentTemplate,
} from '@/features/agentTemplateApi/agentTemplateApi';
import {
  useGetPlanComponentsQuery,
  PlanComponent,
} from '@/features/subscriptionModel/billing/billingApi';

// Helper function to get admin_id
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

interface AgentComponentPricing {
  id: string;
  component_id: string;
  component_name: string;
  component_type: string;
  component_type_display: string;
  consumption_rate: number;
  base_price_per_unit: number;
  override_price_per_unit: number | null;
  effective_price_per_unit: number;
  cost_per_execution: number;
  unit_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentComponentsResponse {
  agent_id: string;
  agent_name: string;
  components: AgentComponentPricing[];
  count: number;
}

// Custom hook to fetch agent components
const useGetAgentComponents = (agentId: string) => {
  const [data, setData] = useState<AgentComponentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!agentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const adminId = getAdminId();
      if (!adminId) {
        throw new Error('Admin ID not found');
      }

      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${BASE_URL}agent-templates/${agentId}/components/?admin_id=${adminId}`,
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

      const result: AgentComponentsResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch agent components:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch components');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchData();
    } else {
      setData(null);
    }
  }, [agentId]);

  const refetch = () => {
    if (agentId) {
      fetchData();
    }
  };

  return { data, isLoading, error, refetch };
};

const AgentComponentPricingManagement = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<AgentComponentPricing | null>(null);
  const [isAgentChanging, setIsAgentChanging] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [formData, setFormData] = useState({
    component_id: '',
    // consumption_rate: '1', // Commented out - not needed
    override_price: '',
  });

  const adminId = getAdminId();

  // Fetch all agent templates
  const { data: agentTemplatesResponse, isLoading: isLoadingAgents } = useGetAgentTemplatesByAdminIdQuery(
    adminId!,
    { skip: !adminId }
  );
  const agentTemplates: AgentTemplate[] = agentTemplatesResponse?.results || [];

  // Fetch all plan components
  const { data: componentsResponse, isLoading: isLoadingComponents } = useGetPlanComponentsQuery({ is_active: true });
  const components = (componentsResponse?.results || []) as PlanComponent[];

  // Fetch components for selected agent
  const {
    data: agentComponentsData,
    isLoading: isLoadingAgentComponents,
    error: agentComponentsError,
    refetch: refetchAgentComponents
  } = useGetAgentComponents(selectedAgentId);

  const agentComponents = agentComponentsData?.components || [];
  const selectedAgent = agentTemplates.find(a => a.id === selectedAgentId);

  // Calculate totals
  const totalCostPerExecution = agentComponents.reduce((sum, comp) => sum + comp.cost_per_execution, 0);
  
  // Handle agent change
  const handleAgentChange = (agentId: string) => {
    setIsAgentChanging(true);
    setSelectedAgentId(agentId);
    resetForm();
  };

  // Reset loading state when components are loaded
  useEffect(() => {
    if (!isLoadingAgentComponents) {
      setIsAgentChanging(false);
    }
  }, [isLoadingAgentComponents]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;

    setIsAdding(true);

    try {
      const adminId = getAdminId();
      if (!adminId) throw new Error('Admin ID not found');

      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${BASE_URL}agent-templates/${selectedAgentId}/components/?admin_id=${adminId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            components: [
              {
                component_id: formData.component_id,
                consumption_rate: 1, // Default consumption rate set to 1
                override_price: formData.override_price ? parseFloat(formData.override_price) : null,
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to add component');
      }

      setIsAddModalOpen(false);
      resetForm();
      refetchAgentComponents();
    } catch (error: any) {
      console.error('Failed to add component to agent:', error);
      alert(error.message || 'Failed to add component');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !selectedComponent) return;

    setIsUpdating(true);

    try {
      const adminId = getAdminId();
      if (!adminId) throw new Error('Admin ID not found');

      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${BASE_URL}agent-templates/${selectedAgentId}/update_component/?admin_id=${adminId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            component_id: selectedComponent.component_id,
            consumption_rate: selectedComponent.consumption_rate, // Keep original consumption rate
            override_price: formData.override_price ? parseFloat(formData.override_price) : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to update component');
      }

      setIsEditModalOpen(false);
      resetForm();
      refetchAgentComponents();
    } catch (error: any) {
      console.error('Failed to update component:', error);
      alert(error.message || 'Failed to update component');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (componentId: string, componentName: string) => {
    if (!selectedAgentId) return;

    if (window.confirm(`Remove "${componentName}" from this agent? This cannot be undone.`)) {
      setIsRemoving(true);

      try {
        const adminId = getAdminId();
        if (!adminId) throw new Error('Admin ID not found');

        const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(
          `${BASE_URL}agent-templates/${selectedAgentId}/remove_component/?component_id=${componentId}&admin_id=${adminId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Failed to remove component');
        }

        refetchAgentComponents();
      } catch (error: any) {
        console.error('Failed to remove component:', error);
        alert(error.message || 'Failed to remove component from agent');
      } finally {
        setIsRemoving(false);
      }
    }
  };

  const handleEdit = (component: AgentComponentPricing) => {
    setSelectedComponent(component);
    setFormData({
      component_id: component.component_id,
      // consumption_rate: component.consumption_rate.toString(), // Commented out
      override_price: component.override_price_per_unit ? component.override_price_per_unit.toString() : '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      component_id: '',
      // consumption_rate: '1', // Commented out
      override_price: '',
    });
    setSelectedComponent(null);
  };

  // Get available components (not already in agent)
  const getAvailableComponents = () => {
    const includedComponentIds = agentComponents.map(c => c.component_id);
    return components.filter(c => !includedComponentIds.includes(c.id));
  };

  const availableComponents = getAvailableComponents();

  // Helper functions
  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `$${num.toFixed(4)}`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#4318ff] to-[#7c75ff] bg-clip-text text-transparent">
                Agent Component
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Configure components for agent templates
              </p>
            </div>
          </div>

          {/* Agent Selection */}
          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Agent Template <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <select
                  value={selectedAgentId}
                  onChange={(e) => handleAgentChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white"
                  disabled={isLoadingAgents}
                >
                  <option value="">-- Select an Agent Template --</option>
                  {agentTemplates.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.agent_type})
                    </option>
                  ))}
                </select>
                {isLoadingAgents && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </div>
              {selectedAgentId && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={availableComponents.length === 0 || isLoadingAgentComponents || isAgentChanging}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {isLoadingAgentComponents ? (
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

          {/* Selected Agent Summary */}
          {selectedAgent && (
            <div className="mt-4 sm:mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              {isAgentChanging ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-600">Loading agent details...</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{selectedAgent.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {selectedAgent.agent_type.toUpperCase()}
                      </span>
                      {selectedAgent.agent_variant && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {selectedAgent.agent_variant}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedAgent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedAgent.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-2xl font-bold text-indigo-600">{agentComponents.length}</div>
                    <div className="text-sm text-gray-600">Components Configured</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {agentComponentsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Error Loading Components</h3>
                <p className="mt-2 text-gray-600">{agentComponentsError}</p>
                <button
                  onClick={() => refetchAgentComponents()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {selectedAgentId && (isLoadingAgentComponents || isAgentChanging) && !agentComponentsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Loading Components</h3>
              <p className="mt-2 text-gray-600 text-center">
                Loading component pricing for {selectedAgent?.name}...
              </p>
            </div>
          </div>
        )}

        {/* Components Table */}
        {selectedAgentId && !isLoadingAgentComponents && !isAgentChanging && !agentComponentsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {agentComponents.length === 0 ? (
              <div className="flex items-center justify-center py-12 sm:py-20">
                <div className="text-center max-w-md px-4">
                  <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No Components Configured</h3>
                  <p className="mt-2 text-gray-600">
                    This agent doesn't have any component pricing configured yet.
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
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Component</th>
                        {/* Consumption Rate column - COMMENTED OUT */}
                        {/* <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Consumption Rate</th> */}
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Base Price</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Override Price</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Effective Price</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Cost/Execution</th>
                        <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {agentComponents.map((component) => (
                        <tr key={component.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-bold">
                                  {component.component_type.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{component.component_name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{component.component_type_display}</div>
                              </div>
                            </div>
                          </td>
                          {/* Consumption Rate cell - COMMENTED OUT */}
                          {/* <td className="px-4 sm:px-6 py-4">
                            <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                              {component.consumption_rate} {component.unit_label}
                            </span>
                          </td> */}
                          <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                            <div className="text-sm text-gray-600">
                              {formatPrice(component.base_price_per_unit)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                            {component.override_price_per_unit ? (
                              <div className="text-sm font-semibold text-orange-600">
                                {formatPrice(component.override_price_per_unit)}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">Default</div>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm font-semibold text-indigo-600">
                              {formatPrice(component.effective_price_per_unit)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm font-bold text-green-600">
                              {formatCost(component.cost_per_execution)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEdit(component)}
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
                                onClick={() => handleRemove(component.component_id, component.component_name)}
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

        {/* No Agent Selected State */}
        {!selectedAgentId && !isLoadingAgents && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto h-20 w-20 text-gray-400 mb-6">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Select an Agent Template</h3>
              <p className="mt-2 text-gray-600">
                Choose an agent template from the dropdown above to configure its component pricing
              </p>
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">What is Component Pricing?</div>
                  <ul className="text-left space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Define how much of each component an agent consumes per execution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Set custom pricing that overrides default component prices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Calculate accurate costs for agent operations</span>
                    </li>
                  </ul>
                </div>
              </div>
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
                <h2 className="text-2xl font-bold text-gray-900">Add Component Pricing</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure pricing for {selectedAgent?.name}
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
                  value={formData.component_id}
                  onChange={(e) => setFormData({ ...formData, component_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                  disabled={isAdding || isLoadingComponents}
                >
                  <option value="">-- Select a Component --</option>
                  {availableComponents.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} ({comp.component_type})
                    </option>
                  ))}
                </select>
                {availableComponents.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">All available components are already configured.</p>
                )}
              </div>

              {/* Consumption Rate - COMMENTED OUT */}
              {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Consumption Rate <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={formData.consumption_rate}
                  onChange={(e) => setFormData({ ...formData, consumption_rate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="1.0"
                  required
                  disabled={isAdding}
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many units of this component the agent uses per execution
                </p>
              </div> */}

              {/* Override Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Override Price (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</div>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.override_price}
                    onChange={(e) => setFormData({ ...formData, override_price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Leave empty to use default"
                    disabled={isAdding}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Custom price per unit (overrides component's default price)
                </p>
              </div>

              {/* Preview */}
              {/* {formData.component_id && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Cost Preview:</div>
                  {(() => {
                    const selectedComp = components.find(c => c.id === formData.component_id);
                    if (!selectedComp) return null;
                    const consumptionRate = 1; // Default consumption rate
                    const effectivePrice = formData.override_price 
                      ? parseFloat(formData.override_price) 
                      : parseFloat(selectedComp.price_per_unit);
                    const costPerExecution = consumptionRate * effectivePrice;
                    return (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Consumption: {consumptionRate} {selectedComp.unit_label}/execution (default)</div>
                        <div>Effective Price: {formatPrice(effectivePrice)}/unit</div>
                        <div className="font-semibold text-indigo-700">
                          Cost per Execution: {formatCost(costPerExecution)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )} */}

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
                  disabled={isAdding || !formData.component_id || availableComponents.length === 0}
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

      {/* Edit Component Modal */}
      {isEditModalOpen && selectedComponent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Component Pricing</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update: {selectedComponent.component_name}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Note: Only override price can be edited. Consumption rate is fixed at {selectedComponent.consumption_rate}.
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
                <div className="text-sm font-semibold text-gray-900 mb-2">Component:</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="font-medium">{selectedComponent.component_name}</div>
                  <div>{selectedComponent.component_type_display}</div>
                  <div className="text-indigo-600">
                    Base Price: {formatPrice(selectedComponent.base_price_per_unit)}/{selectedComponent.unit_label}
                  </div>
                </div>
              </div>

              {/* Consumption Rate - COMMENTED OUT, Show as read-only */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Current Consumption Rate</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedComponent.consumption_rate} {selectedComponent.unit_label}/execution
                </div>
                <div className="text-xs text-gray-500 mt-1">Consumption rate cannot be edited</div>
              </div>

              {/* Override Price */}
              {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Override Price (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</div>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.override_price}
                    onChange={(e) => setFormData({ ...formData, override_price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Leave empty for default"
                    disabled={isUpdating}
                  />
                </div>
              </div> */}

              {/* Preview */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="text-sm font-semibold text-gray-900 mb-2">Updated Cost:</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    Consumption: {selectedComponent.consumption_rate} {selectedComponent.unit_label}/execution
                  </div>
                  <div className="font-semibold text-green-700">
                    Cost per Execution: {formatCost(
                      selectedComponent.consumption_rate * 
                      (formData.override_price 
                        ? parseFloat(formData.override_price) 
                        : selectedComponent.base_price_per_unit)
                    )}
                  </div>
                </div>
              </div>

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
                    'Update Component'
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

export default AgentComponentPricingManagement;