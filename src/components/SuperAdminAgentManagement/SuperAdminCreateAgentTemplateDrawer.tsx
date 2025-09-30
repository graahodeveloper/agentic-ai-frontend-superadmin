'use client';
import React, { useState, useRef, useEffect } from 'react';

import { User } from '@/types/auth';
import { AgentTemplate, APIError, getAdminIdFromStorage, useCreateAgentTemplateMutation, useUpdateAgentTemplateMutation, useGetAgentTemplateByIdQuery } from '@/features/agentTemplateApi/agentTemplateApi';

interface SuperAdminCreateAgentTemplateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: () => void;
  currentUser: User | null;
  editTemplate?: AgentTemplate | null;
  isEditMode?: boolean;
}

interface FormData {
  name: string;
  description: string;
  agent_type: string;
  agent_role: string;
  is_active: boolean;
  is_public: boolean;
}

const SuperAdminCreateAgentTemplateDrawer: React.FC<SuperAdminCreateAgentTemplateDrawerProps> = ({
  isOpen,
  onClose,
  onAgentCreated,
  currentUser,
  editTemplate = null,
  isEditMode = false,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    agent_type: 'internal',
    agent_role: '',
    is_active: true,
    is_public: false,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // API hooks
  const [createAgentTemplate, { isLoading: isCreating }] = useCreateAgentTemplateMutation();
  const [updateAgentTemplate, { isLoading: isUpdating }] = useUpdateAgentTemplateMutation();

  const isProcessing = isEditMode ? isUpdating : isCreating;
  const adminId = getAdminIdFromStorage();

  const { 
    data: templateData, 
    isLoading: isLoadingTemplate,
    error: templateError,
  } = useGetAgentTemplateByIdQuery(
    { id: editTemplate?.id || '', admin_id: adminId || '' },
    { skip: !isEditMode || !editTemplate?.id || !adminId }
  );

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Reset form when drawer opens or template data changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      setSaveMessage(null);

      if (isEditMode && templateData) {
        // Populate with fresh fetched data
        setFormData({
          name: templateData.name,
          description: templateData.description,
          agent_type: templateData.agent_type || 'internal',
          agent_role: (templateData as AgentTemplate).agent_role || '',
          is_active: templateData.is_active,
          is_public: templateData.is_public,
        });
      } else if (isEditMode && editTemplate && templateError) {
        // Fallback to passed data if fetch fails
        console.warn('Failed to fetch latest template data, using cached version');
        setFormData({
          name: editTemplate.name,
          description: editTemplate.description,
          agent_type: editTemplate.agent_type || 'internal',
          agent_role: (editTemplate as AgentTemplate).agent_role || '',
          is_active: editTemplate.is_active,
          is_public: editTemplate.is_public,
        });
      } else {
        // Reset for create mode
        setFormData({
          name: '',
          description: '',
          agent_type: 'internal',
          agent_role: '',
          is_active: true,
          is_public: false,
        });
      }
    }
  }, [isOpen, isEditMode, templateData, templateError, editTemplate]);

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Template name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Agent role validation
    if (!formData.agent_role.trim()) {
      newErrors.agent_role = 'Agent role is required';
    } else if (formData.agent_role.trim().length < 2) {
      newErrors.agent_role = 'Agent role must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    try {
      const adminId = getAdminIdFromStorage();
      if (!adminId) {
        setSaveMessage({
          type: 'error',
          text: 'Admin ID not found. Please log in again.',
        });
        return;
      }

      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        agent_type: formData.agent_type,
        agent_role: formData.agent_role.trim(),
        is_active: formData.is_active,
        is_public: formData.is_public,
      };

      let result;
      if (isEditMode && editTemplate) {
        // Update existing template
        console.log('Updating agent template with data:', templateData);
        result = await updateAgentTemplate({ 
          id: editTemplate.id, 
          admin_id: adminId, 
          data: templateData 
        }).unwrap();
        console.log('Agent template updated successfully:', result);
        setSaveMessage({
          type: 'success',
          text: `Agent template "${formData.name}" updated successfully!`,
        });
      } else {
        // Create new template
        console.log('Creating agent template with data:', templateData);
        result = await createAgentTemplate({ admin_id: adminId, data: templateData }).unwrap();
        console.log('Agent template created successfully:', result);
        setSaveMessage({
          type: 'success',
          text: `Agent template "${formData.name}" created successfully!`,
        });
      }

      // Clear message after 2 seconds and close drawer
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
        onAgentCreated();
        onClose();
      }, 2000);

    } catch (error: unknown) {
      console.error('Error creating/updating template:', error);

      const e = error as APIError;
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} template. Please try again.`;

      if (e.data?.name) {
        errorMessage = e.data.name[0] || errorMessage;
      } else if (e.data?.detail) {
        errorMessage = e.data.detail;
      } else if (e.message) {
        errorMessage = e.message;
      }

      setSaveMessage({ type: 'error', text: errorMessage });
      
      // Clear message after 5 seconds
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    }
  };

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
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Agent Template' : 'Create Agent Template'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 2 - {currentStep === 1 ? 'Basic Information' : 'Configuration'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <div
                className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {saveMessage && (
            <div
              className={`mx-6 mt-4 p-4 rounded-lg border ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
              aria-live="polite"
            >
              <div className="flex items-center">
                {saveMessage.type === 'success' ? (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {saveMessage.text}
              </div>
            </div>
          )}

          {/* Template Loading State for Edit Mode */}
          {isEditMode && isLoadingTemplate && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Loading template details...</p>
            </div>
          )}

          {/* Template Fetch Error */}
          {isEditMode && templateError && (
            <div className="mx-6 mt-4 p-4 rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-700">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 7a1 1 0 100 2 1 1 0 000-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Failed to load latest template data. Using cached version.
              </div>
            </div>
          )}

          {/* Content - Only render when not loading template */}
          {!(isEditMode && isLoadingTemplate) && (
            <div className="flex-1 overflow-y-auto p-6">
              {currentStep === 1 ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  
                  {/* Agent Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.agent_type}
                      onChange={(e) => handleInputChange('agent_type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white"
                    >
                      <option value="internal">Internal</option>
                      <option value="external">External</option>
                    </select>
                  </div>

                  {/* Template Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter agent name"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-indigo-800">Getting Started</h3>
                        <div className="mt-2 text-sm text-indigo-700">
                          <p>
                            Create a template that can be used by multiple users across the platform. Choose an agent type and provide a descriptive name.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe what this agent template will do and its purpose..."
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.description.length} characters (minimum 10 required)
                    </p>
                  </div>

                  {/* Agent Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.agent_role}
                      onChange={(e) => handleInputChange('agent_role', e.target.value)}
                      placeholder="e.g., Customer Support Agent, Sales Agent, etc."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                        errors.agent_role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.agent_role && (
                      <p className="mt-1 text-sm text-red-600">{errors.agent_role}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Specify the role or purpose of this agent
                    </p>
                  </div>

                  {/* Is Active */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-3">
                        <span className="text-sm font-medium text-gray-700">Template is Active</span>
                        <p className="text-sm text-gray-500">Enable this template immediately after creation</p>
                      </label>
                    </div>
                  </div>

                  {/* Is Public - Optional */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <input
                        id="is_public"
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => handleInputChange('is_public', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_public" className="ml-3">
                        <span className="text-sm font-medium text-gray-700">
                          Public Template <span className="text-gray-500 text-xs">(Optional)</span>
                        </span>
                        <p className="text-sm text-gray-500">Make this template available to all users on the platform</p>
                      </label>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Ready to {isEditMode ? 'Update' : 'Create'}</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            Your template will be {isEditMode ? 'updated' : 'created'} with the name &quot;<strong>{formData.name}</strong>&quot; and will be{' '}
                            {formData.is_active ? 'active' : 'inactive'} by default.
                            {formData.is_public && ' It will be available as a public template.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {currentStep === 1 ? 'Fill in the basic information' : 'Configure your template settings'}
              </div>
              <div className="flex space-x-3">
                {currentStep === 2 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {currentStep === 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEditMode ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      `${isEditMode ? 'Update' : 'Create'} Template`
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminCreateAgentTemplateDrawer;