import { DOMRef } from '@react-types/shared';
import React, {
  forwardRef,
  ReactElement,
  ReactNode,
  useRef,
  useState,
} from 'react';
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
    header,
    footer,
    headerStyles,
    footerStyles,
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

  // Track popover open/close and capture children order for session
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const cachedChildrenOrder = useRef<ReactNode[] | null>(null);
  const selectionsWhenClosed = useRef<{
    single: string | null;
    multiple: string[];
  }>({ single: null, multiple: [] });

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

  // Function to sort children with selected items on top
  const getSortedChildren = React.useCallback(() => {
    if (!children) return children;

    // If we have cached order, use it
    if (cachedChildrenOrder.current) {
      return cachedChildrenOrder.current;
    }

    // Only sort when the popover opens with existing selections from previous session
    const hadSelectionsWhenClosed =
      selectionMode === 'multiple'
        ? selectionsWhenClosed.current.multiple.length > 0
        : selectionsWhenClosed.current.single !== null;

    if (!isPopoverOpen || !hadSelectionsWhenClosed) {
      return children;
    }

    // Create selected keys set for fast lookup
    const selectedSet = new Set<string>();
    if (selectionMode === 'multiple' && effectiveSelectedKeys) {
      effectiveSelectedKeys.forEach((key) => selectedSet.add(String(key)));
    } else if (selectionMode === 'single' && effectiveSelectedKey != null) {
      selectedSet.add(String(effectiveSelectedKey));
    }

    // Helper function to check if an item is selected
    const isItemSelected = (child: any): boolean => {
      return child?.key != null && selectedSet.has(String(child.key));
    };

    // Helper function to sort children array
    const sortChildrenArray = (childrenArray: ReactNode[]): ReactNode[] => {
      const selected: ReactNode[] = [];
      const unselected: ReactNode[] = [];

      childrenArray.forEach((child: any) => {
        if (!child || typeof child !== 'object') {
          unselected.push(child);
          return;
        }

        // Handle sections - sort items within each section
        if (
          child.type === BaseSection ||
          child.type?.displayName === 'Section'
        ) {
          const sectionChildren = Array.isArray(child.props.children)
            ? child.props.children
            : [child.props.children];

          const selectedItems: ReactNode[] = [];
          const unselectedItems: ReactNode[] = [];

          sectionChildren.forEach((sectionChild: any) => {
            if (
              sectionChild &&
              typeof sectionChild === 'object' &&
              (sectionChild.type === Item ||
                sectionChild.type?.displayName === 'Item')
            ) {
              if (isItemSelected(sectionChild)) {
                selectedItems.push(sectionChild);
              } else {
                unselectedItems.push(sectionChild);
              }
            } else {
              unselectedItems.push(sectionChild);
            }
          });

          // Create new section with sorted children, preserving React element properly
          unselected.push(
            React.cloneElement(child, {
              ...child.props,
              children: [...selectedItems, ...unselectedItems],
            }),
          );
        }
        // Handle regular items
        else if (child.type === Item || child.type?.displayName === 'Item') {
          if (isItemSelected(child)) {
            selected.push(child);
          } else {
            unselected.push(child);
          }
        } else {
          unselected.push(child);
        }
      });

      return [...selected, ...unselected];
    };

    // Sort the children
    const childrenArray = React.Children.toArray(children);
    const sortedChildren = sortChildrenArray(childrenArray);

    // Cache the sorted order when popover opens
    if (isPopoverOpen) {
      cachedChildrenOrder.current = sortedChildren;
    }

    return sortedChildren;
  }, [
    children,
    effectiveSelectedKeys,
    effectiveSelectedKey,
    selectionMode,
    isPopoverOpen,
    hasSelection,
  ]);

  const sortedChildren = getSortedChildren();

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
  const renderTrigger = (state) => {
    // Track popover open/close state to control sorting
    React.useEffect(() => {
      if (state.isOpen !== isPopoverOpen) {
        setIsPopoverOpen(state.isOpen);
        if (!state.isOpen) {
          // Popover closed - clear cached order and save current selections for next session
          cachedChildrenOrder.current = null;
          selectionsWhenClosed.current = {
            single: effectiveSelectedKey,
            multiple: effectiveSelectedKeys || [],
          };
        }
      }
    }, [state.isOpen, isPopoverOpen]);

    return (
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
  };

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
            selectedKey={
              selectionMode === 'single'
                ? effectiveSelectedKey ?? undefined
                : undefined
            }
            selectedKeys={
              selectionMode === 'multiple' ? effectiveSelectedKeys : undefined
            }
            selectionMode={selectionMode}
            validationState={validationState}
            isDisabled={isDisabled}
            stateRef={listStateRef}
            sortSelectedToTop={false}
            mods={{
              popover: true,
            }}
            header={header}
            footer={footer}
            headerStyles={headerStyles}
            footerStyles={footerStyles}
            onSelectionChange={(selection) => {
              // No need to change any flags - children order is cached

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
            {sortedChildren}
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
