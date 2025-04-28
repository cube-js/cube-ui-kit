import { useEffect, useRef, useState } from 'react';

export function useDebouncedValue<T>(
  value: T,
  delay: number = 300,
  maxWait?: number,
): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const lastValueRef = useRef(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If value returns to the original while waiting, clear timeouts
    if (value === lastValueRef.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxWaitTimeoutRef.current) clearTimeout(maxWaitTimeoutRef.current);
      return;
    }

    // Handle delay
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      lastValueRef.current = value;
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
        maxWaitTimeoutRef.current = null;
      }
    }, delay);

    // Handle maxWait if provided
    if (maxWait && !maxWaitTimeoutRef.current) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastValueRef.current = value;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }, maxWait);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxWaitTimeoutRef.current) clearTimeout(maxWaitTimeoutRef.current);
    };
  }, [value, delay, maxWait]);

  return debouncedValue;
}
