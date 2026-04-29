import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string; // For filter-style dropdowns that show label when no value selected
  className?: string;
  compact?: boolean; // For smaller h-9 style dropdowns
}

export function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label,
  className = '',
  compact = false
}: CustomSelectProps) {
  const [internalValue, setInternalValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    setInternalValue(option);
    if (onChange) {
      onChange(option);
    }
    setIsOpen(false);
  };

  const handleDropdownScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const displayValue = internalValue || label || placeholder || 'Select';
  const heightClass = compact ? 'h-9' : 'h-14';
  const paddingClass = compact ? 'px-3 py-2' : 'px-4 py-3';
  const textSizeClass = compact ? 'text-sm' : 'text-base';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${heightClass} ${paddingClass} ${textSizeClass} bg-white border-2 rounded-xl text-left flex items-center justify-between shadow-sm transition-all ${
          isOpen
            ? 'border-honey-500 ring-4 ring-honey-100'
            : 'border-charcoal-200 focus:border-honey-500 focus:ring-4 focus:ring-honey-100'
        } ${!internalValue ? 'text-charcoal-700' : 'text-charcoal-900'}`}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={`size-4 text-charcoal-400 transition-transform ml-2 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-charcoal-100 rounded-xl shadow-2xl p-2 max-h-[400px] overflow-y-auto scrollbar-hide" onWheel={handleDropdownScroll}>
          <div className="space-y-1">
            {(label || placeholder) && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-4 py-3 text-left rounded-lg transition-colors whitespace-nowrap ${
                  !internalValue
                    ? 'bg-honey-100 text-charcoal-900 font-medium'
                    : 'text-charcoal-700 hover:bg-honey-50'
                }`}
              >
                {label || placeholder}
              </button>
            )}
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-3 text-left rounded-lg transition-colors whitespace-nowrap ${
                  internalValue === option
                    ? 'bg-honey-100 text-charcoal-900 font-medium'
                    : 'text-charcoal-700 hover:bg-honey-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}