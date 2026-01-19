import { useInsertionEffect, useMemo, useRef } from 'react';

import { keyframes } from '../injector';
import { KeyframesResult, KeyframesSteps } from '../injector/types';

type UseKeyframesOptions = {
  name?: string;
  root?: Document | ShadowRoot;
};

/**
 * Hook to inject CSS @keyframes and return the generated animation name.
 * Handles keyframes injection with proper cleanup on unmount or dependency changes.
 *
 * @example Basic usage - steps object is the dependency
 * ```tsx
 * function MyComponent() {
 *   const bounce = useKeyframes({
 *     '0%': { transform: 'scale(1)' },
 *     '50%': { transform: 'scale(1.1)' },
 *     '100%': { transform: 'scale(1)' },
 *   });
 *
 *   return <div style={{ animation: `${bounce} 1s infinite` }}>Bouncing</div>;
 * }
 * ```
 *
 * @example With custom name
 * ```tsx
 * function MyComponent() {
 *   const fadeIn = useKeyframes(
 *     { from: { opacity: 0 }, to: { opacity: 1 } },
 *     { name: 'fadeIn' }
 *   );
 *
 *   return <div style={{ animation: `${fadeIn} 0.3s ease-out` }}>Fading in</div>;
 * }
 * ```
 *
 * @example Factory function with dependencies
 * ```tsx
 * function MyComponent({ scale }: { scale: number }) {
 *   const pulse = useKeyframes(
 *     () => ({
 *       '0%': { transform: 'scale(1)' },
 *       '100%': { transform: `scale(${scale})` },
 *     }),
 *     [scale]
 *   );
 *
 *   return <div style={{ animation: `${pulse} 1s infinite` }}>Pulsing</div>;
 * }
 * ```
 */

// Overload 1: Static steps object
export function useKeyframes(
  steps: KeyframesSteps,
  options?: UseKeyframesOptions,
): string;

// Overload 2: Factory function with dependencies
export function useKeyframes(
  factory: () => KeyframesSteps,
  deps: readonly unknown[],
  options?: UseKeyframesOptions,
): string;

// Implementation
export function useKeyframes(
  stepsOrFactory: KeyframesSteps | (() => KeyframesSteps),
  depsOrOptions?: readonly unknown[] | UseKeyframesOptions,
  options?: UseKeyframesOptions,
): string {
  // Detect which overload is being used
  const isFactory = typeof stepsOrFactory === 'function';

  // Parse arguments based on overload
  const deps =
    isFactory && Array.isArray(depsOrOptions) ? depsOrOptions : undefined;
  const opts = isFactory
    ? options
    : (depsOrOptions as UseKeyframesOptions | undefined);

  // Memoize the keyframes steps to get a stable reference
  const stepsData = useMemo(
    () => {
      const steps = isFactory
        ? (stepsOrFactory as () => KeyframesSteps)()
        : (stepsOrFactory as KeyframesSteps);

      if (!steps || Object.keys(steps).length === 0) {
        return null;
      }

      return steps;
    },

    isFactory ? deps ?? [] : [stepsOrFactory],
  );

  // Store keyframes results for cleanup - we need to track both the render-time
  // injection (for the name) and the effect-time injection (for Strict Mode safety)
  const renderResultRef = useRef<KeyframesResult | null>(null);
  const effectResultRef = useRef<KeyframesResult | null>(null);

  // Inject keyframes during render to ensure the animation name is available
  // immediately. The keyframes() function uses reference counting internally,
  // so multiple calls with the same content are deduplicated.
  const name = useMemo(() => {
    // Dispose previous render-time result if deps changed
    renderResultRef.current?.dispose();
    renderResultRef.current = null;

    if (!stepsData) {
      return '';
    }

    // Inject keyframes synchronously
    const result = keyframes(stepsData, {
      name: opts?.name,
      root: opts?.root,
    });

    renderResultRef.current = result;

    return result.toString();
  }, [stepsData, opts?.name, opts?.root]);

  // Handle injection and cleanup in useInsertionEffect to properly support
  // React 18+ Strict Mode double-invocation (mount → unmount → mount).
  // The effect setup re-injects the keyframes if cleanup was called, ensuring
  // the CSS exists after Strict Mode remounts.
  useInsertionEffect(() => {
    // Dispose previous effect-time result
    effectResultRef.current?.dispose();
    effectResultRef.current = null;

    // Re-inject keyframes. This ensures the CSS exists after Strict Mode cleanup.
    // The keyframes() function uses reference counting, so this is idempotent
    // if the CSS wasn't disposed.
    if (stepsData) {
      const result = keyframes(stepsData, {
        name: opts?.name,
        root: opts?.root,
      });
      effectResultRef.current = result;
    }

    // Cleanup on unmount or when dependencies change.
    // Dispose both the effect-time and render-time results to properly
    // decrement the reference count.
    return () => {
      effectResultRef.current?.dispose();
      effectResultRef.current = null;
      renderResultRef.current?.dispose();
      renderResultRef.current = null;
    };
  }, [stepsData, opts?.name, opts?.root]);

  return name;
}
