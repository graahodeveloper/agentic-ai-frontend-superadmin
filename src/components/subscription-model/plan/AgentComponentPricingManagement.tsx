// components/subscription-model/plan/AgentComponentPricingManagement.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  component_type_display?: string;
  total_quantity: number | string | null;
  base_price_per_unit: number | string;
  override_price: number | string | null;
  effective_price_per_unit: number;
  unit_label: string;
  is_unlimited: boolean;
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
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!agentId) return;

    if (isRefetch) {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const adminId = getAdminId();
      if (!adminId) {
        throw new Error('Admin ID not found');
      }

      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!BASE_URL) {
        throw new Error('API base URL not configured');
      }
      const response = await fetch(
        `${BASE_URL}agent-templates/${agentId}/components/?admin_id=${adminId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('superAdminToken')}`,
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
      setIsFetching(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      fetchData(false);
    } else {
      setData(null);
    }
  }, [agentId, fetchData]);

  const refetch = () => {
    if (agentId) {
      fetchData(true);
    }
  };

  return { data, isLoading, isFetching, error, refetch };
};

interface FormData {
  component_id: string;
  total_quantity: string;
  override_price: string;
  is_unlimited: boolean;
}

// Loading Spinner Component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  return (
    <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]}`}></div>
  );
};

// Table Skeleton Component
const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="animate-pulse">
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
        ))}
      </div>
    </div>
    {[...Array(rows)].map((_, index) => (
      <div key={index} className="px-6 py-4 border-b border-gray-100">
        <div className="flex gap-4 items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Loading Overlay Component
const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-2xl">
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-lg">
      <LoadingSpinner size="sm" />
      <span className="text-sm text-gray-600">Updating...</span>
    </div>
  </div>
);

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  componentName,
  isDeleting
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  componentName: string;
  isDeleting: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Remove Component</h3>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to remove <span className="font-semibold text-gray-900">&quot;{componentName}&quot;</span> from this agent?
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-red-700">
                This action cannot be undone. The component pricing configuration will be permanently removed.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Remove</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Component Modal Component
const AddComponentModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  availableComponents,
  components,
  agentName,
  isAdding,
  isLoadingComponents,
  formatPrice,
  formatCost
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  availableComponents: PlanComponent[];
  components: PlanComponent[];
  agentName: string;
  isAdding: boolean;
  isLoadingComponents: boolean;
  formatPrice: (price: string | number | null | undefined) => string;
  formatCost: (cost: number) => string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add Component</h3>
                <p className="text-indigo-200 text-sm">Configure pricing for {agentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isAdding}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Component Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Component <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.component_id}
              onChange={(e) => setFormData({ ...formData, component_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                All available components are already configured.
              </p>
            )}
          </div>

          {/* Total Quantity Input (only shown if not unlimited) */}
          {!formData.is_unlimited && formData.component_id && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Total Quantity <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.total_quantity}
                  onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Total quantity to allocate"
                  disabled={isAdding}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  {components.find(c => c.id === formData.component_id)?.unit_label || 'units'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total quantity of this component allocated for this agent (added to user wallet)
              </p>
            </div>
          )}

          {/* Override Price & Unlimited Toggle */}
          <div className="flex items-start gap-4">
            {/* Override Price */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Override Price <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</div>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.override_price}
                  onChange={(e) => setFormData({ ...formData, override_price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Leave empty for default price"
                  disabled={isAdding}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Custom price per unit (overrides component&apos;s default price)
              </p>
            </div>

            {/* Unlimited Toggle */}
            <div className="pt-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.is_unlimited}
                    onChange={(e) => setFormData({ ...formData, is_unlimited: e.target.checked, total_quantity: e.target.checked ? '' : formData.total_quantity })}
                    disabled={isAdding}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 peer-disabled:opacity-50 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Unlimited</span>
                  <span className="text-xs text-gray-500">No usage limits</span>
                </div>
              </label>
            </div>
          </div>

          {/* Unlimited Info Banner */}
          {formData.is_unlimited && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Unlimited Usage Enabled</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Users will have unlimited consumption of this component for this agent. The user&apos;s wallet will be marked as unlimited for this resource.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {formData.component_id && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">Configuration Preview</span>
              </div>
              {(() => {
                const selectedComp = components.find(c => c.id === formData.component_id);
                if (!selectedComp) return null;
                const effectivePrice = formData.override_price
                  ? parseFloat(formData.override_price)
                  : parseFloat(selectedComp.price_per_unit);
                return (
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Total Quantity:</span>
                      <span className="font-medium">
                        {formData.is_unlimited ? 'Unlimited' : `${formData.total_quantity ? Number(formData.total_quantity).toLocaleString() : '—'} ${selectedComp.unit_label}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-medium">{formatPrice(parseFloat(selectedComp.price_per_unit))}/{selectedComp.unit_label}</span>
                    </div>
                    {formData.override_price && (
                      <div className="flex justify-between text-orange-600">
                        <span>Override Price:</span>
                        <span className="font-medium">{formatPrice(parseFloat(formData.override_price))}/{selectedComp.unit_label}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-blue-200 flex justify-between text-indigo-700">
                      <span className="font-semibold">Effective Price:</span>
                      <span className="font-bold">{formatPrice(effectivePrice)}/{selectedComp.unit_label}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isAdding}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !formData.component_id || availableComponents.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isAdding ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Adding...</span>
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
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Component Modal Component
const EditComponentModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedComponent,
  isUpdating,
  formatPrice,
  formatCost
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  selectedComponent: AgentComponentPricing | null;
  isUpdating: boolean;
  formatPrice: (price: string | number | null | undefined) => string;
  formatCost: (cost: number) => string;
}) => {
  if (!isOpen || !selectedComponent) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 ring-1 ring-white/30 rounded-xl flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Edit Component</h3>
                <p className="text-green-100/90 text-sm mt-0.5">{selectedComponent.component_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="p-2 rounded-full hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-7 overflow-y-auto max-h-[calc(92vh-88px)]">
          {/* Current Configuration & Live Preview side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Current Component Info */}
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4.5 h-4.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Configuration</span>
              </div>
              <div className="text-sm text-gray-600 space-y-2.5">
                <div className="flex justify-between">
                  <span>Component</span>
                  <span className="font-medium text-gray-900">{selectedComponent.component_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="font-medium text-gray-900">{selectedComponent.component_type_display}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Quantity</span>
                  <span className="font-medium text-gray-900">
                    {selectedComponent.is_unlimited ? 'Unlimited' : `${selectedComponent.total_quantity ? Number(selectedComponent.total_quantity).toLocaleString() : '—'} ${selectedComponent.unit_label}`}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-600">
                  <span>Base Price</span>
                  <span className="font-medium">{formatPrice(selectedComponent.base_price_per_unit)}/{selectedComponent.unit_label}</span>
                </div>
                {selectedComponent.override_price && (
                  <div className="flex justify-between text-orange-600">
                    <span>Current Override</span>
                    <span className="font-medium">{formatPrice(selectedComponent.override_price)}/{selectedComponent.unit_label}</span>
                  </div>
                )}
                <div className="pt-2.5 border-t border-gray-200 flex justify-between text-green-600">
                  <span className="font-semibold">Effective Price</span>
                  <span className="font-bold">{formatPrice(selectedComponent.effective_price_per_unit)}/{selectedComponent.unit_label}</span>
                </div>
              </div>
            </div>

            {/* Updated Pricing Preview */}
            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4.5 h-4.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Updated Preview</span>
              </div>
              <div className="text-sm text-gray-700 space-y-2.5">
                <div className="flex justify-between">
                  <span>Total Quantity</span>
                  <span className="font-medium text-gray-900">
                    {formData.is_unlimited ? 'Unlimited' : `${formData.total_quantity ? Number(formData.total_quantity).toLocaleString() : '—'} ${selectedComponent.unit_label}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Override Price</span>
                  <span className="font-medium text-gray-900">
                    {formData.override_price ? `${formatPrice(parseFloat(formData.override_price))}/${selectedComponent.unit_label}` : '—'}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-green-200 flex justify-between text-green-700">
                  <span className="font-semibold">Effective Price</span>
                  <span className="font-bold">
                    {formatPrice(formData.override_price ? parseFloat(formData.override_price) : parseFloat(String(selectedComponent.base_price_per_unit)))}/{selectedComponent.unit_label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Quantity & Override Price Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Total Quantity Input (only shown if not unlimited) */}
            {!formData.is_unlimited ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Quantity <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    placeholder="Total quantity to allocate"
                    disabled={isUpdating}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    {selectedComponent.unit_label}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Total quantity of this component allocated for this agent (added to user wallet)
                </p>
              </div>
            ) : (
              <div className="hidden md:block" />
            )}

            {/* Override Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Override Price <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</div>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.override_price}
                  onChange={(e) => setFormData({ ...formData, override_price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  placeholder="Leave empty for default price"
                  disabled={isUpdating}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Leave empty to remove override and use base price
              </p>
            </div>
          </div>

          {/* Unlimited Toggle */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-700">Unlimited Usage</span>
              <span className="text-xs text-gray-500 mt-0.5">Allow unrestricted consumption of this component</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.is_unlimited}
                  onChange={(e) => setFormData({ ...formData, is_unlimited: e.target.checked, total_quantity: e.target.checked ? '' : formData.total_quantity })}
                  disabled={isUpdating}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 peer-disabled:opacity-50 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
          </div>

          {/* Unlimited Info Banner */}
          {formData.is_unlimited && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Unlimited Usage Enabled</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Users will have unlimited consumption of this component for this agent. No usage tracking or limits will apply.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Update Component</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AgentComponentPricingManagement = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<AgentComponentPricing | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isAgentChanging, setIsAgentChanging] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    component_id: '',
    total_quantity: '',
    override_price: '',
    is_unlimited: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

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
    isFetching: isFetchingAgentComponents,
    error: agentComponentsError,
    refetch: refetchAgentComponents
  } = useGetAgentComponents(selectedAgentId);

  const agentComponents = agentComponentsData?.components || [];
  const selectedAgent = agentTemplates.find(a => a.id === selectedAgentId);

  // Get unique component types for filter
  const componentTypes = useMemo(() => {
    const types = new Set<string>();
    agentComponents.forEach(c => types.add(c.component_type));
    return Array.from(types);
  }, [agentComponents]);

  // Filtered and paginated components
  const filteredComponents = useMemo(() => {
    return agentComponents.filter(comp => {
      const matchesType = !typeFilter || comp.component_type === typeFilter;
      const matchesSearch = !searchQuery ||
        comp.component_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (comp.component_type_display || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [agentComponents, typeFilter, searchQuery]);

  const paginatedComponents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredComponents.slice(startIndex, startIndex + pageSize);
  }, [filteredComponents, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredComponents.length / pageSize);

  // Calculate totals
  const totalQuantityAllocated = useMemo(() => {
    return agentComponents.reduce((sum, comp) => {
      if (comp.is_unlimited) return sum;
      const qty = typeof comp.total_quantity === 'string'
        ? parseFloat(comp.total_quantity) || 0
        : comp.total_quantity || 0;
      return sum + qty;
    }, 0);
  }, [agentComponents]);

  const hasUnlimitedComponents = useMemo(() => {
    return agentComponents.some(comp => comp.is_unlimited);
  }, [agentComponents]);

  // Handle agent change
  const handleAgentChange = useCallback((agentId: string) => {
    setIsAgentChanging(true);
    setSelectedAgentId(agentId);
    setCurrentPage(1);
    setTypeFilter('');
    setSearchQuery('');
    resetForm();
  }, []);

  // Reset loading state when components are loaded
  useEffect(() => {
    if (!isLoadingAgentComponents) {
      setIsAgentChanging(false);
    }
  }, [isLoadingAgentComponents]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, searchQuery, pageSize]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;

    setIsAdding(true);

    try {
      const adminId = getAdminId();
      if (!adminId) throw new Error('Admin ID not found');

      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!BASE_URL) {
        throw new Error('API base URL not configured');
      }
      const response = await fetch(
        `${BASE_URL}agent-templates/${selectedAgentId}/components/?admin_id=${adminId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('superAdminToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            components: [
              {
                component_id: formData.component_id,
                total_quantity: formData.is_unlimited ? null : (formData.total_quantity ? parseFloat(formData.total_quantity) : null),
                override_price: formData.override_price ? parseFloat(formData.override_price) : null,
                is_unlimited: formData.is_unlimited,
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
    } catch (error: unknown) {
      console.error('Failed to add component to agent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add component';
      alert(errorMessage);
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

      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!BASE_URL) {
        throw new Error('API base URL not configured');
      }
      const response = await fetch(
        `${BASE_URL}agent-templates/${selectedAgentId}/update_component/?admin_id=${adminId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('superAdminToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            component_id: selectedComponent.component_id,
            total_quantity: formData.is_unlimited ? null : (formData.total_quantity ? parseFloat(formData.total_quantity) : null),
            override_price: formData.override_price ? parseFloat(formData.override_price) : null,
            is_unlimited: formData.is_unlimited,
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
    } catch (error: unknown) {
      console.error('Failed to update component:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update component';
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!selectedAgentId || !componentToDelete) return;

    setIsRemoving(true);

    try {
      const adminId = getAdminId();
      if (!adminId) throw new Error('Admin ID not found');

      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!BASE_URL) {
        throw new Error('API base URL not configured');
      }
      const response = await fetch(
        `${BASE_URL}agent-templates/${selectedAgentId}/remove_component/?component_id=${componentToDelete.id}&admin_id=${adminId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('superAdminToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to remove component');
      }

      setIsDeleteModalOpen(false);
      setComponentToDelete(null);
      refetchAgentComponents();
    } catch (error: unknown) {
      console.error('Failed to remove component:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove component from agent';
      alert(errorMessage);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleEdit = useCallback((component: AgentComponentPricing) => {
    setSelectedComponent(component);
    setFormData({
      component_id: component.component_id,
      total_quantity: component.total_quantity ? component.total_quantity.toString() : '',
      override_price: component.override_price ? component.override_price.toString() : '',
      is_unlimited: component.is_unlimited || false,
    });
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((componentId: string, componentName: string) => {
    setComponentToDelete({ id: componentId, name: componentName });
    setIsDeleteModalOpen(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      component_id: '',
      total_quantity: '',
      override_price: '',
      is_unlimited: false,
    });
    setSelectedComponent(null);
  }, []);

  // Get available components (not already in agent)
  const availableComponents = useMemo(() => {
    const includedComponentIds = agentComponents.map(c => c.component_id);
    return components.filter(c => !includedComponentIds.includes(c.id));
  }, [agentComponents, components]);

  // Helper functions
  const formatPrice = useCallback((price: string | number | null | undefined) => {
    if (price === null || price === undefined) return '$0.0000';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '$0.0000';
    return `$${num.toFixed(4)}`;
  }, []);

  const formatCost = useCallback((cost: number) => {
    return `$${cost.toFixed(6)}`;
  }, []);

  // Pagination helper
  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Agent Component Pricing
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Configure components and pricing for agent templates
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white transition-all"
                  disabled={isLoadingAgents}
                >
                  <option value="">-- Select an Agent Template --</option>
                  {agentTemplates.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.agent_type})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isLoadingAgents && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              {selectedAgentId && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={availableComponents.length === 0 || isLoadingAgentComponents || isAgentChanging}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                >
                  {isLoadingAgentComponents ? (
                    <>
                      <LoadingSpinner size="sm" />
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
          {selectedAgent && !isAgentChanging && (
            <div className="mt-4 sm:mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedAgent.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
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
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{agentComponents.length}</div>
                    <div className="text-sm text-gray-600">Components</div>
                  </div>
                  <div className="text-center">
                    {hasUnlimitedComponents ? (
                      <>
                        <div className="text-2xl font-bold text-emerald-600">∞</div>
                        <div className="text-sm text-gray-600">Has Unlimited</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-green-600">{totalQuantityAllocated.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Allocated</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
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

        {/* Initial Loading State */}
        {selectedAgentId && isLoadingAgentComponents && !isFetchingAgentComponents && !agentComponentsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <TableSkeleton rows={5} />
          </div>
        )}

        {/* Components Table */}
        {selectedAgentId && !isLoadingAgentComponents && !agentComponentsError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {isFetchingAgentComponents && <LoadingOverlay />}

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
                    This agent doesn&apos;t have any component pricing configured yet.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={availableComponents.length === 0}
                    className="mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {availableComponents.length === 0 ? (
                      'No Components Available'
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add First Component
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search components..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white transition-all"
                      >
                        <option value="">All Types</option>
                        {componentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Component</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Total Quantity</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Base Price</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Override</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Effective Price</th>
                        <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedComponents.map((component) => (
                        <tr key={component.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                component.is_unlimited
                                  ? 'bg-gradient-to-br from-emerald-100 to-green-100'
                                  : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                              }`}>
                                {component.is_unlimited ? (
                                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="text-indigo-600 font-bold text-sm">
                                    {component.component_type.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900 truncate">{component.component_name}</span>
                                  {component.is_unlimited && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                      Unlimited
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{component.component_type_display}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                            {component.is_unlimited ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-semibold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Unlimited
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                                {component.total_quantity ? Number(component.total_quantity).toLocaleString() : '—'} {component.unit_label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {formatPrice(component.base_price_per_unit)}/{component.unit_label}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                            {component.override_price ? (
                              <span className="inline-flex px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">
                                {formatPrice(component.override_price)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm font-bold text-green-600">
                              {formatPrice(component.effective_price_per_unit)}/{component.unit_label}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEdit(component)}
                                disabled={isUpdating || isRemoving}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Edit pricing"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(component.component_id, component.component_name)}
                                disabled={isUpdating || isRemoving}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Remove component"
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

                {/* Summary Row */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{paginatedComponents.length}</span> of{' '}
                      <span className="font-medium">{filteredComponents.length}</span> components
                      {filteredComponents.length !== agentComponents.length && (
                        <span className="text-gray-400"> (filtered from {agentComponents.length} total)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Total Allocated:</span>
                      {hasUnlimitedComponents ? (
                        <span className="text-lg font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Has Unlimited
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">{totalQuantityAllocated.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-white">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Page Size Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Rows per page:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          {[5, 10, 20, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>

                      {/* Page Navigation */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="First page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Previous page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {getPageNumbers().map((page, index) => (
                          typeof page === 'number' ? (
                            <button
                              key={index}
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-indigo-600 text-white'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          ) : (
                            <span key={index} className="px-2 text-gray-400">...</span>
                          )
                        ))}

                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Next page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Last page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Free Tier Enabled Indicator - Show when agent has unlimited components */}
        {selectedAgentId && !isLoadingAgentComponents && !agentComponentsError && agentComponents.some(c => c.is_unlimited) && (
          <div className="mt-6 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-emerald-500/25">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-bold text-emerald-900">Free Tier Enabled</h4>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-sm text-emerald-800 mb-3">
                  This agent qualifies for the free tier because it has unlimited components configured.
                  Users without a subscription can access this agent with 1 instance limit.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-emerald-700 font-medium">Unlimited Components:</span>
                  {agentComponents.filter(c => c.is_unlimited).map((comp) => (
                    <span
                      key={comp.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-lg text-xs text-emerald-700 border border-emerald-200 font-medium"
                    >
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {comp.component_name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-white/80 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-sm text-emerald-800">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>User Benefits:</strong> Users can create 1 instance of this agent without any subscription.
                      If they try to create more, they&apos;ll be prompted to upgrade.
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div className="text-sm text-gray-700">
                  <div className="font-semibold mb-3 text-indigo-900">What is Component Pricing?</div>
                  <ul className="text-left space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Define how much of each component an agent consumes per execution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Set custom pricing that overrides default component prices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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
      <AddComponentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        onSubmit={handleAddSubmit}
        formData={formData}
        setFormData={setFormData}
        availableComponents={availableComponents}
        components={components}
        agentName={selectedAgent?.name || ''}
        isAdding={isAdding}
        isLoadingComponents={isLoadingComponents}
        formatPrice={formatPrice}
        formatCost={formatCost}
      />

      {/* Edit Component Modal */}
      <EditComponentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        onSubmit={handleEditSubmit}
        formData={formData}
        setFormData={setFormData}
        selectedComponent={selectedComponent}
        isUpdating={isUpdating}
        formatPrice={formatPrice}
        formatCost={formatCost}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setComponentToDelete(null);
        }}
        onConfirm={handleRemoveConfirm}
        componentName={componentToDelete?.name || ''}
        isDeleting={isRemoving}
      />
    </div>
  );
};

export default AgentComponentPricingManagement;
