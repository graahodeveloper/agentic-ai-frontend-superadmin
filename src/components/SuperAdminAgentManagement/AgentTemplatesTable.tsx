import React, { useState, useMemo } from 'react';
import { 
  AgentTemplate, 
  useUpdateAgentTemplateMutation,
  getAdminIdFromStorage 
} from '@/features/agentTemplateApi/agentTemplateApi';
import ViewInstancesDrawer from './ViewInstancesDrawer';

interface AgentTemplatesTableProps {
  templates: AgentTemplate[];
  isLoading?: boolean;
  onRefresh: () => void;
  onEditTemplate?: (template: AgentTemplate) => void;
}

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

  // Frontend Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getAgentTypeIcon = (agentType: string) => {
    switch (agentType.toLowerCase()) {
      case 'website':
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v12h12V4H4z"/>
            </svg>
          </div>
        );
      case 'facebook':
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/>
            </svg>
          </div>
        );
      case 'internal':
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg flex-shrink-0">
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 11a1 1 0 112 0v3a1 1 0 11-2 0v-3zm1-5a1 1 0 100 2 1 1 0 000-2z"/>
            </svg>
          </div>
        );
      case 'external':
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg flex-shrink-0">
            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
            </svg>
          </div>
        );
      case 'chatbot':
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-teal-100 rounded-lg flex-shrink-0">
            <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
            </svg>
          </div>
        );
    }
  };

  // Render Mobile Card View
  const renderMobileCard = (template: AgentTemplate) => (
    <div key={template.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0 mt-1">
          {getAgentTypeIcon(template.agent_variant || template.agent_type)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">{template.name}</h3>
          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {template.agent_id}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{template.description}</p>

      {/* Type and Role */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Type</p>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 capitalize">
            {template.agent_variant || template.agent_type}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Role</p>
          {template.agent_role ? (
            <span className="inline-block text-xs text-gray-800 font-medium truncate">
              {truncateText(template.agent_role, 15)}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Not set</span>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => handleToggleActive(template)}
          disabled={isUpdating}
          className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
            template.is_active
              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className={`w-2 h-2 rounded-full mr-2 ${
            template.is_active ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          {template.is_active ? 'Active' : 'Inactive'}
        </button>

        <button
          onClick={() => handleTogglePublic(template)}
          disabled={isUpdating}
          className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
            template.is_public
              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {template.is_public ? 'Public' : 'Private'}
        </button>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 mb-1">Activations</p>
          <p className="text-sm font-bold text-gray-900">
            <span className="text-indigo-600">{template.active_activations_count}</span>
            <span className="text-gray-400 font-normal"> / {template.activations_count}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Instances</p>
          <p className="text-sm font-bold text-gray-900">
            <span className="text-indigo-600">{template.active_instances_count}</span>
            <span className="text-gray-400 font-normal"> / {template.instances_count}</span>
          </p>
        </div>
      </div>

      {/* Created Info */}
      <div className="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">{formatDate(template.created_at)}</span>
          <span className="text-gray-500">by {template.creator_name}</span>
        </div>
      </div>

      {/* Action Messages */}
      {actionMessages[template.id] && (
        <div className={`mb-3 p-2.5 rounded-lg text-xs font-medium ${
          actionMessages[template.id].type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {actionMessages[template.id].text}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleViewInstancesClick(template)}
          className="flex-1 flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 px-4 py-2.5 rounded-lg text-sm font-semibold border border-blue-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2zm-4-4V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
          </svg>
          <span>View</span>
        </button>
        
        <button
          onClick={() => handleEditClick(template)}
          className="flex-1 flex items-center justify-center space-x-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-200 px-4 py-2.5 rounded-lg text-sm font-semibold border border-indigo-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Edit</span>
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading agent templates...</p>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
      {/* Mobile View (Cards) */}
      <div className="lg:hidden space-y-4">
        {paginatedTemplates.map(template => renderMobileCard(template))}
        
        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col space-y-4">
              <div className="text-sm text-gray-600 text-center font-medium">
                Page {currentPage} of {totalPages} • {startItem}-{endItem} of {totalCount}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    currentPage === 1
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-300 active:scale-95'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm border border-indigo-200">
                  {currentPage}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    currentPage === totalPages
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-300 active:scale-95'
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
      </div>

      {/* Desktop View - Fixed Table with Proper Scroll Containment */}
      <div className="hidden lg:block w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {/* Table Container with Proper Scroll Containment */}
          <div 
            className="flex-1 overflow-auto"
            style={{ 
              maxHeight: 'calc(100vh - 350px)',
              minHeight: '500px',
            }}
          >
            <div className="min-w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[28%]">
                      Template Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[10%]">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[15%]">
                      Agent Role
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[10%]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[10%]">
                      Visibility
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[10%]">
                      Usage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[12%]">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[5%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-indigo-50/30 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getAgentTypeIcon(template.agent_variant || template.agent_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors" title={template.name}>
                                {template.name}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 mb-2 border border-indigo-100">
                              {template.agent_id}
                            </span>
                            <p 
                              className="text-xs text-gray-600 line-clamp-2 break-words leading-relaxed" 
                              title={template.description}
                            >
                              {template.description}
                            </p>
                          </div>
                        </div>
                        {actionMessages[template.id] && (
                          <div className={`mt-3 p-2.5 rounded-lg text-xs font-medium ${
                            actionMessages[template.id].type === 'success' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {actionMessages[template.id].text}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1.5">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 capitalize border border-gray-200">
                            {template.agent_variant || template.agent_type}
                          </span>
                          {template.agent_variant && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 capitalize border border-blue-100">
                              {template.agent_type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {template.agent_role ? (
                          <div className="group/role relative">
                            <div className="inline-flex items-start px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200 max-w-full">
                              <span className="break-words line-clamp-2">
                                {template.agent_role}
                              </span>
                            </div>
                            {(template.agent_role?.length || 0) > 50 && (
                              <div className="invisible group-hover/role:visible absolute z-20 left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl break-words">
                                {template.agent_role}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic font-medium">Not specified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(template)}
                          disabled={isUpdating}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            template.is_active
                              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:shadow-sm'
                              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:shadow-sm'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            template.is_active ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublic(template)}
                          disabled={isUpdating}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            template.is_public
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:shadow-sm'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:shadow-sm'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex items-center justify-center space-x-2 w-full">
                            <span className="text-xs text-gray-500 font-medium">Act:</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-bold text-indigo-600">{template.active_activations_count}</span>
                              <span className="text-gray-400 text-xs">/</span>
                              <span className="text-sm font-medium text-gray-600">{template.activations_count}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-center space-x-2 w-full">
                            <span className="text-xs text-gray-500 font-medium">Inst:</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-bold text-indigo-600">{template.active_instances_count}</span>
                              <span className="text-gray-400 text-xs">/</span>
                              <span className="text-sm font-medium text-gray-600">{template.instances_count}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="font-semibold text-xs text-gray-900">{formatDate(template.created_at)}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]" title={template.creator_name}>
                            by <span className="font-medium">{template.creator_name}</span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewInstancesClick(template)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 p-2 rounded-lg group/btn border border-transparent hover:border-blue-200 active:scale-95"
                            title="View instances"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2zm-4-4V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleEditClick(template)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-200 p-2 rounded-lg group/btn border border-transparent hover:border-indigo-200 active:scale-95"
                            title="Edit template"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


          {totalPages > 1 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 font-medium">
                  Showing <span className="font-bold text-indigo-600">{startItem}</span> to{' '}
                  <span className="font-bold text-indigo-600">{endItem}</span> of{' '}
                  <span className="font-bold text-gray-900">{totalCount}</span> results
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
        </div>
      </div>

      <ViewInstancesDrawer
        isOpen={isViewInstancesDrawerOpen}
        onClose={handleCloseViewInstancesDrawer}
        template={selectedTemplateForViewing}
      />
    </>
  );
};

export default AgentTemplatesTable;