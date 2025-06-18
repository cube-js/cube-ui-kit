import { Key, Node } from '@react-types/shared';
import { useRef } from 'react';
import { FocusRing, useFocusVisible, useHover, useMenuItem } from 'react-aria';
import { TreeState } from 'react-stately';

import { Styles } from '../../../tasty';
import { ClearSlots, mergeProps, SlotProvider } from '../../../utils/react';

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

  const isSelectable = state.selectionManager.selectionMode !== 'none';
  const isDisabledKey = state.disabledKeys.has(key);

  const ref = useRef<HTMLLIElement>(null);
  const { hoverProps, isHovered } = useHover({ isDisabled: isDisabledKey });

  // Determine if focus should be shown (keyboard modality only)
  const { isFocusVisible } = useFocusVisible({});

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

  // Show focused state only when focus is keyboard-visible
  const isKeyboardFocused = isFocused && isFocusVisible;

  const buttonProps = {
    qa: itemProps.qa ? itemProps.qa : `MenuButton-${key}`,
    mods: {
      ...itemProps.mods,
      hovered: isHovered,
      focused: isKeyboardFocused,
      pressed: isPressed,
    },
  };

  const contents = (
    <MenuButton
      {...mergeProps(itemProps, buttonProps)}
      styles={styles}
      selectionIcon={selectionIcon}
      isSelectable={isSelectable}
      isSelected={isSelected}
      isDisabled={isDisabled}
    >
      {rendered}
    </MenuButton>
  );

  return (
    <FocusRing>
      <StyledItem
        {...mergeProps(menuItemProps, hoverProps)}
        ref={ref}
        data-qa={itemProps.qa ? `MenuItem-${itemProps.qa}` : `MenuItem-${key}`}
        mods={{
          disabled: isDisabled,
          selected: isSelected,
          selectable: isSelectable,
          hovered: isHovered,
          focused: isKeyboardFocused,
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
