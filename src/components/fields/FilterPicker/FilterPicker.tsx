import {
  Children,
  cloneElement,
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FocusScope, useKeyboard } from 'react-aria';
import { Section as BaseSection, Item } from 'react-stately';

import { useWarn } from '../../../_internal/hooks/use-warn';
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
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { Button } from '../../actions';
import { Text } from '../../content/Text';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import {
  CubeFilterListBoxProps,
  FilterListBox,
} from '../FilterListBox/FilterListBox';
import { ListBox } from '../ListBox';

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
  /** Icon to show in the trigger button */
  icon?: ReactElement;
  /** Button styling type */
  type?:
    | 'outline'
    | 'clear'
    | 'primary'
    | 'secondary'
    | 'neutral'
    | (string & {});
  /** Button theme */
  theme?: 'default' | 'special';
  /** Size of the picker component */
  size?: 'small' | 'medium' | 'large';
  /** Children (FilterPicker.Item and FilterPicker.Section elements) */
  children?: ReactNode;
  /** Custom styles for the list box popover */
  listBoxStyles?: Styles;
  /** Custom styles for the popover container */
  popoverStyles?: Styles;
  /** Custom styles for the trigger button */
  triggerStyles?: Styles;
  /** Whether to show checkboxes for multiple selection mode */
  isCheckable?: boolean;

  /**
   * Custom renderer for the summary shown inside the trigger when there is a selection.
   *
   * For `selectionMode="multiple"` the function receives:
   *  - `selectedLabels`: array of labels of the selected items.
   *  - `selectedKeys`: array of keys of the selected items or "all".
   *
   * For `selectionMode="single"` the function receives:
   *  - `selectedLabel`: label of the selected item.
   *  - `selectedKey`: key of the selected item.
   *
   * The function should return a `ReactNode` that will be rendered inside the trigger.
   * Set to `false` to hide the summary text completely.
   */
  renderSummary?:
    | ((args: {
        selectedLabels: string[];
        selectedKeys: 'all' | (string | number)[];
        selectedLabel?: string;
        selectedKey?: string | number | null;
        selectionMode: 'single' | 'multiple';
      }) => ReactNode)
    | false;

  /** Ref to access internal ListBox state (from FilterListBox) */
  listStateRef?: MutableRefObject<any | null>;
  /** Additional modifiers for styling the FilterPicker */
  mods?: Record<string, boolean>;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

const FilterPickerWrapper = tasty({
  qa: 'FilterPicker',
  styles: {
    display: 'grid',
    flow: 'column',
    gridRows: '1sf',
    placeContent: 'stretch',
    placeItems: 'stretch',
  },
});

const TriggerButton = tasty(Button, {
  qa: 'FilterPickerTrigger',
  styles: {
    placeContent: 'stretch',
  },
});

