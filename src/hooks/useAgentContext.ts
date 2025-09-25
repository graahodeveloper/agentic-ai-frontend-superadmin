// src/hooks/useAgentContext.ts - With Proper TypeScript Types
import { useState, useEffect } from 'react';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { useUpdateActivationMutation } from '@/features/activation/activationApi';
import { Agent } from '@/types/agent' // Adjust the import path as necessary

interface UseAgentContextProps {
  agent: Agent | null;
  userSession?: {
    sub_id: string | null;
    user_id?: string;
  };
}

interface ContextResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Define expected API error response structure
interface ApiErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
}

// Type guard to check if error is FetchBaseQueryError
const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError => {
  return error !== null && typeof error === 'object' && 'status' in error;
};

// Type guard to check if error is SerializedError
const isSerializedError = (error: unknown): error is SerializedError => {
  return error !== null && typeof error === 'object' && 'message' in error && !('status' in error);
};

// Type guard to check if error has message property
const hasMessage = (error: unknown): error is { message: string } => {
  return error !== null && typeof error === 'object' && 'message' in error;
};

// Helper function to safely extract error message
const extractErrorMessage = (error: unknown): string => {
  if (isFetchBaseQueryError(error)) {
    // Handle RTK Query FetchBaseQueryError
    if (error.data) {
      if (typeof error.data === 'string') {
        return error.data;
      }
      
      if (typeof error.data === 'object') {
        const apiError = error.data as ApiErrorResponse;
        if (apiError.message) return apiError.message;
        if (apiError.detail) return apiError.detail;
        if (apiError.error) return apiError.error;
      }
    }
    
    // Handle specific error statuses
    if (typeof error.status === 'number') {
      return `Request failed with status: ${error.status}`;
    }
    
    if (typeof error.status === 'string') {
      return `Request failed: ${error.status}`;
    }
    
    return 'Request failed';
  }
  
  if (isSerializedError(error)) {
    // Handle RTK SerializedError
    return error.message || 'Unknown error occurred';
  }
  
  if (error instanceof Error) {
    // Handle standard JavaScript Error
    return error.message;
  }
  
  if (hasMessage(error)) {
    // Handle objects with message property
    return error.message;
  }
  
  if (typeof error === 'string') {
    // Handle string errors
    return error;
  }
  
  // Fallback for unknown error types
  return 'Failed to save context';
};

export const useAgentContext = ({ agent, userSession }: UseAgentContextProps) => {
  const [context, setContext] = useState<string>('');
  const [agentRolesContext, setAgentRolesContext] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [updateActivation] = useUpdateActivationMutation();

  // Load existing context when agent changes
  useEffect(() => {
    if (agent?.activation_data?.context) {
      setContext(agent.activation_data.context);
    } else {
      setContext('');
    }
    if (agent?.activation_data?.agent_roles) {
      setAgentRolesContext(agent.activation_data.agent_roles);
    } else {
      setAgentRolesContext('');
    }
  }, [agent]);

  const saveContext = async (newContext: string, newAgentRolesContext: string): Promise<ContextResult> => {
    if (!agent || !userSession?.sub_id) {
      return {
        success: false,
        error: 'Missing agent or user session data'
      };
    }

    // Check if agent has activation data
    if (!agent.activation_data?.id) {
      return {
        success: false,
        error: 'Agent is not activated. Please activate the agent first.'
      };
    }

    setIsSaving(true);

    try {
      const result = await updateActivation({
        id: agent.activation_data.id,
        data: {
          user_id: userSession.sub_id,
          agent_id: agent.id,
          status: agent.activation_data.status,
          context: newContext,
          agent_roles: newAgentRolesContext
        }
      }).unwrap();

      console.log('Context updated successfully:', result);
      setContext(newContext);

      setIsSaving(false);
      return {
        success: true,
        message: 'Context saved successfully'
      };

    } catch (error: unknown) {
      setIsSaving(false);
      console.error('Error saving context:', error);
      
      // Log error details safely
      if (isFetchBaseQueryError(error)) {
        console.error('Error details:', {
          status: error.status,
          data: error.data
        });
      } else if (hasMessage(error)) {
        console.error('Error details:', {
          message: error.message
        });
      }
      
      const errorMessage = extractErrorMessage(error);

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const hasExistingContext = Boolean(context && context.trim().length > 0);

  // Helper function to reset context to original value
  const resetContext = (): void => {
    if (agent?.activation_data?.context) {
      setContext(agent.activation_data.context);
    } else {
      setContext('');
    }
  };

  // Helper function to check if context has been modified
  const isContextModified = (): boolean => {
    const originalContext = agent?.activation_data?.context || '';
    return context !== originalContext;
  };

  return {
    context,
    agentRolesContext,
    setContext,
    setAgentRolesContext,
    saveContext,
    resetContext,
    isSaving,
    hasExistingContext,
    isContextModified
  };
};