import React, { Key, useRef } from 'react';
import { useHover } from '@react-aria/interactions';
import { Node } from '@react-types/shared';
import { TreeState } from '@react-stately/tree';
import { FocusRing } from '@react-aria/focus';
import { useMenuItem } from '@react-aria/menu';
import { mergeProps, ClearSlots, SlotProvider } from '../../../utils/react';
import { useMenuContext } from './context';
import { StyledMenuItem } from './styled';
import { MenuButton, MenuSelectionType } from './MenuButton';

export interface MenuItemProps<T> {
  item: Node<T>;
  state: TreeState<T>;
  selectionIcon?: MenuSelectionType;
  isVirtualized?: boolean;
  onAction?: (key: Key) => void;
}

/** @private */
export function MenuItem<T>(props: MenuItemProps<T>) {
  const { item, state, selectionIcon, isVirtualized, onAction } = props;
  const { onClose, closeOnSelect } = useMenuContext();
  const { rendered, key, props: itemProps } = item;

  const isSelectable = state.selectionManager.selectionMode !== 'none';
  const isSelected = state.selectionManager.isSelected(key);
  const isDisabled = state.disabledKeys.has(key);

  const ref = useRef<HTMLLIElement>(null);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { menuItemProps, labelProps, descriptionProps, keyboardShortcutProps } =
    useMenuItem(
      {
        isSelected,
        isDisabled,
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

  let contents =
    typeof rendered === 'string' ? (
      <MenuButton
        {...itemProps}
        selectionIcon={selectionIcon}
        isSelectable={isSelectable}
        isSelected={isSelected}
        isDisabled={isDisabled}
      >
        {rendered}
      </MenuButton>
    ) : (
      rendered
    );

  return (
    <FocusRing>
      <StyledMenuItem
        {...mergeProps(menuItemProps, hoverProps)}
        ref={ref}
        mods={{
          disabled: isDisabled,
          selected: isSelected,
          selectable: isSelectable,
          hovered: isHovered,
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
      </StyledMenuItem>
    </FocusRing>
  );
}
