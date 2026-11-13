import { useObjectRef } from '@react-aria/utils';
import { tasty } from '@tenphi/tasty';
import { useHover, useToggleButtonGroupItem } from 'react-aria';

import { useWarn } from '../../../_internal/hooks/use-warn';
import { useFocus } from '../../../utils/react/interactions';
import { mergeProps } from '../../../utils/react/mergeProps';
import { CubeItemProps, Item } from '../../content/Item/Item';
import { getValidationTheme } from '../../form/validation/resolve-validation-props';
import { JOINED_ITEM_STYLES } from '../RadioGroup/joined-styles';

import { useToggleGroupContext } from './context';

import type { Key } from '@react-types/shared';
import type { BasePropsWithoutChildren } from '@tenphi/tasty';
import type { ReactNode, Ref } from 'react';

export interface CubeToggleGroupItemProps
  extends
    Pick<BasePropsWithoutChildren, 'qa' | 'qaVal' | 'styles'>,
    Pick<CubeItemProps, 'icon' | 'tooltip'> {
  /**
   * The item's key in the group's `selectedKey` / `selectedKeys`. A direct
   * child of the group gets it from its React `key`; pass it for an item inside
   * a wrapper component, or for a key that is not a string (a React `key`
   * always is).
   */
  id?: Key;
  /** The visible label. Omit it for an icon-only item, and give `aria-label`. */
  children?: ReactNode;
  /** The accessible name of an icon-only item. */
  'aria-label'?: string;
  /** Whether this item is disabled. The group's `isDisabled` disables them all. */
  isDisabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

// A toggle is a button of the group `Radio.Group type="button"` shares
// (`joined-styles.ts`), so the two draw one look.
const ToggleGroupItemElement = tasty(Item, {
  as: 'button',
  styles: JOINED_ITEM_STYLES,
});

/**
 * One option of a `ToggleGroup`: a toggle button whose key is in the group's
 * selection while it is on.
 */
export function ToggleGroupItem(props: CubeToggleGroupItemProps) {
  const {
    id,
    icon,
    tooltip,
    children,
    isDisabled,
    qa,
    qaVal,
    styles,
    ref,
    'aria-label': ariaLabel,
  } = props;

  const { state, size, type, isInvalid, isValid, isReadOnly } =
    useToggleGroupContext();

  useWarn(id == null, {
    key: 'toggle-group-item-key',
    args: [
      'CubeUIKit: ToggleGroup.Item needs a React `key` (as a direct child of the group) or an `id`, so the group can tell which item is selected.',
    ],
  });

  const domRef = useObjectRef(ref);

  const {
    buttonProps,
    isPressed,
    isSelected,
    isDisabled: isItemDisabled,
  } = useToggleButtonGroupItem(
    { id: id as Key, isDisabled, 'aria-label': ariaLabel },
    state,
    domRef,
  );

  // A read-only toggle takes no hover or press state: a press changes nothing.
  const { hoverProps, isHovered } = useHover({
    isDisabled: isItemDisabled || isReadOnly,
  });
  // Keyboard focus only. The arrow keys move it between the items without
  // toggling them, so the focused item draws its own ring.
  const { focusProps, isFocused } = useFocus(true);

  // The visual `type` below is `Item`'s; the button's own is `htmlType`.
  const { type: _htmlType, ...elementProps } = buttonProps;

  return (
    <ToggleGroupItemElement
      {...mergeProps(elementProps, hoverProps, focusProps)}
      ref={domRef}
      qa={qa || 'ToggleGroupItem'}
      qaVal={qaVal}
      htmlType="button"
      type={type}
      size={size}
      theme={getValidationTheme(
        'default',
        { isInvalid, isValid },
        { includeValid: true },
      )}
      icon={icon}
      tooltip={tooltip}
      isDisabled={isItemDisabled}
      styles={styles}
      // `selected` goes through `mods`, not `isSelected`: `Item` would turn
      // that into `aria-selected`, which a toggle button and a radio don't
      // take. React Aria already sets `aria-pressed` or `aria-checked`.
      mods={{
        joined: true,
        selected: isSelected,
        hovered: isHovered,
        pressed: isPressed && !isReadOnly,
        focused: isFocused,
        readonly: !!isReadOnly,
      }}
    >
      {children}
    </ToggleGroupItemElement>
  );
}
