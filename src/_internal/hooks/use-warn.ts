import { useEffect } from 'react';

import { warn } from '../../utils/warnings';

const WARNED = new Set<string>();

export function useWarn<T>(condition: T, ...args: Parameters<typeof warn>) {
  useEffect(() => {
    if (WARNED.has(args[0])) return;

    if (condition) {
      WARNED.add(args[0]);
      warn(...args);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition]);
}
