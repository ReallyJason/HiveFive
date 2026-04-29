import { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxValue?: number;
  showMaxHint?: boolean;
  maxHint?: string;
}

const DEFAULT_MAX_CENTS = 999_999; // ⬡ 9,999.99

export function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = "0.00",
  className = '',
  disabled = false,
  maxValue,
  showMaxHint = true,
  maxHint,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('0.00');
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert string value to cents (integer)
  const toCents = (val: string): number => {
    if (!val || val === '' || val === '0') return 0;
    const num = parseFloat(val);
    return Math.round(num * 100);
  };

  // Convert cents to formatted string
  const formatCents = (cents: number): string => {
    const dollars = cents / 100;
    return dollars.toFixed(2);
  };

  const maxCents =
    typeof maxValue === 'number' && Number.isFinite(maxValue) && maxValue > 0
      ? Math.round(maxValue * 100)
      : DEFAULT_MAX_CENTS;
  const maxDisplay = maxHint ?? (maxCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Initialize display value
  useEffect(() => {
    if (value === '' || value === '0') {
      setDisplayValue('0.00');
    } else {
      const cents = toCents(value);
      setDisplayValue(formatCents(cents));
    }
  }, [value]);

  const atMax = toCents(displayValue) >= maxCents;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.keyCode === 8 || e.key === 'Backspace') {
      e.preventDefault();
      let cents = toCents(displayValue);
      cents = Math.floor(cents / 10);
      
      const newValue = formatCents(cents);
      setDisplayValue(newValue);
      onChange(newValue);
      return;
    }

    // Handle delete (reset to 0)
    if (e.keyCode === 46 || e.key === 'Delete') {
      e.preventDefault();
      setDisplayValue('0.00');
      onChange('0');
      return;
    }

    // Allow: tab, escape, enter
    if ([9, 27, 13].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z (undo)
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      (e.keyCode === 90 && e.ctrlKey === true)) {
      return;
    }

    // Ensure that it's a number
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
        (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
      return;
    }

    // Handle number input (cap at 9,999.99)
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      e.preventDefault();
      const digit = e.key;

      let cents = toCents(displayValue);
      cents = cents * 10 + parseInt(digit);

      if (cents > maxCents) return;

      const newValue = formatCents(cents);
      setDisplayValue(newValue);
      onChange(newValue);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const num = parseFloat(pastedText.replace(/[^0-9.]/g, ''));

    if (!isNaN(num)) {
      const formatted = Math.min(num, maxCents / 100).toFixed(2);
      setDisplayValue(formatted);
      onChange(formatted);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // On mobile, the keyboard fires onChange instead of keyDown.
    // Extract digits from the raw value, convert to cents, format.
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '' || raw === '0') {
      setDisplayValue('0.00');
      onChange('0');
      return;
    }
    let cents = parseInt(raw, 10);
    if (cents > maxCents) cents = maxCents;
    const newValue = formatCents(cents);
    setDisplayValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500 font-mono pointer-events-none">
        ⬡
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full h-14 pl-10 pr-4 bg-white border-2 border-charcoal-200 rounded-xl font-mono text-base text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-4 focus:ring-honey-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      />
      {showMaxHint && (
        <p
          className={`mt-1 text-right text-xs font-mono ${atMax ? 'text-red-600' : 'text-charcoal-400'}`}
          aria-live="polite"
        >
          Max ⬡ {maxDisplay}
          {atMax ? ' • Reached' : ''}
        </p>
      )}
    </div>
  );
}
