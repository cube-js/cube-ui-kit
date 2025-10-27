import { Key, Node } from '@react-types/shared';
import { KeyboardEvent, useContext, useRef } from 'react';
import { FocusRing, useMenuItem } from 'react-aria';
import { TreeState } from 'react-stately';

import { RightIcon } from '../../../icons';
import { Styles } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
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

  // Extract optional keyboard shortcut and CommandMenu-specific props from item props so they are not passed down to DOM elements.
  const { hotkeys, wrapper, keywords, forceMount, ...cleanItemProps } =
    (itemProps || {}) as any;

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

  // Destructure presentation-related props from cleanItemProps so they are not spread onto DOM element
  const {
    suffix,
    description,
    icon,
    rightIcon,
    prefix,
    tooltip,
    actions,
    mods: itemMods,
    qa: itemQa,
    textValue,
    ...restCleanProps
  } = cleanItemProps as any;

  // Selection indicator will be handled by Item component
  const isVirtualFocused = state.selectionManager.focusedKey === key;

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
        {...mergeProps(menuItemProps, restCleanProps, {
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
          onKeyDown: submenuContext?.onKeyDown
            ? (e: KeyboardEvent) => {
                // Call submenu handler first, if it prevents default, don't call the original
                submenuContext.onKeyDown?.(e);
                if (!e.defaultPrevented && menuItemProps.onKeyDown) {
                  menuItemProps.onKeyDown(e);
                }
              }
            : menuItemProps.onKeyDown,
          onMouseEnter:
            submenuContext?.onMouseEnter || menuItemProps.onMouseEnter,
          onMouseLeave:
            submenuContext?.onMouseLeave || menuItemProps.onMouseLeave,
        })}
        ref={elementRef}
        icon={icon}
        rightIcon={submenuContext ? <RightIcon /> : rightIcon}
        prefix={prefix}
        suffix={suffix}
        description={description}
        hotkeys={hotkeys}
        tooltip={tooltip}
        actions={actions}
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
