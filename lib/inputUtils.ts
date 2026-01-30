/**
 * Input utility functions for number inputs with scroll wheel and range parsing
 */

// Debounce timer for auto-select after keyboard input
let selectDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced select - selects input content after user stops typing
 */
export const debouncedSelect = (input: HTMLInputElement, delay: number = 400) => {
  if (selectDebounceTimer) clearTimeout(selectDebounceTimer);
  selectDebounceTimer = setTimeout(() => {
    if (document.activeElement === input) {
      input.select();
    }
  }, delay);
};

// Debounce timer for range parsing
let rangeParseTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Parse a multi-digit number as a range (e.g., "2050" → {min: "20", max: "50"})
 */
export const parseAsRange = (value: string): { min: string; max: string } | null => {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 100) return null;

  const len = value.length;

  const trySplit = (splitAt: number): { min: string; max: string } | null => {
    const minStr = value.slice(0, splitAt);
    const maxStr = value.slice(splitAt);
    const minVal = parseInt(minStr, 10);
    const maxVal = parseInt(maxStr, 10);

    if (minVal >= 1 && minVal <= 100 && maxVal >= 1 && maxVal <= 100) {
      return { min: minStr, max: maxStr };
    }
    return null;
  };

  if (len === 3) {
    return trySplit(1) || trySplit(2);
  } else if (len === 4) {
    return trySplit(2);
  } else if (len === 5) {
    return trySplit(2) || trySplit(3);
  }

  return null;
};

/**
 * Debounced range parsing - waits for user to stop typing before parsing
 */
export const debouncedRangeParse = (
  input: HTMLInputElement,
  value: string,
  onRangeParsed: (min: string, max: string) => void,
  delay: number = 400
) => {
  if (rangeParseTimer) clearTimeout(rangeParseTimer);
  rangeParseTimer = setTimeout(() => {
    const range = parseAsRange(value);
    if (range && document.activeElement === input) {
      onRangeParsed(range.min, range.max);
      const container = input.parentElement;
      const secondInput = container?.querySelectorAll('input')[1] as HTMLInputElement;
      if (secondInput) setTimeout(() => secondInput.select(), 0);
    }
  }, delay);
};

/**
 * Handle scroll wheel on number input
 */
export const handleNumberWheel = (
  e: React.WheelEvent<HTMLInputElement>,
  currentValue: string,
  min: number,
  max: number,
  step: number,
  onChange: (newValue: string) => void,
  skipValues?: number[]
) => {
  e.preventDefault();
  const input = e.currentTarget;
  const current = currentValue === '' ? (e.deltaY > 0 ? max + step : min - step) : parseFloat(currentValue);
  const delta = e.deltaY > 0 ? -step : step;
  let newValue = Math.min(max, Math.max(min, current + delta));

  if (skipValues && skipValues.includes(newValue)) {
    newValue = Math.min(max, Math.max(min, newValue + delta));
  }

  onChange(newValue.toString());
  setTimeout(() => input.select(), 10);
};
