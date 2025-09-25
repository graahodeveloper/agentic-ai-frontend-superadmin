// src/hook/useUserSession.ts
import { useState, useEffect, useRef } from 'react';
import { fetchAuthSession, fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { useGetUserProfileBySubIdQuery, useCreateUserMutation } from '@/features/user/userApi';
import { UserSession } from '@/types/auth';
import { count } from 'console';

export const useUserSession = () => {
  const [userSession, setUserSession] = useState<UserSession>({
    isLoading: true,
    isAuthenticated: false,
    sub_id: null,
    email: null,
    name: null,
    error: null,
    first_name: null,
    last_name: null,
    country: null
  });

  const [shouldFetchProfile, setShouldFetchProfile] = useState(false);
  
  // Track creation attempts to prevent infinite loops
  const creationAttemptedRef = useRef(false);
  const lastErrorRef = useRef<unknown>(null);
  
  // RTK Query hooks - only run when we have sub_id
  const { 
    data: backendUserResponse, 
    error: profileError, 
    isLoading: isLoadingProfile,
    refetch: refetchProfile
  } = useGetUserProfileBySubIdQuery(
    userSession.sub_id!, 
    { 
      skip: !userSession.sub_id || !shouldFetchProfile 
    }
  );

  // Extract user from response
  const backendUser = backendUserResponse?.user || null;

  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();

  // Check authentication and get user session
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        setUserSession(prev => ({ ...prev, isLoading: true, error: null }));

        // Step 1: Check if user is authenticated
        const user = await getCurrentUser();
        
        if (!user) {
          setUserSession(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
            error: 'User not authenticated'
          }));
          return;
        }

        // Step 2: Get auth session and extract sub_id
        const session = await fetchAuthSession();
        const sub_id = session.tokens?.accessToken?.payload?.sub as string;

        if (!sub_id) {
          setUserSession(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
            error: 'No sub_id found in session'
          }));
          return;
        }

        // Step 3: Get user attributes
        const userAttributes = await fetchUserAttributes();
        const email = userAttributes.email || '';
        const name = userAttributes.name || '';

        // Step 4: Update session state
        setUserSession(prev => ({
          ...prev,
          isAuthenticated: true,
          sub_id,
          email,
          name,
          isLoading: false
        }));

        // Step 5: Trigger profile fetch and reset creation flag
        setShouldFetchProfile(true);
        creationAttemptedRef.current = false; // Reset on new auth

      } catch (error) {
        console.error('Auth check failed:', error);
        setUserSession(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        }));
      }
    };

    checkAuthAndLoadUser();
  }, []);

  // Handle user creation when profile is not found - WITH PROPER GUARDS
 useEffect(() => {
    const handleUserCreation = async () => {
      // GUARD 1: Only proceed if we have session data
      if (!userSession.sub_id || !userSession.email || !userSession.name) {
        return;
      }

      // GUARD 2: Don't proceed if we don't have an error
      if (!profileError) {
        return;
      }

      // GUARD 3: Prevent multiple creation attempts for the same error
      if (creationAttemptedRef.current) {
        console.log('User creation already attempted, skipping...');
        return;
      }

      // GUARD 4: Only handle specific error types
      const errorObj = profileError as unknown;
      const isUserNotFound =
        typeof errorObj === 'object' && errorObj !== null &&
        (
          // @ts-expect-error: runtime type check
          (errorObj.status === 404) ||
          // @ts-expect-error: runtime type check
          (typeof errorObj.data === 'string' && (errorObj.data.includes('not found') || errorObj.data.includes('User not found'))) ||
          // @ts-expect-error: runtime type check
          (errorObj.originalStatus === 404)
        );

      if (!isUserNotFound) {
        console.log('Error is not "user not found", skipping creation:', errorObj);
        return;
      }

      // GUARD 5: Check if this is the same error we already tried to handle
      if (lastErrorRef.current && 
          JSON.stringify(lastErrorRef.current) === JSON.stringify(errorObj)) {
        console.log('Same error as last attempt, skipping creation');
        return;
      }

      try {
        console.log('User not found in backend, creating new user...');
        
        // Mark that we're attempting creation
        creationAttemptedRef.current = true;
        lastErrorRef.current = errorObj;

        // Parse name into first_name and last_name
        const nameParts = userSession.name.trim().split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        // Prepare user data for API
        const userData = {
          sub_id: userSession.sub_id,
          first_name: first_name,
          last_name: last_name,
          email: userSession.email,
          country: userSession.country,
          mobile: '', // Empty string as requested
        };

        console.log('Creating user profile with data usersession:', userData);

        // Call API to create user profile
        const userResponse = await createUser(userData).unwrap();
        console.log('User profile created successfully:', userResponse);

        // Reset creation flag on success
        creationAttemptedRef.current = false;
        lastErrorRef.current = null;

        // Refetch the profile after successful creation
        await refetchProfile();

      } catch (createError) {
        console.error('Failed to create user profile:', createError);
        
        // Don't reset the creation flag immediately on error
        // This prevents immediate retry and allows manual intervention
        
        setUserSession(prev => ({
          ...prev,
          error: 'Failed to create user profile'
        }));

        // Reset creation flag after a delay to allow for potential retry later
        setTimeout(() => {
          creationAttemptedRef.current = false;
          lastErrorRef.current = null;
        }, 30000); // 30 second cooldown
      }
    };

    handleUserCreation();
  }, [
    userSession.sub_id, 
    userSession.email, 
    userSession.name, 
    profileError, // Depend on the whole error object to satisfy React Hook dependency
    createUser, 
    refetchProfile
  ]);
  
  return {
    userSession,
    backendUser,
    isLoadingProfile: isLoadingProfile || isCreatingUser,
    profileError,
    refetchProfile,
    // Expose method to manually retry creation if needed
    retryUserCreation: () => {
      creationAttemptedRef.current = false;
      lastErrorRef.current = null;
    }
  };
};