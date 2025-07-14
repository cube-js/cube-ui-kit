import { Key, Node } from '@react-types/shared';
import { IconPointFilled } from '@tabler/icons-react';
import { ReactNode, useRef } from 'react';
import { FocusRing, useMenuItem } from 'react-aria';
import { useHotkeys } from 'react-hotkeys-hook';
import { TreeState } from 'react-stately';

import { CheckIcon } from '../../../icons';
import { Styles } from '../../../tasty';
import { ClearSlots, mergeProps, SlotProvider } from '../../../utils/react';
import { HotKeys } from '../../content/HotKeys';
import { Text } from '../../content/Text';
import { Space } from '../../layout/Space';

import { useMenuContext } from './context';
import { StyledItem } from './styled';

export type MenuSelectionType = 'checkbox' | 'radio';

export interface MenuItemProps<T> {
  item: Node<T>;
  state: TreeState<T>;
  styles?: Styles;
  selectionIcon?: MenuSelectionType;
  isVirtualized?: boolean;
  isDisabled?: boolean;
  onAction?: (key: Key) => void;
  size?: 'small' | 'medium' | (string & {});
}

// Returns icon corresponding to selection type
const getSelectionTypeIcon = (selectionIcon?: MenuSelectionType) => {
  switch (selectionIcon) {
    case 'checkbox':
      return <CheckIcon />;
    case 'radio':
      return <IconPointFilled />;
    default:
      return undefined;
  }
};

// Normalise postfix rendering (string -> Text component)
const getPostfix = (postfix?: ReactNode) =>
  typeof postfix === 'string' ? (
    <Text nowrap color="inherit" data-element="Postfix">
      {postfix}
    </Text>
  ) : (
    postfix
  );

/** @private */
export function MenuItem<T>(props: MenuItemProps<T>) {
  const { item, state, styles, selectionIcon, isVirtualized, onAction, size } =
    props;
  const { onClose, closeOnSelect } = useMenuContext();
  const { rendered, key, props: itemProps } = item;

  // Extract optional keyboard shortcut and CommandMenu-specific props from item props so they are not passed down to DOM elements.
  const { hotkeys, wrapper, keywords, forceMount, ...cleanItemProps } =
    (itemProps || {}) as any;

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

  // Destructure presentation-related props from cleanItemProps so they are not spread onto DOM element
  const {
    postfix,
    description,
    icon,
    mods: itemMods,
    qa: itemQa,
    textValue,
    ...restCleanProps
  } = cleanItemProps as any;

  // Build final postfix: custom postfix or HotKeys hint if provided and no explicit postfix
  const finalPostfix =
    postfix ?? (hotkeys ? <HotKeys>{hotkeys}</HotKeys> : undefined);

  const checkIcon =
    isSelectable && isSelected
      ? getSelectionTypeIcon(selectionIcon)
      : undefined;

  const isVirtualFocused = state.selectionManager.focusedKey === key;

  const mods = {
    ...itemMods,
    focused: isFocused || isVirtualFocused,
    pressed: isPressed,
    selectionIcon: !!selectionIcon,
    selectable: isSelectable,
    selected: isSelected,
    disabled: isDisabled,
  };

  // Register global hotkey if provided
  useHotkeys(
    typeof hotkeys === 'string' ? hotkeys.toLowerCase() : '',
    () => {
      if (!hotkeys) return;
      if (isDisabledKey || isDisabled) return;
      // Simulate a click on the menu item so all existing handlers run
      if (ref.current) {
        ref.current.click();
      }
    },
    {
      enableOnContentEditable: true,
      enabled: !!hotkeys,
      preventDefault: true,
      enableOnFormTags: true,
    },
    [hotkeys, isDisabledKey, isDisabled],
  );

  return (
    <FocusRing>
      <StyledItem
        {...mergeProps(menuItemProps, restCleanProps, {
          qa: itemQa ? itemQa : `MenuItem-${key}`,
          mods,
          styles,
          'aria-disabled': isDisabled || undefined,
          'data-size': size,
        })}
        ref={ref}
      >
        <ClearSlots>
          <SlotProvider
            slots={{
              text: { className: 'itemLabel', ...labelProps },
              end: { className: 'end', ...descriptionProps },
              icon: { className: 'icon' },
              description: { className: 'description', ...descriptionProps },
              keyboard: { className: 'keyboard', ...keyboardShortcutProps },
            }}
          >
            {/* Content structure replicating previous MenuButton */}
            {checkIcon ? (
              <div data-element="ButtonIcon">{checkIcon}</div>
            ) : null}
            {icon ? <div data-element="ButtonIcon">{icon}</div> : null}
            <Space
              gap="1x"
              placeContent="space-between"
              overflow="clip"
              width="100%"
            >
              <Space flow="column" gap="0" width="100%">
                <Text ellipsis color="inherit">
                  {rendered}
                </Text>
                {description ? (
                  <Text
                    nowrap
                    ellipsis
                    data-element="Description"
                    preset="t4"
                    color="#dark-03"
                  >
                    {description}
                  </Text>
                ) : null}
              </Space>
              {finalPostfix && getPostfix(finalPostfix)}
            </Space>
          </SlotProvider>
        </ClearSlots>
      </StyledItem>
    </FocusRing>
  );
}
