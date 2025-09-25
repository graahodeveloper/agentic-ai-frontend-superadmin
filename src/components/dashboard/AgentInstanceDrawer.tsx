// components/dashboard/AgentInstanceDrawer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { TemplateAssignment } from '@/features/agentTemplateApi/agentTemplateApi';
import { useCreateAgentInstanceMutation } from '@/features/agentTemplateApi/agentTemplateApi';

interface AgentInstanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: TemplateAssignment | null;
}

const AgentInstanceDrawer: React.FC<AgentInstanceDrawerProps> = ({ isOpen, onClose, assignment }) => {
  const [name, setName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [createAgentInstance] = useCreateAgentInstanceMutation();

  // Clear message timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setMessage(null);
    }
  }, [isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!assignment || !name.trim()) {
      setMessage({ type: 'error', text: 'Please provide a name for the agent instance.' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const payload = {
        template_id: assignment.agent_template,
        name: name.trim(),
        user_sub_id: assignment.admin_details.sub_id,
        is_active: true,
      };

      const response = await createAgentInstance({
        admin_sub_id: assignment.admin_details.sub_id,
        data: payload,
      }).unwrap();

      setMessage({
        type: 'success',
        text: response.message || 'Agent instance created successfully',
      });

      // Clear message after 5 seconds
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setMessage(null);
        onClose();
      }, 5000);
    } 
    
    catch (error: unknown) {
      let errorMessage = 'Failed to create agent instance. Please try again.';

      if (
        typeof error === "object" &&
        error !== null &&
        ("name" in error || "detail" in error)
      ) {
        const err = error as { name?: string[]; detail?: string };
        errorMessage = err.name?.[0] || err.detail || errorMessage;
      }

      setMessage({ type: "error", text: errorMessage });

      // Clear message after 5 seconds
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setMessage(null);
      }, 5000);
    }

    
    finally {
      setIsProcessing(false);
    }
  };

  // Don't render if not open or no assignment
  if (!isOpen || !assignment) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-1/2 lg:w-1/3 max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create Agent Instance
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Create a new instance for {assignment.template_details.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
              aria-label="Close drawer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div
              className={`mx-6 mt-4 p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
              aria-live="polite"
            >
              <div className="flex items-center">
                {message.type === 'success' ? (
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
                {message.text}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="instance-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Instance Name
                </label>
                <input
                  id="instance-name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Enter instance name (e.g., Customer Service Bot - Store E)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 placeholder-gray-400 text-sm"
                  aria-required="true"
                />
              </div>

              {/* Template Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Template Details
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <strong>Name:</strong> {assignment.template_details.name}
                  </div>
                  <div>
                    <strong>Type:</strong>{' '}
                    <span className="capitalize">
                      {assignment.template_details.agent_type}
                    </span>
                  </div>
                  <div>
                    <strong>Variant:</strong>{' '}
                    <span className="capitalize">
                      {assignment.template_details.agent_variant}
                    </span>
                  </div>
                  <div>
                    <strong>Assigned by:</strong> {assignment.assigned_by_name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing || !name.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                aria-label="Create instance"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Instance'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentInstanceDrawer;