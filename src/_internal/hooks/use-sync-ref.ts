import { MutableRefObject, useLayoutEffect, useRef } from 'react';

export function useSyncRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef<T>(value);

  useLayoutEffect(() => {
    ref.current = value;
  });

  return ref;
}
