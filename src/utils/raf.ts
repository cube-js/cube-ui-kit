/**
 * Chains N requestAnimationFrame calls and returns a cancel function.
 * Useful for ensuring layout is complete before performing operations.
 *
 * @param callback - The function to call after N frames
 * @param count - Number of RAF cycles to wait (default: 1)
 * @returns A function to cancel the pending RAF call
 *
 * @example
 * const cancel = chainRaf(() => {
 *   updatePosition();
 * }, 3);
 *
 * // Later, if needed:
 * cancel();
 */
export function chainRaf(callback: () => void, count: number = 1): () => void {
  let rafId: number | null = null;
  let cancelled = false;

  const scheduleNext = (remaining: number) => {
    if (cancelled) return;

    if (remaining <= 0) {
      callback();
      return;
    }

    rafId = requestAnimationFrame(() => {
      scheduleNext(remaining - 1);
    });
  };

  scheduleNext(count);

  return () => {
    cancelled = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}
