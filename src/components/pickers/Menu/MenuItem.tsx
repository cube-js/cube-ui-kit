import { Key, Node } from '@react-types/shared';
import { useRef } from 'react';
import { FocusRing, useMenuItem } from 'react-aria';
import { useHotkeys } from 'react-hotkeys-hook';
import { TreeState } from 'react-stately';

import { Styles } from '../../../tasty';
import { ClearSlots, mergeProps, SlotProvider } from '../../../utils/react';
import { HotKeys } from '../../content/HotKeys';

import { useMenuContext } from './context';
import { MenuButton, MenuSelectionType } from './MenuButton';
import { StyledItem } from './styled';

export interface MenuItemProps<T> {
  item: Node<T>;
  state: TreeState<T>;
  styles?: Styles;
  selectionIcon?: MenuSelectionType;
  isVirtualized?: boolean;
  isDisabled?: boolean;
  onAction?: (key: Key) => void;
}

/** @private */
export function MenuItem<T>(props: MenuItemProps<T>) {
  const { item, state, styles, selectionIcon, isVirtualized, onAction } = props;
  const { onClose, closeOnSelect } = useMenuContext();
  const { rendered, key, props: itemProps } = item;

  // Extract optional keyboard shortcut from item props so it is not passed down to DOM elements.
  // `keys` is our custom prop for specifying keyboard shortcuts, similar to `postfix` or `icon`.
   
  const { keys: shortcutKeys, ...cleanItemProps } = (itemProps || {}) as any;

  const isSelectable = state.selectionManager.selectionMode !== 'none';
  const isDisabledKey = state.disabledKeys.has(key);

  const ref = useRef<HTMLLIElement>(null);

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
      onClose,
      closeOnSelect,
      isVirtualized,
      onAction,
    },
    state,
    ref,
  );

  const buttonProps = {
    qa: (cleanItemProps as any).qa
      ? (cleanItemProps as any).qa
      : `MenuButton-${key}`,
    mods: {
      ...(cleanItemProps as any).mods,
      focused: isFocused,
      pressed: isPressed,
    },
  };

  // Build extra props for MenuButton: automatically add postfix HotKeys component when shortcut provided
  const extraButtonProps: any = {};
  if (shortcutKeys && !(cleanItemProps as any).postfix) {
    extraButtonProps.postfix = <HotKeys keys={shortcutKeys} />;
  }

  const contents = (
    <MenuButton
      {...mergeProps(cleanItemProps, buttonProps, extraButtonProps)}
      styles={styles}
      selectionIcon={selectionIcon}
      isSelectable={isSelectable}
      isSelected={isSelected}
      isDisabled={isDisabled}
    >
      {rendered}
    </MenuButton>
  );

  // Register global hotkey if provided
  useHotkeys(
    typeof shortcutKeys === 'string' ? shortcutKeys.toLowerCase() : '',
    () => {
      if (!shortcutKeys) return;

      if (isDisabledKey || isDisabled) {
        return;
      }

      // Simulate a click on the menu item so all existing handlers run
      if (ref.current) {
        ref.current.click();
      }
    },
    {
      // Ensure the hotkey is active even when the element is not focused
      enableOnContentEditable: true,
      enabled: !!shortcutKeys,
      preventDefault: true,
    },
    [shortcutKeys, isDisabledKey, isDisabled],
  );

  return (
    <FocusRing>
      <StyledItem
        {...mergeProps(menuItemProps, {
          'aria-disabled': isDisabled || undefined,
        })}
        ref={ref}
        qa={
          (cleanItemProps as any).qa
            ? `MenuItem-${(cleanItemProps as any).qa}`
            : `MenuItem-${key}`
        }
        mods={{
          disabled: isDisabled,
          selected: isSelected,
          selectable: isSelectable,
          focused: isFocused,
          pressed: isPressed,
        }}
      >
        <ClearSlots>
          <SlotProvider
            slots={{
              text: { className: 'itemLabel', ...labelProps },
              end: { className: 'end', ...descriptionProps },
              icon: { className: 'icon', size: 'S' },
              description: { className: 'description', ...descriptionProps },
              keyboard: { className: 'keyboard', ...keyboardShortcutProps },
            }}
          >
            {contents}
          </SlotProvider>
        </ClearSlots>
      </StyledItem>
    </FocusRing>
  );
}
