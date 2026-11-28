import { useEffect, useState } from 'react';

/**
 * How long a picker waits, while it loads with no options, before its list
 * shows its empty row, so a fast load never flashes it. `SearchComboBox`'s
 * `loadingDelay` defaults to it, and `ComboBox` uses it.
 */
export const LOADING_DELAY = 1000;

/**
 * Whether the current load has lasted `delay` ms. It turns `true` once
 * `isLoading` has stayed on that long, and `false` as soon as it turns off,
 * so the next load waits again.
 */
export function useDelayedLoading(
  isLoading: boolean,
  delay = LOADING_DELAY,
): boolean {
  const [hasWaited, setHasWaited] = useState(false);

  // A finished load resets the wait for the next one.
  if (!isLoading && hasWaited) setHasWaited(false);

  useEffect(() => {
    if (!isLoading || delay <= 0) return;

    const timer = setTimeout(() => setHasWaited(true), delay);

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return isLoading && (delay <= 0 || hasWaited);
}
