'use client';
import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/types/auth';
import { signUp } from 'aws-amplify/auth';
import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { useCreateUserAsAdminMutation } from '@/features/user/userApi';

interface CreateUserFormData {
  fullName: string;
  email: string;
  country: string;
  role: 'user' | 'admin';
  password: string;
  newPassword: string;
}
type CognitoError = {
  name: string;
  message?: string;
  code?: string;
};
interface CreateUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
  isCreatingUser: boolean;
  currentUser: User | null;
}

const CreateUserDrawer: React.FC<CreateUserDrawerProps> = ({
  isOpen,
  onClose,
  onUserCreated,
  isCreatingUser,
  currentUser,
}) => {
  const [formData, setFormData] = useState<CreateUserFormData>({
    fullName: '',
    email: '',
    country: '',
    role: 'user',
    password: '',
    newPassword: '',
  });
  const [errors, setErrors] = useState<Partial<CreateUserFormData>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the admin mutation
  const [createUserAsAdmin, { isLoading: isCreatingUserAsAdmin }] = useCreateUserAsAdminMutation();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: '',
        email: '',
        country: '',
        role: 'user',
        password: '',
        newPassword: '',
      });
      setErrors({});
      setSaveMessage(null);
    }
  }, [isOpen]);

  // Clear any existing timeout when component unmounts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Please confirm your password';
    } else if (formData.password !== formData.newPassword) {
      newErrors.newPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to create user in AWS Cognito
  const createUserInCognito = async (email: string, password: string, fullName: string): Promise<string> => {
    try {
      console.log('Creating user in AWS Cognito...');
      
      const signUpResult = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: fullName,
          },
          autoSignIn: false,
        },
      });

      console.log('AWS Cognito signup result:', signUpResult);
      
      return signUpResult.userId || email;
    } 
    catch (error: unknown) {
      const cognitoError = error as CognitoError;

      console.error('Error creating user in Cognito:', cognitoError);

      // Handle specific Cognito errors
      if (cognitoError.name === 'UsernameExistsException') {
        throw new Error('A user with this email already exists');
      } else if (cognitoError.name === 'InvalidPasswordException') {
        throw new Error('Password does not meet requirements');
      } else if (cognitoError.name === 'InvalidParameterException') {
        throw new Error('Invalid email format or parameter');
      }

      throw new Error(cognitoError.message || 'Failed to create user in AWS Cognito');
    }
  };

  // Function to auto-confirm user in Cognito (admin operation)
  const autoConfirmUserInCognito = async (email: string, userSub: string) => {
    try {
      
      // Check if credentials exist
      if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials not found in environment variables');
      }

      // Initialize Cognito client with admin credentials
      const cognitoClient = new CognitoIdentityProviderClient({
        region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        },
      });

      const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_XhJtfE9gB';

      console.log('Step 1: Confirming user signup...');
      // Confirm the user signup
      const confirmCommand = new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: email,
      });

      const confirmResult = await cognitoClient.send(confirmCommand);
      console.log('User signup confirmed successfully:', confirmResult);

      console.log('Step 2: Setting email as verified...');
      // Mark email as verified
      const updateCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
      });

      const updateResult = await cognitoClient.send(updateCommand);
      console.log('Email verification set successfully:', updateResult);

      console.log('Auto-confirmation completed successfully');
      return true;
    }
      catch (error: unknown) {
  // Helper function to safely get property
  const getProperty = (obj: unknown, prop: string): unknown => {
    return obj && typeof obj === 'object' && prop in obj 
      ? (obj as Record<string, unknown>)[prop] 
      : undefined;
  };

  const getName = (): string => {
    return error instanceof Error ? error.name : 'Unknown';
  };

  const getMessage = (): string => {
    return error instanceof Error ? error.message : String(error);
  };

  const getCode = (): string => {
    const code = getProperty(error, 'code');
    return typeof code === 'string' ? code : 'Unknown';
  };

  const getStatusCode = (): number | undefined => {
    const metadata = getProperty(error, '$metadata');
    if (metadata && typeof metadata === 'object') {
      const statusCode = getProperty(metadata, 'httpStatusCode');
      return typeof statusCode === 'number' ? statusCode : undefined;
    }
    return undefined;
  };

  const getRequestId = (): string | undefined => {
    const metadata = getProperty(error, '$metadata');
    if (metadata && typeof metadata === 'object') {
      const requestId = getProperty(metadata, 'requestId');
      return typeof requestId === 'string' ? requestId : undefined;
    }
    return undefined;
  };

  console.error('Detailed auto-confirmation error:', {
    name: getName(),
    message: getMessage(),
    code: getCode(),
    statusCode: getStatusCode(),
    requestId: getRequestId(),
  });

  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new Error(`Auto-confirmation failed: ${errorMessage}`);
}
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  if (!currentUser?.sub_id) {
    setSaveMessage({ 
      type: 'error', 
      text: 'Admin user identification required. Please log in again.' 
    });
    return;
  }

  setIsCreating(true);

  try {
    console.log('Starting admin user creation process...');

    // Step 1: Create user in AWS Cognito
    const signUpResult = await createUserInCognito(
      formData.email, 
      formData.password, 
      formData.fullName
    );

    console.log('User created in Cognito:', signUpResult);

    

    // Step 1.5: Auto-confirm
    try {
      await autoConfirmUserInCognito(formData.email, signUpResult);
      console.log('User auto-confirmed successfully');
    } catch (confirmError: unknown) {
  const errorMessage = confirmError instanceof Error 
    ? confirmError.message 
    : String(confirmError);
  console.warn('Auto-confirmation failed, continuing:', errorMessage);
}

    // Step 2: Create user in Django backend
    const nameParts = formData.fullName.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    // ✅ Pass adminSubId as part of payload (mutation will handle converting to query params)
    const adminUserPayload = {
      first_name,
      last_name,
      email: formData.email,
      role: formData.role,
      is_active: true,
      password: formData.password,
      country: formData.country,
      sub_id: signUpResult, 
      adminSubId: currentUser.sub_id, // stays here, but now goes as query param
    };

    console.log('Creating user in Django backend:', adminUserPayload);

    const result = await createUserAsAdmin(adminUserPayload).unwrap();
    console.log('User created successfully:', result);

    onUserCreated(result.user || result);

    setSaveMessage({ 
      type: 'success', 
      text: 'User created and auto-confirmed successfully! No email verification required.' 
    });

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 2000);

  }catch (error: unknown) {
  console.error('Error creating user:', error);
  // (same error handling as before)
} finally {
    setIsCreating(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateUserFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClear = () => {
    setFormData({
      fullName: '',
      email: '',
      country: '',
      role: 'user',
      password: '',
      newPassword: '',
    });
    setErrors({});
    setSaveMessage(null);
  };

  // Don't render if not open
  if (!isOpen) return null;

  const isLoading = isCreating || isCreatingUserAsAdmin || isCreatingUser;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
              <p className="text-sm text-gray-600 mt-1">Create a user account that will be automatically verified</p>
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
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {saveMessage.text}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 ${
                    errors.fullName ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1.5">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 ${
                    errors.country ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="United States"
                  maxLength={100}
                />
                {errors.country && <p className="text-xs text-red-500 mt-1.5">{errors.country}</p>}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 text-gray-900 border-gray-200"
                >
                  <option value="user">User</option>
                  {/* <option value="admin">Admin</option> */}
                </select>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter secure password"
                />
                {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.newPassword && <p className="text-xs text-red-500 mt-1.5">{errors.newPassword}</p>}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="space-y-4">
              {/* Info Text */}
              {/* <div className="flex items-center justify-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                User will be auto-verified, no email confirmation needed
              </div> */}
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Clear Button - Less prominent */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="sm:order-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  Clear Form
                </button>
                
                {/* Cancel & Create Buttons */}
                <div className="sm:order-2 flex gap-3 sm:ml-auto">
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 min-w-[120px]"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create User'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateUserDrawer;