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

  // A portal mounts a fresh subtree in a commit that did not re-render `<Root>`,
  // so its window cannot cover this one — open one here, flushing in
  // `useInsertionEffect` before any positioning effect reads the DOM.
  //
  // In the kit this path is tooltips: `TooltipTrigger` is the only component
  // that renders `<Portal>`. Popovers, modals and trays portal through
  // `<Overlay>`'s own `createPortal`, which opens its own window.
  const content = <TastyBatchProvider>{children}</TastyBatchProvider>;

  if (isDisabled) return content;
  // Render inline until mountRoot is available (fixes timing issues in tests and SSR)
  if (!mountRoot) return content;
  return createPortal(content, mountRoot);
}
