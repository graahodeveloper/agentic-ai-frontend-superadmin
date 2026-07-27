import React, { useState, useMemo, useEffect } from 'react';
import {
  AgentTemplate,
  useUpdateAgentTemplateMutation,
  getAdminIdFromStorage
} from '@/features/agentTemplateApi/agentTemplateApi';
import ViewInstancesDrawer from './ViewInstancesDrawer';
import AgentComponentPricingManagement from '@/components/subscription-model/plan/AgentComponentPricingManagement';

interface AgentTemplatesTableProps {
  templates: AgentTemplate[];
  isLoading?: boolean;
  onRefresh: () => void;
  onEditTemplate?: (template: AgentTemplate) => void;
}

// ============================================
// Agent type visuals
// ============================================
const getAgentTypeGradient = (agentType: string) => {
  switch (agentType.toLowerCase()) {
    case 'website':
      return 'from-green-500 to-emerald-500';
    case 'facebook':
      return 'from-blue-500 to-sky-500';
    case 'internal':
      return 'from-purple-500 to-violet-500';
    case 'external':
      return 'from-orange-500 to-amber-500';
    case 'chatbot':
      return 'from-teal-500 to-cyan-500';
    case 'ocr':
      return 'from-amber-500 to-yellow-500';
    case 'idp':
      return 'from-rose-500 to-pink-500';
    case 'whatsapp':
      return 'from-green-500 to-lime-500';
    case 'instagram':
      return 'from-pink-500 to-fuchsia-500';
    default:
      return 'from-gray-500 to-slate-500';
  }
};

