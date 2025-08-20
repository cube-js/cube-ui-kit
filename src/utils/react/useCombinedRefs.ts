import { RefObject, useEffect, useRef } from 'react';

export function useCombinedRefs(...refs: any[]): RefObject<any> {
  const targetRef = useRef(null);

  useEffect(() => {
    refs.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === 'function') {
        ref(targetRef.current);
      } else {
        ref.current = targetRef.current;
      }
    });
  }, [refs]);

  return targetRef;
}