export const FilterPicker = forwardRef(function FilterPicker<T extends object>(
  props: CubeFilterPickerProps<T>,
  ref: ForwardedRef<HTMLElement>,
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
          // Handle "all" selection and array selections
          if (key === 'all') {
            onChange('all');
          } else {
            onChange(key ? (Array.isArray(key) ? key : [key]) : []);
          }
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
    shouldFocusWrap,
    children,
    shouldFlip = true,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    disabledKeys,
    onSelectionChange,
    selectionMode = 'single',
    listStateRef,
    focusOnHover,
    showSelectAll,
    selectAllLabel,
    header,
    footer,
    headerStyles,
    footerStyles,
    triggerStyles,
    allowsCustomValue,
    renderSummary,
    isCheckable,
    ...otherProps
  } = props;

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  // Warn if isCheckable is false in single selection mode
  useWarn(isCheckable === false && selectionMode === 'single', {
    key: ['filterpicker-checkable-single-mode'],
    args: [
      'CubeUIKit: isCheckable=false is not recommended in single selection mode as it may confuse users about selection behavior.',
    ],
  });

  // Internal selection state (uncontrolled scenario)
  const [internalSelectedKey, setInternalSelectedKey] = useState<string | null>(
    defaultSelectedKey ?? null,
  );
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<
    'all' | string[]
  >(defaultSelectedKeys ?? []);

  // Track popover open/close and capture children order for session
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const cachedChildrenOrder = useRef<ReactNode[] | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isControlledSingle = selectedKey !== undefined;
  const isControlledMultiple = selectedKeys !== undefined;

  const effectiveSelectedKey = isControlledSingle
    ? selectedKey
    : internalSelectedKey;
  const effectiveSelectedKeys = isControlledMultiple
    ? selectedKeys
    : internalSelectedKeys;

  // Utility: remove React's ".$" / "." prefixes from element keys so that we
  // can compare them with user-provided keys.
  const normalizeKeyValue = (key: any): string => {
    if (key == null) return '';
    const str = String(key);
    return str.startsWith('.$')
      ? str.slice(2)
      : str.startsWith('.')
        ? str.slice(1)
        : str;
  };

  // ---------------------------------------------------------------------------
  // Map public-facing keys (without React's "." prefix) to the actual React
  // element keys that appear in the collection (which usually have the `.$`
  // or `.` prefix added by React when children are in an array). This ensures
  // that the key we pass to ListBox exactly matches the keys it receives from
  // React Aria, so the initial selection is highlighted correctly.
  // ---------------------------------------------------------------------------

  const findReactKey = useCallback(
    (lookup: any): any => {
      if (lookup == null) return lookup;

      const normalizedLookup = normalizeKeyValue(lookup);
      let foundKey: any = lookup;

      const traverse = (nodes: ReactNode): void => {
        Children.forEach(nodes, (child: any) => {
          if (!child || typeof child !== 'object') return;

          if (child.key != null) {
            if (normalizeKeyValue(child.key) === normalizedLookup) {
              foundKey = child.key;
            }
          }

          if (child.props?.children) {
            traverse(child.props.children);
          }
        });
      };

      if (children) traverse(children);

      return foundKey;
    },
    [children],
  );

  const mappedSelectedKey = useMemo(() => {
    if (selectionMode !== 'single') return null;
    return findReactKey(effectiveSelectedKey);
  }, [selectionMode, effectiveSelectedKey, findReactKey]);

  const mappedSelectedKeys = useMemo(() => {
    if (selectionMode !== 'multiple') return undefined as any;

    if (effectiveSelectedKeys === 'all') return 'all' as const;

    if (Array.isArray(effectiveSelectedKeys)) {
      return (effectiveSelectedKeys as any[]).map((k) => findReactKey(k));
    }

    return effectiveSelectedKeys as any;
  }, [selectionMode, effectiveSelectedKeys, findReactKey]);

  // Given an iterable of keys (array or Set) toggle membership for duplicates
  const processSelectionArray = (iterable: Iterable<any>): string[] => {
    const resultSet = new Set<string>();
    for (const key of iterable) {
      const nKey = String(key);
      if (resultSet.has(nKey)) {
        resultSet.delete(nKey); // toggle off if clicked twice
      } else {
        resultSet.add(nKey); // select
      }
    }
    return Array.from(resultSet);
  };

  // Helper to get selected item labels for display
  const getSelectedLabels = () => {
    if (!children) return [];

    // Handle "all" selection - return all available labels
    if (selectionMode === 'multiple' && effectiveSelectedKeys === 'all') {
      const allLabels: string[] = [];

      const extractAllLabels = (nodes: ReactNode): void => {
        Children.forEach(nodes, (child: any) => {
          if (!child || typeof child !== 'object') return;

          if (child.type === Item) {
            const label =
              child.props.textValue ||
              (typeof child.props.children === 'string'
                ? child.props.children
                : '') ||
              String(child.props.children || '');
            allLabels.push(label);
          }

          if (child.props?.children) {
            extractAllLabels(child.props.children);
          }
        });
      };

      extractAllLabels(children);
      return allLabels;
    }

    const selectedSet = new Set(
      selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
        ? (effectiveSelectedKeys || []).map((k) => normalizeKeyValue(k))
        : effectiveSelectedKey != null
          ? [normalizeKeyValue(effectiveSelectedKey)]
          : [],
    );

    const labels: string[] = [];

    const extractLabels = (nodes: ReactNode): void => {
      Children.forEach(nodes, (child: any) => {
        if (!child || typeof child !== 'object') return;

        if (child.type === Item) {
          if (selectedSet.has(normalizeKeyValue(child.key))) {
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

    const processedKeys = new Set<string>();

    // Modified extractLabels to track which keys we've processed
    const extractLabelsWithTracking = (nodes: ReactNode): void => {
      Children.forEach(nodes, (child: any) => {
        if (!child || typeof child !== 'object') return;

        if (child.type === Item) {
          const childKey = String(child.key);
          if (selectedSet.has(childKey)) {
            const label =
              child.props.textValue ||
              (typeof child.props.children === 'string'
                ? child.props.children
                : '') ||
              String(child.props.children || '');
            labels.push(label);
            processedKeys.add(childKey);
          }
        }

        if (child.props?.children) {
          extractLabelsWithTracking(child.props.children);
        }
      });
    };

    extractLabelsWithTracking(children);

    // Handle custom values that don't have corresponding children
    const selectedKeysArr =
      selectionMode === 'multiple' && effectiveSelectedKeys !== 'all'
        ? (effectiveSelectedKeys || []).map(String)
        : effectiveSelectedKey != null
          ? [String(effectiveSelectedKey)]
          : [];

    // Add labels for any selected keys that weren't processed (custom values)
    selectedKeysArr.forEach((key) => {
      if (!processedKeys.has(normalizeKeyValue(key))) {
        // This is a custom value, use the key as the label
        labels.push(key);
      }
    });

    return labels;
  };

  const selectedLabels = getSelectedLabels();
  const hasSelection = selectedLabels.length > 0;

  // Always keep the latest selection in a ref (with normalized keys) so that we can read it synchronously in the popover close effect.
  const latestSelectionRef = useRef<{
    single: string | null;
    multiple: 'all' | string[];
  }>({
    single: effectiveSelectedKey != null ? String(effectiveSelectedKey) : null,
    multiple:
      effectiveSelectedKeys === 'all'
        ? 'all'
        : (effectiveSelectedKeys ?? []).map(String),
  });

  useEffect(() => {
    latestSelectionRef.current = {
      single:
        effectiveSelectedKey != null ? String(effectiveSelectedKey) : null,
      multiple:
        effectiveSelectedKeys === 'all'
          ? 'all'
          : (effectiveSelectedKeys ?? []).map(String),
    };
  }, [effectiveSelectedKey, effectiveSelectedKeys]);
  const selectionsWhenClosed = useRef<{
    single: string | null;
    multiple: 'all' | string[];
  }>({ single: null, multiple: [] });

  // Capture the initial selection (from defaultSelectedKey(s)) so that
  // the very first popover open can already use it for sorting.
  useEffect(() => {
    selectionsWhenClosed.current = { ...latestSelectionRef.current };
     
  }, []); // run only once on mount

  // Function to sort children with selected items on top
  const getSortedChildren = useCallback(() => {
    if (!children) return children;

    // When the popover is **closed**, reuse the cached order if we have it to
    // avoid unnecessary reflows. If we don't have a cache yet (first open),
    // fall through to compute the sorted order so the very first render is
    // already correct.
    if (!isPopoverOpen && cachedChildrenOrder.current) {
      return cachedChildrenOrder.current;
    }

    // Popover is open – compute (or recompute) the sorted order for this
    // session.

    // Determine if there were any selections when the popover was previously closed.
    const hadSelectionsWhenClosed =
      selectionMode === 'multiple'
        ? selectionsWhenClosed.current.multiple.length > 0
        : selectionsWhenClosed.current.single !== null;

    // Only apply sorting when there were selections in the previous session.
    // We intentionally do not depend on the `isPopoverOpen` flag here because that
    // flag is updated **after** the first render triggered by clicking the
    // trigger button. Relying on it caused a timing issue where the very first
    // render of a freshly-opened popover was unsorted. By removing the
    // `isPopoverOpen` check we ensure items are already sorted during that first
    // render while still maintaining stable order within an open popover thanks
    // to the `cachedChildrenOrder` guard above.

    if (!hadSelectionsWhenClosed) {
      return children;
    }

    // Create selected keys set for fast lookup
    const selectedSet = new Set<string>();
    if (selectionMode === 'multiple') {
      if (selectionsWhenClosed.current.multiple === 'all') {
        // Don't sort when "all" is selected, just return original children
        return children;
      } else {
        (selectionsWhenClosed.current.multiple as string[]).forEach((key) =>
          selectedSet.add(String(key)),
        );
      }
    } else if (
      selectionMode === 'single' &&
      selectionsWhenClosed.current.single != null
    ) {
      selectedSet.add(String(selectionsWhenClosed.current.single));
    }

    // Helper function to check if an item is selected
    const isItemSelected = (child: any): boolean => {
      return (
        child?.key != null && selectedSet.has(normalizeKeyValue(child.key))
      );
    };

    // Helper function to sort children array
    const sortChildrenArray = (childrenArray: ReactNode[]): ReactNode[] => {
      const cloneWithNormalizedKey = (item: any) =>
        cloneElement(item, {
          key: normalizeKeyValue(item.key),
        });

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
              const clonedItem = cloneWithNormalizedKey(sectionChild);

              if (isItemSelected(sectionChild)) {
                selectedItems.push(clonedItem);
              } else {
                unselectedItems.push(clonedItem);
              }
            } else {
              unselectedItems.push(sectionChild);
            }
          });

          // Create new section with sorted children, preserving React element properly
          unselected.push(
            cloneElement(child, {
              ...child.props,
              children: [...selectedItems, ...unselectedItems],
            }),
          );
        }
        // Handle non-section elements (items, dividers, etc.)
        else {
          const clonedItem = cloneWithNormalizedKey(child);

          if (isItemSelected(child)) {
            selected.push(clonedItem);
          } else {
            unselected.push(clonedItem);
          }
        }
      });

      return [...selected, ...unselected];
    };

    // Sort the children
    const childrenArray = Children.toArray(children);
    const sortedChildren = sortChildrenArray(childrenArray);

    // Cache the sorted order when popover opens or when we compute it for the
    // first time before opening.
    if (isPopoverOpen || !cachedChildrenOrder.current) {
      cachedChildrenOrder.current = sortedChildren;
    }

    return sortedChildren;
  }, [
    children,
    effectiveSelectedKeys,
    effectiveSelectedKey,
    selectionMode,
    isPopoverOpen,
  ]);

  // FilterListBox handles custom values internally when allowsCustomValue={true}
  // We only provide the sorted original children
  const finalChildren = getSortedChildren();

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
    } else if (hasSelection && renderSummary === false) {
      return null;
    }

    let content: string | null | undefined = '';

    if (!hasSelection) {
      content = placeholder;
    } else if (selectionMode === 'single') {
      content = selectedLabels[0];
    } else if (effectiveSelectedKeys === 'all') {
      content = selectAllLabel;
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

  const [shouldUpdatePosition, setShouldUpdatePosition] = useState(false);

  // The trigger is rendered as a function so we can access the dialog state
  const renderTrigger = (state) => {
    // Track popover open/close state to control sorting
    useEffect(() => {
      if (state.isOpen !== isPopoverOpen) {
        setIsPopoverOpen(state.isOpen);
        if (!state.isOpen) {
          // Popover just closed – preserve the current sorted order so the
          // fade-out animation keeps its layout unchanged. We only need to
          // record the latest selection for the next session.
          selectionsWhenClosed.current = { ...latestSelectionRef.current };
        }
      }
    }, [state.isOpen, isPopoverOpen]);

    // Add keyboard support for arrow keys to open the popover
    const { keyboardProps } = useKeyboard({
      onKeyDown: (e) => {
        if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !state.isOpen) {
          e.preventDefault();
          state.open();
        }
      },
    });

    setTimeout(() => {
      // Disable the update of the position while the popover is open (with a delay) to avoid jumping
      setShouldUpdatePosition(!state.isOpen);
    }, 100);

    return (
      <TriggerButton
        ref={triggerRef as any}
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
        {...keyboardProps}
        aria-label={`${props['aria-label'] ?? props.label ?? ''}`}
      >
        {renderTriggerContent()}
      </TriggerButton>
    );
  };

  const filterPickerField = (
    <FilterPickerWrapper qa={props.qa || 'FilterPicker'} styles={styles}>
      <DialogTrigger
        type="popover"
        placement="bottom start"
        styles={triggerStyles}
        shouldUpdatePosition={shouldUpdatePosition}
        shouldFlip={shouldFlip}
        isDismissable={true}
      >
        {renderTrigger}
        {(close) => (
          <Dialog display="grid" styles={{ gridRows: '1sf', ...popoverStyles }}>
            <FocusScope restoreFocus>
              <FilterListBox
                autoFocus
                // Pass an aria-label so the internal ListBox is properly labeled and React Aria doesn't warn.
                aria-label={`${props['aria-label'] ?? props.label ?? ''} Picker`}
                selectedKey={
                  selectionMode === 'single' ? mappedSelectedKey : undefined
                }
                selectedKeys={
                  selectionMode === 'multiple' ? mappedSelectedKeys : undefined
                }
                disabledKeys={disabledKeys}
                focusOnHover={focusOnHover}
                shouldFocusWrap={shouldFocusWrap}
                allowsCustomValue={allowsCustomValue}
                selectionMode={selectionMode}
                validationState={validationState}
                isDisabled={isDisabled}
                stateRef={listStateRef}
                isCheckable={isCheckable}
                mods={{
                  popover: true,
                }}
                size={size === 'small' ? 'medium' : size}
                showSelectAll={showSelectAll}
                selectAllLabel={selectAllLabel}
                header={header}
                footer={footer}
                headerStyles={headerStyles}
                footerStyles={footerStyles}
                qa={`${props.qa || 'FilterPicker'}ListBox`}
                onEscape={() => close()}
                onOptionClick={(key) => {
                  // For FilterPicker, clicking the content area should close the popover
                  // in multiple selection mode (single mode already closes via onSelectionChange)
                  if (
                    (selectionMode === 'multiple' && isCheckable) ||
                    key === '__ALL__'
                  ) {
                    close();
                  }
                }}
                onSelectionChange={(selection) => {
                  // No need to change any flags - children order is cached

                  // Update internal state if uncontrolled
                  if (selectionMode === 'single') {
                    if (!isControlledSingle) {
                      setInternalSelectedKey(selection as any);
                    }
                  } else {
                    if (!isControlledMultiple) {
                      let normalized: any = selection;

                      if (selection === 'all') {
                        normalized = 'all';
                      } else if (Array.isArray(selection)) {
                        normalized = processSelectionArray(selection);
                      } else if (
                        selection &&
                        typeof selection === 'object' &&
                        selection instanceof Set
                      ) {
                        normalized = processSelectionArray(selection as any);
                      }

                      setInternalSelectedKeys(normalized as any);
                    }
                  }

                  // Update latest selection ref synchronously
                  if (selectionMode === 'single') {
                    latestSelectionRef.current.single = selection as any;
                  } else {
                    if (selection === 'all') {
                      latestSelectionRef.current.multiple = 'all';
                    } else if (Array.isArray(selection)) {
                      latestSelectionRef.current.multiple = Array.from(
                        new Set(processSelectionArray(selection)),
                      );
                    } else if (
                      selection &&
                      typeof selection === 'object' &&
                      selection instanceof Set
                    ) {
                      latestSelectionRef.current.multiple = Array.from(
                        new Set(processSelectionArray(selection as any)),
                      );
                    } else {
                      latestSelectionRef.current.multiple = selection as any;
                    }
                  }

                  onSelectionChange?.(selection as any);

                  if (selectionMode === 'single') {
                    close();
                  }
                }}
              >
                {finalChildren}
              </FilterListBox>
            </FocusScope>
          </Dialog>
        )}
      </DialogTrigger>
    </FilterPickerWrapper>
  );

  return wrapWithField<Omit<CubeFilterPickerProps<T>, 'children'>>(
    filterPickerField,
    ref as any,
    mergeProps(
      {
        ...props,
        styles: undefined,
      },
      {},
    ),
  );
}) as unknown as (<T>(
  props: CubeFilterPickerProps<T> & { ref?: ForwardedRef<HTMLElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

FilterPicker.Item = ListBox.Item;

FilterPicker.Section = BaseSection;

Object.defineProperty(FilterPicker, 'cubeInputType', {
  value: 'FilterPicker',
  enumerable: false,
  configurable: false,
});
