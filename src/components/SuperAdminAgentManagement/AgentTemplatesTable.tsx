import React, { useState } from 'react';
import { 
  AgentTemplate, 
  useUpdateAgentTemplateMutation,
  getAdminIdFromStorage 
} from '@/features/agentTemplateApi/agentTemplateApi';
import ViewInstancesDrawer from './ViewInstancesDrawer'; // Import the new drawer component

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
  onEditTemplate
}) => {
  const [updateAgentTemplate, { isLoading: isUpdating }] = useUpdateAgentTemplateMutation();
  const [actionMessages, setActionMessages] = useState<{ [key: string]: { type: 'success' | 'error'; text: string } }>({});
  
  // State for View Instances Drawer
  const [isViewInstancesDrawerOpen, setIsViewInstancesDrawerOpen] = useState(false);
  const [selectedTemplateForViewing, setSelectedTemplateForViewing] = useState<AgentTemplate | null>(null);

  // Get admin ID from localStorage
  const adminId = getAdminIdFromStorage();

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

  // New function to handle view instances click
  const handleViewInstancesClick = (template: AgentTemplate) => {
    setSelectedTemplateForViewing(template);
    setIsViewInstancesDrawerOpen(true);
  };

  // Close view instances drawer
  const handleCloseViewInstancesDrawer = () => {
    setIsViewInstancesDrawerOpen(false);
    setSelectedTemplateForViewing(null);
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

  const getAgentTypeIcon = (agentType: string) => {
    switch (agentType.toLowerCase()) {
      case 'website':
        return (
          <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v12h12V4H4z"/>
            </svg>
          </div>
        );
      case 'facebook':
        return (
          <div className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/>
            </svg>
          </div>
        );
      case 'whatsapp':
        return (
          <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.472 2.528C15.556.619 12.896-.3 10.05-.3c-5.446 0-9.879 4.433-9.879 9.879 0 1.742.454 3.442 1.317 4.944L0 20l5.565-1.459c1.46.8 3.103 1.222 4.785 1.222h.004c5.442 0 9.875-4.433 9.875-9.879 0-2.846-.919-5.506-2.528-7.374l-.229-.002z"/>
            </svg>
          </div>
        );
      case 'telegram':
        return (
          <div className="inline-flex items-center justify-center w-6 h-6 bg-sky-100 rounded-full">
            <svg className="w-3 h-3 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18.384,2.297c0.319-0.289,0.497-0.679,0.497-1.091c0-0.805-0.653-1.458-1.458-1.458H2.578C1.773-0.252,1.12,0.401,1.12,1.206c0,0.412,0.178,0.802,0.497,1.091l8.364,7.582L18.384,2.297z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
            <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
            </svg>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent templates...</p>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2zm-4-4V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Found</h3>
          <p className="text-gray-600">You haven&apos;t created any agent templates yet.</p>

        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {getAgentTypeIcon(template.agent_variant || template.agent_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {template.name}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {template.agent_id}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    {/* Action Message */}
                    {actionMessages[template.id] && (
                      <div className={`mt-2 p-2 rounded text-xs ${
                        actionMessages[template.id].type === 'success' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {actionMessages[template.id].text}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {template.agent_variant || template.agent_type}
                      </span>
                      {template.agent_variant && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                          {template.agent_type}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(template)}
                      disabled={isUpdating}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                        template.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        template.is_active ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublic(template)}
                      disabled={isUpdating}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                        template.is_public
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {template.is_public ? (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          Public
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                          </svg>
                          Private
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Active:</span>
                        <span className="font-medium">{template.active_activations_count}</span>
                        <span className="text-gray-400">/</span>
                        <span>{template.activations_count}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Instances:</span>
                        <span className="font-medium">{template.active_instances_count}</span>
                        <span className="text-gray-400">/</span>
                        <span>{template.instances_count}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <p className="font-medium">{formatDate(template.created_at)}</p>
                      <p className="text-xs text-gray-400">by {template.creator_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* View Instances Button */}
                      <button
                        onClick={() => handleViewInstancesClick(template)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1 rounded"
                        title="View instances"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2zm-4-4V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
                        </svg>
                      </button>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(template)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200 p-1 rounded"
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

      {/* View Instances Drawer */}
      <ViewInstancesDrawer
        isOpen={isViewInstancesDrawerOpen}
        onClose={handleCloseViewInstancesDrawer}
        template={selectedTemplateForViewing}
      />
    </>
  );
};

export default AgentTemplatesTable;