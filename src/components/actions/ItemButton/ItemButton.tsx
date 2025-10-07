import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';

import { tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { CubeItemBaseProps, ItemBase } from '../../content/ItemBase';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemButtonProps
  extends CubeItemBaseProps,
    Omit<CubeUseActionProps, 'as'> {}

const StyledItemBase = tasty(ItemBase, {
  as: 'button',
  type: 'neutral',
  theme: 'default',
  styles: {
    reset: 'button',
    placeContent: 'center stretch',
  },
});

export const ItemButton = forwardRef(function ItemButton(
  allProps: CubeItemButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  const { mods, to, htmlType, as, type, theme, onPress, ...rest } =
    allProps as CubeItemButtonProps & {
      as?: 'a' | 'button' | 'div' | 'span';
    };

  const { actionProps } = useAction(
    { ...(allProps as any), htmlType, to, as, mods },
    ref,
  );

  return (
    <StyledItemBase
      {...(mergeProps(rest, actionProps) as any)}
      htmlType={actionProps.type}
      type={type}
      theme={theme}
    />
  );
});

export type { CubeItemButtonProps as ItemButtonProps };
