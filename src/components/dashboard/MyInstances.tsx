import React, { useState } from 'react';
import { AgentInstance } from '@/features/agentTemplateApi/agentTemplateApi';
import { useCreateActivationMutation, useUpsertActivationMutation } from '@/features/agentTemplateApi/agentTemplateApi';
import AnalyticsDrawer from './AnalyticsDrawer';
import ConfigurationDrawer from './ConfigurationDrawer';
import { User } from '@/types/auth';

interface MyInstancesProps {
  instancesResponse?: {
    count: number;
    results: AgentInstance[];
    summary: {
      total_instances: number;
      active_instances: number;
      inactive_instances: number;
      instances_with_activations: number;
    };
  };
  isLoading: boolean;
  error?: unknown;
  currentUser: User | null;
  onShowChatWidget?: (agent: AgentInstance) => void;
}

const MyInstances: React.FC<MyInstancesProps> = ({ instancesResponse, isLoading, error, currentUser, onShowChatWidget }) => {
  const [successMessages, setSuccessMessages] = useState<Record<string, string>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [analyticsDrawerOpen, setAnalyticsDrawerOpen] = useState<Record<string, boolean>>({});
  const [configurationDrawerOpen, setConfigurationDrawerOpen] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<Record<string, boolean>>({});

  const [createActivation, { isLoading: isActivationLoading }] = useCreateActivationMutation();
  const [upsertActivation, { isLoading: isUpsertActivationLoading }] = useUpsertActivationMutation();

  // Helper function to check if instance is activated
  const isInstanceActivated = (instance: AgentInstance): boolean => {
    return instance.activations && instance.activations.length > 0 && instance.activations[0].status;
  };

  // Handle opening/closing analytics drawer
  const handleToggleAnalyticsDrawer = (instance: AgentInstance) => {
    const instanceId = instance.id;
    setAnalyticsDrawerOpen((prev) => ({ ...prev, [instanceId]: !prev[instanceId] }));
  };

  // Handle opening/closing configuration drawer
  const handleToggleConfigurationDrawer = (instance: AgentInstance) => {
    const instanceId = instance.id;
    setConfigurationDrawerOpen((prev) => ({ ...prev, [instanceId]: !prev[instanceId] }));
  };

  // Handle opening/closing menu
  const handleToggleMenu = (instance: AgentInstance) => {
    const instanceId = instance.id;
    setMenuOpen((prev) => ({ ...prev, [instanceId]: !prev[instanceId] }));
  };

  // Handle activation click
  const handleActivationClick = async (instance: AgentInstance) => {
    const instanceId = instance.id;

    // Clear previous messages
    setErrorMessages((prev) => ({ ...prev, [instanceId]: '' }));
    setSuccessMessages((prev) => ({ ...prev, [instanceId]: '' }));

    if (!currentUser?.sub_id) {
      setErrorMessages((prev) => ({
        ...prev,
        [instanceId]: 'User session not found'
      }));
      return;
    }

    try {
      console.log('Activating instance:', {
        admin_sub_id: instance.user_sub_id,
        user_id: instance.user_sub_id,
        agent_id: instance.id,
        status: true
      });

      const result = await createActivation({
        admin_sub_id: instance.user_sub_id,
        data: {
          user_id: instance.user_sub_id,
          agent_id: instance.id,
          status: true
        }
      }).unwrap();

      console.log('Activation successful:', result);

      setSuccessMessages((prev) => ({
        ...prev,
        [instanceId]: 'Instance activated successfully!'
      }));

      // Automatically open configuration drawer after successful activation
      setTimeout(() => {
        handleToggleConfigurationDrawer(instance);
        setSuccessMessages((prev) => ({ ...prev, [instanceId]: '' }));
      }, 2000);

    } 
    
   catch (err: unknown) {
  console.error('Error activating instance:', err);

  let errorMessage = 'Failed to activate instance';

  if (typeof err === 'object' && err !== null) {
    const e = err as { data?: { detail?: string }; message?: string };

    if (e.data?.detail) {
      errorMessage = e.data.detail;
    } else if (e.message) {
      errorMessage = e.message;
    }
  }

  setErrorMessages((prev) => ({
    ...prev,
    [instanceId]: errorMessage,
  }));
}

  };

  // Handle deactivation click
  const handleDeactivationClick = async (instance: AgentInstance) => {
    const instanceId = instance.id;

    // Clear previous messages
    setErrorMessages((prev) => ({ ...prev, [instanceId]: '' }));
    setSuccessMessages((prev) => ({ ...prev, [instanceId]: '' }));

    if (!currentUser?.sub_id) {
      setErrorMessages((prev) => ({
        ...prev,
        [instanceId]: 'User session not found'
      }));
      return;
    }

    try {
      console.log('Deactivating instance:', {
        admin_sub_id: instance.user_sub_id,
        user_id: instance.user_sub_id,
        agent_id: instance.id,
        status: false
      });

      const result = await upsertActivation({
        admin_sub_id: instance.user_sub_id,
        data: {
          user_id: instance.user_sub_id,
          agent_id: instance.id,
          status: false
        }
      }).unwrap();

      console.log('Deactivation successful:', result);

      setSuccessMessages((prev) => ({
        ...prev,
        [instanceId]: result.message
      }));

      setTimeout(() => {
        setSuccessMessages((prev) => ({ ...prev, [instanceId]: '' }));
      }, 2000);

    }
  catch (err: unknown) {
    console.error('Error deactivating instance:', err);

    let errorMessage = 'Failed to deactivate instance';

    if (typeof err === 'object' && err !== null) {
      const e = err as { data?: { detail?: string }; message?: string };

      if (e.data?.detail) {
        errorMessage = e.data.detail;
      } else if (e.message) {
        errorMessage = e.message;
      }
    }

    setErrorMessages((prev) => ({
      ...prev,
      [instanceId]: errorMessage,
    }));
  }

  };

  if (!currentUser?.sub_id) {
    return (
      <div className="text-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-sm">
        <div className="text-gray-600 text-lg font-medium">Please log in to view your instances</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 text-lg">Loading your instances...</span>
      </div>
    );
  }

  if (error) {
        const errorMessage = (() => {
          if (typeof error === 'object' && error !== null && 'status' in error) {
            const e = error as { status?: number; data?: string };
            return `Error ${e.status ?? ''}: ${e.data ?? 'Failed to fetch instances'}`;
          }
          return 'Failed to fetch instances';
        })();


    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-800">Error loading instances</h3>
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!instancesResponse?.results?.length) {
    return (
      <div className="text-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H6a1 1 0 00-1 1v1m16 0h-2M4 5h2"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No instances created yet</h3>
        <p className="text-gray-600 mb-4">Create your first instance to get started</p>
        <div className="text-sm text-gray-500">Click the + button above to create a new instance</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Instances</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your agent instances</p>
          {instancesResponse && (
            <p className="text-xs text-gray-400 mt-1">
              Total instances: {instancesResponse.summary.total_instances} • Active:{' '}
              {instancesResponse.summary.active_instances} • With Activations:{' '}
              {instancesResponse.summary.instances_with_activations}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {instancesResponse.results.map((instance: AgentInstance) => {
          const instanceError = errorMessages[instance.id];
          const instanceSuccess = successMessages[instance.id];
          const isActivated = isInstanceActivated(instance);

          console.log('Instance:', instance);
          console.log('Is activated:', isActivated);
          console.log('Activations:', instance.activations);

          return (
            <div
              key={instance.id}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 relative"
            >
              <div className="p-5">
                <div className="flex flex-col h-full">
                  {/* Header with icon, title, and menu */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg">
                        🤖
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{instance.name}</h3>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => handleToggleMenu(instance)}
                        className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                        title="More options"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                      {menuOpen[instance.id] && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                          <div className="py-1">
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setMenuOpen((prev) => ({ ...prev, [instance.id]: false }))}
                            >
                              Edit
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              onClick={() => setMenuOpen((prev) => ({ ...prev, [instance.id]: false }))}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instance ID Badge */}
                  {instance.agent_id && (
                    <div className="mb-3">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200">
                        <svg className="w-3 h-3 text-gray-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">ID: {instance.agent_id}</span>
                      </div>
                    </div>
                  )}

                  {/* Agent Type and Status */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                      {instance.agent_type}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <div
                        className={`w-2 h-2 rounded-full mr-1 ${isActivated ? 'bg-green-500' : 'bg-gray-400'}`}
                      ></div>
                      {isActivated ? 'Activated' : 'Not Activated'}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">{instance.description}</p>

                  {/* Website, Created Date, and Additional Info */}
                  <div className="text-xs text-gray-500 space-y-2 mb-4">
                    {instance.website && (
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <a
                          href={instance.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 truncate max-w-[150px]"
                        >
                          {instance.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    <div>Created {new Date(instance.created_at).toLocaleDateString()}</div>
                    <div>
                      Activations: {instance.activations_summary.total_count} (
                      {instance.activations_summary.active_count} active)
                    </div>
                    <div>Created by: {instance.creator_name}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center space-x-4 px-2">
                    {/* Show Activate Button when not activated */}
                    {!isActivated && (
                      <div
                        onClick={() => !isActivationLoading && handleActivationClick(instance)}
                        className={`cursor-pointer p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                          isActivationLoading ? 'cursor-not-allowed opacity-50' : ''
                        } bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-emerald-500/25`}
                      >
                        {isActivationLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <div className="text-white">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show other buttons only when activated */}
                    {isActivated && (
                      <>
                        {/* Deactivation Icon */}
                        <div
                          onClick={() => !isUpsertActivationLoading && handleDeactivationClick(instance)}
                          className={`cursor-pointer p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                            isUpsertActivationLoading ? 'cursor-not-allowed opacity-50' : ''
                          } bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-500/25`}
                        >
                          {isUpsertActivationLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <div className="text-white">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.59-5.41L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Configuration Icon */}
                        <div
                          onClick={() => handleToggleConfigurationDrawer(instance)}
                          className="cursor-pointer p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-110"
                        >
                          <div className="text-white">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                            </svg>
                          </div>
                        </div>

                        {/* Analytics Icon */}
                        <div
                          onClick={() => handleToggleAnalyticsDrawer(instance)}
                          className="cursor-pointer p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110"
                        >
                          <div className="text-white">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Success/Error Messages */}
              {(instanceError || instanceSuccess) && (
                <div className="px-5 pb-4">
                  {instanceError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="ml-2 text-sm text-red-700 flex-1">{instanceError}</p>
                        <button
                          onClick={() =>
                            setErrorMessages((prev) => {
                              const newMessages = { ...prev };
                              delete newMessages[instance.id];
                              return newMessages;
                            })
                          }
                          className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {instanceSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="ml-2 text-sm text-green-700">{instanceSuccess}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Drawer */}
              <AnalyticsDrawer
                isOpen={analyticsDrawerOpen[instance.id] || false}
                onClose={() => setAnalyticsDrawerOpen((prev) => ({ ...prev, [instance.id]: false }))}
                agentId={instance.id}
                currentUserSession={currentUser}
              />

              {/* Configuration Drawer */}
              <ConfigurationDrawer
                isOpen={configurationDrawerOpen[instance.id] || false}
                onClose={() => setConfigurationDrawerOpen((prev) => ({ ...prev, [instance.id]: false }))}
                agent={instance}
                currentUserSession={currentUser}
                setSuccessMessages={setSuccessMessages}
                setErrorMessages={setErrorMessages}
                onShowChatWidget={onShowChatWidget}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyInstances;