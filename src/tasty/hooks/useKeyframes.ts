import { useInsertionEffect, useMemo, useRef } from 'react';

import { keyframes } from '../injector';
import { KeyframesSteps } from '../injector/types';

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

  const disposeRef = useRef<(() => void) | null>(null);
  const nameRef = useRef<string>('');

  // Generate a stable key for memoization
  const stepsKey = useMemo(
    () => {
      const steps = isFactory
        ? (stepsOrFactory as () => KeyframesSteps)()
        : (stepsOrFactory as KeyframesSteps);

      // Store steps for later use in effect
      return JSON.stringify(steps);
    },
    isFactory ? deps ?? [] : [stepsOrFactory],
  );

  // Store parsed steps for the effect
  const stepsRef = useRef<KeyframesSteps>({});

  // Update steps when key changes
  if (stepsKey) {
    try {
      stepsRef.current = JSON.parse(stepsKey);
    } catch {
      stepsRef.current = {};
    }
  }

  // Inject keyframes in insertion effect
  useInsertionEffect(() => {
    // Dispose previous injection
    disposeRef.current?.();
    disposeRef.current = null;

    const steps = stepsRef.current;

    if (!steps || Object.keys(steps).length === 0) {
      nameRef.current = '';
      return;
    }

    // Inject keyframes
    const result = keyframes(steps, {
      name: opts?.name,
      root: opts?.root,
    });

    nameRef.current = result.toString();
    disposeRef.current = result.dispose;

    // Cleanup on unmount or when steps change
    return () => {
      disposeRef.current?.();
      disposeRef.current = null;
    };
  }, [stepsKey, opts?.name, opts?.root]);

  return nameRef.current;
}
