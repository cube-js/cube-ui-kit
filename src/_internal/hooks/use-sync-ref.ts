import { MutableRefObject, useRef } from 'react';

import { useLayoutEffect } from '../../utils/react/use-layout-effect';

export function useSyncRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef<T>(value);

  useLayoutEffect(() => {
    ref.current = value;
  });

  return ref;
}
