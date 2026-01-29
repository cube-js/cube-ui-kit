import { forwardRef, ReactNode } from 'react';

import { tasty } from '../../../tasty';
import { CubeItemProps, Item } from '../../content/Item/Item';

import type { ToastType } from './types';

export interface ToastItemProps extends Partial<Omit<CubeItemProps, 'type'>> {
  /** Primary content (→ Item children). Also supports description-only for migration. */
  title?: ReactNode;
  /** Secondary content (or primary if no title/children) */
  description?: ReactNode;
  /** Visual theme */
  theme?: ToastType;
  /** Whether the toast is in loading state */
  isLoading?: boolean;
}

const StyledItem = tasty(Item, {
  styles: {
    transition: 'theme, inset',
    pointerEvents: 'none',

    Description: {
      preset: 't4',
    },
  },
});

export const ToastItem = forwardRef<HTMLElement, ToastItemProps>(
  function ToastItem(props, ref) {
    const { title, description, theme, isLoading, children, qa, ...itemProps } =
      props;

    // If only description provided (no title/children), use description as primary content
    const primaryContent = children ?? title ?? description;
    const secondaryContent = children || title ? description : undefined;

    return (
      <StyledItem
        ref={ref}
        qa={qa ?? 'Toast'}
        type="card"
        theme={theme}
        isLoading={isLoading}
        description={secondaryContent}
        {...itemProps}
      >
        {primaryContent}
      </StyledItem>
    );
  },
);
