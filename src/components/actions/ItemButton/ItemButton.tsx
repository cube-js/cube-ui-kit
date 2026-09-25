import { FocusableRef, PressEvent } from '@react-types/shared';
import { Styles, tasty } from '@tenphi/tasty';
import { forwardRef, HTMLAttributes, ReactNode, useMemo, useRef } from 'react';

import { useEvent } from '../../../_internal';
import {
  mergeProps,
  mergeRefs,
  useDismissParentPopover,
} from '../../../utils/react';
import { CubeItemProps, Item } from '../../content/Item';
import { ItemBadge } from '../../content/ItemBadge';
import { CubeItemActionProps, ItemAction } from '../ItemAction';
import { ItemActionsWrapper } from '../ItemActionsWrapper';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemButtonProps
  extends Omit<CubeItemProps, 'size'>,
    Omit<CubeUseActionProps, 'as'> {
  /**
   * The row's trailing controls, rendered beside the button rather than inside
   * it. Pass `null` to keep an empty run — the row reserves no space for it, and
   * the button is not remounted when the actions arrive later.
   */
  actions?: ReactNode;
  size?: Omit<CubeItemProps['size'], 'inline'>;
  wrapperStyles?: Styles;
  /**
   * Extra props spread on the actions run's container, e.g. event handlers.
   * Only meaningful together with `actions`.
   */
  actionsProps?: HTMLAttributes<HTMLDivElement>;
}

const StyledItem = tasty(Item, {
  as: 'button',
  type: 'item',
  theme: 'default',
  styles: {
    recipe: 'reset button',
    placeContent: 'center stretch',
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
    type = 'item',
    theme = 'default',
    onPress,
    // Extract react-aria press callbacks to prevent them from leaking to DOM via rest.
    // These are handled by useButton inside useAction.
    onPressStart: _onPressStart,
    onPressEnd: _onPressEnd,
    onPressChange: _onPressChange,
    onPressUp: _onPressUp,
    actions,
    actionsProps,
    size = 'medium',
    wrapperStyles,
    autoHideActions = false,
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

  // Default: pressing an ItemButton inside an open popover closes that
  // popover. Opt-outs: `data-popover-trigger` on self (applied by
  // FilterPicker / Picker / Select / MenuTrigger for their own triggers) and
  // `data-popover-keep` on self or any ancestor. Modals don't subscribe.
  const dismissParentPopover = useDismissParentPopover();
  const buttonElementRef = useRef<HTMLElement | null>(null);

  const wrappedOnPress = useEvent((e: PressEvent) => {
    onPress?.(e);
    const el = buttonElementRef.current;
    if (!el) return;
    if (el.hasAttribute('data-popover-trigger')) return;
    if (el.closest('[data-popover-keep]')) return;
    dismissParentPopover(el);
  });

  const { actionProps } = useAction(
    {
      ...(allProps as any),
      htmlType,
      to,
      as,
      mods,
      isDisabled: finalIsDisabled,
      onPress: wrappedOnPress,
    },
    ref,
  );

  // Merge the useAction-supplied ref with our internal ref so the dismiss
  // wrapper can read the rendered DOM node at press time.
  const combinedRef = useMemo(
    () => mergeRefs(actionProps.ref as any, buttonElementRef),
    [actionProps.ref],
  );

  // Once a row has had actions it keeps the wrapper, even after they go away.
  // Adding or removing a DOM level around the button remounts it — losing focus,
  // any running transition, and the element every ref in the tree is holding —
  // and a row whose actions come and go with a permission or a loading flag
  // would do that on every flip. The empty run costs nothing: it publishes a
  // width of 0, so the row reserves no space for it.
  //
  // `null` is how a caller asks for the run up front — "there is a run here, it
  // just has nothing in it right now" — so a row that knows its actions are
  // coming never has to remount to receive them. Only `undefined` means the row
  // has no run at all.
  const hasHadActions = useRef(false);

  if (actions !== undefined) {
    hasHadActions.current = true;
  }

  const withWrapper = hasHadActions.current;

  // `isSelected` on a button is a toggle state, so it reads as `aria-pressed`,
  // as `Button` does. Skipped on a link (`to`), for a call site's own `role` (a
  // tab or option wants `aria-selected`), and on a trigger that reports
  // `aria-expanded`, which is its state instead. An explicit value still wins.
  //
  // Set after the spread: `useButton` always returns an `aria-pressed` key,
  // undefined when the caller passed none, which would overwrite it.
  const ariaPressed =
    allProps['aria-pressed'] ??
    (allProps.isSelected != null &&
    actionProps.as !== 'a' &&
    allProps.role == null &&
    allProps['aria-expanded'] == null
      ? allProps.isSelected
      : undefined);

  const renderButton = (
    showActions: boolean,
    skipActionsWidthTransition = false,
  ) => (
    <StyledItem
      // Two different questions. `insideWrapper` is "am I laid out for a
      // sibling run", which stays true so the DOM does not restructure;
      // `actions` is "is there anything in that run to reserve width for",
      // which must go back to false when the run empties — it drives the
      // two-square minimum width and the suffix's padding, and a row that
      // reserved space for nothing would sit wider than it needs to.
      insideWrapper={withWrapper}
      showActions={showActions}
      skipActionsWidthTransition={skipActionsWidthTransition}
      actions={actions ? true : undefined}
      {...(mergeProps(rest, actionProps) as any)}
      aria-pressed={ariaPressed}
      ref={combinedRef}
      data-popover-dismiss=""
      htmlType={actionProps.type}
      type={type}
      theme={theme}
      size={size}
      isLoading={isLoading}
      isDisabled={isDisabled}
    />
  );

  if (withWrapper) {
    return (
      <ItemActionsWrapper
        type={type}
        theme={theme}
        size={size as CubeItemProps['size']}
        mods={mods}
        styles={wrapperStyles}
        actions={actions}
        actionsProps={actionsProps}
        autoHideActions={autoHideActions}
        disableActionsFocus={disableActionsFocus}
        isDisabled={finalIsDisabled}
      >
        {({ showActions, skipActionsWidthTransition }) =>
          renderButton(showActions, skipActionsWidthTransition)
        }
      </ItemActionsWrapper>
    );
  }

  return renderButton(false);
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
