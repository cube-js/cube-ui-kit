import { FocusableRef } from '@react-types/shared';
import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHover } from 'react-aria';

import { Styles, tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { ItemBadge } from '../../content/ItemBadge';
import { CubeItemBaseProps, ItemBase } from '../../content/ItemBase';
import { DisplayTransition } from '../../helpers';
import { CubeItemActionProps, ItemAction } from '../ItemAction';
import { ItemActionProvider } from '../ItemActionContext';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemButtonProps
  extends Omit<CubeItemBaseProps, 'size'>,
    Omit<CubeUseActionProps, 'as'> {
  actions?: ReactNode;
  size?: Omit<CubeItemBaseProps['size'], 'inline'>;
  wrapperStyles?: Styles;
  showActionsOnHover?: boolean;
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
    preset: {
      '': 't3m',
      '[data-size="xsmall"]': 't4',
      '[data-size="xlarge"]': 't2m',
    },

    $size: {
      '': '$size-md',
      '[data-size="xsmall"]': '$size-xs',
      '[data-size="small"]': '$size-sm',
      '[data-size="medium"]': '$size-md',
      '[data-size="large"]': '$size-lg',
      '[data-size="xlarge"]': '$size-xl',
    },

    '& > [data-element="Actions"]': {
      position: 'absolute',
      inset: '1bw 1bw auto auto',
      display: 'flex',
      gap: '1bw',
      placeItems: 'center',
      placeContent: 'center end',
      pointerEvents: 'auto',
      padding: '0 $side-padding 0 0',
      height: 'min ($size - 2bw)',
      opacity: {
        '': 1,
        'actions-hidden': 0,
      },
      translate: {
        '': '0 0',
        'actions-hidden': '.5x 0',
      },
      transition: 'theme, translate',

      '$side-padding': 'max(min(.5x, (($size - 3x + 2bw) / 2)), 1bw)',
    },
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
    wrapperStyles,
    showActionsOnHover = false,
    ...rest
  } = allProps as CubeItemButtonProps & {
    as?: 'a' | 'button' | 'div' | 'span';
  };

  const actionsRef = useRef<HTMLDivElement>(null);
  const [actionsWidth, setActionsWidth] = useState(0);
  const [areActionsVisible, setAreActionsVisible] = useState(false);
  const [areActionsShown, setAreActionsShown] = useState(false);

  useLayoutEffect(() => {
    if (actions && actionsRef.current) {
      const width = Math.round(actionsRef.current.offsetWidth);
      if (width !== actionsWidth) {
        setActionsWidth(width);
      }
    }
  }, [actions, areActionsVisible]);

  const { hoverProps, isHovered } = useHover({});

  const finalWrapperStyles = useMemo(() => {
    return wrapperStyles
      ? {
          ...wrapperStyles,
          ...(wrapperStyles?.Actions
            ? {
                '& > [data-element="Actions"]': wrapperStyles.Actions,
                Actions: undefined,
              }
            : undefined),
        }
      : undefined;
  }, [wrapperStyles]);

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
        {...hoverProps}
        data-size={size}
        mods={{ 'actions-hidden': !areActionsShown && showActionsOnHover }}
        styles={finalWrapperStyles}
        style={
          {
            '--actions-width':
              areActionsVisible || !showActionsOnHover
                ? `${actionsWidth}px`
                : '0px',
            ...(typeof size === 'number' && { '--size': `${size}px` }),
          } as CSSProperties
        }
      >
        {button}
        <ItemActionProvider type={type} theme={theme}>
          {showActionsOnHover ? (
            <DisplayTransition
              exposeUnmounted
              isShown={isHovered}
              onPhaseChange={(phase) => {
                setAreActionsVisible(phase !== 'unmounted');
              }}
              onToggle={(isShown) => {
                setAreActionsShown(isShown);
              }}
            >
              {({ ref: transitionRef }) => {
                return (
                  <div
                    ref={(node: any) => {
                      actionsRef.current = node;
                      transitionRef(node);
                    }}
                    data-element="Actions"
                  >
                    {actions}
                  </div>
                );
              }}
            </DisplayTransition>
          ) : (
            <div ref={actionsRef} data-element="Actions">
              {actions}
            </div>
          )}
        </ItemActionProvider>
      </ActionsWrapper>
    );
  }

  return button;
});

const _ItemButton = Object.assign(ItemButton, {
  Action: ItemAction,
  Badge: ItemBadge,
});

export { _ItemButton as ItemButton };
export type {
  CubeItemButtonProps as ItemButtonProps,
  CubeItemActionProps as ItemActionProps,
};
