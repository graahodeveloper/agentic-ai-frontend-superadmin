import React from 'react';

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  buttonText: string;
  buttonAction: () => void;
  isCompleted: boolean;
  isDisabled?: boolean;
  buttonColor?: string;
  children?: React.ReactNode;
  // New props for secondary button
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void;
  isSecondaryDisabled?: boolean;
  secondaryButtonColor?: string;
}

const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  description,
  buttonText,
  buttonAction,
  isCompleted,
  isDisabled = false,
  buttonColor = "blue",
  children,
  // Secondary button props
  secondaryButtonText,
  secondaryButtonAction,
  isSecondaryDisabled = false,
  secondaryButtonColor = "gray"
}) => {
  const getButtonColorClasses = (color: string, disabled: boolean) => {
    if (disabled) {
      return "bg-gray-400 cursor-not-allowed";
    }
    
    switch (color) {
      case "blue":
        return "bg-blue-600 hover:bg-blue-700";
      case "purple":
        return "bg-purple-600 hover:bg-purple-700";
      case "green":
        return "bg-green-600 hover:bg-green-700";
      case "gray":
        return "bg-gray-600 hover:bg-gray-700";
      case "teal":
        return "bg-teal-600 hover:bg-teal-700";
      default:
        return "bg-blue-600 hover:bg-blue-700";
    }
  };

  return (
    <div className="flex items-start space-x-6">
      {/* Step Circle - Separated */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
          isCompleted 
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {isCompleted ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            stepNumber
          )}
        </div>
        <span className="text-xs font-medium text-gray-600 mt-2">Step {stepNumber}</span>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-6 bg-[linear-gradient(90deg,_#fff_-11.17%,_#c9c7ea_100%)] rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className=" text-md font-medium text-gray-900">{title}</h3>
          <div className="flex space-x-3">
            {/* Secondary Button (Test button) */}
            {secondaryButtonText && secondaryButtonAction && (
              <button
                onClick={secondaryButtonAction}
                disabled={isSecondaryDisabled}
                className={`px-4 py-2 text-white rounded-lg cursor-pointer font-medium transition-colors ${getButtonColorClasses(secondaryButtonColor, isSecondaryDisabled)}`}
              >
                {secondaryButtonText}
              </button>
            )}
            {/* Primary Button */}
            <button
              onClick={buttonAction}
              disabled={isDisabled}
              className={`px-6 py-2 text-white rounded-lg cursor-pointer font-medium transition-colors ${getButtonColorClasses(buttonColor, isDisabled)}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        {children}
      </div>
    </div>
  );
};

export default StepCard;