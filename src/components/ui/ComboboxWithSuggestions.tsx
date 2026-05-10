// components/ui/ComboboxWithSuggestions.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  isLoading?: boolean;
  allowCustom?: boolean;
  formatValue?: (value: string) => string;
  validateValue?: (value: string) => { isValid: boolean; error: string };
}

const ComboboxWithSuggestions: React.FC<ComboboxWithSuggestionsProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select or type...',
  disabled = false,
  error,
  className = '',
  isLoading = false,
  allowCustom = true,
  formatValue,
  validateValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return options;
    const searchTerm = inputValue.toLowerCase();
    return options.filter(
      (opt) =>
        opt.value.toLowerCase().includes(searchTerm) ||
        opt.label.toLowerCase().includes(searchTerm)
    );
  }, [inputValue, options]);

  // Check if current input matches any existing option
  const matchingOption = useMemo(() => {
    return options.find((opt) => opt.value === inputValue);
  }, [inputValue, options]);

  // Show "Create new" option when custom input doesn't match existing
  const showCreateOption = useMemo(() => {
    if (!allowCustom || !inputValue.trim()) return false;
    const normalizedInput = formatValue ? formatValue(inputValue) : inputValue;
    return !options.some((opt) => opt.value === normalizedInput);
  }, [inputValue, options, allowCustom, formatValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Apply formatting if provided (e.g., snake_case)
      if (formatValue) {
        newValue = formatValue(newValue);
      }

      setInputValue(newValue);
      onChange(newValue);
      setIsOpen(true);
      setHighlightedIndex(-1);
    },
    [onChange, formatValue]
  );

  const handleSelectOption = useCallback(
    (option: ComboboxOption) => {
      setInputValue(option.value);
      onChange(option.value);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleCreateNew = useCallback(() => {
    const newValue = formatValue ? formatValue(inputValue) : inputValue;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }, [inputValue, onChange, formatValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
          setIsOpen(true);
          return;
        }
        return;
      }

      const totalOptions = filteredOptions.length + (showCreateOption ? 1 : 0);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            if (highlightedIndex < filteredOptions.length) {
              handleSelectOption(filteredOptions[highlightedIndex]);
            } else if (showCreateOption) {
              handleCreateNew();
            }
          } else if (showCreateOption) {
            handleCreateNew();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex, showCreateOption, handleSelectOption, handleCreateNew]
  );

  const hasError = !!error;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 pr-10 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 disabled:opacity-50 transition-all ${
            hasError
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
          }`}
          autoComplete="off"
        />

        {/* Dropdown arrow / Loading indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {/* Matched option indicator */}
        {matchingOption && !isOpen && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Existing
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && !disabled && (filteredOptions.length > 0 || showCreateOption) && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1"
          role="listbox"
        >
          {/* Existing options */}
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              onClick={() => handleSelectOption(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                highlightedIndex === index
                  ? 'bg-indigo-50 text-indigo-900'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${option.value === inputValue ? 'bg-indigo-50/50' : ''}`}
              role="option"
              aria-selected={option.value === inputValue}
            >
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-gray-400 font-mono">{option.value}</span>
              </div>
              {option.value === inputValue && (
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </li>
          ))}

          {/* Create new option */}
          {showCreateOption && (
            <>
              {filteredOptions.length > 0 && <li className="border-t border-gray-100 my-1" />}
              <li
                onClick={handleCreateNew}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={`px-3.5 py-2.5 cursor-pointer flex items-center gap-2 transition-colors ${
                  highlightedIndex === filteredOptions.length
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'text-emerald-700 hover:bg-emerald-50/50'
                }`}
                role="option"
              >
                <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-lg">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Create new type</span>
                  <span className="text-xs text-emerald-600 font-mono">
                    "{formatValue ? formatValue(inputValue) : inputValue}"
                  </span>
                </div>
              </li>
            </>
          )}

          {/* No results message */}
          {filteredOptions.length === 0 && !showCreateOption && (
            <li className="px-3.5 py-3 text-gray-500 text-center text-sm">
              No matching types found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default ComboboxWithSuggestions;
