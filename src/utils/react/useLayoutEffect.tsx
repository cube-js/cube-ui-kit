import * as React from 'react';

// During SSR, React emits a warning when calling useLayoutEffect.
// Since neither useLayoutEffect nor useEffect run on the server,
// we can suppress this by replacing it with a noop on the server.
export const useLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
