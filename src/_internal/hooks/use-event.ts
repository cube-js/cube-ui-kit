import { useCallback } from 'react';

import { useSyncRef } from './use-sync-ref';

/**
 * Keeps one callable identity for consumers retaining old references while
 * forwarding to the latest committed callback. Ordinary handlers use plain
 * functions; callbacks owned by local effects use React's useEffectEvent.
 *
 * @see https://github.com/reactjs/rfcs/pull/220
 * @see https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md#internal-implementation
 */
export function useEvent<
  Func extends (...args: Args) => Result,
  Args extends Parameters<any> = Parameters<Func>,
  Result extends ReturnType<any> = ReturnType<Func>,
>(callback: Func): (...args: Args) => Result {
  const callbackRef = useSyncRef(callback);

  return useCallback((...args) => callbackRef.current(...args), [callbackRef]);
}
