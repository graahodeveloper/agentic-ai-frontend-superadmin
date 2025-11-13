'use client';
import React, { useState, useRef, useEffect } from 'react';

import { User } from '@/types/auth';
import { 
  AgentTemplate, 
  APIError, 
  getAdminIdFromStorage, 
  useCreateAgentTemplateMutation, 
  useUpdateAgentTemplateMutation, 
  useGetAgentTemplateByIdQuery,
  useBulkCreateTemplateFieldsMutation,
  useGetTemplateFieldsByTemplateIdQuery,
  useUpdateTemplateFieldMutation,
  TemplateField,
  FieldChoice
} from '@/features/agentTemplateApi/agentTemplateApi';

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
  agent_variant: string;
  description: string;
  agent_type: string;
  agent_role: string;
  is_active: boolean;
  is_public: boolean;
}

interface APIFieldResponse {
  id: string;
  agent_template: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_sensitive: boolean;
  min_length: number | null;
  max_length: number | null;
  min_value: number | null;
  max_value: number | null;
  default_value: string;
  placeholder: string;
  help_text: string;
  choices: FieldChoice[];
  display_order: number;
  field_group: string;
  created_at: string;
  updated_at: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'textarea', label: 'Textarea', icon: '📄' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'select', label: 'Dropdown', icon: '▼' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
  { value: 'radio', label: 'Radio', icon: '◉' },
  { value: 'checkbox', label: 'Checkbox', icon: '✓' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'datetime', label: 'DateTime', icon: '📆' },
  { value: 'file', label: 'File Upload', icon: '📎' },
  { value: 'password', label: 'Password', icon: '🔒' },
];

const FIELD_GROUPS = [
  'credentials',
  'configuration',
  'prompts',
  'settings',
  'advanced',
  'custom'
];

const AGENT_VARIANTS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Website' },
];

const SuperAdminCreateAgentTemplateDrawer: React.FC<SuperAdminCreateAgentTemplateDrawerProps> = ({
  isOpen,
  onClose,
  onAgentCreated,
  currentUser,
  editTemplate = null,
  isEditMode = false,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    agent_variant: 'facebook',
    description: '',
    agent_type: 'internal',
    agent_role: '',
    is_active: true,
    is_public: false,
  });
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [expandedFieldIndex, setExpandedFieldIndex] = useState<number | null>(null);
  const [isProcessingFields, setIsProcessingFields] = useState(false);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // API hooks
  const [createAgentTemplate, { isLoading: isCreating }] = useCreateAgentTemplateMutation();
  const [updateAgentTemplate, { isLoading: isUpdating }] = useUpdateAgentTemplateMutation();
  const [bulkCreateFields, { isLoading: isCreatingFields }] = useBulkCreateTemplateFieldsMutation();
  const [updateTemplateField, { isLoading: isUpdatingField }] = useUpdateTemplateFieldMutation();

  const isProcessing = isEditMode ? (isUpdating || isProcessingFields || isUpdatingField) : (isCreating || isCreatingFields || isProcessingFields);
  const adminId = getAdminIdFromStorage();

  const { 
    data: templateData, 
    isLoading: isLoadingTemplate,
    error: templateError,
  } = useGetAgentTemplateByIdQuery(
    { id: editTemplate?.id || '', admin_id: adminId || '' },
    { skip: !isEditMode || !editTemplate?.id || !adminId }
  );

  // Fetch template fields when in edit mode
  const {
    data: templateFieldsData,
    isLoading: isLoadingFields,
    error: fieldsError,
  } = useGetTemplateFieldsByTemplateIdQuery(
    { template_id: editTemplate?.id || '', admin_id: adminId || '' },
    { skip: !isEditMode || !editTemplate?.id || !adminId }
  );

  // Debug log to see raw API response
  useEffect(() => {
    if (templateFieldsData) {
      console.log('Raw templateFieldsData:', JSON.stringify(templateFieldsData, null, 2));
    }
  }, [templateFieldsData]);

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
      setTemplateFields([]);
      setExpandedFieldIndex(null);
      setIsProcessingFields(false);

      if (isEditMode && templateData) {
        setFormData({
          name: templateData.name,
          agent_variant: (templateData as AgentTemplate & { agent_variant?: string }).agent_variant || 'facebook',
          description: templateData.description,
          agent_type: templateData.agent_type || 'internal',
          agent_role: (templateData as AgentTemplate).agent_role || '',
          is_active: templateData.is_active,
          is_public: templateData.is_public,
        });
      } else if (isEditMode && editTemplate && templateError) {
        console.warn('Failed to fetch latest template data, using cached version');
        setFormData({
          name: editTemplate.name,
          agent_variant: (editTemplate as AgentTemplate & { agent_variant?: string }).agent_variant || 'facebook',
          description: editTemplate.description,
          agent_type: editTemplate.agent_type || 'internal',
          agent_role: (editTemplate as AgentTemplate).agent_role || '',
          is_active: editTemplate.is_active,
          is_public: editTemplate.is_public,
        });
      } else {
        setFormData({
          name: '',
          agent_variant: 'facebook',
          description: '',
          agent_type: 'internal',
          agent_role: '',
          is_active: true,
          is_public: false,
        });
      }
    }
  }, [isOpen, isEditMode, templateData, templateError, editTemplate]);

  // Prepopulate fields when template fields data is loaded
  useEffect(() => {
    if (isEditMode && templateFieldsData) {
      console.log('Template fields data received:', templateFieldsData);
      
      // Handle different possible response structures
      let fieldsArray: APIFieldResponse[] = [];
      
      if (Array.isArray(templateFieldsData)) {
        // If the response is directly an array
        fieldsArray = templateFieldsData;
      } else if (templateFieldsData.fields && Array.isArray(templateFieldsData.fields)) {
        // If the response has a 'fields' property
        fieldsArray = templateFieldsData.fields;
      }
      
      if (fieldsArray.length > 0) {
        console.log('Prepopulating fields from array:', fieldsArray);
        
        const prepopulatedFields: TemplateField[] = fieldsArray.map((field: APIFieldResponse) => {
          const mappedField: TemplateField = {
            id: field.id,
            field_name: field.field_name || '',
            field_label: field.field_label || '',
            field_type: field.field_type as TemplateField['field_type'],
            is_required: field.is_required ?? false,
            is_sensitive: field.is_sensitive ?? false,
            display_order: field.display_order ?? 0,
            field_group: field.field_group || 'configuration',
            placeholder: field.placeholder || '',
            default_value: field.default_value || '',
            help_text: field.help_text || '',
          };

          // Only add optional fields if they have values
          if (field.min_length !== null && field.min_length !== undefined) {
            mappedField.min_length = field.min_length;
          }
          if (field.max_length !== null && field.max_length !== undefined) {
            mappedField.max_length = field.max_length;
          }
          if (field.min_value !== null && field.min_value !== undefined) {
            mappedField.min_value = field.min_value;
          }
          if (field.max_value !== null && field.max_value !== undefined) {
            mappedField.max_value = field.max_value;
          }
          
          // Handle choices array
          if (field.choices && Array.isArray(field.choices) && field.choices.length > 0) {
            mappedField.choices = field.choices.map((choice: FieldChoice) => ({
              value: choice.value || '',
              label: choice.label || ''
            }));
          }

          return mappedField;
        });
        
        // Sort by display_order to maintain correct order
        prepopulatedFields.sort((a, b) => a.display_order - b.display_order);
        
        console.log('Fields prepopulated successfully:', prepopulatedFields);
        setTemplateFields(prepopulatedFields);
      } else {
        console.log('No fields found in template data');
        setTemplateFields([]);
      }
    }
  }, [isEditMode, templateFieldsData]);

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Template name must be at least 2 characters';
    }
    
    // Only validate agent_variant if agent_type is external
    if (formData.agent_type === 'external' && !formData.agent_variant) {
      newErrors.agent_variant = 'Agent variant is required for external agents';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.agent_role.trim()) {
      newErrors.agent_role = 'Agent role is required';
    } else if (formData.agent_role.trim().length < 2) {
      newErrors.agent_role = 'Agent role must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setErrors({});
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
    setErrors({});
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Field Configuration Methods
  const addField = () => {
    const newField: TemplateField = {
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      is_sensitive: false,
      display_order: templateFields.length,
      field_group: 'configuration',
    };
    setTemplateFields([...templateFields, newField]);
    setExpandedFieldIndex(templateFields.length);
  };

  const removeField = (index: number) => {
    const updated = templateFields.filter((_, i) => i !== index);
    // Update display_order for remaining fields
    const reordered = updated.map((field, i) => ({ ...field, display_order: i }));
    setTemplateFields(reordered);
    setExpandedFieldIndex(null);
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const updated = [...templateFields];
    updated[index] = { ...updated[index], ...updates };
    setTemplateFields(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === templateFields.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...templateFields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update display_order
    updated[index].display_order = index;
    updated[newIndex].display_order = newIndex;
    
    setTemplateFields(updated);
    setExpandedFieldIndex(newIndex);
  };

  const addChoice = (fieldIndex: number) => {
    const field = templateFields[fieldIndex];
    const choices = field.choices || [];
    updateField(fieldIndex, {
      choices: [...choices, { value: '', label: '' }]
    });
  };

  const updateChoice = (fieldIndex: number, choiceIndex: number, updates: Partial<FieldChoice>) => {
    const field = templateFields[fieldIndex];
    const choices = [...(field.choices || [])];
    choices[choiceIndex] = { ...choices[choiceIndex], ...updates };
    updateField(fieldIndex, { choices });
  };

  const removeChoice = (fieldIndex: number, choiceIndex: number) => {
    const field = templateFields[fieldIndex];
    const choices = (field.choices || []).filter((_, i) => i !== choiceIndex);
    updateField(fieldIndex, { choices });
  };

  const createTemplateFields = async (templateId: string): Promise<boolean> => {
    if (templateFields.length === 0) {
      return true; // No fields to create, success
    }

    try {
      setIsProcessingFields(true);
      console.log('Creating template fields for template:', templateId);
      console.log('Fields to create:', templateFields);
      
      // Prepare the fields data with proper formatting
      const fieldsData = templateFields.map(field => ({
        field_name: field.field_name.toLowerCase().replace(/\s+/g, '_'),
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required || false,
        is_sensitive: field.is_sensitive || false,
        display_order: field.display_order,
        field_group: field.field_group || 'configuration',
        placeholder: field.placeholder || '',
        default_value: field.default_value || '',
        help_text: field.help_text || '',
        min_length: field.min_length,
        max_length: field.max_length,
        min_value: field.min_value,
        max_value: field.max_value,
        choices: field.choices || []
      }));

      console.log('Prepared fields data:', fieldsData);

      const fieldsResult = await bulkCreateFields({
        admin_id: adminId!,
        data: {
          agent_template: templateId,
          fields: fieldsData
        }
      }).unwrap();
      
      console.log('Template fields created successfully:', fieldsResult);
      
      if (fieldsResult.errors_count > 0) {
        console.warn('Some fields failed to create:', fieldsResult.errors);
        setSaveMessage({
          type: 'error',
          text: `Template created but ${fieldsResult.errors_count} field(s) failed to create. Please check the field configuration.`,
        });
        return false;
      }

      return true;
    } catch (error: unknown) {
      console.error('Error creating template fields:', error);
      const e = error as APIError;
      let errorMessage = 'Template created but failed to create fields. Please try adding fields later.';

      if (e.data?.name) {
        errorMessage = e.data.name[0] || errorMessage;
      } else if (e.data?.detail) {
        errorMessage = e.data.detail;
      } else if (e.message) {
        errorMessage = e.message;
      }

      setSaveMessage({ 
        type: 'error', 
        text: errorMessage 
      });
      return false;
    } finally {
      setIsProcessingFields(false);
    }
  };

  const updateTemplateFields = async (): Promise<boolean> => {
    if (templateFields.length === 0) {
      return true; // No fields to update
    }

    try {
      setIsProcessingFields(true);
      console.log('Updating template fields:', templateFields);

      let successCount = 0;
      let errorCount = 0;

      // Update each field individually
      for (const field of templateFields) {
        if (!field.id) {
          console.warn('Skipping field without ID:', field);
          continue;
        }

        try {
          const fieldData: Record<string, string | number | boolean | FieldChoice[] | undefined> = {
            field_name: field.field_name.toLowerCase().replace(/\s+/g, '_'),
            field_label: field.field_label,
            field_type: field.field_type,
            is_required: field.is_required || false,
            is_sensitive: field.is_sensitive || false,
            display_order: field.display_order,
            field_group: field.field_group || 'configuration',
            placeholder: field.placeholder || '',
            default_value: field.default_value || '',
            help_text: field.help_text || '',
            choices: field.choices || []
          };

          // Only include min/max values if they exist
          if (field.min_length !== undefined) fieldData.min_length = field.min_length;
          if (field.max_length !== undefined) fieldData.max_length = field.max_length;
          if (field.min_value !== undefined) fieldData.min_value = field.min_value;
          if (field.max_value !== undefined) fieldData.max_value = field.max_value;

          await updateTemplateField({
            field_id: field.id,
            admin_id: adminId!,
            data: fieldData
          }).unwrap();

          successCount++;
          console.log('Field updated successfully:', field.id);
        } catch (error) {
          errorCount++;
          console.error('Error updating field:', field.id, error);
        }
      }

      if (errorCount > 0) {
        setSaveMessage({
          type: 'warning',
          text: `Template updated. ${successCount} field(s) updated, ${errorCount} field(s) failed.`,
        });
        return false;
      }

      return true;
    } catch (error: unknown) {
      console.error('Error updating template fields:', error);
      const e = error as APIError;
      let errorMessage = 'Template updated but failed to update fields.';

      if (e.data?.detail) {
        errorMessage = e.data.detail;
      } else if (e.message) {
        errorMessage = e.message;
      }

      setSaveMessage({ 
        type: 'error', 
        text: errorMessage 
      });
      return false;
    } finally {
      setIsProcessingFields(false);
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
        agent_variant: formData.agent_type === 'external' ? formData.agent_variant : undefined,
        description: formData.description.trim(),
        agent_type: formData.agent_type,
        agent_role: formData.agent_role.trim(),
        is_active: formData.is_active,
        is_public: formData.is_public,
      };

      let templateId: string;
      let successMessage = '';

      if (isEditMode && editTemplate) {
        // Update existing template
        console.log('Updating agent template with data:', templateData);
        const result = await updateAgentTemplate({ 
          id: editTemplate.id, 
          admin_id: adminId, 
          data: templateData 
        }).unwrap();
        console.log('Agent template updated successfully:', result);
        templateId = editTemplate.id;
        
        // Update fields if any exist
        const fieldsSuccess = await updateTemplateFields();
        
        successMessage = `Agent template "${formData.name}" updated successfully${templateFields.length > 0 ? ` with ${templateFields.length} field(s)` : ''}!`;
        
        setSaveMessage({
          type: fieldsSuccess ? 'success' : 'warning',
          text: successMessage,
        });
      } else {
        // Create new template - FIRST API CALL
        console.log('Creating agent template with data:', templateData);
        const result = await createAgentTemplate({ admin_id: adminId, data: templateData }).unwrap();
        console.log('Agent template created successfully:', result);

        // Check if template ID is available
        templateId = result.template.id;
        console.log('Template ID for fields creation:', templateId);

        // SECOND API CALL - Create fields only after template is created successfully
        const fieldsSuccess = await createTemplateFields(templateId);
        
        if (fieldsSuccess) {
          successMessage = `Agent template "${formData.name}" created successfully${templateFields.length > 0 ? ` with ${templateFields.length} field(s)` : ''}!`;
        } else {
          successMessage = `Agent template "${formData.name}" created but there were issues with some fields.`;
        }

        setSaveMessage({
          type: fieldsSuccess ? 'success' : 'warning',
          text: successMessage,
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

  const needsChoices = (type: string) => ['select', 'multiselect', 'radio'].includes(type);

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
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Agent Template' : 'Create Agent Template'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 3 - {
                  currentStep === 1 ? 'Basic Information' : 
                  currentStep === 2 ? 'Configuration' : 
                  'Input Fields'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors text-gray-600 hover:text-gray-900"
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
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  currentStep >= 1 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <div
                className={`flex-1 h-1 mx-4 transition-all ${currentStep >= 2 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'}`}
              ></div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  currentStep >= 2 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <div
                className={`flex-1 h-1 mx-4 transition-all ${currentStep >= 3 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'}`}
              ></div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  currentStep >= 3 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                }`}
              >
                3
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {saveMessage && (
            <div
              className={`mx-6 mt-4 p-4 rounded-lg border ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : saveMessage.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
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
                ) : saveMessage.type === 'warning' ? (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
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
          {isEditMode && (isLoadingTemplate || isLoadingFields) && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">
                {isLoadingTemplate ? 'Loading template details...' : 'Loading template fields...'}
              </p>
            </div>
          )}

          {/* Content - Only render when not loading template */}
          {!(isEditMode && (isLoadingTemplate || isLoadingFields)) && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* STEP 1: Basic Information */}
              {currentStep === 1 && (
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
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.agent_type === 'internal' 
                        ? 'Internal agents are used within the platform only'
                        : 'External agents can be integrated with external platforms'
                      }
                    </p>
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

                  {/* Agent Variant - Only show for external agents */}
                  {formData.agent_type === 'external' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agent Variant <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.agent_variant}
                        onChange={(e) => handleInputChange('agent_variant', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white ${
                          errors.agent_variant ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        {AGENT_VARIANTS.map(variant => (
                          <option key={variant.value} value={variant.value}>
                            {variant.label}
                          </option>
                        ))}
                      </select>
                      {errors.agent_variant && (
                        <p className="mt-1 text-sm text-red-600">{errors.agent_variant}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Select the platform where this agent will be deployed
                      </p>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
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
                            Create a template that can be used by multiple users across the platform. 
                            {formData.agent_type === 'external' 
                              ? ' External agents require a variant to specify the integration platform.'
                              : ' Internal agents are used within the platform without external integrations.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Configuration */}
              {currentStep === 2 && (
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
                    <textarea
                      value={formData.agent_role}
                      onChange={(e) => handleInputChange('agent_role', e.target.value)}
                      placeholder="e.g., Customer Support Agent, Sales Agent, etc."
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none ${
                        errors.agent_role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.agent_role && (
                      <p className="mt-1 text-sm text-red-600">{errors.agent_role}</p>
                    )}
                  </div>

                  {/* Is Active */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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

                  {/* Is Public */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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

                  <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
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
                        <h3 className="text-sm font-medium text-green-800">Configuration Complete</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            Next, you can configure input fields for this template, or skip to {isEditMode ? 'update' : 'create'} it immediately.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Input Fields Configuration */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Input Fields Configuration</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {isEditMode 
                          ? 'Manage template fields configuration' 
                          : 'Configure custom fields for agent instances created from this template'
                        }
                      </p>
                    </div>
                    {!isEditMode && (
                      <button
                        onClick={addField}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm sm:text-base font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden xs:inline sm:inline">Add Field</span>
                        <span className="inline xs:hidden sm:hidden">Add</span>
                      </button>
                    )}
                  </div>

                  {templateFields.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No fields configured</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {isEditMode 
                          ? 'This template does not have any fields configured yet'
                          : 'Get started by adding a field to customize your template'
                        }
                      </p>
                      {!isEditMode && (
                        <div className="mt-6">
                          <button
                            onClick={addField}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Your First Field
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {templateFields.map((field, index) => (
                        <div
                          key={field.id || index}
                          className="border border-gray-300 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Field Header */}
                          <div className="p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="flex flex-col space-y-1">
                                <button
                                  onClick={() => moveField(index, 'up')}
                                  disabled={index === 0}
                                  className={`p-1 rounded ${
                                    index === 0
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-500 hover:bg-white hover:text-indigo-600'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => moveField(index, 'down')}
                                  disabled={index === templateFields.length - 1}
                                  className={`p-1 rounded ${
                                    index === templateFields.length - 1
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-500 hover:bg-white hover:text-indigo-600'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">
                                    {FIELD_TYPES.find(t => t.value === field.field_type)?.icon || '📝'}
                                  </span>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {field.field_label || 'Untitled Field'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {field.field_name || 'field_name'} • {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                                      {field.is_required && <span className="ml-2 text-red-500">Required</span>}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setExpandedFieldIndex(expandedFieldIndex === index ? null : index)}
                                className="p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-colors"
                              >
                                <svg
                                  className={`w-5 h-5 transition-transform ${expandedFieldIndex === index ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeField(index)}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Field Configuration (Expandable) */}
                          {expandedFieldIndex === index && (
                            <div className="p-4 space-y-4 border-t border-gray-200 bg-white">
                              <div className="grid grid-cols-2 gap-4">
                                {/* Field Name */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Field Name <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={field.field_name}
                                    onChange={(e) => updateField(index, { field_name: e.target.value })}
                                    placeholder="api_key"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  />
                                  <p className="mt-1 text-xs text-gray-500">Unique identifier (use underscore)</p>
                                </div>

                                {/* Field Label */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Field Label <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={field.field_label}
                                    onChange={(e) => updateField(index, { field_label: e.target.value })}
                                    placeholder="API Key"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  />
                                  <p className="mt-1 text-xs text-gray-500">Display label for users</p>
                                </div>

                                {/* Field Type */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Field Type <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={field.field_type}
                                    onChange={(e) => updateField(index, { 
                                      field_type: e.target.value as TemplateField['field_type'],
                                      choices: needsChoices(e.target.value) ? (field.choices || []) : undefined
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                  >
                                    {FIELD_TYPES.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Field Group */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Field Group
                                  </label>
                                  <select
                                    value={field.field_group || 'configuration'}
                                    onChange={(e) => updateField(index, { field_group: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                  >
                                    {FIELD_GROUPS.map(group => (
                                      <option key={group} value={group}>
                                        {group.charAt(0).toUpperCase() + group.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Placeholder & Help Text */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Placeholder
                                  </label>
                                  <input
                                    type="text"
                                    value={field.placeholder || ''}
                                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                    placeholder="Enter placeholder text..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Default Value
                                  </label>
                                  <input
                                    type="text"
                                    value={field.default_value || ''}
                                    onChange={(e) => updateField(index, { default_value: e.target.value })}
                                    placeholder="Default value..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Help Text
                                </label>
                                <textarea
                                  value={field.help_text || ''}
                                  onChange={(e) => updateField(index, { help_text: e.target.value })}
                                  placeholder="Additional guidance for users..."
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                />
                              </div>

                              {/* Validation Rules (for applicable types) */}
                              {['text', 'textarea', 'password'].includes(field.field_type) && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Min Length
                                    </label>
                                    <input
                                      type="number"
                                      value={field.min_length || ''}
                                      onChange={(e) => updateField(index, { min_length: parseInt(e.target.value) || undefined })}
                                      placeholder="0"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Max Length
                                    </label>
                                    <input
                                      type="number"
                                      value={field.max_length || ''}
                                      onChange={(e) => updateField(index, { max_length: parseInt(e.target.value) || undefined })}
                                      placeholder="255"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                </div>
                              )}

                              {field.field_type === 'number' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Min Value
                                    </label>
                                    <input
                                      type="number"
                                      value={field.min_value || ''}
                                      onChange={(e) => updateField(index, { min_value: parseFloat(e.target.value) || undefined })}
                                      placeholder="0"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Max Value
                                    </label>
                                    <input
                                      type="number"
                                      value={field.max_value || ''}
                                      onChange={(e) => updateField(index, { max_value: parseFloat(e.target.value) || undefined })}
                                      placeholder="100"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Choices (for select, multiselect, radio) */}
                              {needsChoices(field.field_type) && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      Choices <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                      onClick={() => addChoice(index)}
                                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                      + Add Choice
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(field.choices || []).map((choice, choiceIndex) => (
                                      <div key={choiceIndex} className="flex items-center space-x-2">
                                        <input
                                          type="text"
                                          value={choice.value}
                                          onChange={(e) => updateChoice(index, choiceIndex, { value: e.target.value })}
                                          placeholder="value"
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                        <input
                                          type="text"
                                          value={choice.label}
                                          onChange={(e) => updateChoice(index, choiceIndex, { label: e.target.value })}
                                          placeholder="Label"
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                        <button
                                          onClick={() => removeChoice(index, choiceIndex)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Checkboxes */}
                              <div className="flex items-center space-x-6 pt-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.is_required || false}
                                    onChange={(e) => updateField(index, { is_required: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Required Field</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.is_sensitive || false}
                                    onChange={(e) => updateField(index, { is_sensitive: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Sensitive Data</span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
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
                        <h3 className="text-sm font-medium text-blue-800">Field Configuration Tips</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc list-inside space-y-1">
                            <li>Use clear, descriptive field labels that users will understand</li>
                            <li>Add help text for complex fields to guide users</li>
                            <li>Mark sensitive fields (like API keys) to ensure proper handling</li>
                            <li>Group related fields together for better organization</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {currentStep === 1 && 'Fill in the basic information'}
                {currentStep === 2 && 'Configure your template settings'}
                {currentStep === 3 && `${templateFields.length} field(s) configured`}
              </div>
              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
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