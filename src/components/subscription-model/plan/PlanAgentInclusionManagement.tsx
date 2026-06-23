// components/subscription-model/plan/PlanAgentInclusionManagement.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useGetPlansQuery,
  useGetAgentPricingQuery,
  useGetPlanAgentsInPlanQuery,
  useAddAgentToPlanMutation,
  useUpdatePlanAgentInclusionMutation,
  useRemoveAgentFromPlanMutation,
  Plan,
  AgentPricing,
  PlanAgentsResponse,
} from '@/features/subscriptionModel/billing/billingApi';

// ============================================
// TYPES
// ============================================
type PlanAgentItem = PlanAgentsResponse['agents'][number];

interface ApiError {
  data?: { detail?: string };
}

interface FormData {
  agent_pricing_id: string;
  per_instance_price: number;
  display_order: number;
}

interface EditFormData {
  per_instance_price: number;
  is_featured: boolean;
  display_order: number;
}

// ============================================
// CONSTANTS
// ============================================
const DEFAULT_FORM_DATA: FormData = {
  agent_pricing_id: '',
  per_instance_price: 0,
  display_order: 0,
};

const DEFAULT_EDIT_FORM_DATA: EditFormData = {
  per_instance_price: 0,
  is_featured: false,
  display_order: 0,
};

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
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-100 rounded w-24"></div>
          </div>
        </div>
        <div className="w-24 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-20 h-8 bg-gray-200 rounded mx-4"></div>
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
  inclusion: PlanAgentItem | null;
  isDeleting: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  inclusion,
  isDeleting,
}) => {
  if (!isOpen || !inclusion) return null;

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
                <h3 className="text-xl font-bold text-white">Remove Agent</h3>
                <p className="text-red-100 text-sm">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-700">
              Are you sure you want to remove <span className="font-semibold text-gray-900">&quot;{inclusion.agent_pricing?.agent_name}&quot;</span> from this plan?
            </p>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-700 mb-2">Agent Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Pricing Tier:</div>
                <div className="font-medium text-gray-900">{inclusion.agent_pricing?.name || 'Default'}</div>
                <div className="text-gray-500">Per Instance Price:</div>
                <div className="font-medium text-gray-900">${parseFloat(inclusion.per_instance_price || '0').toFixed(2)}</div>
                <div className="text-gray-500">Effective Price:</div>
                <div className="font-medium text-gray-900">${parseFloat(inclusion.effective_price || '0').toFixed(2)}</div>
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
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Remove Agent</span>
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
// ADD AGENT MODAL
// ============================================
interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
  availableAgentPricing: AgentPricing[];
  selectedPlanName: string;
}

