// src/hooks/useAgentActivation.ts - With Proper TypeScript Types
import { useState } from 'react';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { 
  useCreateActivationMutation, 
  useUpdateActivationMutation 
} from '@/features/activation/activationApi';
import { Agent } from '@/types/agent'; // Adjust the import path as necessary
import { UserCreatedAgent } from '@/features/user/userApi';

interface UseAgentActivationProps {
  userSession?: {
    sub_id: string | null;
    user_id?: string;
  };
  onSuccess?: () => void; // Callback for manual refresh
}

interface ActivationResult {
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
  return 'Failed to update activation status';
};

export const useAgentActivation = ({ userSession, onSuccess }: UseAgentActivationProps) => {
  const [createActivation, { isLoading: isCreating }] = useCreateActivationMutation();
  const [updateActivation, { isLoading: isUpdating }] = useUpdateActivationMutation();
  const [isLoading, setIsLoading] = useState(false);

  const handleActivation = async (
    agent: UserCreatedAgent, 
    newStatus: boolean, 
    context: string = ""
  ): Promise<ActivationResult> => {
    console.log('=== Activation Debug Info ===');
    console.log('Agent:', agent);
    console.log('Current activation_data:', agent.activation_data);
    console.log('New status:', newStatus);
    console.log('UserSession:', userSession);

    if (!userSession?.sub_id) {
      return {
        success: false,
        error: 'User session not found'
      };
    }

    setIsLoading(true);

    try {
      const requestPayload = {
        user_id: userSession.sub_id,
        agent_id: agent.id,
        status: newStatus,
        context: context
      };

      console.log('Request payload:', requestPayload);

      let result;

      // Check if activation_data exists and has an id
      if (agent.activation_data?.id) {
        console.log('Updating existing activation with ID:', agent.activation_data.id);
        
        result = await updateActivation({
          id: agent.activation_data.id,
          data: requestPayload
        }).unwrap();
        
        console.log(`Agent ${agent.id} activation updated:`, result);
      } else {
        console.log('Creating new activation (no existing activation_data found)');
        
        result = await createActivation(requestPayload).unwrap();
        
        console.log(`Agent ${agent.id} activation created:`, result);
      }

      console.log('API call successful, triggering UI refresh...');

      // The mutations should automatically invalidate the cache due to the 
      // invalidatesTags configuration in the API, but let's also call
      // the manual refresh callback to be sure
      if (onSuccess) {
        console.log('Calling onSuccess callback for manual refresh');
        // Small delay to ensure the API response is processed
        setTimeout(() => onSuccess(), 200);
      }

      setIsLoading(false);
      return {
        success: true,
        message: `Agent ${newStatus ? 'activated' : 'deactivated'} successfully`
      };

    } catch (error: unknown) {
      setIsLoading(false);
      console.error('Error handling activation:', error);
      
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

  return {
    handleActivation,
    isLoading: isLoading || isCreating || isUpdating
  };
};