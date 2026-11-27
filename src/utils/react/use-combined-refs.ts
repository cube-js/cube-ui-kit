import { Ref, RefObject, useEffect, useRef } from 'react';

type AssignableRef<T> = { current: T | null };

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === 'function') {
        ref(value);
      } else {
        (ref as AssignableRef<T>).current = value;
      }
    });
  };
}

export function useCombinedRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefObject<T> {
  const targetRef = useRef<T>(null) as RefObject<T>;

  useEffect(() => {
    mergeRefs(...refs)(targetRef.current);
  }, [refs]);

  return targetRef;
}