const getAgentTypeIcon = (agentType: string) => {
  switch (agentType.toLowerCase()) {
    case 'website':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v12h12V4H4z"/>
          </svg>
        </div>
      );
    case 'facebook':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/>
          </svg>
        </div>
      );
    case 'internal':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 11a1 1 0 112 0v3a1 1 0 11-2 0v-3zm1-5a1 1 0 100 2 1 1 0 000-2z"/>
          </svg>
        </div>
      );
    case 'external':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
          </svg>
        </div>
      );
    case 'chatbot':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-teal-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
          </svg>
        </div>
      );
    case 'ocr':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
          </svg>
        </div>
      );
    case 'idp':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-rose-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd"/>
          </svg>
        </div>
      );
    case 'whatsapp':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 0a10 10 0 00-8.5 15.3L0 20l4.9-1.3A10 10 0 1010 0zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1110 18zm4.6-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.2.2-.4.1-.1 0-.3 0-.4s-.5-1.3-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 3.9 3.5.6.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.3-.2-.5-.3z"/>
          </svg>
        </div>
      );
    case 'instagram':
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-pink-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 1.8c2.7 0 3 0 4 .1 1 0 1.5.2 1.9.3.5.2.8.4 1.1.7.3.3.5.7.7 1.1.1.4.3.9.3 1.9.1 1.1.1 1.4.1 4s0 3-.1 4c0 1-.2 1.5-.3 1.9-.2.5-.4.8-.7 1.1-.3.3-.7.5-1.1.7-.4.1-.9.3-1.9.3-1.1.1-1.4.1-4 .1s-3 0-4-.1c-1 0-1.5-.2-1.9-.3-.5-.2-.8-.4-1.1-.7-.3-.3-.5-.7-.7-1.1-.1-.4-.3-.9-.3-1.9-.1-1.1-.1-1.4-.1-4s0-3 .1-4c0-1 .2-1.5.3-1.9.2-.5.4-.8.7-1.1.3-.3.7-.5 1.1-.7.4-.1.9-.3 1.9-.3 1.1-.1 1.4-.1 4-.1M10 0C7.3 0 6.9 0 5.9.1 4.8.1 4 .3 3.4.6c-.7.3-1.3.6-1.9 1.2-.6.6-1 1.2-1.2 1.9C0 4.3-.2 5-.1 6.1 0 7.1 0 7.5 0 10.2s0 3.1.1 4.1c.1 1.1.3 1.9.6 2.5.3.7.6 1.3 1.2 1.9.6.6 1.2 1 1.9 1.2.6.3 1.4.5 2.5.6 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1.1-.1 1.9-.3 2.5-.6.7-.3 1.3-.6 1.9-1.2.6-.6 1-1.2 1.2-1.9.3-.6.5-1.4.6-2.5.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-1.1-.3-1.9-.6-2.5-.3-.7-.6-1.3-1.2-1.9-.6-.6-1.2-1-1.9-1.2C16 .3 15.2.1 14.1.1 13.1 0 12.7 0 10 0z"/>
            <path d="M10 4.9a5.1 5.1 0 100 10.2 5.1 5.1 0 000-10.2zm0 8.4a3.3 3.3 0 110-6.6 3.3 3.3 0 010 6.6z"/>
            <circle cx="15.3" cy="4.7" r="1.2"/>
          </svg>
        </div>
      );
    default:
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
          </svg>
        </div>
      );
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ============================================
// Component Pricing Modal (embeds full pricing management)
// ============================================
interface PricingModalProps {
  template: AgentTemplate;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ template, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-gray-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">Component Pricing</h2>
              <p className="text-sm text-white/80 truncate">
                Configure components &amp; pricing for{' '}
                <span className="font-semibold text-white">{template.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AgentComponentPricingManagement agentId={template.id} embedded />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Template Card
// ============================================
interface TemplateCardProps {
  template: AgentTemplate;
  isUpdating: boolean;
  actionMessage?: { type: 'success' | 'error'; text: string };
  onToggleActive: (template: AgentTemplate) => void;
  onTogglePublic: (template: AgentTemplate) => void;
  onViewInstances: (template: AgentTemplate) => void;
  onEdit: (template: AgentTemplate) => void;
  onPricing: (template: AgentTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isUpdating,
  actionMessage,
  onToggleActive,
  onTogglePublic,
  onViewInstances,
  onEdit,
  onPricing,
}) => {
  const gradient = getAgentTypeGradient(template.agent_variant || template.agent_type);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-200 flex flex-col">
      {/* Gradient accent strip */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          {getAgentTypeIcon(template.agent_variant || template.agent_type)}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 leading-tight truncate" title={template.name}>
              {template.name}
            </h3>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {template.agent_id}
            </span>
          </div>
        </div>

        {/* Type / variant badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 capitalize border border-gray-200">
            {template.agent_variant || template.agent_type}
          </span>
          {template.agent_variant && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 capitalize border border-blue-100">
              {template.agent_type}
            </span>
          )}
          {template.agent_role && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 max-w-[160px] truncate"
              title={template.agent_role}
            >
              {template.agent_role}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-gray-600 line-clamp-2 leading-relaxed" title={template.description}>
          {template.description || 'No description provided.'}
        </p>

        {/* Status toggles */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => onToggleActive(template)}
            disabled={isUpdating}
            className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              template.is_active
                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            title="Toggle active status"
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${template.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
            {template.is_active ? 'Active' : 'Inactive'}
          </button>

          <button
            onClick={() => onTogglePublic(template)}
            disabled={isUpdating}
            className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              template.is_public
                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            title="Toggle visibility"
          >
            {template.is_public ? (
              <>
                <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                Public
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                </svg>
                Private
              </>
            )}
          </button>
        </div>

        {/* Usage stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-gray-50 rounded-xl">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5 font-medium">Activations</p>
            <p className="text-sm font-bold text-gray-900">
              <span className="text-indigo-600">{template.active_activations_count}</span>
              <span className="text-gray-400 font-normal"> / {template.activations_count}</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5 font-medium">Instances</p>
            <p className="text-sm font-bold text-gray-900">
              <span className="text-indigo-600">{template.active_instances_count}</span>
              <span className="text-gray-400 font-normal"> / {template.instances_count}</span>
            </p>
          </div>
        </div>

        {/* Created info */}
        <div className="flex items-center justify-between mt-3 mb-4 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{formatDate(template.created_at)}</span>
          <span className="truncate max-w-[140px]" title={template.creator_name}>
            by <span className="font-medium">{template.creator_name}</span>
          </span>
        </div>

        {/* Action message */}
        {actionMessage && (
          <div className={`mb-3 p-2.5 rounded-lg text-xs font-medium ${
            actionMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => onPricing(template)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Component Pricing
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewInstances(template)}
              className="flex-1 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2zm-4-4V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
              </svg>
              View
            </button>

            <button
              onClick={() => onEdit(template)}
              className="flex-1 flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-semibold border border-indigo-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================
const AgentTemplatesTable: React.FC<AgentTemplatesTableProps> = ({
  templates,
  isLoading,
  onRefresh,
  onEditTemplate,
}) => {
  const [updateAgentTemplate, { isLoading: isUpdating }] = useUpdateAgentTemplateMutation();
  const [actionMessages, setActionMessages] = useState<{ [key: string]: { type: 'success' | 'error'; text: string } }>({});

  const [isViewInstancesDrawerOpen, setIsViewInstancesDrawerOpen] = useState(false);
  const [selectedTemplateForViewing, setSelectedTemplateForViewing] = useState<AgentTemplate | null>(null);

  // Component Pricing modal
  const [pricingTemplate, setPricingTemplate] = useState<AgentTemplate | null>(null);

  // Frontend Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const adminId = getAdminIdFromStorage();

  // Calculate paginated data
  const { paginatedTemplates, totalPages, startItem, endItem, totalCount } = useMemo(() => {
    const total = templates.length;
    const pages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = templates.slice(start, end);

    return {
      paginatedTemplates: paginated,
      totalPages: pages,
      startItem: total > 0 ? start + 1 : 0,
      endItem: Math.min(end, total),
      totalCount: total
    };
  }, [templates, currentPage, itemsPerPage]);

  const handleToggleActive = async (template: AgentTemplate) => {
    if (!adminId) {
      setActionMessages(prev => ({
        ...prev,
        [template.id]: { type: 'error', text: 'Admin ID not found' }
      }));
      return;
    }

    try {
      await updateAgentTemplate({
        id: template.id,
        admin_id: adminId,
        data: { is_active: !template.is_active }
      }).unwrap();

      setActionMessages(prev => ({
        ...prev,
        [template.id]: {
          type: 'success',
          text: `Template ${!template.is_active ? 'activated' : 'deactivated'} successfully`
        }
      }));

      setTimeout(() => {
        setActionMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[template.id];
          return newMessages;
        });
      }, 3000);

      onRefresh();
    } catch (error) {
      console.error('Error toggling template status:', error);
      setActionMessages(prev => ({
        ...prev,
        [template.id]: { type: 'error', text: 'Failed to update template status' }
      }));

      setTimeout(() => {
        setActionMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[template.id];
          return newMessages;
        });
      }, 5000);
    }
  };

  const handleTogglePublic = async (template: AgentTemplate) => {
    if (!adminId) {
      setActionMessages(prev => ({
        ...prev,
        [template.id]: { type: 'error', text: 'Admin ID not found' }
      }));
      return;
    }

    try {
      await updateAgentTemplate({
        id: template.id,
        admin_id: adminId,
        data: { is_public: !template.is_public }
      }).unwrap();

      setActionMessages(prev => ({
        ...prev,
        [template.id]: {
          type: 'success',
          text: `Template visibility updated successfully`
        }
      }));

      setTimeout(() => {
        setActionMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[template.id];
          return newMessages;
        });
      }, 3000);

      onRefresh();
    } catch (error) {
      console.error('Error updating template visibility:', error);
      setActionMessages(prev => ({
        ...prev,
        [template.id]: { type: 'error', text: 'Failed to update template visibility' }
      }));

      setTimeout(() => {
        setActionMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[template.id];
          return newMessages;
        });
      }, 5000);
    }
  };

  const handleEditClick = (template: AgentTemplate) => {
    onEditTemplate?.(template);
  };

  const handleViewInstancesClick = (template: AgentTemplate) => {
    setSelectedTemplateForViewing(template);
    setIsViewInstancesDrawerOpen(true);
  };

  const handleCloseViewInstancesDrawer = () => {
    setIsViewInstancesDrawerOpen(false);
    setSelectedTemplateForViewing(null);
  };

  const handleOpenPricing = (template: AgentTemplate) => {
    setPricingTemplate(template);
  };

  const handleClosePricing = () => {
    setPricingTemplate(null);
    onRefresh();
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="h-1.5 bg-gray-200" />
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded-lg flex-1" />
                <div className="h-8 bg-gray-200 rounded-lg flex-1" />
              </div>
              <div className="h-16 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2zm-4-4V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Templates Found</h3>
          <p className="text-gray-600">You haven&apos;t created any agent templates yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {paginatedTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isUpdating={isUpdating}
            actionMessage={actionMessages[template.id]}
            onToggleActive={handleToggleActive}
            onTogglePublic={handleTogglePublic}
            onViewInstances={handleViewInstancesClick}
            onEdit={handleEditClick}
            onPricing={handleOpenPricing}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 font-medium">
              Showing <span className="font-bold text-indigo-600">{startItem}</span> to{' '}
              <span className="font-bold text-indigo-600">{endItem}</span> of{' '}
              <span className="font-bold text-gray-900">{totalCount}</span> templates
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  currentPage === 1
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 active:scale-95 shadow-sm'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`min-w-[40px] px-3 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                        currentPage === pageNumber
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                          : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 active:scale-95'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  currentPage === totalPages
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 active:scale-95 shadow-sm'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewInstancesDrawer
        isOpen={isViewInstancesDrawerOpen}
        onClose={handleCloseViewInstancesDrawer}
        template={selectedTemplateForViewing}
      />

      {/* Component Pricing Modal */}
      {pricingTemplate && (
        <PricingModal
          key={pricingTemplate.id}
          template={pricingTemplate}
          onClose={handleClosePricing}
        />
      )}
    </>
  );
};

export default AgentTemplatesTable;
