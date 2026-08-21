import { TastyBatchProvider } from '@tenphi/tasty';
import { createPortal } from 'react-dom';

import { PortalProps } from './types';
import { usePortal } from './usePortal';

/**
 * This component renders its children outside the current DOM hierarchy.
 *
 * React [doesn't support](https://github.com/facebook/react/issues/13097) portal API in SSR, so, if you want to
 * render a Portal in SSR, use prop `disabled`.
 *
 * By default, Portal's children render under the `<Root />` component.
 *
 * ***Important***: Since React doesn't support portals on SSR, `<Portal />` children renders in the next tick.
 * If you need to make some computations, use the `onMount` callback
 *
 * @see https://reactjs.org/docs/portals.html
 *
 * @example ```jsx
 *  <div>
 *    Portal will be rendered outside me!
 *
 *    <Portal>
 *      <div>some content will be shown outside the parent container</div>
 *    </Portal>
 *  </div>
 * ```
 */
export function Portal(props: PortalProps) {
  const { children, mountRoot, isDisabled } = usePortal(props);

  // Overlays are where injection and measurement interleave worst: a dialog or
  // tooltip mounts a fresh subtree and react-aria positions it from a layout
  // effect in that same commit. `<Root>`'s batch window does not cover those
  // commits — it does not re-render for them — so open one here. It flushes in
  // `useInsertionEffect`, before any positioning effect reads the DOM.
  const content = <TastyBatchProvider>{children}</TastyBatchProvider>;

  if (isDisabled) return content;
  // Render inline until mountRoot is available (fixes timing issues in tests and SSR)
  if (!mountRoot) return content;
  return createPortal(content, mountRoot);
}
