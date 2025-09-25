import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  AgentTemplate, 
  useGetTemplateInstancesQuery,
  getAdminIdFromStorage,
  TemplateInstance,
} from '@/features/agentTemplateApi/agentTemplateApi';

interface ViewInstancesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  template: AgentTemplate | null;
}

const ITEMS_PER_PAGE = 12;

const ViewInstancesDrawer: React.FC<ViewInstancesDrawerProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // API hooks
  const adminId = getAdminIdFromStorage();
  
  const { 
    data: instancesData, 
    isLoading: isLoadingInstances,
    error: instancesError,
    refetch: refetchInstances 
  } = useGetTemplateInstancesQuery(
    { 
      templateId: template?.id || '',
      admin_id: adminId || '',
    },
    { skip: !isOpen || !template?.id || !adminId }
  );

  // Reset page when drawer opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Simple pagination
  const paginatedInstances = useMemo(() => {
    if (!instancesData?.instances) return { items: [], totalPages: 0, totalItems: 0 };
    
    const instances = instancesData.instances;
    const totalItems = instances.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const items = instances.slice(startIndex, endIndex);
    
    return { items, totalPages, totalItems };
  }, [instancesData?.instances, currentPage]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Template Instances
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                All instances created from this template
              </p>
              {template && (
                <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-white rounded-full shadow-sm border border-indigo-200">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-indigo-800">{template.name}</span>
                  <span className="text-xs text-indigo-600 ml-2">({template.agent_id})</span>
                </div>
              )}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {isLoadingInstances ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading instances...</h3>
                  <p className="text-gray-600">Please wait while we fetch the data</p>
                </div>
              </div>
            ) : instancesError ? (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load</h3>
                  <p className="text-gray-600 mb-4">Unable to load instances for this template.</p>
                  <button
                    onClick={() => refetchInstances()}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                </div>
              </div>
            ) : !instancesData?.instances?.length ? (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Instances Yet</h3>
                  <p className="text-gray-600">No instances have been created from this template.</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid gap-4">
                  {paginatedInstances.items.map((instance, index) => (
                    <div
                      key={instance.id}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-200"
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeIn 0.5s ease-out forwards'
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {instance.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                instance.is_active
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                instance.is_active ? 'bg-green-500' : 'bg-gray-500'
                              }`}></div>
                              {instance.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Created by <span className="font-medium">{instance.instance_creator_name}</span>
                          </p>
                        </div>
                      </div>

                      {/* Agent ID Badge */}
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 mb-4 border border-indigo-100">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-sm font-mono font-semibold text-indigo-800">ID: {instance.agent_id}</span>
                        </div>
                      </div>

                      {/* Date Info */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Created: {formatDate(instance.created_at)}</span>
                        </div>
                        {instance.is_public && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                            </svg>
                            Public
                          </span>
                        )}
                      </div>

                      {/* Last Updated */}
                      {instance.updated_at !== instance.created_at && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Last updated: {formatDate(instance.updated_at)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {paginatedInstances.totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, paginatedInstances.totalItems)} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, paginatedInstances.totalItems)} of{' '}
                  {paginatedInstances.totalItems} instances
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, paginatedInstances.totalPages) }, (_, i) => {
                      let pageNum;
                      if (paginatedInstances.totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        const start = Math.max(1, currentPage - 2);
                        const end = Math.min(paginatedInstances.totalPages, start + 4);
                        pageNum = start + i;
                        if (pageNum > end) return null;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(paginatedInstances.totalPages, prev + 1))}
                    disabled={currentPage === paginatedInstances.totalPages}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {instancesData && (
                  <>
                    {instancesData.instances_count} total instances • {instancesData.active_instances_count} active
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm"
              >
                Close
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
        `}</style>
      </div>
    </>
  );
};

export default ViewInstancesDrawer;