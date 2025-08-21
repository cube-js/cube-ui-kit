import { CollectionChildren } from '@react-types/shared';
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
import { FocusScope, Key, useKeyboard } from 'react-aria';
import { Section as BaseSection, Item, ListState } from 'react-stately';

import { useWarn } from '../../../_internal/hooks/use-warn';
import { DirectionIcon, LoadingIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  extractStyles,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { generateRandomId } from '../../../utils/random';
import { mergeProps } from '../../../utils/react';
import { useEventBus } from '../../../utils/react/useEventBus';
import { CubeItemButtonProps, ItemButton } from '../../actions';
import { CubeItemBaseProps } from '../../content/ItemBase';
import { Text } from '../../content/Text';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';
import {
  CubeFilterListBoxProps,
  FilterListBox,
} from '../FilterListBox/FilterListBox';
import { ListBox } from '../ListBox';

import type { FieldBaseProps } from '../../../shared';

// Define interface for items that can have keys
interface ItemWithKey {
  key?: string | number;
  id?: string | number;
  textValue?: string;
  children?: ItemWithKey[];
  [key: string]: unknown;
}

export interface CubeFilterPickerProps<T>
  extends Omit<CubeFilterListBoxProps<T>, 'size' | 'tooltip'>,
    Omit<CubeItemBaseProps, 'children' | 'size'>,
    BasePropsWithoutChildren,
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps,
    Omit<FieldBaseProps, 'tooltip'>,
    Pick<
      CubeItemButtonProps,
      'type' | 'theme' | 'icon' | 'rightIcon' | 'prefix' | 'suffix' | 'hotkeys'
    > {
  /** Placeholder text when no selection is made */
  placeholder?: string;
  /** Size of the picker component */
  size?: 'small' | 'medium' | 'large';
  /** Custom styles for the list box popover */
  listBoxStyles?: Styles;
  /** Custom styles for the popover container */
  popoverStyles?: Styles;
  /** Custom styles for the trigger button */
  triggerStyles?: Styles;
  /** Whether to show checkboxes for multiple selection mode */
  isCheckable?: boolean;
  /** Whether to flip the popover placement */
  shouldFlip?: boolean;
  /** Tooltip for the trigger button (separate from field tooltip) */
  triggerTooltip?: string | Omit<CubeTooltipProviderProps, 'children'>;
  /** Description for the trigger button (separate from field description) */
  triggerDescription?: ReactNode;

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
        selectedLabels?: string[];
        selectedKeys?: 'all' | (string | number)[];
        selectedLabel?: string;
        selectedKey?: string | number | null;
        selectionMode?: 'single' | 'multiple';
      }) => ReactNode)
    | false;

  /** Ref to access internal ListBox state (from FilterListBox) */
  listStateRef?: MutableRefObject<ListState<T>>;
  /** Additional modifiers for styling the FilterPicker */
  mods?: Record<string, boolean>;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

