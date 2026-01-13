import React, { isValidElement, memo, ReactElement, ReactNode } from 'react';
import * as flattenModule from 'react-keyed-flatten-children';

import { tasty } from '../../../../tasty';
import { ButtonGroup } from '../../../actions';
import { CubeNotificationProps, NotificationActionComponent } from '../types';

type FlattenFn = (children: ReactNode) => (ReactElement | string | number)[];

// Handle CJS/ESM interop - the package exports via `exports.default`
// Vite's __toESM can create nested default: { default: fn } structure
const flatten: FlattenFn = (() => {
  const mod = flattenModule as Record<string, unknown>;
  if (typeof mod === 'function') return mod as unknown as FlattenFn;
  if (typeof mod.default === 'function') return mod.default as FlattenFn;
  if (
    mod.default &&
    typeof mod.default === 'object' &&
    'default' in mod.default &&
    typeof (mod.default as Record<string, unknown>).default === 'function'
  ) {
    return (mod.default as Record<string, unknown>).default as FlattenFn;
  }
  throw new Error('Failed to resolve react-keyed-flatten-children');
})();

interface NotificationFooterProps {
  hasDescription: boolean;
  actions: CubeNotificationProps['actions'];
  onClose: () => void;
  onDismiss: () => void;
}

const FooterArea = tasty(ButtonGroup, {
  styles: {
    gridArea: 'footer',
    gap: '1x 2x',
    flow: 'row wrap',
    margin: {
      '': '0.5x top',
      'has-description': '1x top',
      ':empty': '0',
    },
  },
});

/**
 * @internal This component is unstable and must not be used outside of `NotificationView`.
 */
export const NotificationFooter = memo(function NotificationFooter(
  props: NotificationFooterProps,
) {
  const { actions, onClose, onDismiss, hasDescription } = props;

  return (
    <FooterArea mods={{ 'has-description': hasDescription }}>
      {flatten(
        typeof actions === 'function'
          ? actions({ onClose, onDismiss })
          : actions,
      )
        .filter((action) => isValidElement(action))
        .map((action, index) => {
          const { props } = action as NotificationActionComponent;
          const defaultType = index === 0 ? 'primary' : 'secondary';

          return React.cloneElement(
            action as NotificationActionComponent,
            {
              ...props,
              type: props.type ?? defaultType,
            },
            props.children,
          );
        })}
    </FooterArea>
  );
});
