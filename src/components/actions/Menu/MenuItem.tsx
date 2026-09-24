import { Key, Node } from '@react-types/shared';
import { Styles } from '@tenphi/tasty';
import { KeyboardEvent, useContext, useRef } from 'react';
import { FocusRing, useMenuItem } from 'react-aria';
import { TreeState } from 'react-stately';

import { RightIcon } from '../../../icons/RightIcon';
import { mergeProps } from '../../../utils/react';
import { filterCollectionItemProps } from '../../CollectionItem';
import { Item } from '../../content/Item/Item';

import { useMenuContext } from './context';
import { SubmenuTriggerContext } from './SubmenuTriggerContext';

export type MenuSelectionType = 'checkbox' | 'radio' | 'checkmark';

export interface MenuItemProps<T> {
  item: Node<T>;
  state: TreeState<T>;
  styles?: Styles;
  isVirtualized?: boolean;
  isDisabled?: boolean;
  onAction?: (key: Key) => void;
  size?: 'small' | 'medium' | (string & {});
}

/** @private */
export function MenuItem<T>(props: MenuItemProps<T>) {
  const { item, state, styles, isVirtualized, onAction, size } = props;
  const { onClose, closeOnSelect } = useMenuContext();
  const { rendered, key, props: itemProps } = item;

  // Check if this item is wrapped in a SubmenuTriggerContext
  const submenuContext = useContext(SubmenuTriggerContext);

  // Filter out service props (react-stately and parent-handled props)
  // All remaining props are safe to pass to Item component
  const filteredItemProps = filterCollectionItemProps(itemProps);

  // Extract specific props that need special handling
  const { hotkeys, mods: itemMods, qa: itemQa } = filteredItemProps;

  const isSelectable = state.selectionManager.selectionMode !== 'none';
  const isDisabledKey =
    state.disabledKeys.has(key) || submenuContext?.isDisabled;

  const ref = useRef<HTMLLIElement>(null);

  // Use the triggerRef from submenu context if present
  const elementRef = (submenuContext?.triggerRef ?? ref) as any;

  const {
    menuItemProps,
    labelProps,
    descriptionProps,
    keyboardShortcutProps,
    isFocused,
    isSelected,
    isPressed,
    isDisabled,
  } = useMenuItem(
    {
      isSelected: state.selectionManager.isSelected(key),
      isDisabled: isDisabledKey,
      'aria-label': item['aria-label'],
      key,
      onClose: submenuContext ? undefined : onClose, // Don't close menu for submenu triggers
      closeOnSelect: submenuContext ? false : closeOnSelect, // Don't close on submenu trigger selection
      isVirtualized,
      onAction: submenuContext?.onAction || onAction,
    },
    state,
    elementRef,
  );

  // Selection indicator will be handled by Item component
  const isVirtualFocused = state.selectionManager.focusedKey === key;

  // `mergeProps` chains handlers rather than replacing them, so a handler of
  // the item's own passed to it again runs twice. `onKeyDown` used to be: Enter
  // and Space each click the item, so every keyboard activation fired
  // `onAction` twice. It is taken out here and passed once.
  const { onKeyDown: itemOnKeyDown, ...itemOwnProps } = menuItemProps;
  const onKeyDown = submenuContext?.onKeyDown
    ? (e: KeyboardEvent) => {
        // The submenu goes first; a key it handles is not the item's too.
        submenuContext.onKeyDown?.(e);
        if (!e.defaultPrevented) itemOnKeyDown?.(e);
      }
    : itemOnKeyDown;

  const mods = {
    ...itemMods,
    focused: isFocused || isVirtualFocused,
    pressed: isPressed,
    selected: isSelected,
    disabled: isDisabled,
    submenu: !!submenuContext,
    menuitem: true,
  };

  return (
    <FocusRing>
      <Item
        {...mergeProps({ ...itemOwnProps, onKeyDown }, filteredItemProps, {
          'data-popover-trigger': true,
          qa: itemQa ? itemQa : `MenuItem-${key}`,
          mods,
          styles,
          'data-size': size,
          as: 'li',
          labelProps,
          descriptionProps,
          keyboardShortcutProps,
          'aria-haspopup': submenuContext ? 'menu' : undefined,
          'aria-expanded': submenuContext?.isOpen,
          'data-has-submenu': submenuContext ? true : undefined,
          // Chained after the item's own hover handlers.
          onMouseEnter: submenuContext?.onMouseEnter,
          onMouseLeave: submenuContext?.onMouseLeave,
        })}
        ref={elementRef}
        disableActionsFocus={true}
        rightIcon={submenuContext ? <RightIcon /> : filteredItemProps.rightIcon}
        defaultTooltipPlacement="right"
        isSelected={isSelectable ? isSelected : undefined}
        isDisabled={isDisabled}
        size={size === 'small' ? 'small' : 'medium'}
      >
        {rendered}
      </Item>
    </FocusRing>
  );
}
