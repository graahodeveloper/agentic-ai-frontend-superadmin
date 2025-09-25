'use client';
import React, { useState } from 'react';
import { useAdminLoginMutation } from '@/features/auth/authApi';
import { LoginFormData, FormErrors } from '@/types/auth';

type LoginComponentProps = {
  onSwitchToRegister: () => void;
};

const LoginComponent: React.FC<LoginComponentProps> = ({ onSwitchToRegister }) => {
  //================== State Variables ==================
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  //================== Redux Hooks ==================
  const [adminLogin, { isLoading: isAdminLoading }] = useAdminLoginMutation();

  //================== Validation Functions ==================
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Username/Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: LoginFormData) => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate individual field on blur
    const fieldErrors = validateForm();
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors[fieldName as keyof FormErrors]
    }));
  };

  //================== Super Admin Login Handler ==================
  const handleSubmit = async () => {
    setIsValidating(true);

    setTouched({
      email: true,
      password: true
    });

    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      setIsValidating(false);
      return;
    }

    try {
      console.log('Super admin login attempt:', { ...formData });

      const response = await adminLogin({ 
        email: formData.email, 
        password: formData.password 
      }).unwrap();

      console.log('Super admin login successful:', response);
      
      const adminUser = {
        id: response.id || 'admin-user-id',
        email: response.email,
        full_name: response.full_name || 'Admin User',
        first_name: response.first_name || response.full_name?.split(' ')[0] || 'Admin',
        last_name: response.last_name || response.full_name?.split(' ')[1] || 'User',
        is_active: response.is_active ?? true,
        sub_id: response.sub_id || null,
        role: response.role || 'super_admin',
      };

      localStorage.setItem('superAdminUser', JSON.stringify(adminUser));
      localStorage.setItem('isSuperAdminLoggedIn', 'true');

      console.log('Super admin login successful, user stored:', adminUser);
      window.location.href = '/dashboard';
      
    } catch (error: unknown) {
      console.error('Super admin login failed:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (typeof error === 'object' && error !== null && 'data' in error) {
        const errorData = (error as { data?: string }).data;
        if (errorData) {
          if (errorData.includes('Invalid credentials') || errorData.includes('Login failed')) {
            errorMessage = 'Invalid admin credentials. Please check your username and password.';
          } else {
            errorMessage = errorData;
          }
        }
      }
      
      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
    } finally {
      setIsValidating(false);
    }
  };

  //================== Render Function ==================
  return (
    <div className="space-y-6">
      {/* General Error Message */}
      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Username/Email Field */}
      <div>
        <label className="block text-md font-medium text-gray-700 mb-2">
          Username *
        </label>
        <input
          type="text"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={() => handleBlur('email')}
          placeholder="Enter admin username"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-[#007289] focus:border-[#007289] outline-none transition-colors text-gray-900 placeholder-gray-400 ${
            errors.email && touched.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        />
        {errors.email && touched.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-md font-medium text-gray-700 mb-2">
          Password *
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={() => handleBlur('password')}
            placeholder="Enter admin password"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-[#007289] focus:border-[#007289] outline-none transition-colors text-gray-900 placeholder-gray-400 pr-12 ${
              errors.password && touched.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
        {errors.password && touched.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isAdminLoading || isValidating}
        className="w-full bg-[var(--color-auth-teal)] hover:bg-[var(--color-auth-teal-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        {isAdminLoading || isValidating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in as Super Admin...
          </>
        ) : (
          'Sign In as Super Admin'
        )}
      </button>
    </div>
  );
};

export default LoginComponent;