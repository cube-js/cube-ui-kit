import { Key, Node } from '@react-types/shared';
import { ReactNode, useRef } from 'react';
import { FocusRing, useMenuItem } from 'react-aria';
import { TreeState } from 'react-stately';

import { Styles } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { ItemBase } from '../../content/ItemBase/ItemBase';

import { useMenuContext } from './context';

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

  // Extract optional keyboard shortcut and CommandMenu-specific props from item props so they are not passed down to DOM elements.
  const { hotkeys, wrapper, keywords, forceMount, ...cleanItemProps } =
    (itemProps || {}) as any;

  const isSelectable = state.selectionManager.selectionMode !== 'none';
  const isDisabledKey = state.disabledKeys.has(key);

  const ref = useRef<HTMLLIElement>(null);

  const { menuItemProps, isFocused, isSelected, isPressed, isDisabled } =
    useMenuItem(
      {
        isSelected: state.selectionManager.isSelected(key),
        isDisabled: isDisabledKey,
        'aria-label': item['aria-label'],
        key,
        onClose,
        closeOnSelect,
        isVirtualized,
        onAction,
      },
      state,
      ref,
    );

  // Destructure presentation-related props from cleanItemProps so they are not spread onto DOM element
  const {
    suffix, // Changed from postfix to suffix
    description,
    icon,
    mods: itemMods,
    qa: itemQa,
    textValue,
    tooltip,
    ...restCleanProps
  } = cleanItemProps as any;

  const isVirtualFocused = state.selectionManager.focusedKey === key;

  const mods = {
    ...itemMods,
    focused: isFocused || isVirtualFocused,
    pressed: isPressed,
    selected: isSelected,
    disabled: isDisabled,
  };

  return (
    <FocusRing>
      <ItemBase
        {...mergeProps(menuItemProps, restCleanProps, {
          qa: itemQa ? itemQa : `MenuItem-${key}`,
          mods,
          styles,
          'data-size': size,
          as: 'li',
        })}
        ref={ref}
        icon={icon}
        suffix={suffix}
        description={description}
        hotkeys={hotkeys}
        tooltip={tooltip}
        isSelected={isSelectable ? isSelected : undefined}
        isDisabled={isDisabled}
        size={size === 'small' ? 'small' : 'medium'}
      >
        {rendered}
      </ItemBase>
    </FocusRing>
  );
}
