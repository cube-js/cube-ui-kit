import { createContext, RefObject, useContext } from 'react';

const PortalContext = createContext<RefObject<HTMLElement | null> | null>(null);

/**
 * @private
 * @internal Don't even try to use it
 */
export function usePortalContext(): {
  root: RefObject<HTMLElement | null> | null;
} {
  const root = useContext(PortalContext);

  return { root };
}

/**
 * @private
 * @internal Don't even try to use it
 */
export const PortalProvider = PortalContext.Provider;
