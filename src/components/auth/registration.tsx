import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRegisterMutation, useConfirmSignUpMutation, useResendSignUpMutation, useLoginMutation } from '@/features/auth/authApi';
import { RegistrationFormData, FormErrors } from '@/types/auth';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { COUNTRIES } from '@/libraries/countries';
import { useCreateUserMutation, useUpdateUserMutation } from '@/features/user/userApi';

interface RegistrationComponentProps {
  onSwitchToLogin: () => void;
}

// Define expected API error response structure
interface ApiErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
}

// Country interface
interface Country {
  code: string;
  name: string;
  flag: string;
}

// Type guard functions
const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError => {
  return error !== null && typeof error === 'object' && 'status' in error;
};

const isSerializedError = (error: unknown): error is SerializedError => {
  return error !== null && typeof error === 'object' && 'message' in error && !('status' in error);
};

const hasMessage = (error: unknown): error is { message: string } => {
  return error !== null && typeof error === 'object' && 'message' in error;
};

const extractErrorMessage = (error: unknown): string => {
  if (isFetchBaseQueryError(error)) {
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
    
    if (typeof error.status === 'number') {
      return `Request failed with status: ${error.status}`;
    }
    
    if (typeof error.status === 'string') {
      return `Request failed: ${error.status}`;
    }
    
    return 'Request failed';
  }
  
  if (isSerializedError(error)) {
    return error.message || 'Unknown error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (hasMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};

const RegistrationComponent: React.FC<RegistrationComponentProps> = ({ onSwitchToLogin }) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: ''
  });

  // Country dropdown state
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Redux Hooks
  const [registration, { isLoading: isRegistering }] = useRegisterMutation();
  const [confirmSignUp, { isLoading: isConfirming }] = useConfirmSignUpMutation();
  const [resendSignUp, { isLoading: isResending }] = useResendSignUpMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  // Add this state to store the country for later use
  const [registrationData, setRegistrationData] = useState<{
    email: string;
    name: string;
    country: string;
  } | null>(null);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Validation Functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const getPasswordStrength = (password: string): string => {
    if (password.length === 0) return '';
    if (password.length < 8) return 'Too short';
    if (!validatePassword(password)) return 'Weak';
    if (password.length >= 12) return 'Strong';
    return 'Good';
  };

  const getPasswordStrengthColor = (strength: string): string => {
    switch (strength) {
      case 'Too short': return 'text-red-500';
      case 'Weak': return 'text-red-500';
      case 'Good': return 'text-amber-500';
      case 'Strong': return 'text-emerald-500';
      default: return 'text-gray-400';
    }
  };

  const getPasswordStrengthBg = (strength: string): string => {
    switch (strength) {
      case 'Too short': return 'bg-red-500';
      case 'Weak': return 'bg-red-500';
      case 'Good': return 'bg-amber-500';
      case 'Strong': return 'bg-emerald-500';
      default: return 'bg-gray-200';
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.country) {
      newErrors.country = 'Please select your country';
    }

    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev: RegistrationFormData) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleCountrySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCountrySearch(value);
    setShowCountryDropdown(true);
    
    // Clear selected country if user is typing something different
    if (selectedCountry && value !== selectedCountry.name) {
      setSelectedCountry(null);
      setFormData(prev => ({
        ...prev,
        country: ''
      }));
    }
    
    if (errors.country) {
      setErrors(prev => ({
        ...prev,
        country: undefined
      }));
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setFormData(prev => ({
      ...prev,
      country: country.code
    }));
    setCountrySearch(''); // Clear search when country is selected
    setShowCountryDropdown(false);
    
    if (errors.country) {
      setErrors(prev => ({
        ...prev,
        country: undefined
      }));
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));

    const fieldErrors = validateForm();
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors[fieldName as keyof FormErrors]
    }));
  };

