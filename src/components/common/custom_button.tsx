"use client";

import React, { useState } from 'react';

interface CustomButtonProps {
  children: string;
  onClick: () => void;
  variant?: 'authTeal' | 'gradientAuthTeal' | 'primaryPurple' | 'purple' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  variant = 'authTeal',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  className = '',
  icon,
  iconPosition = 'left'
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Base button styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  // Variant styles - using your exact #007289 color
  const variantStyles = {
    authTeal: 'bg-[#007289] hover:bg-[#005a6b] active:bg-[#004852] text-white border border-[#007289] shadow-sm hover:shadow-md focus:ring-[#007289]/50',
    gradientAuthTeal: 'bg-gradient-to-r from-[#007289] to-[#005a6b] hover:from-[#005a6b] hover:to-[#004852] text-white border-0 shadow-sm hover:shadow-md focus:ring-[#007289]/50',
    primaryPurple: 'bg-[#4318ff] hover:bg-[#3311dd] text-white border border-[#4318ff] focus:ring-[#4318ff]/50',
    purple: 'bg-[#7c75ff] hover:bg-[#6b64ff] text-white border border-[#7c75ff] focus:ring-[#7c75ff]/50',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 focus:ring-gray-500/50',
    danger: 'bg-red-500 hover:bg-red-600 text-white border border-red-500 focus:ring-red-500/50'
  };

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Combine all styles
  const buttonClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${className}`.trim();

  // Handle button click
  const handleClick = () => {
    if (isLoading || isDisabled) return;
    onClick();
  };

  // Handle mouse events for press effect
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4 text-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={isLoading || isDisabled}
      style={{
        transform: isPressed ? 'translateY(1px)' : 'translateY(0)',
      }}
    >
      {/* Content wrapper */}
      <div className="flex items-center justify-center gap-2">
        {/* Left icon */}
        {icon && iconPosition === 'left' && !isLoading && (
          <span className="flex-shrink-0">{icon}</span>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <LoadingSpinner />
        )}

        {/* Button text */}
        <span className="truncate">
          {isLoading ? 'Loading...' : children}
        </span>

        {/* Right icon */}
        {icon && iconPosition === 'right' && !isLoading && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </div>
    </button>
  );
};

export default CustomButton;