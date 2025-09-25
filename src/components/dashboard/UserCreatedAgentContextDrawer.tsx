import React, { useState, useEffect, useRef } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { UserCreatedAgent } from '@/features/user/userApi';
import * as XLSX from 'xlsx';
import { useExtractFileMutation } from '@/features/fileApi';
import { AgentInstance, useUpdateAgentInstanceConfigMutation } from '@/features/agentTemplateApi/agentTemplateApi';

interface UserCreatedAgentContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentInstance | null;
  onContextSaved?: () => void;
}

const UserCreatedAgentContextDrawer: React.FC<UserCreatedAgentContextDrawerProps> = ({
  isOpen,
  onClose,
  agent,
  onContextSaved,
}) => {
  const { userSession } = useUserSession();
  const [context, setContext] = useState<string>('');
  const [agentRolesContext, setAgentRolesContext] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [initialContextExists, setInitialContextExists] = useState<boolean>(false);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [extractFileApi] = useExtractFileMutation();
  const [updateAgentInstanceConfig] = useUpdateAgentInstanceConfigMutation();

  // Initialize context when agent changes
  useEffect(() => {
    if (agent) {
      // For agent instances, context might be stored in instance_config or activation_data
      const existingContext = agent.instance_config?.context || agent.activation_data?.context || '';
      const existingAgentRoles = agent.instance_config?.agent_roles || agent.activation_data?.agent_roles || '';
      
      setContext(existingContext);
      setAgentRolesContext(existingAgentRoles);
      setInitialContextExists(!!existingContext && existingContext.trim() !== '');
    }
  }, [agent]);

  // Clear any existing timeout when component unmounts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContext(e.target.value);
  };

  const handleAgentRolesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAgentRolesContext(e.target.value);
  };

  // Extract text from Excel
  const extractTextFromExcel = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let fullText = '';

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        fullText += `\n=== Sheet: ${sheetName} ===\n`;
        jsonData.forEach((row: unknown[], index: number) => {
          if (Array.isArray(row) && row.length > 0) {
            const rowText = row
              .filter((cell: unknown) => cell !== null && cell !== undefined && cell !== '')
              .map((cell: unknown) => String(cell))
              .join(' | ');
            if (rowText.trim()) {
              fullText += `Row ${index + 1}: ${rowText}\n`;
            }
          }
        });
        fullText += '\n';
      });

      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text from Excel:', error);
      throw new Error('Failed to extract text from Excel file. Please ensure it\'s a valid Excel file.');
    }
  };

  // Extract text from CSV
  const extractTextFromCSV = async (file: File): Promise<string> => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const csvText = event.target.result as string;
            const lines = csvText.split('\n');
            let formattedText = '=== CSV Data ===\n';
            lines.forEach((line, index) => {
              if (line.trim()) {
                const cells = line.split(',').map((cell) => cell.trim().replace(/"/g, ''));
                formattedText += `Row ${index + 1}: ${cells.join(' | ')}\n`;
              }
            });
            resolve(formattedText);
          } else {
            reject(new Error('Failed to read CSV file'));
          }
        };
        reader.onerror = () => reject(new Error('Error reading CSV file'));
        reader.readAsText(file);
      });
    } catch (error) {
      console.error('Error extracting text from CSV:', error);
      throw new Error('Failed to extract text from CSV file');
    }
  };

  // Process uploaded file
  const processFile = async (file: File): Promise<string> => {
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit. Please upload a smaller file.');
    }

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const mimeType = file.type.toLowerCase();

    console.log('Processing file:', file.name, 'Type:', mimeType, 'Extension:', fileExtension);

    if (mimeType.startsWith('text/') || fileExtension === 'txt') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            console.log('Text file content:', event.target.result);
            resolve(event.target.result as string);
          } else {
            reject(new Error('Failed to read text file'));
          }
        };
        reader.onerror = () => reject(new Error('Error reading text file'));
        reader.readAsText(file);
      });
    } else if (fileExtension === 'csv' || mimeType === 'text/csv') {
      const text = await extractTextFromCSV(file);
      console.log('CSV content:', text);
      return text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      fileExtension === 'xlsx' ||
      fileExtension === 'xls'
    ) {
      const text = await extractTextFromExcel(file);
      console.log('Excel content:', text);
      return text;
    } else if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await extractFileApi(formData).unwrap();
        console.log('PDF API response:', response);
        if (!response.success) {
          throw new Error('Failed to extract text from PDF');
        }
        return response.text;
      } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF. Please try again or ensure the file is valid.');
      }
    } else {
      throw new Error(
        `Unsupported file type: ${fileExtension}. Supported formats: TXT, CSV, Excel (.xlsx, .xls), PDF`
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadedFile(file);
    setIsProcessingFile(true);
    setSaveMessage(null);

    try {
      const extractedText = await processFile(file);
      const newContext = extractedText;
      console.log('Setting new context:', newContext);
      setContext(newContext);
      setSaveMessage({
        type: 'success',
        text: `Successfully extracted text from ${file.name}`,
      });
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setSaveMessage({
        type: 'error',
        text: errorMessage,
      });
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessingFile(true);
    setSaveMessage(null);

    try {
      const extractedText = await processFile(file);
      const newContext = extractedText;
      console.log('Setting new context:', newContext);
      setContext(newContext);
      setSaveMessage({
        type: 'success',
        text: `Successfully extracted text from ${file.name}`,
      });
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setSaveMessage({
        type: 'error',
        text: errorMessage,
      });
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSave = async () => {
    if (!agent || !agent.user_sub_id) {
      setSaveMessage({ type: 'error', text: 'Missing agent or user session data' });
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
      return;
    }

    setIsSaving(true);

    try {
      const requestPayload = {
        context: context,
        agent_roles: agentRolesContext,
        additional_config: {
          language: 'English',
          tone: 'Professional and friendly'
        }
      };

      console.log('Updating agent instance config with payload:', requestPayload);
      console.log('Agent ID:', agent.id);
      console.log('Admin Sub ID:', agent.user_sub_id);

      const result = await updateAgentInstanceConfig({
        id: agent.id,
        admin_sub_id: agent.user_sub_id,
        data: requestPayload
      }).unwrap();

      console.log('Agent instance config updated successfully:', result);

      if (result && result.message) {
        setSaveMessage({ type: 'success', text: result.message });
        if (onContextSaved) {
          onContextSaved();
        }
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
        }
        messageTimeoutRef.current = setTimeout(() => {
          setSaveMessage(null);
        }, 5000);
        onClose();
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (error: any) {
      console.error('Error updating agent instance config:', error);
      let errorMessage = 'Failed to update agent configuration. Please try again.';
      
      // Handle RTK Query error format
      if (error?.data) {
        if (typeof error.data === 'string') {
          errorMessage = error.data;
        } else if (error.data.detail) {
          errorMessage = error.data.detail;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setSaveMessage({ type: 'error', text: errorMessage });
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !agent) return null;

  const hasExistingContext = context && context.trim() !== '';

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
              <h2 className="text-xl font-semibold text-gray-900">{agent.name} Context</h2>
              <p className="text-sm text-gray-600 mt-1">Configure your AI knowledge base and responses</p>
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
            <div className="space-y-6">
              {/* Agent Roles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Roles</h3>
                <textarea
                  className="w-full h-64 sm:h-52 md:h-60 lg:h-70 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y text-gray-900 placeholder-gray-400 font-mono text-sm leading-relaxed mb-5"
                  value={agentRolesContext}
                  onChange={handleAgentRolesChange}
                  placeholder={`Example:
You are ${agent.name}, a ${agent.agent_type_display || agent.agent_type} agent.
Business Description: ${agent.description}
Your primary role is to assist customers with their inquiries and provide excellent service.
Communication Style:
  - Tone: Friendly and professional
  - Always be welcoming, patient, and helpful
  - Use conversational language that makes customers feel comfortable
  - Show genuine interest in helping customers find exactly what they want`}
                  aria-label="Agent Roles"
                />
              </div>

              {/* Agent Knowledge Base */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Agent Knowledge Base</h2>
                <textarea
                  value={context}
                  onChange={handleContextChange}
                  placeholder={`Enter your AI knowledge base context here...

You can include:
• Product information
• FAQs and common questions
• Company policies
• Support instructions
• Contact information

The more detailed and specific your context, the better your AI will respond to customer inquiries.`}
                  className="w-full h-64 sm:h-72 md:h-80 lg:h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y text-gray-900 placeholder-gray-400 font-mono text-sm leading-relaxed mb-10"
                  aria-label="Agent Knowledge Base"
                />
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                  isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="region"
                aria-label="Drag and drop file upload"
              >
                <div className="text-center">
                  {isProcessingFile ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                      <p className="text-sm text-gray-600">Processing file...</p>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-8 w-8 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <div className="text-sm text-gray-600 mb-2">
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer text-indigo-600 hover:text-indigo-500"
                        >
                          Upload a file
                        </label>
                        <span> or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-500">TXT, CSV, Excel, PDF files up to 10MB</p>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".txt,.csv,.xlsx,.xls,.pdf,application/pdf,text/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onChange={handleFileUpload}
                        disabled={isProcessingFile}
                        ref={fileInputRef}
                        aria-label="Upload context file"
                      />
                    </>
                  )}
                </div>
                {uploadedFile && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Uploaded: {uploadedFile.name}
                  </div>
                )}
              </div>

              {/* Supported Formats Info */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-indigo-900 mb-2">Supported File Formats:</h4>
                <div className="text-xs text-indigo-700 space-y-1">
                  <div>✓ <strong>Text files:</strong> .txt (plain text)</div>
                  <div>✓ <strong>CSV files:</strong> .csv (comma-separated values)</div>
                  <div>✓ <strong>Excel files:</strong> .xlsx, .xls (spreadsheets)</div>
                  <div>✓ <strong>PDF files:</strong> .pdf (text extraction via backend)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {hasExistingContext ? 'Context loaded' : 'No existing context'}
                </div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(agent.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isProcessingFile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : initialContextExists ? (
                    'Update Context'
                  ) : (
                    'Save Context'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserCreatedAgentContextDrawer;