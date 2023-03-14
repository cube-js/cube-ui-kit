import * as React from 'react';

import { warn } from '../../utils/warnings';

export function useWarn<T>(condition: T, ...args: Parameters<typeof warn>) {
  const didWarn = React.useRef(false);

  React.useEffect(() => {
    if (didWarn.current) return;

    didWarn.current = true;
    if (condition) {
      warn(...args);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition]);
}
