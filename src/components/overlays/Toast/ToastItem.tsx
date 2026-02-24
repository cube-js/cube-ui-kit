import { forwardRef, ReactNode } from 'react';

import { tasty } from '../../../tasty';
import { CubeItemProps, Item } from '../../content/Item/Item';

import { getThemeIcon } from './useToast';

import type { ToastType } from './types';

export interface ToastItemProps
  extends Partial<Omit<CubeItemProps, 'type' | 'icon'>> {
  /** Primary content (→ Item children). Also supports description-only for migration. */
  title?: ReactNode;
  /** Secondary content (or primary if no title/children) */
  description?: ReactNode;
  /** Visual theme */
  theme?: ToastType;
  /** Whether the toast is in loading state */
  isLoading?: boolean;
  /** Icon to display (resolved ReactNode, not a dynamic icon function) */
  icon?: ReactNode;
}

const StyledItem = tasty(Item, {
  styles: {
    shadow: '$shadow',
    transition: 'theme, inset',
    pointerEvents: {
      '': 'none',
      'has-actions': 'auto',
    },

    Description: {
      preset: 't4',
    },
  },
});

export const ToastItem = forwardRef<HTMLElement, ToastItemProps>(
  function ToastItem(props, ref) {
    const {
      title,
      description,
      theme,
      isLoading,
      icon: providedIcon,
      children,
      qa,
      ...itemProps
    } = props;

    const icon = getThemeIcon(theme, providedIcon, isLoading);

    // If only description provided (no title/children), use description as primary content
    const primaryContent = children ?? title ?? description;
    const secondaryContent = children || title ? description : undefined;

    return (
      <StyledItem
        ref={ref}
        qa={qa ?? 'Toast'}
        type="card"
        theme={theme}
        icon={icon}
        isLoading={isLoading}
        isDisabled={false}
        description={secondaryContent}
        {...itemProps}
      >
        {primaryContent}
      </StyledItem>
    );
  },
);
