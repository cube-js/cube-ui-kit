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

  // Store the current keyframes result for cleanup
  const resultRef = useRef<KeyframesResult | null>(null);
  // Track the previous key to detect changes
  const prevKeyRef = useRef<string | null>(null);

  // Inject keyframes synchronously during render to ensure the animation name
  // is available on the first render. The keyframes() function uses reference
  // counting internally, so multiple calls with the same content are deduplicated.
  const name = useMemo(
    () => {
      const steps = isFactory
        ? (stepsOrFactory as () => KeyframesSteps)()
        : (stepsOrFactory as KeyframesSteps);

      const stepsKey = JSON.stringify(steps);

      // If key matches and we already have a result, reuse it without calling
      // keyframes() again to avoid incrementing refCount unnecessarily.
      if (prevKeyRef.current === stepsKey && resultRef.current !== null) {
        return resultRef.current.toString();
      }

      // Key changed or no previous result - dispose old result if present
      if (resultRef.current !== null) {
        resultRef.current.dispose();
        resultRef.current = null;
      }
      prevKeyRef.current = stepsKey;

      if (!steps || Object.keys(steps).length === 0) {
        return '';
      }

      // Inject keyframes synchronously
      const result = keyframes(steps, {
        name: opts?.name,
        root: opts?.root,
      });

      resultRef.current = result;

      return result.toString();
    },

    isFactory
      ? [...(deps ?? []), opts?.name, opts?.root]
      : [stepsOrFactory, opts?.name, opts?.root],
  );

  // Cleanup on unmount
  useInsertionEffect(() => {
    return () => {
      resultRef.current?.dispose();
      resultRef.current = null;
    };
  }, []);

  return name;
}