const FilterPickerWrapper = tasty({
  qa: 'FilterPicker',
  styles: {
    display: 'inline-grid',
    flow: 'column',
    gridRows: '1sf',
    placeContent: 'stretch',
    placeItems: 'stretch',
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
      const fieldProps: Record<string, unknown> = {};

      if (props.selectionMode === 'multiple') {
        fieldProps.selectedKeys = value || [];
      } else {
        fieldProps.selectedKey = value ?? null;
      }

      fieldProps.onSelectionChange = (key: Key | null | 'all' | Key[]) => {
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
    rightIcon,
    prefix,
    suffix,
    hotkeys,
    triggerTooltip,
    triggerDescription,
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    isDisabled,
    isLoading,
    message,
    mods: externalMods,
    description,
    descriptionPlacement,
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
    selectAllLabel = 'All',
    items,
    header,
    footer,
    headerStyles,
    footerStyles,
    triggerStyles,
    allowsCustomValue,
    renderSummary,
    isCheckable,
    allValueProps,
    customValueProps,
    newCustomValueProps,
    ...otherProps
  } = props;

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  // Generate a unique ID for this FilterPicker instance
  const filterPickerId = useMemo(() => generateRandomId(), []);

  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  // Warn if isCheckable is false in single selection mode
  useWarn(isCheckable === false && selectionMode === 'single', {
    key: ['filterpicker-checkable-single-mode'],
    args: [
      'CubeUIKit: isCheckable=false is not recommended in single selection mode as it may confuse users about selection behavior.',
    ],
  });

  // Internal selection state (uncontrolled scenario)
  const [internalSelectedKey, setInternalSelectedKey] = useState<Key | null>(
    defaultSelectedKey ?? null,
  );
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<
    'all' | Key[]
  >(defaultSelectedKeys ?? []);

  // Track popover open/close and capture children order for session
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const cachedChildrenOrder = useRef<ReactNode[] | null>(null);
  // Cache for sorted items array when using `items` prop
  const cachedItemsOrder = useRef<T[] | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ---------------------------------------------------------------------------
  // Invalidate cached sorting whenever the available options change.
  // This ensures newly provided options are displayed and properly sorted on
  // the next popover open instead of re-using a stale order from a previous
  // session (which caused only the previously selected options to be rendered
  // or the list to appear unsorted).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    cachedChildrenOrder.current = null;
  }, [children]);

  useEffect(() => {
    cachedItemsOrder.current = null;
  }, [items]);

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
  const normalizeKeyValue = (key: Key): string => {
    if (key == null) return '';
    // React escapes "=" as "=0" and ":" as "=2" when it stores keys internally.
    // We strip the possible React prefixes first and then un-escape those sequences
    // so that callers work with the original key values supplied by the user.
    let str = String(key);

    // Remove React array/object key prefixes (".$" or ".") if present.
    if (str.startsWith('.$')) {
      str = str.slice(2);
    } else if (str.startsWith('.')) {
      str = str.slice(1);
    }

    // Un-escape React's internal key encodings.
    return str.replace(/=2/g, ':').replace(/=0/g, '=');
  };

  // ---------------------------------------------------------------------------
  // Map public-facing keys (without React's "." prefix) to the actual React
  // element keys that appear in the collection (which usually have the `.$`
  // or `.` prefix added by React when children are in an array). This ensures
  // that the key we pass to ListBox exactly matches the keys it receives from
  // React Aria, so the initial selection is highlighted correctly.
  // ---------------------------------------------------------------------------

  const findReactKey = useCallback(
    (lookup: Key): Key => {
      if (lookup == null) return lookup;

      const normalizedLookup = normalizeKeyValue(lookup);
      let foundKey: Key = lookup;

      const traverse = (nodes: ReactNode): void => {
        Children.forEach(nodes, (child: ReactNode) => {
          if (!child || typeof child !== 'object') return;
          const element = child as ReactElement;

          if (element.key != null) {
            if (normalizeKeyValue(element.key) === normalizedLookup) {
              foundKey = element.key;
            }
          }

          if (
            element.props &&
            typeof element.props === 'object' &&
            'children' in element.props
          ) {
            traverse((element.props as any).children);
          }
        });
      };

      if (children) traverse(children as ReactNode);

      return foundKey;
    },
    [children],
  );

  const mappedSelectedKey = useMemo(() => {
    if (selectionMode !== 'single') return null;
    return effectiveSelectedKey ? findReactKey(effectiveSelectedKey) : null;
  }, [selectionMode, effectiveSelectedKey, findReactKey]);

  const mappedSelectedKeys = useMemo(() => {
    if (selectionMode !== 'multiple') return undefined;

    if (effectiveSelectedKeys === 'all') return 'all' as const;

    if (Array.isArray(effectiveSelectedKeys)) {
      return (effectiveSelectedKeys as Key[]).map((k) => findReactKey(k));
    }

    return effectiveSelectedKeys;
  }, [selectionMode, effectiveSelectedKeys, findReactKey]);

  // Given an iterable of keys (array or Set) toggle membership for duplicates
  const processSelectionArray = (iterable: Iterable<Key>): string[] => {
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
    // Handle "all" selection - return all available labels
    if (selectionMode === 'multiple' && effectiveSelectedKeys === 'all') {
      const allLabels: string[] = [];

      // Extract from items prop if available
      if (items) {
        const extractFromItems = (itemsArray: unknown[]): void => {
          itemsArray.forEach((item) => {
            if (item && typeof item === 'object') {
              const itemObj = item as ItemWithKey;
              if (Array.isArray(itemObj.children)) {
                // Section-like object
                extractFromItems(itemObj.children);
              } else {
                // Regular item - extract label
                const label =
                  itemObj.textValue ||
                  (itemObj as any).label ||
                  (typeof (itemObj as any).children === 'string'
                    ? (itemObj as any).children
                    : '') ||
                  String(
                    (itemObj as any).children ||
                      itemObj.key ||
                      itemObj.id ||
                      item,
                  );
                allLabels.push(label);
              }
            }
          });
        };

        const itemsArray = Array.isArray(items)
          ? items
          : Array.from(items as Iterable<unknown>);
        extractFromItems(itemsArray);
        return allLabels;
      }

      // Extract from children if available
      if (children) {
        const extractAllLabels = (nodes: ReactNode): void => {
          if (!nodes) return;
          Children.forEach(nodes, (child: ReactNode) => {
            if (!child || typeof child !== 'object') return;
            const element = child as ReactElement;

            if (element.type === Item) {
              const props = element.props as any;
              const label =
                props.textValue ||
                (typeof props.children === 'string' ? props.children : '') ||
                String(props.children || '');
              allLabels.push(label);
            }

            if (
              element.props &&
              typeof element.props === 'object' &&
              'children' in element.props
            ) {
              extractAllLabels((element.props as any).children);
            }
          });
        };

        extractAllLabels(children as ReactNode);
        return allLabels;
      }

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
    const processedKeys = new Set<string>();

    // Extract from items prop if available
    if (items) {
      const extractFromItems = (itemsArray: unknown[]): void => {
        itemsArray.forEach((item) => {
          if (item && typeof item === 'object') {
            const itemObj = item as ItemWithKey;
            if (Array.isArray(itemObj.children)) {
              // Section-like object
              extractFromItems(itemObj.children);
            } else {
              // Regular item - check if selected
              const itemKey = itemObj.key || itemObj.id;
              if (
                itemKey != null &&
                selectedSet.has(normalizeKeyValue(itemKey))
              ) {
                const label =
                  itemObj.textValue ||
                  (itemObj as any).label ||
                  (typeof (itemObj as any).children === 'string'
                    ? (itemObj as any).children
                    : '') ||
                  String((itemObj as any).children || itemKey);
                labels.push(label);
                processedKeys.add(normalizeKeyValue(itemKey));
              }
            }
          }
        });
      };

      const itemsArray = Array.isArray(items)
        ? items
        : Array.from(items as Iterable<unknown>);
      extractFromItems(itemsArray);
    }

    // Extract from children if available (for mixed mode or fallback)
    if (children) {
      const extractLabelsWithTracking = (nodes: ReactNode): void => {
        if (!nodes) return;
        Children.forEach(nodes, (child: ReactNode) => {
          if (!child || typeof child !== 'object') return;
          const element = child as ReactElement;

          if (element.type === Item) {
            const childKey = String(element.key);
            if (selectedSet.has(normalizeKeyValue(childKey))) {
              const props = element.props as any;
              const label =
                props.textValue ||
                (typeof props.children === 'string' ? props.children : '') ||
                String(props.children || '');
              labels.push(label);
              processedKeys.add(normalizeKeyValue(childKey));
            }
          }

          if (
            element.props &&
            typeof element.props === 'object' &&
            'children' in element.props
          ) {
            extractLabelsWithTracking((element.props as any).children);
          }
        });
      };

      extractLabelsWithTracking(children as ReactNode);
    }

    // Handle custom values that don't have corresponding items/children
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
    // If children is not provided or is a render function, return it as-is
    if (!children || typeof children === 'function') return children;

    // Reuse the cached order if we have it. We only want to compute the sorted
    // order once per pop-over opening session. The cache is cleared when the
    // pop-over closes so the next opening can recompute.
    if (cachedChildrenOrder.current) {
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
    const isItemSelected = (child: ReactElement): boolean => {
      return (
        child?.key != null && selectedSet.has(normalizeKeyValue(child.key))
      );
    };

    // Helper function to sort children array
    const sortChildrenArray = (childrenArray: ReactNode[]): ReactNode[] => {
      const cloneWithNormalizedKey = (item: ReactElement) =>
        cloneElement(item, {
          key: item.key ? normalizeKeyValue(item.key) : undefined,
        });

      const selected: ReactNode[] = [];
      const unselected: ReactNode[] = [];

      childrenArray.forEach((child: ReactNode) => {
        if (!child || typeof child !== 'object') {
          unselected.push(child);
          return;
        }

        const element = child as ReactElement;

        // Handle sections - sort items within each section
        if (
          element.type === BaseSection ||
          (element.type as any)?.displayName === 'Section'
        ) {
          const props = element.props as any;
          const sectionChildren = Array.isArray(props.children)
            ? props.children
            : [props.children];

          const selectedItems: ReactNode[] = [];
          const unselectedItems: ReactNode[] = [];

          sectionChildren.forEach((sectionChild: ReactNode) => {
            if (sectionChild && typeof sectionChild === 'object') {
              const sectionElement = sectionChild as ReactElement;
              if (
                sectionElement.type === Item ||
                (sectionElement.type as any)?.displayName === 'Item'
              ) {
                const clonedItem = cloneWithNormalizedKey(sectionElement);

                if (isItemSelected(sectionElement)) {
                  selectedItems.push(clonedItem);
                } else {
                  unselectedItems.push(clonedItem);
                }
              } else {
                unselectedItems.push(sectionChild);
              }
            } else {
              unselectedItems.push(sectionChild);
            }
          });

          // Create new section with sorted children, preserving React element properly
          unselected.push(
            cloneElement(element, {
              ...(element.props as any),
              children: [...selectedItems, ...unselectedItems],
            }),
          );
        }
        // Handle non-section elements (items, dividers, etc.)
        else {
          const clonedItem = cloneWithNormalizedKey(element);

          if (isItemSelected(element)) {
            selected.push(clonedItem);
          } else {
            unselected.push(clonedItem);
          }
        }
      });

      return [...selected, ...unselected];
    };

    // Sort the children
    const childrenArray = Children.toArray(children as ReactNode);
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

  // Compute sorted items array when using `items` prop
  const getSortedItems = useCallback(() => {
    if (!items) return items;

    // Reuse the cached order if we have it. We only compute the sorted array
    // once when the pop-over is opened. Cache is cleared on close.
    if (cachedItemsOrder.current) {
      return cachedItemsOrder.current;
    }

    const selectedSet = new Set<string>();

    const addSelected = (key: Key) => {
      if (key != null) selectedSet.add(String(key));
    };

    if (selectionMode === 'multiple') {
      if (selectionsWhenClosed.current.multiple === 'all') {
        // Do not sort when all selected – keep original order
        return items;
      }
      (selectionsWhenClosed.current.multiple as string[]).forEach(addSelected);
    } else {
      if (selectionsWhenClosed.current.single != null) {
        addSelected(selectionsWhenClosed.current.single);
      }
    }

    if (selectedSet.size === 0) {
      return items;
    }

    // Helpers to extract key from item object
    const getItemKey = (obj: unknown): string | undefined => {
      if (obj == null || typeof obj !== 'object') return undefined;

      const item = obj as ItemWithKey;
      if (item.key != null) return String(item.key);
      if (item.id != null) return String(item.id);
      return undefined;
    };

    const sortArray = (arr: unknown[]): unknown[] => {
      const selectedArr: unknown[] = [];
      const unselectedArr: unknown[] = [];

      arr.forEach((obj) => {
        const item = obj as ItemWithKey;
        if (obj && Array.isArray(item.children)) {
          // Section-like object – keep order, but sort its children
          const sortedChildren = sortArray(item.children);
          unselectedArr.push({ ...item, children: sortedChildren });
        } else {
          const key = getItemKey(obj);
          if (key && selectedSet.has(key)) {
            selectedArr.push(obj);
          } else {
            unselectedArr.push(obj);
          }
        }
      });

      return [...selectedArr, ...unselectedArr];
    };

    const itemsArray = Array.isArray(items)
      ? items
      : Array.from(items as Iterable<unknown>);
    const sorted = sortArray(itemsArray) as T[];

    if (isPopoverOpen || !cachedItemsOrder.current) {
      cachedItemsOrder.current = sorted;
    }

    return sorted;
  }, [
    items,
    selectionMode,
    isPopoverOpen,
    selectionsWhenClosed.current.multiple,
    selectionsWhenClosed.current.single,
  ]);

  const finalItems = getSortedItems();

  // FilterListBox handles custom values internally when allowsCustomValue={true}
  // We provide sorted children (if any) and sorted items
  const finalChildren = getSortedChildren();

  const renderTriggerContent = () => {
    // When there is a selection and a custom summary renderer is provided – use it.
    if (hasSelection && typeof renderSummary === 'function') {
      if (selectionMode === 'single') {
        return renderSummary({
          selectedLabel: selectedLabels[0],
          selectedKey: effectiveSelectedKey ?? null,
          selectedLabels,
          selectedKeys: effectiveSelectedKeys,
          selectionMode: 'single',
        });
      }

      return renderSummary({
        selectedLabels,
        selectedKeys: effectiveSelectedKeys,
        selectionMode: 'multiple',
      });
    } else if (hasSelection && renderSummary === false) {
      return null;
    }

    let content: ReactNode = '';

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
    // Listen for other menus opening and close this one if needed
    useEffect(() => {
      const unsubscribe = on('menu:open', (data: { menuId: string }) => {
        // If another menu is opening and this FilterPicker is open, close this one
        if (data.menuId !== filterPickerId && state.isOpen) {
          state.close();
        }
      });

      return unsubscribe;
    }, [on, filterPickerId, state]);

    // Emit event when this FilterPicker opens
    useEffect(() => {
      if (state.isOpen) {
        emit('menu:open', { menuId: filterPickerId });
      }
    }, [state.isOpen, emit, filterPickerId]);

    // Track popover open/close state to control sorting
    useEffect(() => {
      if (state.isOpen !== isPopoverOpen) {
        setIsPopoverOpen(state.isOpen);
        if (!state.isOpen) {
          // Popover just closed – record the latest selection for the next opening
          // and clear the cached order so the next session can compute afresh.
          selectionsWhenClosed.current = { ...latestSelectionRef.current };
          cachedChildrenOrder.current = null;
          cachedItemsOrder.current = null;
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

    useEffect(() => {
      // Disable the update of the position while the popover is open (with a delay) to avoid jumping
      setShouldUpdatePosition(!state.isOpen);
    }, [state.isOpen]);

    return (
      <ItemButton
        ref={triggerRef as any}
        data-popover-trigger
        type={type}
        theme={validationState === 'invalid' ? 'danger' : theme}
        size={size}
        isDisabled={isDisabled || isLoading}
        mods={{
          placeholder: !hasSelection,
          selected: hasSelection,
          ...externalMods,
        }}
        icon={icon}
        rightIcon={
          isLoading ? (
            <LoadingIcon />
          ) : rightIcon !== undefined ? (
            rightIcon
          ) : (
            <DirectionIcon to={state.isOpen ? 'top' : 'bottom'} />
          )
        }
        prefix={prefix}
        suffix={suffix}
        hotkeys={hotkeys}
        tooltip={triggerTooltip}
        description={triggerDescription}
        descriptionPlacement={descriptionPlacement}
        styles={styles}
        {...keyboardProps}
        aria-label={`${props['aria-label'] ?? props.label ?? ''}`}
      >
        {renderTriggerContent()}
      </ItemButton>
    );
  };

  const filterPickerField = (
    <FilterPickerWrapper
      qa={props.qa || 'FilterPicker'}
      styles={styles}
      {...filterBaseProps(otherProps, { eventProps: true })}
    >
      <DialogTrigger
        type="popover"
        placement="bottom start"
        styles={triggerStyles}
        shouldUpdatePosition={shouldUpdatePosition}
        shouldFlip={shouldFlip}
        isDismissable={true}
        shouldCloseOnInteractOutside={(el) => {
          const menuTriggerEl = el.closest('[data-popover-trigger]');
          // If no menu trigger was clicked, allow closing
          if (!menuTriggerEl) return true;
          // If the same trigger that opened this popover was clicked, allow closing (toggle)
          if (menuTriggerEl === (triggerRef as any)?.current) return true;
          // Otherwise, don't close here. Let the event bus handle closing when the other opens.
          return false;
        }}
      >
        {renderTrigger}
        {(close) => (
          <Dialog display="grid" styles={{ gridRows: '1sf', ...popoverStyles }}>
            <FocusScope restoreFocus>
              <FilterListBox
                autoFocus
                items={items ? (finalItems as typeof props.items) : undefined}
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
                isLoading={isLoading}
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
                allValueProps={allValueProps}
                customValueProps={customValueProps}
                newCustomValueProps={newCustomValueProps}
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
                      setInternalSelectedKey(selection as Key | null);
                    }
                  } else {
                    if (!isControlledMultiple) {
                      let normalized: 'all' | Key[] = selection as
                        | 'all'
                        | Key[];

                      if (selection === 'all') {
                        normalized = 'all';
                      } else if (Array.isArray(selection)) {
                        normalized = processSelectionArray(selection);
                      } else if (
                        selection &&
                        typeof selection === 'object' &&
                        (selection as any) instanceof Set
                      ) {
                        normalized = processSelectionArray(
                          selection as Set<Key>,
                        );
                      }

                      setInternalSelectedKeys(normalized);
                    }
                  }

                  // Update latest selection ref synchronously
                  if (selectionMode === 'single') {
                    latestSelectionRef.current.single =
                      selection != null ? String(selection) : null;
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
                      (selection as any) instanceof Set
                    ) {
                      latestSelectionRef.current.multiple = Array.from(
                        new Set(processSelectionArray(selection as Set<Key>)),
                      );
                    } else {
                      latestSelectionRef.current.multiple =
                        selection === 'all'
                          ? 'all'
                          : Array.isArray(selection)
                            ? selection.map(String)
                            : [];
                    }
                  }

                  onSelectionChange?.(selection);

                  if (selectionMode === 'single') {
                    close();
                  }
                }}
              >
                {
                  (children
                    ? (finalChildren as CollectionChildren<T>)
                    : undefined) as CollectionChildren<T>
                }
              </FilterListBox>
            </FocusScope>
          </Dialog>
        )}
      </DialogTrigger>
    </FilterPickerWrapper>
  );

  return wrapWithField<Omit<CubeFilterPickerProps<T>, 'children' | 'tooltip'>>(
    filterPickerField,
    ref as any,
    mergeProps(
      {
        ...props,
        children: undefined,
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
