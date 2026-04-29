import { useEffect, useRef, useState } from 'react';

interface CharacterLimitHintProps {
  current: number;
  max: number;
  min?: number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  showWhenCurrentAtLeast?: number;
}

export function CharacterLimitHint({
  current,
  max,
  min,
  align = 'right',
  className = '',
  showWhenCurrentAtLeast = 1,
}: CharacterLimitHintProps) {
  const hintRef = useRef<HTMLParagraphElement | null>(null);
  const [isFieldFocused, setIsFieldFocused] = useState(false);

  useEffect(() => {
    const syncFocusState = () => {
      const parent = hintRef.current?.parentElement;
      const activeElement = document.activeElement;
      setIsFieldFocused(Boolean(parent && activeElement && parent.contains(activeElement)));
    };

    syncFocusState();
    document.addEventListener('focusin', syncFocusState);
    document.addEventListener('focusout', syncFocusState);

    return () => {
      document.removeEventListener('focusin', syncFocusState);
      document.removeEventListener('focusout', syncFocusState);
    };
  }, []);

  const clampedCurrent = Math.min(current, max);
  const atLimit = clampedCurrent >= max;
  const nearLimit = !atLimit && clampedCurrent >= Math.floor(max * 0.9);
  const needsMoreForMin = typeof min === 'number' && clampedCurrent < min;
  const shouldShow = isFieldFocused && (needsMoreForMin || clampedCurrent >= showWhenCurrentAtLeast);

  const colorClass = atLimit
    ? 'text-red-600'
    : nearLimit
    ? 'text-amber-600'
    : 'text-charcoal-400';

  const alignClass =
    align === 'left' ? 'text-left'
    : align === 'center' ? 'text-center'
    : 'text-right';

  let helperText = '';
  if (needsMoreForMin && typeof min === 'number') {
    helperText = ` • ${min - clampedCurrent} more needed`;
  } else if (atLimit) {
    helperText = ' • Max reached';
  }

  return (
    <p
      ref={hintRef}
      className={`mt-1 text-xs font-mono ${alignClass} ${colorClass} ${shouldShow ? '' : 'hidden'} ${className}`}
    >
      {clampedCurrent}/{max}
      {helperText}
    </p>
  );
}
