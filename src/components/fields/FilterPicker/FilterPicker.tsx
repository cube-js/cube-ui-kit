import { DOMRef } from '@react-types/shared';
import React, { forwardRef, ReactElement, ReactNode, useState } from 'react';
import { Section as BaseSection, Item } from 'react-stately';

import { DirectionIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
} from '../../../tasty';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { Button } from '../../actions';
import { Text } from '../../content/Text';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import {
  CubeFilterListBoxProps,
  FilterListBox,
} from '../FilterListBox/FilterListBox';

import type { FieldBaseProps } from '../../../shared';

export interface CubeFilterPickerProps<T>
  extends Omit<CubeFilterListBoxProps<T>, 'children'>,
    BasePropsWithoutChildren,
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps,
    FieldBaseProps {
  /** Placeholder text when no selection is made */
  placeholder?: string;
  /** Icon to show in the trigger */
  icon?: ReactElement;
  /** Type of button styling */
  type?:
    | 'outline'
    | 'clear'
    | 'primary'
    | 'secondary'
    | 'neutral'
    | (string & {});
  /** Button theme */
  theme?: 'default' | 'special';
  /** Size of the component */
  size?: 'small' | 'medium' | 'large';
  /** Children (FilterListBox.Item and FilterListBox.Section elements) */
  children?: ReactNode;
  /** Maximum number of tags to show before showing count */
  maxTags?: number;
  /** Custom styles for the list box */
  listBoxStyles?: Styles;
  /** Custom styles for the popover */
  popoverStyles?: Styles;

  /**
   * Custom renderer for the summary shown inside the trigger **when there is a selection**.
   *
   * For `selectionMode="multiple"` the function receives:
   *  - `selectedLabels`: array of labels of the selected items.
   *  - `selectedKeys`: array of keys of the selected items.
   *
   * For `selectionMode="single"` the function receives:
   *  - `selectedLabel`: label of the selected item.
   *  - `selectedKey`: key of the selected item.
   *
   * The function should return a `ReactNode` that will be rendered inside the trigger.
   */
  renderSummary?: (args: {
    selectedLabels: string[];
    selectedKeys: (string | number)[];
    selectedLabel?: string;
    selectedKey?: string | number | null;
    selectionMode: 'single' | 'multiple';
  }) => ReactNode;

  /** Optional ref to access internal ListBox state (from FilterListBox) */
  listStateRef?: React.MutableRefObject<any | null>;
  /** Mods for the FilterPicker */
  mods?: Record<string, boolean>;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

export const FilterPicker = forwardRef(function FilterPicker<T extends object>(
  props: CubeFilterPickerProps<T>,
  ref: DOMRef<HTMLDivElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => {
      const fieldProps: any = {};

      if (props.selectionMode === 'multiple') {
        fieldProps.selectedKeys = value || [];
      } else {
        fieldProps.selectedKey = value ?? null;
      }

      fieldProps.onSelectionChange = (key: any) => {
        if (props.selectionMode === 'multiple') {
          onChange(key ? (Array.isArray(key) ? key : [key]) : []);
        } else {
          onChange(Array.isArray(key) ? key[0] : key);
        }
      };

      return fieldProps;
    },
  });

  let {
    qa,
    label,
    extra,
    icon,
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    isDisabled,
    isLoading,
    message,
    mods: externalMods,
    description,
    placeholder,
    size = 'medium',
    styles,
    listBoxStyles,
    popoverStyles,
    type = 'outline',
    theme = 'default',
    labelSuffix,
    children,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    selectionMode = 'multiple',
    listStateRef,
    renderSummary,
    ...otherProps
  } = props;

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  // Internal selection state (uncontrolled scenario)
  const [internalSelectedKey, setInternalSelectedKey] = useState<string | null>(
    defaultSelectedKey ?? null,
  );
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<string[]>(
    defaultSelectedKeys ?? [],
  );

  const isControlledSingle = selectedKey !== undefined;
  const isControlledMultiple = selectedKeys !== undefined;

  const effectiveSelectedKey = isControlledSingle
    ? selectedKey
    : internalSelectedKey;
  const effectiveSelectedKeys = isControlledMultiple
    ? selectedKeys
    : internalSelectedKeys;

  // Helper to get selected item labels for display
  const getSelectedLabels = () => {
    if (!children) return [];

    const selectedSet = new Set(
      selectionMode === 'multiple'
        ? (effectiveSelectedKeys || []).map(String)
        : effectiveSelectedKey != null
          ? [String(effectiveSelectedKey)]
          : [],
    );

    const labels: string[] = [];

    const extractLabels = (nodes: ReactNode): void => {
      React.Children.forEach(nodes, (child: any) => {
        if (!child || typeof child !== 'object') return;

        if (child.type === Item) {
          if (selectedSet.has(String(child.key))) {
            const label =
              child.props.textValue ||
              (typeof child.props.children === 'string'
                ? child.props.children
                : '') ||
              String(child.props.children || '');
            labels.push(label);
          }
        }

        if (child.props?.children) {
          extractLabels(child.props.children);
        }
      });
    };

    extractLabels(children);
    return labels;
  };

  const selectedLabels = getSelectedLabels();
  const hasSelection = selectedLabels.length > 0;

  const renderTriggerContent = () => {
    // When there is a selection and a custom summary renderer is provided – use it.
    if (hasSelection && typeof renderSummary === 'function') {
      if (selectionMode === 'single') {
        return renderSummary({
          selectedLabel: selectedLabels[0],
          selectedKey: effectiveSelectedKey ?? null,
          selectedLabels,
          selectedKeys: effectiveSelectedKeys as any,
          selectionMode: 'single',
        });
      }

      return renderSummary({
        selectedLabels,
        selectedKeys: effectiveSelectedKeys as any,
        selectionMode: 'multiple',
      });
    }

    let content: string | null | undefined = '';

    if (!hasSelection) {
      content = placeholder;
    } else if (selectionMode === 'single') {
      content = selectedLabels[0];
    } else {
      content = selectedLabels.join(', ');
    }

    if (!content) {
      return null;
    }

    return (
      <Text
        ellipsis
        style={{ opacity: hasSelection ? 1 : 'var(--disabled-opacity)' }}
      >
        {content}
      </Text>
    );
  };

  // The trigger is rendered as a function so we can access the dialog state
  const renderTrigger = (state) => (
    <Button
      type={type}
      theme={validationState === 'invalid' ? 'danger' : theme}
      size={size}
      isDisabled={isDisabled}
      isLoading={isLoading}
      mods={{
        placeholder: !hasSelection,
        selected: hasSelection,
        ...externalMods,
      }}
      icon={icon}
      rightIcon={<DirectionIcon to={state.isOpen ? 'top' : 'bottom'} />}
      styles={styles}
      {...otherProps}
    >
      {renderTriggerContent()}
    </Button>
  );

  const filterPickerField = (
    <DialogTrigger
      type="popover"
      placement="bottom start"
      shouldFlip={true}
      isDismissable={true}
    >
      {renderTrigger}
      {(close) => (
        <Dialog display="grid" styles={{ gridRows: '1sf', ...popoverStyles }}>
          <FilterListBox
            autoFocus
            selectedKey={effectiveSelectedKey ?? undefined}
            selectedKeys={
              selectionMode === 'multiple' ? effectiveSelectedKeys : undefined
            }
            defaultSelectedKey={defaultSelectedKey}
            defaultSelectedKeys={defaultSelectedKeys}
            selectionMode={selectionMode}
            validationState={validationState}
            isDisabled={isDisabled}
            stateRef={listStateRef}
            mods={{
              popover: true,
            }}
            onSelectionChange={(selection) => {
              // Update internal state if uncontrolled
              if (selectionMode === 'single') {
                if (!isControlledSingle) {
                  setInternalSelectedKey(selection as any);
                }
              } else {
                if (!isControlledMultiple) {
                  setInternalSelectedKeys(selection as any);
                }
              }

              onSelectionChange?.(selection as any);

              if (selectionMode === 'single') {
                close();
              }
            }}
            onEscape={close}
          >
            {children}
          </FilterListBox>
        </Dialog>
      )}
    </DialogTrigger>
  );

  return wrapWithField<Omit<CubeFilterPickerProps<T>, 'children'>>(
    filterPickerField,
    useCombinedRefs(ref),
    mergeProps(
      {
        ...props,
        styles: undefined,
      },
      {},
    ),
  );
}) as unknown as (<T>(
  props: CubeFilterPickerProps<T> & { ref?: DOMRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

FilterPicker.Item = Item as unknown as (props: {
  description?: ReactNode;
  textValue?: string;
  [key: string]: any;
}) => ReactElement;

FilterPicker.Section = BaseSection;

Object.defineProperty(FilterPicker, 'cubeInputType', {
  value: 'FilterPicker',
  enumerable: false,
  configurable: false,
});