const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
  e.preventDefault();
  setIsValidating(true);

  setTouched({
    name: true,
    email: true,
    password: true,
    confirmPassword: true,
    country: true
  });

  const formErrors = validateForm();
  setErrors(formErrors);

  if (Object.keys(formErrors).length > 0) {
    setIsValidating(false);
    return;
  }

  try {
    console.log('Registration attempt:', formData);
    
    // Store registration data for later use when creating user in backend
    setRegistrationData({
      email: formData.email,
      name: formData.name,
      country: formData.country
    });
    
    const response = await registration({ 
      username: formData.email, 
      password: formData.password,
      name: formData.name,
      country: formData.country // This will be included in response but not sent to Cognito
    }).unwrap();

    if(response?.sub_id) {

    const createUserData = async () => {
          try {
            const email = formData?.email || '';
            const name = formData?.name || '';
            // const mobile = formData?.phone_number || '';
            const nameParts = name.trim().split(' ');
            const first_name = nameParts[0] || '';
            const last_name = nameParts.slice(1).join(' ') || '';
            const country = formData?.country || '';
            console.log('User attributes:', formData);

            const userData = {
              sub_id: response.sub_id,
              first_name: first_name,
              last_name: last_name,
              email: email,
              // mobile: mobile,
              country: country
            };

            const createdUser = await createUser(userData).unwrap();
            console.log('Created user:', createdUser);
            // setUserData(createdUser.user);
          } catch (createError) {
            console.error('Error creating user:', createError);
            // setErrorMessage('Failed to create user profile. Please try again later.');
          }
        };

    createUserData();
    }


    
    if (response.requiresVerification) {
      setShowEmailVerification(true);
      setErrors(prev => ({
        ...prev,
        general: undefined
      }));
    } else {
      // If no verification needed, create user immediately
      // await createUserInBackend(formData.email, formData.name, formData.country);
      // router.push('/dashboard');
    }
  } catch (error: unknown) {
    console.error('Registration failed:', error);
    const errorMessage = extractErrorMessage(error);
    setErrors(prev => ({
      ...prev,
      general: errorMessage
    }));
  } finally {
    setIsValidating(false);
  }
};

const handleEmailVerification = async () => {
  if (!verificationCode.trim()) {
    setErrors(prev => ({
      ...prev,
      general: 'Please enter the verification code'
    }));
    return;
  }

  try {
    console.log('Confirming email verification...');
    const verificationResponse = await confirmSignUp({
      username: formData.email,
      confirmationCode: verificationCode
    }).unwrap();
    
    console.log('Email verified successfully:', verificationResponse);

    console.log('Auto-logging in user after verification...');
    const loginResponse = await login({
      username: formData.email,
      password: formData.password
    }).unwrap();

    console.log('Auto-login successful:', loginResponse);
    
    // Create user in backend with country data
    // if (registrationData) {
    //   await createUserInBackend(
    //     registrationData.email, 
    //     registrationData.name, 
    //     registrationData.country
    //   );
    // }
    
    router.push('/dashboard');

  } catch (error: unknown) {
    console.error('Verification or login failed:', error);
    const errorMessage = extractErrorMessage(error);
    
    if (isFetchBaseQueryError(error) && error.data) {
      if (typeof error.data === 'string' && error.data.includes('verification')) {
        setErrors(prev => ({
          ...prev,
          general: 'Invalid verification code. Please try again.'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          general: 'Email verified successfully, but auto-login failed. Please try logging in manually.'
        }));
        
        setTimeout(() => {
          onSwitchToLogin();
        }, 3000);
      }
    } else {
      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
    }
  }
};

  const resendVerificationCode = async () => {
    try {
      await resendSignUp({ username: formData.email }).unwrap();
      console.log('Verification code sent');
      
      setErrors(prev => ({
        ...prev,
        general: undefined
      }));
      
      const successMessage = 'New verification code sent to your email!';
      setErrors(prev => ({
        ...prev,
        general: successMessage
      }));
      
      setTimeout(() => {
        setErrors(prev => ({
          ...prev,
          general: undefined
        }));
      }, 3000);
    } catch (error: unknown) {
      console.error('Resend failed:', error);
      const errorMessage = extractErrorMessage(error);
      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
    }
  };

  // Email Verification View
  if (showEmailVerification) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Verify Your Email</h2>
          <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
            We&apos;ve sent a 6-digit verification code to 
            <span className="block font-semibold text-gray-900 mt-1">{formData.email}</span>
          </p>

        </div>

        {errors.general && (
          <div className={`p-4 rounded-xl border-l-4 ${
            errors.general.includes('sent') || errors.general.includes('New verification') || errors.general.includes('verified successfully')
              ? 'bg-emerald-50 border-emerald-400'
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {errors.general.includes('sent') || errors.general.includes('New verification') || errors.general.includes('verified successfully') ? (
                  <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  errors.general.includes('sent') || errors.general.includes('New verification') || errors.general.includes('verified successfully')
                    ? 'text-emerald-800'
                    : 'text-red-800'
                }`}>
                  {errors.general}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-900">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="000000"
            className="w-full px-6 py-4 text-2xl font-mono text-center border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-200 bg-gray-50 focus:bg-white tracking-widest"
            maxLength={6}
          />
        </div>

        <button
          onClick={handleEmailVerification}
          disabled={isConfirming || isValidating || isLoggingIn}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md"
        >
          {isConfirming || isValidating || isLoggingIn ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isConfirming ? 'Verifying...' : isLoggingIn ? 'Signing in...' : 'Processing...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify & Continue
            </>
          )}
        </button>

        <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the code?{' '}
              <button
                onClick={resendVerificationCode}
                disabled={isResending}
                className="text-teal-600 hover:text-teal-700 font-semibold disabled:opacity-50 transition-colors"
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </p>


          <button
            onClick={() => setShowEmailVerification(false)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  // Main Registration Form
  return (
    <div className="space-y-6">
      {/* General Error Message */}
      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">
          Full Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          onBlur={() => handleBlur('name')}
          placeholder="Enter your full name"
          className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 ${
            errors.name && touched.name 
              ? 'border-red-300 bg-red-50 focus:border-red-500' 
              : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500'
          }`}
        />
        {errors.name && touched.name && (
          <p className="text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">
          Email Address *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={() => handleBlur('email')}
          placeholder="Enter your email address"
          className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 ${
            errors.email && touched.email 
              ? 'border-red-300 bg-red-50 focus:border-red-500' 
              : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500'
          }`}
        />
        {errors.email && touched.email && (
          <p className="text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      {/* Country Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">
          Country *
        </label>
        
        <div className="relative" ref={countryDropdownRef}>
          <div className="relative">
            <input
              type="text"
              name="country"
              id="country"
              value={selectedCountry ? selectedCountry.name : countrySearch}
              onChange={handleCountrySearch}
              onFocus={() => setShowCountryDropdown(true)}
              onBlur={() => handleBlur('country')}
              placeholder="Select your country"
              autoComplete="country"
              role="combobox"
              aria-expanded={showCountryDropdown}
              aria-haspopup="listbox"
              className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 pr-12 ${
                errors.country && touched.country 
                  ? 'border-red-300 bg-red-50 focus:border-red-500' 
                  : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500'
              }`}
            />
            
            {/* Hidden input for the actual country code */}
            <input
              type="hidden"
              name="country_code"
              value={formData.country}
            />
            
            {selectedCountry ? (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center">
                <span className="text-xl mr-2">{selectedCountry.flag}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            ) : (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>

          {/* Country Dropdown - Same as before */}
          {showCountryDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
              {!countrySearch && !selectedCountry && (
                <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                  Type to search or scroll through all countries
                </div>
              )}
              
              {filteredCountries.length > 0 ? (
                <>
                  {countrySearch && !selectedCountry && (
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                      {filteredCountries.length} country{filteredCountries.length !== 1 ? 'ies' : ''} found
                    </div>
                  )}
                  
                  {filteredCountries.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className={`flex items-center px-4 py-3 hover:bg-teal-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedCountry?.code === country.code ? 'bg-teal-50 text-teal-800' : ''
                      }`}
                    >
                      <span className="text-xl mr-3">{country.flag}</span>
                      <span className="text-gray-900 font-medium flex-1">{country.name}</span>
                      <span className="text-sm text-gray-500 font-mono">{country.code}</span>
                      {selectedCountry?.code === country.code && (
                        <svg className="w-4 h-4 ml-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="px-4 py-6 text-gray-500 text-sm text-center">
                  <svg className='w-8 h-8 mx-auto mb-2 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>

                 <p>No countries found matching &quot;{countrySearch}&quot;</p>


                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {errors.country && touched.country && (
          <p className="text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.country}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">
          Password *
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={() => handleBlur('password')}
            placeholder="Create a strong password"
            className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 pr-12 ${
              errors.password && touched.password 
                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold ${getPasswordStrengthColor(getPasswordStrength(formData.password))}`}>
                Password strength: {getPasswordStrength(formData.password)}
              </p>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-2 w-1/4 rounded-full transition-all duration-300 ${
                    level <= (formData.password.length >= 12 && validatePassword(formData.password) ? 4 :
                              validatePassword(formData.password) ? 3 :
                              formData.password.length >= 8 ? 2 : 1)
                      ? getPasswordStrengthBg(getPasswordStrength(formData.password))
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {errors.password && touched.password && (
          <p className="text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">
          Confirm Password *
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder="Confirm your password"
            className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 pr-12 ${
              errors.confirmPassword && touched.confirmPassword 
                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Password Match Indicator */}
        {formData.confirmPassword && (
          <div className="flex items-center">
            {formData.password === formData.confirmPassword ? (
              <div className="flex items-center text-emerald-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold">Passwords match</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                <span className="text-xs font-semibold">Passwords don&apos;t match</span>

              </div>
            )}
          </div>
        )}
        
        {errors.confirmPassword && touched.confirmPassword && (
          <p className="text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isRegistering || isValidating}
        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md mt-8"
      >
        {isRegistering || isValidating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Your Account...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create Account
          </>
        )}
      </button>

      {/* Terms Notice */}
      <p className="text-xs text-gray-500 text-center leading-relaxed">
        By creating an account, you agree to our{' '}
        <a href="#" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
          Privacy Policy
        </a>
      </p>

      {/* Sign In Link */}
      <div className="text-center mt-8">
        <p className="text-xs text-gray-500">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-medium transition-colors"
            style={{ color: '#007289' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#005a6b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#007289';
            }}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegistrationComponent;