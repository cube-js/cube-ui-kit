import { FocusableRef } from '@react-types/shared';
import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useFocusWithin, useHover } from 'react-aria';

import { Styles, tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { CubeItemProps, Item } from '../../content/Item';
import { ItemBadge } from '../../content/ItemBadge';
import { DisplayTransition } from '../../helpers';
import { CubeItemActionProps, ItemAction } from '../ItemAction';
import { ItemActionProvider } from '../ItemActionContext';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemButtonProps
  extends Omit<CubeItemProps, 'size'>,
    Omit<CubeUseActionProps, 'as'> {
  actions?: ReactNode;
  size?: Omit<CubeItemProps['size'], 'inline'>;
  wrapperStyles?: Styles;
}

const StyledItem = tasty(Item, {
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
      'size=xsmall': '$size-xs',
      'size=small': '$size-sm',
      'size=medium': '$size-md',
      'size=large': '$size-lg',
      'size=xlarge': '$size-xl',
    },

    Actions: {
      $: '>',
      position: 'absolute',
      inset: '1bw 1bw auto auto',
      display: 'flex',
      gap: '1bw',
      placeItems: 'center',
      placeContent: 'center end',
      pointerEvents: 'auto',
      padding: '0 $side-padding',
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

      // Size for the action buttons
      '$action-size': 'min(max((2x + 2bw), ($size - 1x - 2bw)), (4x - 2bw))',
      // Side padding for the button
      '$side-padding': '(($size - $action-size - 2bw) / 2)',
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
    type = 'neutral',
    theme = 'default',
    onPress,
    // Extract react-aria press callbacks to prevent them from leaking to DOM via rest.
    // These are handled by useButton inside useAction.
    onPressStart: _onPressStart,
    onPressEnd: _onPressEnd,
    onPressChange: _onPressChange,
    onPressUp: _onPressUp,
    actions,
    size = 'medium',
    wrapperStyles,
    showActionsOnHover = false,
    disableActionsFocus = false,
    isDisabled,
    isLoading = false,
    ...rest
  } = allProps as CubeItemButtonProps & {
    as?: 'a' | 'button' | 'div' | 'span';
  };

  // Loading state makes the component disabled (same logic as Item)
  const finalIsDisabled =
    isDisabled === true || (isLoading && isDisabled !== false);

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

  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [hasPressed, setHasPressed] = useState(false);
  const { hoverProps, isHovered } = useHover({});
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  });

  // Watch for data-pressed attribute on any descendant element
  useLayoutEffect(() => {
    const actionsEl = actionsRef.current;

    if (!actionsEl || !showActionsOnHover) return;

    const checkPressed = () => {
      setHasPressed(actionsEl.querySelector('[data-pressed]') !== null);
    };

    const observer = new MutationObserver(checkPressed);

    observer.observe(actionsEl, {
      attributes: true,
      attributeFilter: ['data-pressed'],
      subtree: true,
    });

    checkPressed();

    return () => observer.disconnect();
  }, [areActionsVisible, showActionsOnHover]);

  const shouldShowActions = isHovered || isFocusWithin || hasPressed;

  const { actionProps } = useAction(
    {
      ...(allProps as any),
      htmlType,
      to,
      as,
      mods,
      isDisabled: finalIsDisabled,
    },
    ref,
  );

  const button = (
    <StyledItem
      actions={actions ? true : undefined}
      {...(mergeProps(rest, actionProps) as any)}
      htmlType={actionProps.type}
      type={type}
      theme={theme}
      size={size}
      isLoading={isLoading}
      isDisabled={isDisabled}
    />
  );

  if (actions) {
    return (
      <ActionsWrapper
        {...hoverProps}
        data-size={size}
        mods={{ 'actions-hidden': !areActionsShown && showActionsOnHover }}
        styles={wrapperStyles}
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
        <ItemActionProvider
          type={type}
          theme={theme}
          disableActionsFocus={disableActionsFocus}
          isDisabled={finalIsDisabled}
        >
          {showActionsOnHover ? (
            <DisplayTransition
              exposeUnmounted
              isShown={shouldShowActions}
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
                    {...focusWithinProps}
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
