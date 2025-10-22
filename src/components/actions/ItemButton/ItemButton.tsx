import { FocusableRef } from '@react-types/shared';
import {
  forwardRef,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Styles, tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { CubeItemBaseProps, ItemBase } from '../../content/ItemBase';
import { CubeItemActionProps, ItemAction } from '../ItemAction';
import { ItemActionProvider } from '../ItemActionContext';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemButtonProps
  extends CubeItemBaseProps,
    Omit<CubeUseActionProps, 'as'> {
  actions?: ReactNode;
  wrapperStyles?: Styles;
}

const StyledItemBase = tasty(ItemBase, {
  as: 'button',
  type: 'neutral',
  theme: 'default',
  styles: {
    reset: 'button',
    placeContent: 'center stretch',
  },
});

const ActionsWrapper = tasty({
  styles: {
    display: 'grid',
    position: 'relative',
    placeContent: 'stretch',
    placeItems: 'stretch',

    $size: {
      '': '$size-md',
      '[data-size="xsmall"]': '$size-xs',
      '[data-size="small"]': '$size-sm',
      '[data-size="medium"]': '$size-md',
      '[data-size="large"]': '$size-lg',
      '[data-size="xlarge"]': '$size-xl',
    },
  },
});

const ActionsContainer = tasty({
  styles: {
    position: 'absolute',
    inset: '1bw 1bw auto auto',
    display: 'flex',
    gap: '1bw',
    placeItems: 'center',
    placeContent: 'end',
    pointerEvents: 'auto',
    padding: '0 .5x 0 0',
    height: '$size',
  },
});

const ItemButton = forwardRef(function ItemButton(
  allProps: CubeItemButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  const {
    mods,
    to,
    htmlType,
    as,
    type,
    theme,
    onPress,
    actions,
    size = 'medium',
    ...rest
  } = allProps as CubeItemButtonProps & {
    as?: 'a' | 'button' | 'div' | 'span';
  };

  const actionsRef = useRef<HTMLDivElement>(null);
  const [actionsWidth, setActionsWidth] = useState(0);

  useLayoutEffect(() => {
    if (actions && actionsRef.current) {
      const width = Math.round(actionsRef.current.offsetWidth);
      if (width !== actionsWidth) {
        setActionsWidth(width);
      }
    }
  }, [actions, actionsWidth]);

  const { actionProps } = useAction(
    { ...(allProps as any), htmlType, to, as, mods },
    ref,
  );

  const button = (
    <StyledItemBase
      actions={actions ? true : undefined}
      {...(mergeProps(rest, actionProps) as any)}
      htmlType={actionProps.type}
      type={type}
      theme={theme}
      size={size}
    />
  );

  if (actions) {
    return (
      <ActionsWrapper
        data-size={typeof size === 'number' ? undefined : size}
        style={
          {
            '--actions-width': `${actionsWidth}px`,
            '--size': typeof size === 'number' ? `${size}px` : undefined,
          } as any
        }
      >
        {button}
        <ActionsContainer ref={actionsRef}>
          <ItemActionProvider type={type}>{actions}</ItemActionProvider>
        </ActionsContainer>
      </ActionsWrapper>
    );
  }

  return button;
});

const _ItemButton = Object.assign(ItemButton, {
  Action: ItemAction,
});

export { _ItemButton as ItemButton };
export type {
  CubeItemButtonProps as ItemButtonProps,
  CubeItemActionProps as ItemActionProps,
};
