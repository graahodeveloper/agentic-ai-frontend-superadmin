import React, { useState, useEffect } from 'react';
import { useGetAgentsByUserSubIdQuery, useGrantAgentAccessMutation, Agent } from '@/features/user/userApi';
import { AgentAccess, User } from '@/types/auth';

interface AssignAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User;
  currentUser: User | null;
  onAccessGranted?: () => void;
}

type ApiError = {
  status?: number;
  data?: {
    agent?: string[];
    access_type?: string[];
    user?: string[];
    detail?: string;
    [key: string]: unknown;
  };
};

type AccessType = 'view' | 'use' | 'manage' | 'full';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

const accessTypeConfig = {
  view: {
    label: 'View',
    description: 'Can view agent information only',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: '👁️'
  },
  use: {
    label: 'Use',
    description: 'Can use the agent for tasks',
    color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    icon: '🔧'
  },
  manage: {
    label: 'Manage',
    description: 'Can modify agent settings',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    icon: '⚙️'
  },
  full: {
    label: 'Full Access',
    description: 'Complete control over the agent',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    icon: '👑'
  }
};

const AssignAgentsModal: React.FC<AssignAgentsModalProps> = ({
  isOpen,
  onClose,
  selectedUser,
  currentUser,
  onAccessGranted
}) => {
  const [selectedAccess, setSelectedAccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [existingAccess, setExistingAccess] = useState<Record<string, AccessType>>({});
  
  // NEW: State for tracking which agents are expanded (checkbox selected)
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  // Toast functions
  const showToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    const toast: ToastMessage = { id, type, title, message };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch agents using the current admin's sub_id
  const { 
    data: agentsData, 
    error: agentsError, 
    isLoading: isLoadingAgents,
    refetch: refetchAgents
  } = useGetAgentsByUserSubIdQuery(currentUser?.sub_id || '', {
    skip: !currentUser?.sub_id || !isOpen,
  });

  // Grant access mutation
  const [grantAccess, { isLoading: isMutationLoading, error: mutationError }] = useGrantAgentAccessMutation();

  // NEW: Handle checkbox toggle for expanding/collapsing agents
  const handleAgentToggle = (agentId: string) => {
    const newExpandedAgents = new Set(expandedAgents);
    
    if (expandedAgents.has(agentId)) {
      // Collapsing - remove from expanded and clear any selection for this agent
      newExpandedAgents.delete(agentId);
      if (selectedAccess?.startsWith(agentId + '-')) {
        setSelectedAccess(null);
      }
    } else {
      // Expanding - add to expanded
      newExpandedAgents.add(agentId);
    }
    
    setExpandedAgents(newExpandedAgents);
  };

  // Reset and initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, initializing...');
      setIsProcessing(false);
      setToasts([]);
      
      // Build existing access lookup
      const accessLookup: Record<string, AccessType> = {};
      if (selectedUser?.agent_access) {
        selectedUser.agent_access.forEach((access: AgentAccess) => {
          const agentId = access.agent || access.agent_details?.id;
          if (agentId) {
            accessLookup[agentId] = access.access_type;
          }
        });
      }
      setExistingAccess(accessLookup);
      
      // Clear selections and expanded state
      setSelectedAccess(null);
      setExpandedAgents(new Set());
    } else {
      setToasts([]);
    }
  }, [isOpen, selectedUser]);

  const handleClick = (agentId: string, accessType: AccessType) => {
    const selectionKey = `${agentId}-${accessType}`;
    
    if (selectedAccess === selectionKey) {
      setSelectedAccess(null);
    } else {
      setSelectedAccess(selectionKey);
      
      if (existingAccess[agentId]) {
        setExistingAccess(prev => {
          const updated = { ...prev };
          delete updated[agentId];
          return updated;
        });
      }
    }
  };

  const handleSave = async () => {
    if (!selectedAccess) return;
    
    const lastDashIndex = selectedAccess.lastIndexOf('-');
    if (lastDashIndex === -1) {
      showToast('error', 'Invalid Selection', 'Error: Invalid selection format');
      return;
    }
    
    const agentId = selectedAccess.substring(0, lastDashIndex);
    const accessType = selectedAccess.substring(lastDashIndex + 1);
    
    if (!agentId || agentId.length < 30) {
      showToast('error', 'Invalid Agent ID', 'Error: Invalid agent ID format');
      return;
    }
    
    if (!['view', 'use', 'manage', 'full'].includes(accessType)) {
      showToast('error', 'Invalid Access Type', 'Error: Access type must be one of: view, use, manage, full');
      return;
    }
    
    if (!currentUser?.sub_id) {
      showToast('error', 'Admin Not Found', 'Error: Admin user session not found');
      return;
    }
    
    if (!selectedUser?.id) {
      showToast('error', 'User Not Found', 'Error: Selected user information not found');
      return;
    }
    
    const requestData = {
      user: selectedUser.id,
      agent: agentId,
      access_type: accessType as AccessType,
      adminSubId: currentUser.sub_id
    };
    
    setIsProcessing(true);
    
    try {
      const result = await grantAccess(requestData).unwrap();
      
      const agentName = agentsData?.results?.find(a => a.id === agentId)?.name || 'Agent';
      showToast('success', 'Access Granted', `Successfully granted ${accessTypeConfig[accessType as AccessType].label} access to ${agentName}`);
      
      setExistingAccess(prev => ({
        ...prev,
        [agentId]: accessType as AccessType
      }));
      
      if (onAccessGranted) {
        onAccessGranted();
      }
      
      setTimeout(() => {
        setSelectedAccess(null);
        setIsProcessing(false);
      }, 1000);
      
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setIsProcessing(false);

      let errorTitle = 'Failed to Grant Access';
      let errorMessage = 'An unexpected error occurred while granting access.';

      if (apiError?.data) {
        const errorDetails: string[] = [];
        if (apiError.data.agent) {
          errorDetails.push(`Agent: ${apiError.data.agent.join(', ')}`);
        }
        if (apiError.data.access_type) {
          errorDetails.push(`Access Type: ${apiError.data.access_type.join(', ')}`);
        }
        if (apiError.data.user) {
          errorDetails.push(`User: ${apiError.data.user.join(', ')}`);
        }
        if (apiError.data.detail) {
          errorDetails.push(apiError.data.detail);
        }

        if (errorDetails.length > 0) {
          errorMessage = errorDetails.join(' • ');
        }

        if (apiError.status === 400) {
          errorTitle = 'Validation Error';
        } else if (apiError.status === 403) {
          errorTitle = 'Permission Denied';
        } else if (apiError.status === 404) {
          errorTitle = 'Resource Not Found';
        } else if (apiError.status && apiError.status >= 500) {
          errorTitle = 'Server Error';
        }
      }

      showToast('error', errorTitle, errorMessage);
    }
  };

  if (!isOpen) return null;

  // Toast Component
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[70] space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-full bg-white shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out animate-in slide-in-from-right ${
            toast.type === 'success' ? 'border-l-4 border-green-500' :
            toast.type === 'error' ? 'border-l-4 border-red-500' :
            'border-l-4 border-blue-500'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === 'success' && (
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {toast.type === 'error' && (
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {toast.type === 'info' && (
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                <p className="mt-1 text-sm text-gray-600 leading-5">{toast.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
                  onClick={() => removeToast(toast.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 max-w-2xl bg-white shadow-2xl z-50 border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Assign Agents</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Grant access to agents for{' '}
                  <span className="font-semibold text-indigo-600">
                    {selectedUser?.full_name || selectedUser?.email}
                  </span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingAgents ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading agents...</span>
              </div>
            ) : agentsError ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 font-medium">Error loading agents</p>
                <p className="text-gray-500 text-sm mt-1">Please try again later</p>
                <button 
                  onClick={() => refetchAgents()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : !agentsData?.results?.length ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No agents available</h3>
                <p className="text-gray-500">There are no agents available to assign to this user.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Available Agents ({agentsData.count})
                  </h3>
                  <div className="text-sm text-gray-500">
                    {expandedAgents.size} selected for assignment
                  </div>
                </div>

                <div className="space-y-3">
                  {agentsData.results.map((agent) => {
                    const existingAccessType = existingAccess[agent.id];
                    const isExpanded = expandedAgents.has(agent.id);
                    
                    return (
                      <div key={agent.id} className={`bg-white rounded-xl border-2 transition-all duration-300 ${
                        isExpanded 
                          ? 'border-indigo-200 shadow-lg bg-gradient-to-br from-white to-indigo-50/30' 
                          : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                      }`}>
                        
                        {/* Compact View - Always Visible */}
                        <div className="p-4">
                          <div className="flex items-center space-x-4">
                            {/* Checkbox */}
                            <div className="flex-shrink-0">
                              <label className="inline-flex items-center cursor-pointer group">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={isExpanded}
                                    onChange={() => handleAgentToggle(agent.id)}
                                    className="sr-only"
                                  />
                                  <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                                    isExpanded 
                                      ? 'bg-indigo-600 border-indigo-600' 
                                      : 'border-gray-300 group-hover:border-indigo-400'
                                  }`}>
                                    {isExpanded && (
                                      <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </label>
                            </div>

                            {/* Agent Icon */}
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                {agent.icon ? (
                                  <img src={agent.icon} alt={agent.name} className="w-6 h-6 rounded" />
                                ) : (
                                  <span className="text-white font-bold text-sm">
                                    {agent.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Agent Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900 truncate">{agent.name}</h4>
                                {/* <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                                  agent.is_active 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {agent.is_active ? 'Active' : 'Inactive'}
                                </span> */}
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                                  {agent.agent_type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{agent.description}</p>
                              {existingAccessType && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Current: {accessTypeConfig[existingAccessType].label}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Expand/Collapse Indicator */}
                            <div className="flex-shrink-0">
                              <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Expanded View - Access Level Selection */}
                        {isExpanded && (
                          <div className="border-t border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                            <div className="p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold text-gray-800">
                                  Select Access Level:
                                </h5>
                                {existingAccessType && (
                                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                    Currently has {accessTypeConfig[existingAccessType].label} access
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {(Object.entries(accessTypeConfig) as [AccessType, typeof accessTypeConfig[AccessType]][]).map(([type, config]) => {
                                  const selectionKey = `${agent.id}-${type}`;
                                  const isSelected = selectedAccess === selectionKey;
                                  const isExistingAccess = existingAccessType === type;
                                  
                                  return (
                                    <div key={type} className="space-y-2">
                                      <button
                                        onClick={() => handleClick(agent.id, type)}
                                        className={`
                                          relative p-3 rounded-lg border-2 text-left transition-all duration-200 w-full group
                                          ${isSelected 
                                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 shadow-md scale-105' 
                                            : isExistingAccess
                                            ? 'border-orange-300 bg-orange-50/70'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                          } 
                                          cursor-pointer
                                        `}
                                      >
                                        <div className="flex items-start space-x-2">
                                          <span className="text-base">{config.icon}</span>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900">{config.label}</div>
                                            <div className="text-xs text-gray-600 mt-0.5 leading-tight">{config.description}</div>
                                            {isSelected && (
                                              <div className="text-xs text-indigo-600 font-semibold mt-1 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                                SELECTED
                                              </div>
                                            )}
                                            {isExistingAccess && !isSelected && (
                                              <div className="text-xs text-orange-600 font-semibold mt-1 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                                CURRENT
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {isSelected && (
                                          <div className="absolute -top-1 -right-1">
                                            <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                              </svg>
                                            </div>
                                          </div>
                                        )}
                                      </button>

                                      {/* Save Button */}
                                      {isSelected && (
                                        <button
                                          onClick={handleSave}
                                          disabled={isProcessing}
                                          className="w-full flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                                        >
                                          {isProcessing ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                              Saving...
                                            </>
                                          ) : (
                                            <>
                                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                              {isExistingAccess ? `Update to ${config.label}` : `Grant ${config.label} Access`}
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Select agents using checkboxes, then choose access levels to grant permissions
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </>
  );
};

export default AssignAgentsModal;