import { useObjectRef } from '@react-aria/utils';
import { BaseProps, mergeStyles, tasty } from '@tenphi/tasty';
import { Children, cloneElement, isValidElement } from 'react';
import { useLabel, useToggleButtonGroup } from 'react-aria';
import { useToggleGroupState } from 'react-stately';

import { FieldBaseProps } from '../../../shared/form';
import { mergeProps } from '../../../utils/react/mergeProps';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import { useFieldProps } from '../../form/Form/use-field/use-field-props';
import { wrapWithField } from '../../form/wrapper';
import { JOINED_GROUP_STYLES } from '../RadioGroup/joined-styles';

import { ToggleGroupContext } from './context';
import { CubeToggleGroupItemProps, ToggleGroupItem } from './ToggleGroupItem';

import type { AriaLabelingProps, Key } from '@react-types/shared';
import type { ReactElement, ReactNode, Ref } from 'react';
import type { ToggleGroupState } from 'react-stately';
import type { ToggleGroupSize, ToggleGroupType } from './context';

export interface CubeToggleGroupProps
  extends
    Omit<BaseProps, 'children' | 'role' | 'as'>,
    AriaLabelingProps,
    FieldLayoutStyleProps,
    FieldBaseProps<Key | readonly Key[] | null | undefined> {
  /**
   * `single`: at most one item is on, and pressing it again turns it off.
   * `multiple`: each item toggles on its own.
   * @default 'single'
   */
  selectionMode?: 'single' | 'multiple';
  /** The key of the item that is on, or `null` for none (controlled, `single`). */
  selectedKey?: Key | null;
  /** The key of the item that starts on (uncontrolled, `single`). */
  defaultSelectedKey?: Key | null;
  /** The keys of the items that are on (controlled, `multiple`). */
  selectedKeys?: readonly Key[];
  /** The keys of the items that start on (uncontrolled, `multiple`). */
  defaultSelectedKeys?: readonly Key[];
  /**
   * Called when the selection changes: with a key or `null` in `single` mode,
   * and with an array of keys in `multiple` mode.
   */
  onSelectionChange?: (key: Key | null | Key[]) => void;
  /**
   * The size of every item: the sizes of `Radio.Group type="button"`.
   * @default 'medium'
   */
  size?: ToggleGroupSize;
  /**
   * The look of every item.
   * @default 'outline'
   */
  type?: ToggleGroupType;
  /** `ToggleGroup.Item` elements. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const ToggleGroupElement = tasty({
  qa: 'ToggleGroup',
  styles: mergeStyles(
    {
      display: 'flex',
      flow: 'row',
      placeItems: 'stretch',
      placeContent: 'stretch',
      width: {
        '': 'max-content max-content initial',
        // In a field its style props size, the group fills the field as every
        // other input does.
        'fill-width': 'auto',
      },
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },
    // The row `Radio.Group type="button"` shares (`joined-styles.ts`).
    JOINED_GROUP_STYLES,
  ),
});

/**
 * A direct `ToggleGroup.Item` child takes its key from its React `key`, so a
 * mapped list writes the key once, as `Picker.Item` does. An explicit `id`
 * wins, and anything that is not an item is left alone: an `id` there would
 * reach the DOM.
 */
function keyItems(children: ReactNode) {
  return Children.map(children, (child) => {
    if (
      !isValidElement<CubeToggleGroupItemProps>(child) ||
      child.type !== ToggleGroupItem ||
      child.key == null ||
      child.props.id != null
    ) {
      return child;
    }

    return cloneElement(child, { id: child.key });
  });
}

/** A read-only group keeps its selection: no press or key changes it. */
function keepSelection(state: ToggleGroupState): ToggleGroupState {
  return {
    ...state,
    toggleKey() {},
    setSelected() {},
    setSelectedKeys() {},
  };
}

/**
 * A joined row of toggle buttons that holds a value: one item or none
 * (`selectionMode="single"`), or any number of them (`"multiple"`). For a
 * choice that always has exactly one option, use `Radio.Group type="button"`.
 */
function ToggleGroup(rawProps: CubeToggleGroupProps) {
  const props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) =>
      rawProps.selectionMode === 'multiple'
        ? {
            selectedKeys: (value as readonly Key[] | null | undefined) ?? [],
            onSelectionChange: onChange,
          }
        : {
            selectedKey: (value as Key | null | undefined) ?? null,
            onSelectionChange: onChange,
          },
  });

  const {
    qa,
    id,
    label,
    isDisabled,
    isReadOnly,
    isRequired,
    isInvalid,
    isValid,
    selectionMode = 'single',
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    size = 'medium',
    type = 'outline',
    children,
    ref,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
  } = props;

  const isSingle = selectionMode === 'single';
  const fieldLayout = splitFieldLayout(props);
  const domRef = useObjectRef(ref);

  const baseState = useToggleGroupState({
    selectionMode,
    isDisabled,
    selectedKeys: isSingle
      ? selectedKey === undefined
        ? undefined
        : selectedKey === null
          ? []
          : [selectedKey]
      : selectedKeys,
    defaultSelectedKeys: isSingle
      ? defaultSelectedKey == null
        ? undefined
        : [defaultSelectedKey]
      : defaultSelectedKeys,
    onSelectionChange(keys) {
      if (isSingle) {
        onSelectionChange?.(keys.values().next().value ?? null);
      } else {
        onSelectionChange?.([...keys]);
      }
    },
  });
  const state = isReadOnly ? keepSelection(baseState) : baseState;

  // The field's label names the group; a group is not a labelable element, so
  // it points at the label rather than the label pointing at it.
  const { labelProps, fieldProps } = useLabel({
    id,
    label,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    labelElementType: 'span',
  });

  // `single`: a radiogroup of radios; `multiple`: a toolbar of toggle buttons.
  // Either way the arrow keys move focus between the items, and Tab leaves.
  const { groupProps } = useToggleButtonGroup(
    {
      selectionMode,
      isDisabled,
      'aria-label': fieldProps['aria-label'],
      'aria-labelledby': fieldProps['aria-labelledby'],
    },
    state,
    domRef,
  );

  const group = (
    <ToggleGroupElement
      {...groupProps}
      ref={domRef}
      // The current id: `useLabel` follows it, the form binding may change it.
      id={id}
      qa={qa || 'ToggleGroup'}
      styles={fieldLayout.styles}
      data-input-type="togglegroup"
      aria-describedby={ariaDescribedBy}
      // A radiogroup takes these; a toolbar does not.
      aria-required={isSingle && isRequired ? true : undefined}
      aria-invalid={isSingle && isInvalid ? true : undefined}
      mods={{
        joined: true,
        'fill-width': fieldLayout.fillWidth,
      }}
    >
      <ToggleGroupContext.Provider
        value={{ state, size, type, isInvalid, isValid, isReadOnly }}
      >
        {keyItems(children)}
      </ToggleGroupContext.Provider>
    </ToggleGroupElement>
  );

  return wrapWithField(group, {
    ...props,
    ...fieldLayout.field,
    labelProps: mergeProps(props.labelProps, labelProps),
  });
}

export interface ToggleGroupComponent {
  (props: CubeToggleGroupProps): ReactElement;
  Item: typeof ToggleGroupItem;
  displayName?: string;
}

const _ToggleGroup: ToggleGroupComponent = Object.assign(ToggleGroup, {
  Item: ToggleGroupItem,
  displayName: 'ToggleGroup',
});

// What the legacy `<Field>` reads to pick its default validation trigger.
Object.defineProperty(_ToggleGroup, 'cubeInputType', {
  value: 'ToggleGroup',
  enumerable: false,
  configurable: false,
});

export { _ToggleGroup as ToggleGroup };
