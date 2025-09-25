import React, { useState, useRef, useEffect } from 'react';
import { useGetUsersQuery } from '@/features/user/userApi';
import { 
  AgentTemplate, 
  useAssignAdminToTemplateMutation,
  getAdminIdFromStorage,
  APIError 
} from '@/features/agentTemplateApi/agentTemplateApi';
import { User } from '@/types/auth';

interface AssignAdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete: () => void;
  template: AgentTemplate | null;
}

interface FormData {
  selectedAdminId: string;
  can_create_instances: boolean;
  can_manage_activations: boolean;
  can_modify_instances: boolean;
  expires_at: string;
  notes: string;
}

const AssignAdminDrawer: React.FC<AssignAdminDrawerProps> = ({
  isOpen,
  onClose,
  onAssignmentComplete,
  template,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    selectedAdminId: '',
    can_create_instances: true,
    can_manage_activations: true,
    can_modify_instances: true,
    expires_at: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // API hooks
  const { 
    data: adminsData, 
    isLoading: isLoadingAdmins,
    refetch: refetchAdmins 
  } = useGetUsersQuery(
    { 
      page: 1, 
      limit: 100, 
      is_active: true 
    },
    { skip: !isOpen }
  );

  const [assignAdminToTemplate, { isLoading: isAssigning }] = useAssignAdminToTemplateMutation();

  const adminId = getAdminIdFromStorage();

  // Filter admin users from the response
  const adminUsers = React.useMemo(() => {
    if (!adminsData?.results) return [];
    return adminsData.results.filter(user => user.role === 'admin');
  }, [adminsData]);

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      setSaveMessage(null);
      setFormData({
        selectedAdminId: '',
        can_create_instances: true,
        can_manage_activations: true,
        can_modify_instances: true,
        expires_at: '',
        notes: '',
      });
      // Refetch admins when drawer opens
      refetchAdmins();
    }
  }, [isOpen, refetchAdmins]);

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.selectedAdminId) {
      newErrors.selectedAdminId = 'Please select an admin user';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    // Validate expires_at if provided
    if (formData.expires_at) {
      const expiryDate = new Date(formData.expires_at);
      const now = new Date();
      if (expiryDate <= now) {
        newErrors.expires_at = 'Expiry date must be in the future';
      }
    }

    // Ensure at least one permission is granted
    if (!formData.can_create_instances && !formData.can_manage_activations && !formData.can_modify_instances) {
      setSaveMessage({
        type: 'error',
        text: 'At least one permission must be granted'
      });
      return false;
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
    if (!validateStep2() || !template || !adminId) {
      if (!template) {
        setSaveMessage({
          type: 'error',
          text: 'Template information is missing'
        });
      }
      if (!adminId) {
        setSaveMessage({
          type: 'error',
          text: 'Admin ID not found. Please log in again.'
        });
      }
      return;
    }

    try {
      const assignmentData = {
        agent_template: template.id,
        admin_user: formData.selectedAdminId,
        can_create_instances: formData.can_create_instances,
        can_manage_activations: formData.can_manage_activations,
        can_modify_instances: formData.can_modify_instances,
        expires_at: formData.expires_at || undefined,
        notes: formData.notes.trim() || undefined,
      };

      console.log('Assigning admin to template with data:', assignmentData);
      const result = await assignAdminToTemplate({ 
        admin_id: adminId, 
        data: assignmentData 
      }).unwrap();

      console.log('Admin assigned successfully:', result);
      
      const selectedAdmin = adminUsers.find(admin => admin.id === formData.selectedAdminId);
      setSaveMessage({
        type: 'success',
        text: `Admin "${selectedAdmin?.full_name || 'Unknown'}" assigned to template "${template.name}" successfully!`,
      });

      // Clear message after 2 seconds and close drawer
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
        onAssignmentComplete();
        onClose();
      }, 2000);

    } catch (error: unknown) {
      console.error('Error assigning admin to template:', error);

      const e = error as any; // More flexible typing for server error responses
      let errorMessage = 'Failed to assign admin to template. Please try again.';

      // Handle specific server error formats
      if (e.data) {
        // Check for non_field_errors (like unique constraint violations)
        if (e.data.non_field_errors && Array.isArray(e.data.non_field_errors)) {
          const nonFieldError = e.data.non_field_errors[0];
          if (nonFieldError.includes('must make a unique set')) {
            const selectedAdmin = adminUsers.find(admin => admin.id === formData.selectedAdminId);
            errorMessage = `Admin "${selectedAdmin?.full_name || 'this user'}" is already assigned to template "${template?.name}". Please select a different admin or check existing assignments.`;
          } else {
            errorMessage = nonFieldError;
          }
        }
        // Check for detail field
        else if (e.data.detail) {
          errorMessage = e.data.detail;
        }
        // Check for field-specific errors
        else if (e.data.agent_template || e.data.admin_user) {
          const fieldErrors = [];
          if (e.data.agent_template) fieldErrors.push(`Template: ${e.data.agent_template[0]}`);
          if (e.data.admin_user) fieldErrors.push(`Admin: ${e.data.admin_user[0]}`);
          errorMessage = fieldErrors.join(', ');
        }
      } 
      // Fallback to message field
      else if (e.message) {
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

  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1); // Default to 1 year from now
    return date.toISOString().slice(0, 16); // Format for datetime-local input
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
                Assign Admin to Template
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 2 - {currentStep === 1 ? 'Select Admin User' : 'Configure Permissions'}
              </p>
              {template && (
                <p className="text-sm text-indigo-600 mt-1 font-medium">
                  Template: {template.name}
                </p>
              )}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 1 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Admin User</h3>
                
                {/* Admin Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin User <span className="text-red-500">*</span>
                  </label>
                  {isLoadingAdmins ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <span className="ml-2 text-gray-600">Loading admin users...</span>
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600">No admin users found</p>
                      <p className="text-sm text-gray-500 mt-1">Make sure admin users exist and are active</p>
                    </div>
                  ) : (
                    <select
                      value={formData.selectedAdminId}
                      onChange={(e) => handleInputChange('selectedAdminId', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white ${
                        errors.selectedAdminId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select an admin user</option>
                      {adminUsers.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.full_name} ({admin.email})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.selectedAdminId && (
                    <p className="mt-1 text-sm text-red-600">{errors.selectedAdminId}</p>
                  )}
                </div>

                {/* Selected Admin Preview */}
                {formData.selectedAdminId && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-indigo-800">Selected Admin</h4>
                        <div className="mt-1 text-sm text-indigo-700">
                          {(() => {
                            const selectedAdmin = adminUsers.find(admin => admin.id === formData.selectedAdminId);
                            return selectedAdmin ? (
                              <div>
                                <p className="font-medium">{selectedAdmin.full_name}</p>
                                <p>{selectedAdmin.email}</p>
                                <p className="text-xs text-indigo-600 mt-1">Role: {selectedAdmin.role}</p>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Admin Assignment</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          You are assigning admin privileges for the template "<strong>{template?.name}</strong>". 
                          The selected admin will be able to manage this template according to the permissions you configure in the next step.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Permissions</h3>
                
                {/* Permissions */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">Permissions</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="can_create_instances"
                          type="checkbox"
                          checked={formData.can_create_instances}
                          onChange={(e) => handleInputChange('can_create_instances', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="can_create_instances" className="text-sm font-medium text-gray-700">
                          Can Create Instances
                        </label>
                        <p className="text-sm text-gray-500">Allow the admin to create new instances from this template</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="can_manage_activations"
                          type="checkbox"
                          checked={formData.can_manage_activations}
                          onChange={(e) => handleInputChange('can_manage_activations', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="can_manage_activations" className="text-sm font-medium text-gray-700">
                          Can Manage Activations
                        </label>
                        <p className="text-sm text-gray-500">Allow the admin to activate and deactivate template instances</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="can_modify_instances"
                          type="checkbox"
                          checked={formData.can_modify_instances}
                          onChange={(e) => handleInputChange('can_modify_instances', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="can_modify_instances" className="text-sm font-medium text-gray-700">
                          Can Modify Instances
                        </label>
                        <p className="text-sm text-gray-500">Allow the admin to edit and modify template instances</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => handleInputChange('expires_at', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                      errors.expires_at ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.expires_at && (
                    <p className="mt-1 text-sm text-red-600">{errors.expires_at}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty for permanent access
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any notes about this assignment..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.notes.length} characters
                  </p>
                </div>

                {/* Summary */}
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
                      <h3 className="text-sm font-medium text-green-800">Assignment Summary</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          Admin will be granted{' '}
                          <strong>
                            {[
                              formData.can_create_instances && 'create instances',
                              formData.can_manage_activations && 'manage activations',
                              formData.can_modify_instances && 'modify instances'
                            ].filter(Boolean).join(', ')}
                          </strong>{' '}
                          permissions for template "<strong>{template?.name}</strong>".
                          {formData.expires_at && (
                            <span> Access expires on <strong>{new Date(formData.expires_at).toLocaleDateString()}</strong>.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {currentStep === 1 ? 'Select the admin user to assign' : 'Configure permissions and settings'}
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
                    disabled={!formData.selectedAdminId || isLoadingAdmins}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isAssigning}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {isAssigning ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </div>
                    ) : (
                      'Assign Admin'
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

export default AssignAdminDrawer;