const AddAgentModal: React.FC<AddAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  availableAgentPricing,
  selectedPlanName,
}) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  }, [formData, onSubmit]);

  const selectedPricing = useMemo(() =>
    availableAgentPricing.find(p => p.id === formData.agent_pricing_id),
  [availableAgentPricing, formData.agent_pricing_id]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Add Agent to Plan</h3>
                  <p className="text-indigo-100 text-sm">Configure for {selectedPlanName}</p>
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
                Select Agent Pricing <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.agent_pricing_id}
                onChange={(e) => setFormData({ ...formData, agent_pricing_id: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
                required
              >
                <option value="">-- Select an Agent --</option>
                {availableAgentPricing.map((pricing) => (
                  <option key={pricing.id} value={pricing.id}>
                    {pricing.agent_name} - {pricing.name} @ ${parseFloat(pricing.price).toFixed(2)} / {pricing.unit}
                  </option>
                ))}
              </select>
              {availableAgentPricing.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">All available agents are already added to this plan.</p>
              )}
            </div>

            {/* Preview selected agent */}
            {selectedPricing && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selected Agent Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Category:</div>
                  <div className="font-medium text-gray-900">{selectedPricing.agent_category}</div>
                  <div className="text-gray-500">Price:</div>
                  <div className="font-medium text-gray-900">${parseFloat(selectedPricing.price).toFixed(2)} / {selectedPricing.unit}</div>
                  <div className="text-gray-500">Billing:</div>
                  <div className="font-medium text-gray-900 capitalize">{selectedPricing.billing_method?.replace(/_/g, ' ')}</div>
                </div>
                {selectedPricing.description && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-indigo-200">{selectedPricing.description}</p>
                )}
              </div>
            )}

            {/* Per Instance Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Per Instance Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.per_instance_price}
                onChange={(e) => setFormData({ ...formData, per_instance_price: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Price charged per instance creation from this agent template</p>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Order in which this agent appears (lower numbers first)</p>
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
              disabled={isLoading || !formData.agent_pricing_id}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Agent</span>
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
// EDIT AGENT MODAL
// ============================================
interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditFormData) => Promise<void>;
  isLoading: boolean;
  inclusion: PlanAgentItem | null;
}

const EditAgentModal: React.FC<EditAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  inclusion,
}) => {
  const [formData, setFormData] = useState<EditFormData>(DEFAULT_EDIT_FORM_DATA);

  useEffect(() => {
    if (isOpen && inclusion) {
      setFormData({
        per_instance_price: parseFloat(inclusion.per_instance_price || '0'),
        is_featured: inclusion.is_featured,
        display_order: inclusion.display_order,
      });
    }
  }, [isOpen, inclusion]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  }, [formData, onSubmit]);

  if (!isOpen || !inclusion) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Edit Agent Inclusion</h3>
                  <p className="text-indigo-100 text-sm">{inclusion.agent_pricing?.agent_name}</p>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Current Agent Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Agent:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="font-medium text-gray-900">{inclusion.agent_pricing?.agent_name}</div>
                <div>{inclusion.agent_pricing?.name || 'Default Pricing'}</div>
                <div className="text-indigo-600 font-medium">
                  ${parseFloat(inclusion.agent_pricing?.price || '0').toFixed(2)} / {inclusion.agent_pricing?.unit}
                </div>
              </div>
            </div>

            {/* Per Instance Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Per Instance Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.per_instance_price}
                onChange={(e) => setFormData({ ...formData, per_instance_price: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Price charged per instance creation</p>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
              />
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Featured Agent</p>
                <p className="text-sm text-gray-500">Highlight this agent in the plan</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  formData.is_featured ? 'bg-yellow-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 rounded-b-2xl px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Update</span>
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
// HELPER FUNCTIONS
// ============================================
const isApiError = (err: unknown): err is ApiError =>
  typeof err === 'object' && err !== null && 'data' in err;

const formatPrice = (price: string | number | null | undefined): string => {
  if (price === null || price === undefined) return '$0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
};

// ============================================
// MAIN COMPONENT
// ============================================
const PlanAgentInclusionManagement = () => {
  // URL params
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');

  // State
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInclusion, setSelectedInclusion] = useState<PlanAgentItem | null>(null);
  const [inclusionToDelete, setInclusionToDelete] = useState<PlanAgentItem | null>(null);

  // Loading states
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // API Hooks
  const { data: plansData, isLoading: isLoadingPlans } = useGetPlansQuery({});
  const { data: agentPricingData, isLoading: isLoadingAgentPricing } = useGetAgentPricingQuery({ is_active: true });
  const { data: planAgentsData, isLoading: isLoadingInclusions, isFetching, refetch } = useGetPlanAgentsInPlanQuery(selectedPlanId, {
    skip: !selectedPlanId,
  });

  const [addAgentToPlan] = useAddAgentToPlanMutation();
  const [updateInclusion] = useUpdatePlanAgentInclusionMutation();
  const [removeAgent] = useRemoveAgentFromPlanMutation();

  // Memoized data
  const plans = useMemo<Plan[]>(() => plansData?.results || [], [plansData]);
  const agentPricingOptions = useMemo<AgentPricing[]>(() => agentPricingData?.results || [], [agentPricingData]);
  const allInclusions = useMemo<PlanAgentItem[]>(() => planAgentsData?.agents || [], [planAgentsData]);
  const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId), [plans, selectedPlanId]);

  // Pagination
  const totalCount = allInclusions.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedInclusions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allInclusions.slice(start, start + pageSize);
  }, [allInclusions, currentPage, pageSize]);

  const paginationInfo = useMemo(() => ({
    start: totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1,
    end: Math.min(currentPage * pageSize, totalCount),
  }), [currentPage, pageSize, totalCount]);

  // Auto-select plan from URL
  useEffect(() => {
    if (planFromUrl && plans.length > 0 && !selectedPlanId) {
      const planExists = plans.some(p => p.id === planFromUrl);
      if (planExists) {
        setSelectedPlanId(planFromUrl);
      }
    }
  }, [planFromUrl, plans, selectedPlanId]);

  // Reset page when plan changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPlanId, pageSize]);

  // Available agents (not already in plan)
  const availableAgentPricing = useMemo(() => {
    const includedAgentIds = allInclusions.map(i => i.agent_pricing?.agent_id);
    return agentPricingOptions.filter(ap => !includedAgentIds.includes(ap.agent_id));
  }, [allInclusions, agentPricingOptions]);

  // Handlers
  const handleAddSubmit = useCallback(async (formData: FormData) => {
    if (!selectedPlanId) return;

    setIsAdding(true);
    try {
      await addAgentToPlan({
        planId: selectedPlanId,
        data: {
          agents: [{
            agent_pricing_id: formData.agent_pricing_id,
            per_instance_price: formData.per_instance_price,
          }]
        },
      }).unwrap();

      setIsAddModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to add agent to plan:', error);
      alert(isApiError(error) ? (error.data?.detail ?? 'Failed to add agent') : 'Failed to add agent');
    } finally {
      setIsAdding(false);
    }
  }, [selectedPlanId, addAgentToPlan, refetch]);

  const handleEditSubmit = useCallback(async (formData: EditFormData) => {
    if (!selectedPlanId || !selectedInclusion) return;

    setIsUpdating(true);
    try {
      await updateInclusion({
        planId: selectedPlanId,
        inclusionId: selectedInclusion.id,
        data: {
          agent_pricing_id: selectedInclusion.agent_pricing?.id || '',
          per_instance_price: formData.per_instance_price,
          is_featured: formData.is_featured,
          display_order: formData.display_order,
        },
      }).unwrap();

      setIsEditModalOpen(false);
      setSelectedInclusion(null);
      refetch();
    } catch (error) {
      console.error('Failed to update inclusion:', error);
      alert(isApiError(error) ? (error.data?.detail ?? 'Failed to update') : 'Failed to update');
    } finally {
      setIsUpdating(false);
    }
  }, [selectedPlanId, selectedInclusion, updateInclusion, refetch]);

  const handleDelete = useCallback(async () => {
    if (!selectedPlanId || !inclusionToDelete) return;

    setIsDeleting(true);
    try {
      await removeAgent({
        planId: selectedPlanId,
        agentId: inclusionToDelete.agent_pricing?.agent_id ?? '',
      }).unwrap();

      setIsDeleteModalOpen(false);
      setInclusionToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to remove agent:', error);
      alert('Failed to remove agent from plan');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedPlanId, inclusionToDelete, removeAgent, refetch]);

  const handleOpenEditModal = useCallback((inclusion: PlanAgentItem) => {
    setSelectedInclusion(inclusion);
    setIsEditModalOpen(true);
  }, []);

  const handleOpenDeleteModal = useCallback((inclusion: PlanAgentItem) => {
    setInclusionToDelete(inclusion);
    setIsDeleteModalOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const isLoadingInitialData = isLoadingPlans || isLoadingAgentPricing;
  const showOverlay = isFetching && !isLoadingInclusions;

  return (
    <div className="w-full min-h-screen p-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                Link Agents to Plans
              </h1>
              <p className="text-gray-600 mt-2">
                Add and manage agents included in subscription plans
              </p>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Plan <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  disabled={isLoadingInitialData}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none"
                >
                  <option value="">-- Select a Plan --</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.plan_type}) - {formatPrice(plan.base_price)}/{plan.billing_period}
                    </option>
                  ))}
                </select>
                {isLoadingInitialData && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {selectedPlanId && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={availableAgentPricing.length === 0 || isAdding || isLoadingInclusions}
                  className="flex items-center justify-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Agent</span>
                </button>
              )}
            </div>
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedPlan.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {selectedPlan.plan_type.toUpperCase()}
                    </span>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Base: {formatPrice(selectedPlan.base_price)}/{selectedPlan.billing_period}
                    </span>
                    {selectedPlan.featured && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-2xl font-bold text-indigo-600">{totalCount}</div>
                  <div className="text-sm text-gray-600">Agent{totalCount !== 1 ? 's' : ''} Included</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {selectedPlanId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {showOverlay && <LoadingOverlay />}

            {isLoadingInclusions ? (
              <TableSkeleton rows={pageSize} />
            ) : paginatedInclusions.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No Agents Added</h3>
                  <p className="mt-2 text-gray-600">This plan doesn&apos;t have any agents yet</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={availableAgentPricing.length === 0}
                    className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {availableAgentPricing.length === 0 ? 'No Agents Available' : 'Add First Agent'}
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pricing Tier</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Per Instance Price</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Base Price</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Billing</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedInclusions.map((inclusion) => (
                        <tr key={inclusion.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{inclusion.agent_pricing?.agent_name}</div>
                                <div className="text-xs text-gray-500">{inclusion.agent_pricing?.agent_category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-900">{inclusion.agent_pricing?.name || 'Default'}</div>
                            {inclusion.agent_pricing?.description && (
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xs">{inclusion.agent_pricing.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-semibold">
                              {formatPrice(inclusion.per_instance_price)}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-bold text-gray-900">{formatPrice(inclusion.agent_pricing?.price)}</div>
                            <div className="text-xs text-gray-500">
                              per {inclusion.agent_pricing?.unit}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                              {inclusion.agent_pricing?.billing_method?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1">
                              {inclusion.is_featured && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  Featured
                                </span>
                              )}
                              <div className="text-xs text-gray-500">Order: {inclusion.display_order}</div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(inclusion)}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(inclusion)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove"
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
                {totalPages > 0 && (
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
                )}
              </>
            )}
          </div>
        )}

        {/* No Plan Selected State */}
        {!selectedPlanId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Select a Plan</h3>
              <p className="mt-2 text-gray-600">Choose a plan from the dropdown above to manage its agents</p>
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl text-left">
                <h4 className="font-medium text-gray-700 mb-2">Quick Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Select a plan to view and manage its agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Add multiple agents to build comprehensive plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Configure instances and pricing for each agent</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      <AddAgentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        isLoading={isAdding}
        availableAgentPricing={availableAgentPricing}
        selectedPlanName={selectedPlan?.name || ''}
      />

      {/* Edit Agent Modal */}
      <EditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInclusion(null);
        }}
        onSubmit={handleEditSubmit}
        isLoading={isUpdating}
        inclusion={selectedInclusion}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setInclusionToDelete(null);
        }}
        onConfirm={handleDelete}
        inclusion={inclusionToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default PlanAgentInclusionManagement;
