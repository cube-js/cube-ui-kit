import { useHover } from '@react-aria/interactions';
import { IconMinus } from '@tabler/icons-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  mergeStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  CSSProperties,
  DOMAttributes,
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import {
  AriaListBoxProps,
  DropTarget,
  mergeProps as mergeAriaProps,
  useDraggableItem,
  useDropIndicator,
  useFocusRing,
  useKeyboard,
  useListBox,
  useListBoxSection,
  useOption,
} from 'react-aria';
import {
  Section as BaseSection,
  DraggableCollectionState,
  DroppableCollectionState,
  ListProps,
  useListState,
} from 'react-stately';

import { useWarn } from '../../../_internal/hooks/use-warn';
import { useI18n } from '../../../i18n';
import { CheckIcon } from '../../../icons/CheckIcon';
import { GripVerticalIcon } from '../../../icons/GripVerticalIcon';
import { Icon } from '../../../icons/Icon';
import { SIZE_NAME_TO_KEY, SIZES } from '../../../tokens';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { allowOverlayKeysToPropagate } from '../../../utils/react/overlayKeyPropagation';
import { extractStyles } from '../../../utils/styles';
// Import Menu styled components for header and footer
import {
  StyledDivider,
  StyledFooter,
  StyledHeader,
  StyledSectionHeading,
} from '../../actions/Menu/styled';
import {
  CollectionItem,
  CubeCollectionItemProps,
  filterCollectionItemProps,
  filterSelectionItemProps,
  getValueSelectionState,
} from '../../CollectionItem';
import { Item } from '../../content/Item/Item';
import {
  getValidationMods,
  getValidationTheme,
  useFieldProps,
  wrapWithField,
} from '../../form';
import { createMockDragState } from '../../shared/DraggableCollection';
import { useOptionOriginPress } from '../option-origin-press';

import { DraggableListBox } from './DraggableListBox';

import type { SelectionManager } from '@react-stately/selection';
import type {
  Collection,
  CollectionBase,
  Node as CollectionNode,
  Key,
} from '@react-types/shared';
import type { FieldBaseProps } from '../../../shared';

const ListBoxWrapperElement = tasty({
  qa: 'ListBox',
  styles: {
    display: 'grid',
    gridColumns: '1sf',
    gridRows: 'max-content max-content max-content 1sf max-content',
    flow: 'column',
    gap: 0,
    position: 'relative',
    radius: {
      '': '1cr',
      '[data-shape="popover"]': '(1cr - 1bw)',
      '[data-shape="plain"]': '0',
    },
    color: '#dark-02',
    transition: 'theme',
    outline: {
      '': '#purple-03.0',
      'invalid & focused': '#danger.50',
      focused: '#purple-03',
    },
    border: {
      '': true,
      focused: '#primary-text',
      valid: '#success-text.50',
      invalid: '#danger-text.50',
      disabled: true,
      '[data-shape="plain"] | [data-shape="popover"] | searchable': false,
    },
  },
});

const ListElement = tasty({
  as: 'ul',
  styles: {
    // The space between options. Set from `listGap`, which also hands the
    // same number to the virtualizer.
    '$list-gap': '1bw',
    display: 'block',
    // The space kept below the last option. Padding, so `listStyles` can take
    // it away, and outside the content box, where a virtualized list sets its
    // own height.
    padding: {
      '': '.5x bottom',
      // Empty, the list sits under its empty label and takes no space.
      empty: 0,
    },
    listStyle: 'none',
    boxSizing: 'content-box',
    margin: {
      '': '.5x .5x 0 .5x',
      '[data-shape="plain"] | empty': '0',
    },
    height: 'max-content',
  },
});

// NEW: dedicated scroll container for ListBox
const ListBoxScrollElement = tasty({
  as: 'div',
  styles: {
    display: 'grid',
    gridColumns: '1sf',
    gridRows: '1sf',
    overflow: 'auto',
    scrollbar: 'styled',
  },
});

// Create an extended Item for ListBox options with 'all' modifier support
const ListBoxItem = tasty(Item, {
  as: 'li',
  disableActionsFocus: true,
  styles: {
    display: 'grid',
    margin: {
      '': '$list-gap bottom',
      // Mid-drag the last option is followed by a drop indicator, which takes
      // the gap back (`ListBoxDropIndicatorElement`). Not `:has(~ …)`: see
      // AGENTS.md → Styling.
      ':last-child': '0',
      all: '.5x',
    },
    // Inside the option: options sit a hairline apart, so a ring outside one
    // would cover its neighbour, and the scroll box would clip it at the edges.
    outlineOffset: '-1bw',
    Icon: {
      cursor: {
        draggable: 'grab',
      },
      opacity: {
        gripIcon: '.4',
        'gripIcon & hovered': '1',
      },
      transition: {
        draggable: 'opacity',
      },
    },
  },
});

// Horizontal drop indicator for DnD reordering
const ListBoxDropIndicatorElement = tasty({
  as: 'li',
  styles: {
    zIndex: 10,
    position: 'relative',
    pointerEvents: 'none',
    height: 0,
    // After the last option: cancels the `$list-gap` that option keeps while
    // it is not the last child, so the list holds its height mid-drag. An
    // `optionStyles` margin replaces that gap, and this then overshoots.
    margin: {
      '': 0,
      ':last-child': '(-1 * $list-gap) top',
    },
    opacity: {
      '': 0,
      'drop-target': 1,
    },

    Indicator: {
      $: '>',
      position: 'absolute',
      left: '.5x',
      right: '.5x',
      // A marker line in device pixels, not a border.
      '$drop-indicator-size': '2px',
      // Centred in the gap between two options, or on the edge of the list.
      top: {
        '': '($drop-indicator-size / -2 - $list-gap / 2)',
        ':first-child | :last-child': '($drop-indicator-size / -2)',
      },
      height: '$drop-indicator-size',
      fill: '#primary',
      radius: 'round',
    },
  },
});

const SectionWrapperElement = tasty({
  as: 'li',
  styles: {
    display: 'block',
  },
});

const SectionListElement = tasty({
  qa: 'ListBoxSectionList',
  as: 'ul',
  styles: {
    display: 'flex',
    gap: '0',
    flow: 'column',
    margin: '0',
    padding: '0',
    listStyle: 'none',
  },
});

// Checkbox component for multiple selection options
const ListBoxCheckbox = tasty({
  as: 'div',
  styles: {
    display: 'grid',
    placeItems: 'center',
    radius: '.5r',
    width: '(2x - 2bw)',
    height: '(2x - 2bw)',
    flexShrink: 0,
    transition: 'theme',
    opacity: {
      '': 0,
      'selected | indeterminate | hovered | focused': 1,
    },
    fill: {
      '': '#surface',
      'selected | indeterminate': '#primary',
      'invalid & !(selected | indeterminate)': '#surface',
      'invalid & (selected | indeterminate)': '#danger',
      disabled: '#dark.12',
    },
    color: {
      '': '#clear',
      'selected | indeterminate': '#white',
    },
    border: {
      '': '#dark.30',
      invalid: '#danger',
      'disabled | ((selected | indeterminate) & !invalid)': '#clear',
    },
  },
});

const ListBoxCheckboxWrapper = tasty({
  as: 'div',
  styles: {
    display: 'grid',
    placeItems: 'center',
    placeContent: 'center',
    cursor: '$pointer',
    placeSelf: 'stretch',
  },
});

function renderCheckboxIcon({
  isSelected,
  isDisabled,
  isFocused,
  isHovered,
  isInvalid,
  isValid,
}: {
  isSelected: boolean;
  isDisabled: boolean;
  isFocused: boolean;
  isHovered: boolean;
  isInvalid?: boolean;
  isValid?: boolean;
}) {
  const mods = {
    selected: isSelected,
    disabled: isDisabled,
    focused: isFocused,
    hovered: isHovered,
    ...getValidationMods({ isInvalid, isValid }),
  };

  return (
    <ListBoxCheckboxWrapper data-element="CheckboxWrapper" mods={mods}>
      <ListBoxCheckbox data-element="Checkbox" mods={mods}>
        <CheckIcon size={12} stroke={3} />
      </ListBoxCheckbox>
    </ListBoxCheckboxWrapper>
  );
}

export interface CubeListBoxProps<T>
  extends
    Omit<
      AriaListBoxProps<T>,
      'autoFocus' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'
    >,
    CollectionBase<T>,
    FieldBaseProps<Key | readonly Key[] | null | undefined>,
    BasePropsWithoutChildren,
    // The style props `PROP_STYLES` extracts at runtime and the docs list;
    // without these a `height` or `width` worked but failed to type-check.
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps {
  /** Custom styles for the list container */
  listStyles?: Styles;
  /** Custom styles for individual options */
  optionStyles?: Styles;
  /**
   * Substring to highlight within each option's (text) children. Typically the
   * current search query. Matching is case-insensitive.
   */
  optionHighlight?: string;
  /** Custom styles for section containers */
  sectionStyles?: Styles;
  /** Custom styles for section headings */
  headingStyles?: Styles;
  /**
   * Space between options, in pixels. Defaults to a hairline (`1bw`). It
   * applies to flat, virtualized, sectioned and reorderable lists alike.
   */
  listGap?: number;
  /** Whether the ListBox is disabled */
  isDisabled?: boolean;
  /** The selected key in controlled single selection mode */
  selectedKey?: Key | null;
  /** The selected keys in controlled multiple selection mode. Use "all" to select all items or an array of keys */
  selectedKeys?: 'all' | Key[];
  /** The default selected key in uncontrolled single selection mode */
  defaultSelectedKey?: Key | null;
  /** The default selected keys in uncontrolled multiple selection mode. Use "all" to select all items or an array of keys */
  defaultSelectedKeys?: 'all' | Key[];
  /** Callback fired when selection changes */
  onSelectionChange?: (key: Key | null | 'all' | Key[]) => void;
  /** The selection mode of the ListBox */
  selectionMode?: 'single' | 'multiple';
  /** Ref for accessing the list DOM element */
  listRef?: RefObject<HTMLUListElement | null>;
  /** Whether to disallow empty selection */
  disallowEmptySelection?: boolean;
  /**
   * Whether `onSelectionChange` should fire even when the new selection equals the
   * current one (e.g. re-selecting the already-selected item with `disallowEmptySelection`).
   * React Stately suppresses such duplicate events by default. Popover-based wrappers
   * (Picker, FilterPicker) rely on the duplicate event to close the popover on re-select.
   */
  allowDuplicateSelectionEvents?: boolean;
  /** Whether to wrap focus when reaching the end of the list */
  shouldFocusWrap?: boolean;
  /**
   * Ref to access the internal ListState instance.
   * This allows parent components to access selection state and other list functionality.
   */
  stateRef?: RefObject<any | null>;

  /**
   * Whether moving the pointer over an option will move DOM focus to that option.
   * Leave it off for components that keep DOM focus outside (e.g. searchable FilterListBox).
   * Defaults to false.
   */
  focusOnHover?: boolean;
  /** Custom header content displayed above the list */
  header?: ReactNode;
  /** Custom footer content displayed below the list */
  footer?: ReactNode;
  /** Custom styles for the header */
  headerStyles?: Styles;
  /** Custom styles for the footer */
  footerStyles?: Styles;
  /** Additional modifiers for styling the ListBox */
  mods?: Record<string, boolean>;
  /** Size variant of the ListBox */
  size?: 'small' | 'medium' | 'large';

  /**
   * When `true`, clicking an already-selected item keeps it selected instead of toggling it off,
   * and `onSelectionChange` reports that item again. Applies in single selection mode, whether
   * `selectionMode` is set or left to its default. Useful when embedding ListBox inside
   * components like ComboBox.
   */
  disableSelectionToggle?: boolean;

  /**
   * Whether to use virtual focus for keyboard navigation.
   * When true, DOM focus stays outside individual option elements (useful for searchable lists).
   * Defaults to false for backward compatibility.
   */
  shouldUseVirtualFocus?: boolean;

  /**
   * For a list whose focused option is moved from an input outside it, as
   * FilterListBox's search input does: whether focus is within that input's
   * component. The focused option is marked only while it is `true`. Unset, the
   * list's own focus decides, and with `shouldUseVirtualFocus` the focused
   * option is always marked.
   */
  isFocusWithin?: boolean;

  /**
   * Callback fired when the user presses Escape key.
   * When provided, this prevents React Aria's default Escape behavior (selection reset).
   */
  onEscape?: () => void;

  /**
   * Whether to show checkboxes for multiple selection mode.
   * This adds a checkbox icon to the left of each option.
   */
  isCheckable?: boolean;

  /**
   * Callback fired when an option is clicked but not on the checkbox area.
   * Used by FilterPicker to close the popover on non-checkbox clicks.
   */
  onOptionClick?: (key: Key) => void;

  /**
   * Whether to show the "Select All" checkbox in multiple selection mode.
   * It sits above the list as its own Tab stop and shows checked once every
   * selectable item the list shows is selected. A press selects every item
   * (`'all'`), or once checked takes the items shown out of the selection.
   * Under a `filter` it acts only on the items shown, and selected items the
   * filter hides stay selected.
   */
  showSelectAll?: boolean;

  /**
   * Label for the "Select All" option. Defaults to "Select All".
   */
  selectAllLabel?: ReactNode;

  /**
   * Props to apply to the "Select All" option.
   */
  allValueProps?: Partial<CubeCollectionItemProps<T>>;

  /**
   * Filter function to apply to the collection nodes.
   * Takes an iterable of nodes and returns a filtered iterable.
   * Useful for implementing search/filter functionality.
   */
  filter?: (nodes: Iterable<any>) => Iterable<any>;

  /**
   * Label to display when the list is empty (no items available).
   * Defaults to "No items".
   */
  emptyLabel?: ReactNode;

  /**
   * Visual shape of the ListBox styling.
   * - `card` (default): Standard card styling with border and margin
   * - `plain`: No border, no margin, no radius - suitable for embedded use
   * - `popover`: No border, but keeps margin and radius - suitable for overlay use
   * Defaults to 'card'.
   */
  shape?: 'card' | 'plain' | 'popover';

  /**
   * Enable drag-and-drop reordering of list items.
   * When enabled, virtualization is disabled and each item gets a drag handle.
   * @default false
   */
  isReorderable?: boolean;

  /**
   * Callback when items are reordered via drag-and-drop.
   * Called with the new array of item keys in their new order.
   */
  onReorder?: (newOrder: string[]) => void;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

/** A collection with no options, for a list state that isn't needed. */
const NO_OPTIONS: ListProps<any> = { children: [], selectionMode: 'none' };

/**
 * The "Select All" row: a tri-state checkbox above the list rather than an
 * option in it, since it acts on the options instead of being one. Being
 * outside the listbox keeps the listbox's children to options and groups, and
 * makes it a Tab stop of its own, which a list in virtual focus (searchable
 * lists) could not offer as an option.
 */
const SelectAllOption = ({
  label,
  isSelected,
  isIndeterminate,
  isDisabled,
  isCheckable,
  size = 'medium',
  onClick,
  focusProps,
  allValueProps = {},
}: {
  label?: ReactNode;
  isSelected: boolean;
  isIndeterminate: boolean;
  isDisabled?: boolean;
  isCheckable?: boolean;
  size?: 'small' | 'medium' | 'large';
  /** `propagate` is false for a press on the checkbox mark, which only toggles */
  onClick: (propagate: boolean) => void;
  /** Tells the list when the row has focus */
  focusProps: DOMAttributes<HTMLElement>;
  allValueProps?: Partial<CubeCollectionItemProps<any>>;
}) => {
  const { t } = useI18n();
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps: focusRingProps, isFocusVisible } = useFocusRing();
  const resolvedLabel =
    label === '' || label === undefined || label === null
      ? t('listBox.selectAll', 'Select All')
      : label;

  const markIcon = isIndeterminate ? (
    <Icon size={12} stroke={3} aria-hidden="true">
      <IconMinus />
    </Icon>
  ) : (
    <CheckIcon size={12} stroke={3} />
  );

  const checkboxMods = {
    selected: isSelected,
    disabled: isDisabled,
    hovered: isHovered,
    indeterminate: isIndeterminate,
  };

  const checkboxIcon = isCheckable ? (
    <ListBoxCheckboxWrapper data-element="CheckboxWrapper" mods={checkboxMods}>
      <ListBoxCheckbox data-element="Checkbox" mods={checkboxMods}>
        {(isIndeterminate || isSelected) && markIcon}
      </ListBoxCheckbox>
    </ListBoxCheckboxWrapper>
  ) : null;

  const handleClick = (e: ReactMouseEvent<HTMLElement>) => {
    // A click on the checkbox mark only toggles; one on the label also tells
    // the list's owner, which closes a picker on it.
    const checkbox = e.currentTarget.querySelector(
      '[data-element="CheckboxWrapper"]',
    );

    onClick(!checkbox?.contains(e.target as Node));
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== ' ') return;

    // Space toggles a checkbox, and must neither scroll nor reach a shortcut.
    e.preventDefault();
    e.stopPropagation();
    onClick(false);
  };

  return (
    <>
      <ListBoxItem
        as="div"
        role="checkbox"
        aria-checked={isIndeterminate ? 'mixed' : isSelected}
        data-size={size}
        size={size}
        isDisabled={isDisabled}
        icon={checkboxIcon}
        mods={{
          listboxitem: true,
          // As a mod rather than `isSelected`, which would add an
          // `aria-selected` a checkbox does not take.
          selected: isSelected,
          disabled: isDisabled,
          checkable: isCheckable,
          hovered: isHovered,
          focused: isFocusVisible,
          indeterminate: isIndeterminate,
          all: true, // Important: this preserves the 'all' modifier
        }}
        {...mergeProps(hoverProps, focusRingProps, focusProps, allValueProps, {
          tabIndex: isDisabled ? undefined : 0,
          onClick: handleClick,
          onKeyDown: handleKeyDown,
        })}
      >
        {resolvedLabel}
      </ListBoxItem>
      <StyledDivider as="div" role="presentation" />
    </>
  );
};

/** The keys of the options a user can select in a collection: not disabled. */
function getSelectableKeys(
  collection: Collection<CollectionNode<unknown>>,
  disabledKeys: Set<Key>,
): Key[] {
  const keys: Key[] = [];

  for (const key of collection.getKeys()) {
    const node = collection.getItem(key);

    if (
      node?.type === 'item' &&
      !disabledKeys.has(key) &&
      !node.props?.isDisabled
    ) {
      keys.push(key);
    }
  }

  return keys;
}

/**
 * The selection a "Select All" press leaves. While it isn't checked, the press
 * selects all (`'all'`), or under a filter adds the options shown. Once it is,
 * the press takes the options shown out of the selection: selected options
 * the list doesn't show, hidden by a filter or not among its options, stay.
 * `hiddenKeys` are the selectable options a filter hides.
 */
function getSelectAllSelection(
  isAllSelected: boolean,
  selection: 'all' | Set<Key>,
  shownKeys: Key[],
  hiddenKeys: Key[],
): 'all' | Set<Key> {
  if (!isAllSelected) {
    return selection === 'all' || hiddenKeys.length === 0
      ? 'all'
      : new Set([...selection, ...shownKeys]);
  }

  if (selection === 'all') return new Set(hiddenKeys);

  const next = new Set(selection);

  for (const key of shownKeys) next.delete(key);

  return next;
}

/**
 * Whether every option a user can select is selected, which checks "Select
 * All". Disabled options don't count, and a list with nothing to select is
 * never all selected.
 */
function isEverySelectableSelected(
  collection: Collection<CollectionNode<unknown>>,
  selectionManager: SelectionManager,
): boolean {
  if (selectionManager.rawSelection === 'all') return true;

  let hasSelectable = false;

  for (const key of collection.getKeys()) {
    if (
      collection.getItem(key)?.type !== 'item' ||
      !selectionManager.canSelectItem(key)
    ) {
      continue;
    }

    if (!selectionManager.isSelected(key)) return false;

    hasSelectable = true;
  }

  return hasSelectable;
}

/**
 * A public selection prop as the Set-based value React Stately expects: a key
 * array (or `'all'`, passed through) in multiple mode, a single key (or
 * `null` for none) in single mode.
 */
function toStatelySelection(
  value: 'all' | Key[] | Key | null,
  isMultiple: boolean,
): 'all' | Set<Key> {
  if (isMultiple) {
    return value === 'all' ? 'all' : new Set(value as Key[]);
  }

  return value == null ? new Set() : new Set([value as Key]);
}

/**
 * A droppable collection's props without the `id` and the null
 * `aria-describedby` React Aria gives the collection. `mergeProps` would keep
 * both over the listbox's own, so a reorderable list would drop the `id` its
 * caller passed, leave a search input's `aria-controls` pointing at nothing,
 * and lose its description and error message. React Aria sets both for a drop
 * on the whole list, and ListBox renders no such drop target.
 */
function withoutWholeListDropProps({
  id: _id,
  'aria-describedby': _describedBy,
  ...collectionProps
}: Record<string, unknown>) {
  return collectionProps;
}

export const ListBox = forwardRef(function ListBox<T extends object>(
  props: CubeListBoxProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
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

  const { t } = useI18n();

  let {
    qa,
    label,
    extra,
    id,
    labelStyles,
    isRequired,
    necessityIndicator,
    isInvalid,
    isValid,
    isDisabled,
    listStyles,
    optionStyles,
    optionHighlight,
    sectionStyles,
    headingStyles,
    listGap,
    listRef,
    message,
    description,
    styles,
    mods: externalMods,
    size = 'medium',
    labelSuffix,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    shouldUseVirtualFocus,
    isFocusWithin,
    onSelectionChange,
    disableSelectionToggle = false,
    allowDuplicateSelectionEvents,
    stateRef,
    focusOnHover,
    header,
    footer,
    headerStyles,
    footerStyles,
    onEscape,
    isCheckable,
    onOptionClick,
    showSelectAll,
    selectAllLabel,
    allValueProps,
    filter,
    emptyLabel = t('listBox.noItems', 'No items'),
    shape = 'card',
    isReorderable = false,
    onReorder,
    form,
    ...otherProps
  } = props;

  const lastSelectedKeyRef = useRef<Key | null>(null);

  // Wrap onSelectionChange to prevent selection when disabled and handle React Aria's Set format
  const externalSelectionHandler = onSelectionChange || (props as any).onChange;

  const wrappedOnSelectionChange = useMemo(() => {
    if (!externalSelectionHandler) return undefined;

    return (keys: any) => {
      // Don't allow selection changes when disabled
      if (isDisabled) {
        return;
      }

      // React Aria always passes a Set for selection changes
      // Handle the special "all" case and convert to our public API format
      if (keys === 'all') {
        externalSelectionHandler('all');
      } else if (keys instanceof Set) {
        if (keys.size === 0) {
          // Picking the selected option again keeps it, in single mode
          // whether set or by default. The controlled key is the one picked.
          if (disableSelectionToggle && props.selectionMode !== 'multiple') {
            const prevKey = selectedKey ?? lastSelectedKeyRef.current;
            if (prevKey != null) {
              externalSelectionHandler(prevKey);
              return;
            }
          }
          externalSelectionHandler(
            props.selectionMode === 'multiple' ? [] : null,
          );
        } else if (props.selectionMode === 'multiple') {
          externalSelectionHandler(Array.from(keys));
        } else {
          const key = Array.from(keys)[0];
          lastSelectedKeyRef.current = key ?? null;
          externalSelectionHandler(key);
        }
      } else {
        lastSelectedKeyRef.current = keys as Key | null;
        externalSelectionHandler(keys);
      }
    };
  }, [
    externalSelectionHandler,
    isDisabled,
    props.selectionMode,
    disableSelectionToggle,
    selectedKey,
  ]);

  // Prepare props for useListState with correct selection props
  const listStateProps: ListProps<T> = {
    ...props,
    onSelectionChange: wrappedOnSelectionChange,
    disabledBehavior: 'all',
    filter,
    selectionMode: props.selectionMode || 'single',
    allowDuplicateSelectionEvents,
  };

  // Set selection props based on mode: the array props in multiple mode, the
  // scalar key props in single mode.
  const isMultiple = listStateProps.selectionMode === 'multiple';
  const selection = isMultiple ? selectedKeys : selectedKey;
  const defaultSelection = isMultiple
    ? defaultSelectedKeys
    : defaultSelectedKey;

  if (selection !== undefined) {
    listStateProps.selectedKeys = toStatelySelection(selection, isMultiple);
  }

  if (defaultSelection !== undefined) {
    listStateProps.defaultSelectedKeys = toStatelySelection(
      defaultSelection,
      isMultiple,
    );
  }

  const listState = getValueSelectionState(useListState(listStateProps));

  const hasSelectAll = !!showSelectAll && props.selectionMode === 'multiple';

  // Under a filter, "Select All" acts on the options it shows and keeps the
  // selected ones the filter hides, so it needs the whole list. Built only
  // then; otherwise it is empty.
  const { collection: fullCollection } = useListState<T>(
    hasSelectAll && filter
      ? { children: props.children, items: props.items, selectionMode: 'none' }
      : NO_OPTIONS,
  );

  useLayoutEffect(() => {
    const selected = listState.selectionManager.selectedKeys;
    if (selected && (selected as any).size > 0) {
      const first = Array.from(selected as Set<Key>)[0];
      lastSelectedKeyRef.current = first ?? null;
    }
  }, [listState.selectionManager.selectedKeys]);

  // Checked once every selectable option is selected, however it got there;
  // mixed while only some are.
  const isAllSelected =
    hasSelectAll &&
    isEverySelectableSelected(listState.collection, listState.selectionManager);
  const isSomeSelected =
    hasSelectAll && !isAllSelected && !listState.selectionManager.isEmpty;

  // React Stately reports the change, so it is reported once. It reports none
  // when nothing changes, as when `disallowEmptySelection` keeps the selection.
  const handleSelectAllClick = (propagate: boolean) => {
    if (isDisabled || !hasSelectAll) return;

    const { collection, disabledKeys, selectionManager } = listState;
    const next = getSelectAllSelection(
      isAllSelected,
      selectionManager.rawSelection,
      getSelectableKeys(collection, disabledKeys),
      getSelectableKeys(fullCollection, disabledKeys).filter(
        (key) => !collection.getItem(key),
      ),
    );

    if (next === 'all') {
      selectionManager.selectAll();
    } else if (next.size === 0) {
      selectionManager.clearSelection();
    } else {
      selectionManager.setSelectedKeys(next);
    }

    if (propagate && !isAllSelected) {
      onOptionClick?.('__ALL__');
    }
  };

  // Track whether the last focus change was due to keyboard navigation
  const lastFocusSourceRef = useRef<'keyboard' | 'mouse' | 'other'>('other');

  // Expose the list state instance via the provided ref (if any)
  if (stateRef) {
    stateRef.current = {
      ...listState,
      lastFocusSourceRef,
    };
  }

  // Warn if isCheckable is false in single selection mode
  useWarn(isCheckable === false && props.selectionMode === 'single', {
    key: ['listbox-checkable-single-mode'],
    args: [
      'CubeUIKit: isCheckable=false is not recommended in single selection mode as it may confuse users about selection behavior.',
    ],
  });

  // Custom keyboard handling: `Escape` and `Tab` have to leave the list so a
  // surrounding overlay can close on the one and keep focus inside with the
  // other, while every other key stays contained. See
  // `allowOverlayKeysToPropagate`.
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      allowOverlayKeysToPropagate(e);

      // Mark focus changes from keyboard navigation
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === 'PageUp' ||
        e.key === 'PageDown'
      ) {
        lastFocusSourceRef.current = 'keyboard';
      }

      if (e.key === 'Escape') {
        // Called to potentially override the default selection clearing.
        onEscape?.();
      }
    },
  });

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  listRef = useCombinedRefs(listRef);

  // ----- Collection and virtualization decision (must precede useListBox) -----
  const itemsArray = useMemo(
    () => [...listState.collection],
    [listState.collection],
  );

  const hasSections = useMemo(
    () => itemsArray.some((i) => i.type === 'section'),
    [itemsArray],
  );

  const shouldVirtualize = !hasSections && !isReorderable;

  const { listBoxProps, labelProps } = useListBox(
    {
      ...props,
      id: id,
      // Only disable isVirtualized for reorderable lists (DnD needs real DOM focus).
      // Section-based lists keep isVirtualized: true to preserve ARIA attributes.
      isVirtualized: !isReorderable,
      shouldUseVirtualFocus: shouldUseVirtualFocus ?? false,
      escapeKeyBehavior: onEscape ? 'none' : 'clearSelection',
      onSelectionChange: wrappedOnSelectionChange,
    },
    listState,
    listRef,
  );

  const { isFocused, focusProps } = useFocus();
  // An empty list is still a Tab stop, on its `ul` with no height, so the
  // card shows that focus as it shows its own.
  const { isFocused: isListElementFocused, focusProps: listElementFocusProps } =
    useFocus();
  const { isFocused: isSelectAllFocused, focusProps: selectAllFocusProps } =
    useFocus();

  // The focused key outlives focus, so an option shows as focused only while
  // the list has it. A component whose input moves the key (FilterListBox)
  // says whether focus is within it, in any focus mode. Otherwise the list's
  // own focus decides, and with virtual focus the focused key alone marks it.
  // Focus on "Select All" is on neither.
  const isListFocused =
    !isSelectAllFocused &&
    (isFocusWithin ??
      (shouldUseVirtualFocus || listState.selectionManager.isFocused));

  // Scroll container ref for virtualization
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? itemsArray.length : 0,
    getScrollElement: () => scrollRef.current,
    // Use the actual item key to ensure React properly reconciles DOM elements
    // when items are filtered, added, or removed. Without this, the virtualizer
    // uses index-based keys which causes DOM reuse issues and style leaking.
    // A new key function makes the virtualizer recompute positions from the
    // heights it has measured per key. ListBox isn't compiled (useVirtualizer),
    // so that is every render. Reading `itemsArray` keeps new items bringing a
    // new function should it ever compile.
    getItemKey: (index: number) => itemsArray[index]?.key ?? index,
    estimateSize: (index: number) => {
      const currentItem: any = itemsArray[index];

      if (currentItem?.props?.description) {
        return SIZES.XL;
      }
      return SIZES[SIZE_NAME_TO_KEY[size] as keyof typeof SIZES];
    },
    // Options are positioned absolutely here, so their margins space nothing.
    // `1` matches the `1bw` default.
    gap: listGap ?? 1,
    overscan: 10,
  });

  // The virtualizer caches positions without the gap, so re-measure when it
  // changes. Not when the items do: their positions follow `getItemKey`, and
  // `measure()` would drop every measured height.
  useEffect(() => {
    if (shouldVirtualize) {
      rowVirtualizer.measure();
    }
  }, [shouldVirtualize, rowVirtualizer, listGap]);

  // The focused key this effect last saw, to tell a move of focus from a
  // change of the items.
  const lastFocusedKeyRef = useRef<Key | null>(null);

  // Keep the focused option visible. One the virtualizer hasn't rendered is
  // scrolled to by index, which renders it, when focus moves to it (End,
  // typeahead, the selected option on autofocus or Tab); new items alone
  // leave a list the user scrolled away from where it is. One already
  // rendered is scrolled to only for keyboard navigation, so a click never
  // moves the list.
  useLayoutEffect(() => {
    const focusedKey = listState.selectionManager.focusedKey;
    const hasFocusMoved = focusedKey !== lastFocusedKeyRef.current;

    lastFocusedKeyRef.current = focusedKey;

    if (focusedKey == null) return;

    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const itemElement = scrollElement.querySelector(
      `[data-key="${CSS.escape(String(focusedKey))}"]`,
    ) as HTMLElement;

    if (!itemElement) {
      const index = shouldVirtualize
        ? itemsArray.findIndex((item) => item.key === focusedKey)
        : -1;

      if (index !== -1 && hasFocusMoved) {
        rowVirtualizer.scrollToIndex(index, { align: 'auto' });
      }

      return;
    }

    // Only scroll on keyboard navigation
    if (lastFocusSourceRef.current !== 'keyboard') return;

    const scrollTop = scrollElement.scrollTop;
    const viewportHeight = scrollElement.clientHeight;
    const viewportBottom = scrollTop + viewportHeight;

    const itemRect = itemElement.getBoundingClientRect();
    const scrollRect = scrollElement.getBoundingClientRect();

    // Calculate item position relative to scroll container
    const itemTop = itemRect.top - scrollRect.top + scrollTop;
    const itemBottom = itemTop + itemRect.height;

    // Check if the item is fully visible in the viewport
    const isAlreadyVisible =
      itemTop >= scrollTop && itemBottom <= viewportBottom;

    if (!isAlreadyVisible) {
      // Use scrollIntoView with block: 'nearest' to minimize scroll jumps
      itemElement.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
  }, [
    listState.selectionManager.focusedKey,
    itemsArray,
    shouldVirtualize,
    rowVirtualizer,
  ]);

  // Merge React Aria listbox props with custom keyboard props so both sets of
  // event handlers (e.g. Arrow navigation *and* our Escape handler) are
  // preserved.
  // `useListBox` takes no validation state, so the list would look invalid
  // without a screen reader ever hearing it.
  const mergedListBoxProps = mergeProps(
    listBoxProps,
    keyboardProps,
    listElementFocusProps,
    { 'aria-invalid': isInvalid || undefined },
  );

  // React Aria keeps a disabled list a Tab stop while no option has focus.
  if (isDisabled) {
    delete mergedListBoxProps.tabIndex;
  }

  // An empty list keeps its listbox, which ids from outside point at (a search
  // input's `aria-controls`, the label's `aria-labelledby`), and says why it is
  // empty through its description: a listbox may hold only options and groups.
  const isEmpty = listState.collection.size === 0;
  const emptyLabelId = `${listBoxProps.id}-empty`;

  if (isEmpty) {
    mergedListBoxProps['aria-describedby'] = [
      mergedListBoxProps['aria-describedby'],
      emptyLabelId,
    ]
      .filter(Boolean)
      .join(' ');
  }

  // Ordered keys for DnD reordering
  const orderedKeys = useMemo(() => {
    if (!isReorderable) {
      return [];
    }

    return itemsArray
      .filter((i) => i.type === 'item')
      .map((i) => String(i.key));
  }, [isReorderable, itemsArray]);

  const isCardFocused = isFocused || (isEmpty && isListElementFocused);

  const mods = useMemo(
    () => ({
      ...getValidationMods({ isInvalid, isValid }),
      disabled: isDisabled,
      focused: isCardFocused,
      header: !!header || hasSelectAll,
      footer: !!footer,
      selectAll: hasSelectAll,
      ...externalMods,
    }),
    [
      isInvalid,
      isValid,
      isDisabled,
      isCardFocused,
      header,
      footer,
      hasSelectAll,
      externalMods,
    ],
  );

  const listGapTokens =
    listGap == null ? undefined : { '$list-gap': `${listGap}px` };

  const listBoxField = (
    <ListBoxWrapperElement
      ref={ref}
      qa="ListBoxWrapper"
      mods={mods}
      styles={styles}
      data-shape={shape}
    >
      {header ? (
        <StyledHeader styles={headerStyles} data-size={size}>
          {header}
        </StyledHeader>
      ) : (
        <div role="presentation" />
      )}
      {hasSelectAll ? (
        <SelectAllOption
          label={selectAllLabel}
          isSelected={isAllSelected}
          isIndeterminate={isSomeSelected}
          isDisabled={isDisabled}
          isCheckable={isCheckable}
          size={size}
          allValueProps={allValueProps}
          focusProps={selectAllFocusProps}
          onClick={handleSelectAllClick}
        />
      ) : (
        <>
          <div role="presentation" />
          <div role="presentation" />
        </>
      )}
      {/* Scroll container wrapper */}
      <ListBoxScrollElement ref={scrollRef} mods={mods} {...focusProps}>
        {isEmpty && (
          <Item
            id={emptyLabelId}
            // Read as the listbox's description, so not a second time as text.
            aria-hidden="true"
            preset="t4"
            color="#dark-03"
            size={size}
            padding="(.5x - 1bw)"
          >
            {emptyLabel}
          </Item>
        )}
        {isReorderable && !isEmpty ? (
          <DraggableListBox
            state={listState}
            listRef={listRef}
            orderedKeys={orderedKeys}
            onReorder={onReorder}
          >
            {(dragState, dropState, collectionProps) => (
              <ListElement
                qa={qa || 'ListBox'}
                {...mergeProps(
                  mergedListBoxProps,
                  withoutWholeListDropProps(collectionProps),
                )}
                ref={listRef}
                styles={listStyles}
                tokens={listGapTokens}
                aria-disabled={isDisabled || undefined}
                mods={{ sections: false }}
                data-shape={shape}
                data-input-type="listbox"
              >
                {itemsArray
                  .filter((item) => item.type === 'item')
                  .map((item) => (
                    <Option
                      key={item.key}
                      size={size}
                      item={item}
                      state={listState}
                      styles={optionStyles}
                      highlight={optionHighlight}
                      isParentDisabled={isDisabled}
                      isInvalid={isInvalid}
                      isValid={isValid}
                      focusOnHover={focusOnHover}
                      isListFocused={isListFocused}
                      isCheckable={isCheckable}
                      lastFocusSourceRef={lastFocusSourceRef}
                      dragState={dragState}
                      dropState={dropState}
                      onClick={onOptionClick}
                    />
                  ))}
              </ListElement>
            )}
          </DraggableListBox>
        ) : (
          <ListElement
            qa={qa || 'ListBox'}
            {...mergedListBoxProps}
            ref={listRef}
            styles={listStyles}
            tokens={listGapTokens}
            aria-disabled={isDisabled || undefined}
            mods={{ sections: hasSections, empty: isEmpty }}
            data-shape={shape}
            data-input-type="listbox"
            // oxlint-disable-next-line react/forbid-component-props -- the virtualizer measures the list's total height
            style={
              shouldVirtualize
                ? {
                    position: 'relative',
                    height: `${rowVirtualizer.getTotalSize()}px`,
                  }
                : undefined
            }
          >
            {shouldVirtualize
              ? rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const item = itemsArray[virtualItem.index];

                  return (
                    <Option
                      key={item.key}
                      size={size}
                      item={item}
                      state={listState}
                      styles={optionStyles}
                      highlight={optionHighlight}
                      isParentDisabled={isDisabled}
                      isInvalid={isInvalid}
                      isValid={isValid}
                      focusOnHover={focusOnHover}
                      isListFocused={isListFocused}
                      isCheckable={isCheckable}
                      // Measures the option's real height; the virtualizer adds the gap.
                      virtualRef={rowVirtualizer.measureElement as any}
                      virtualStyle={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      virtualIndex={virtualItem.index}
                      lastFocusSourceRef={lastFocusSourceRef}
                      onClick={onOptionClick}
                    />
                  );
                })
              : (() => {
                  const renderedItems: ReactNode[] = [];
                  let isFirstSection = true;

                  for (const item of listState.collection) {
                    if (item.type === 'section') {
                      if (!isFirstSection) {
                        renderedItems.push(
                          // A listbox holds only options and groups.
                          <StyledDivider
                            key={`divider-${String(item.key)}`}
                            role="presentation"
                          />,
                        );
                      }

                      renderedItems.push(
                        <ListBoxSection
                          key={item.key}
                          item={item}
                          state={listState}
                          optionStyles={optionStyles}
                          optionHighlight={optionHighlight}
                          headingStyles={headingStyles}
                          sectionStyles={sectionStyles}
                          isParentDisabled={isDisabled}
                          isInvalid={isInvalid}
                          isValid={isValid}
                          focusOnHover={focusOnHover}
                          isListFocused={isListFocused}
                          isCheckable={isCheckable}
                          size={size}
                          lastFocusSourceRef={lastFocusSourceRef}
                          onClick={onOptionClick}
                        />,
                      );

                      isFirstSection = false;
                    } else {
                      renderedItems.push(
                        <Option
                          key={item.key}
                          size={size}
                          item={item}
                          state={listState}
                          styles={optionStyles}
                          highlight={optionHighlight}
                          isParentDisabled={isDisabled}
                          isInvalid={isInvalid}
                          isValid={isValid}
                          focusOnHover={focusOnHover}
                          isListFocused={isListFocused}
                          isCheckable={isCheckable}
                          lastFocusSourceRef={lastFocusSourceRef}
                          onClick={onOptionClick}
                        />,
                      );
                    }
                  }

                  return renderedItems;
                })()}
          </ListElement>
        )}
      </ListBoxScrollElement>
      {footer ? (
        <StyledFooter styles={footerStyles} data-size={size}>
          {footer}
        </StyledFooter>
      ) : (
        <div role="presentation" />
      )}
    </ListBoxWrapperElement>
  );

  return wrapWithField<Omit<CubeListBoxProps<T>, 'children'>>(listBoxField, {
    ...props,
    labelProps: mergeAriaProps(labelProps, props.labelProps),
  });
}) as unknown as (<T>(
  props: CubeListBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & {
  Item: typeof CollectionItem;
  Section: typeof BaseSection;
};

function Option({
  size = 'medium',
  item,
  state,
  styles,
  highlight,
  isParentDisabled,
  isInvalid,
  isValid,
  focusOnHover = false,
  isListFocused = false,
  isCheckable,
  onClick: onOptionClick,
  virtualStyle,
  virtualRef,
  virtualIndex,
  lastFocusSourceRef,
  dragState,
  dropState,
}: {
  size?: 'small' | 'medium' | 'large';
  item: any;
  state: any;
  styles?: Styles;
  highlight?: string;
  isParentDisabled?: boolean;
  isInvalid?: boolean;
  isValid?: boolean;
  focusOnHover?: boolean;
  /** Whether the list has focus, so its focused option shows as focused */
  isListFocused?: boolean;
  isCheckable?: boolean;
  onClick?: (key: Key) => void;
  /** Inline style applied when virtualized (absolute positioning etc.) */
  virtualStyle?: CSSProperties;
  /** react-virtual's `measureElement`, called with the option after every commit */
  virtualRef?: (element: HTMLElement | null) => void;
  /** Virtual index from react-virtual for data-index attribute */
  virtualIndex?: number;
  /** Ref to track the source of focus changes */
  lastFocusSourceRef?: MutableRefObject<'keyboard' | 'mouse' | 'other'>;
  /** Drag state from DraggableCollection. When provided, enables drag-and-drop. */
  dragState?: DraggableCollectionState;
  /** Drop state from DraggableCollection. When provided, renders drop indicators. */
  dropState?: DroppableCollectionState;
}) {
  const localRef = useRef<HTMLLIElement>(null);

  // Measure during the commit. After it, the browser can paint the option at
  // its estimated height first, overlapping the next one for a frame.
  useLayoutEffect(() => {
    virtualRef?.(localRef.current);
  });

  const isDisabled = isParentDisabled || state.disabledKeys.has(item.key);
  const isSelected = state.selectionManager.isSelected(item.key);

  // Drag-and-drop support — only enable when both states are provided
  const isDraggable = !!dragState && !!dropState;

  // useDraggableItem must be called unconditionally (Rules of Hooks).
  // When dragState is undefined, we pass a minimal mock state to satisfy the hook.
  const mockDragState = useMemo(
    () => createMockDragState(state.collection, state.selectionManager),
    [state.collection, state.selectionManager],
  );

  const dragResult = useDraggableItem(
    { key: item.key },
    dragState ?? mockDragState,
  );
  const effectiveDragProps = isDraggable ? dragResult.dragProps : {};
  const isDragging = isDraggable && !!dragState?.isDragging(item.key);

  const { hoverProps, isHovered } = useHover({ isDisabled });

  const { optionProps, isPressed, labelProps, descriptionProps } = useOption(
    {
      key: item.key,
      isDisabled,
      isSelected,
      shouldSelectOnPressUp: true,
      shouldFocusOnHover: focusOnHover,
    },
    state,
    localRef,
  );

  const isFocused =
    !isDisabled &&
    isListFocused &&
    state.selectionManager.focusedKey === item.key;

  // Filter out service props - all remaining props can be passed to Item
  const filteredItemProps = filterSelectionItemProps(
    filterCollectionItemProps(item.props),
  );

  // Determine icon: drag handle > checkbox > user icon > default
  const effectiveIcon = useMemo(() => {
    if (isDraggable) {
      if (!filteredItemProps.icon || isHovered) {
        return <GripVerticalIcon size={14} />;
      }
    }

    if (
      !isCheckable ||
      state.selectionManager.selectionMode !== 'multiple' ||
      filteredItemProps.icon
    ) {
      return (
        filteredItemProps.icon ??
        (state.selectionManager.selectionMode !== 'multiple' ? null : undefined)
      );
    }

    return renderCheckboxIcon({
      isSelected,
      isDisabled,
      isFocused,
      isHovered,
      isInvalid,
      isValid,
    });
  }, [
    isDraggable,
    isCheckable,
    state.selectionManager.selectionMode,
    isSelected,
    isDisabled,
    isFocused,
    isHovered,
    isInvalid,
    isValid,
    filteredItemProps.icon,
  ]);

  // Side-effects layered on top of React Aria's own onClick. The underlying
  // React Aria onClick is already chained via mergeProps below, so this handler
  // must NOT call optionProps.onClick again — re-invoking it would trigger
  // usePress's virtual-click branch and double-fire onPress (and toggle
  // selection twice in multiple mode).
  const runOptionExtras = (target: EventTarget | null) => {
    if (lastFocusSourceRef) {
      lastFocusSourceRef.current = 'mouse';
    }

    state.selectionManager.setFocusedKey(item.key);

    if (!onOptionClick) {
      return;
    }

    // In checkable multiple mode, suppress the callback when the click landed
    // inside the checkbox wrapper — that area is reserved for toggle-only
    // behaviour (React Aria still handles the toggle via the chained onClick).
    if (isCheckable && state.selectionManager.selectionMode === 'multiple') {
      const clickTarget = target as HTMLElement;
      const checkboxElement = localRef.current?.querySelector(
        '[data-element="CheckboxWrapper"]',
      );

      if (
        checkboxElement &&
        (checkboxElement === clickTarget ||
          checkboxElement.contains(clickTarget))
      ) {
        return;
      }
    }

    onOptionClick(item.key);
  };

  const handleOptionExtras = (e: MouseEvent) => runOptionExtras(e.target);

  // A mouse press picks the option it started on, even if the list moved
  // under the pointer before the release. The browser then sends the click to
  // a common ancestor, so the press runs the click's side effects itself.
  const originPress = useOptionOriginPress({
    key: item.key,
    ref: localRef,
    manager: state.selectionManager,
    isDisabled,
    onSettle: runOptionExtras,
  });

  // Filter out React Aria props that shouldn't reach the DOM
  const {
    onKeyDown,
    onKeyUp,
    onPointerUp,
    tabIndex,
    'aria-selected': ariaSelected,
    'aria-disabled': ariaDisabled,
    role,
    ...filteredOptionProps
  } = filterSelectionItemProps(optionProps);

  const theme = getValidationTheme(
    'default' as const,
    { isInvalid, isValid },
    { includeValid: true },
  );

  const listBoxItem = (
    <ListBoxItem
      ref={localRef}
      data-key={String(item.key)}
      {...mergeProps(
        filteredOptionProps,
        hoverProps,
        filteredItemProps,
        {
          onClick: handleOptionExtras,
          onKeyDown,
          onKeyUp,
          onPointerDown: originPress.onPointerDown,
          onPointerUp: originPress.wrapPointerUp(onPointerUp),
          tabIndex,
          'aria-selected': ariaSelected,
          'aria-disabled': ariaDisabled,
          role,
        },
        effectiveDragProps,
      )}
      theme={theme}
      // oxlint-disable-next-line react/forbid-component-props -- the virtualizer positions the option
      style={virtualStyle}
      data-size={size}
      data-index={virtualIndex}
      size={size}
      display={isDraggable ? 'grid' : undefined}
      isSelected={isSelected}
      isDisabled={isDisabled}
      icon={effectiveIcon}
      highlight={highlight}
      labelProps={labelProps}
      descriptionProps={descriptionProps}
      styles={mergeStyles(styles, filteredItemProps.styles)}
      defaultTooltipPlacement="right"
      mods={{
        listboxitem: true,
        focused: isFocused,
        pressed: isPressed,
        dragging: isDragging,
        draggable: isDraggable,
        gripIcon: isDraggable && (!filteredItemProps.icon || isHovered),
        valid: isSelected && !!isValid && !isInvalid,
        invalid: isSelected && !!isInvalid,
        checkable: isCheckable,
        hovered: isHovered,
        all: false, // This will be set to true for SelectAllOption
      }}
    >
      {item.rendered}
    </ListBoxItem>
  );

  if (!isDraggable || !dropState) {
    return listBoxItem;
  }

  return (
    <>
      <ListBoxDropIndicator
        target={{ type: 'item', key: item.key, dropPosition: 'before' }}
        dropState={dropState}
      />
      {listBoxItem}
      <ListBoxDropIndicator
        target={{ type: 'item', key: item.key, dropPosition: 'after' }}
        dropState={dropState}
      />
    </>
  );
}

// =============================================================================
// Drop Indicator for DnD reordering
// =============================================================================

function ListBoxDropIndicator({
  target,
  dropState,
}: {
  target: DropTarget;
  dropState: DroppableCollectionState;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { dropIndicatorProps, isHidden, isDropTarget } = useDropIndicator(
    { target },
    dropState,
    ref,
  );

  if (isHidden) {
    return null;
  }

  return (
    <ListBoxDropIndicatorElement
      ref={ref}
      role="option"
      {...dropIndicatorProps}
      mods={{ 'drop-indicator': true, 'drop-target': isDropTarget }}
    >
      <div data-element="Indicator" />
    </ListBoxDropIndicatorElement>
  );
}

interface ListBoxSectionProps<T> {
  item: any;
  state: any;
  optionStyles?: Styles;
  optionHighlight?: string;
  headingStyles?: Styles;
  sectionStyles?: Styles;
  isParentDisabled?: boolean;
  isInvalid?: boolean;
  isValid?: boolean;
  focusOnHover?: boolean;
  isListFocused?: boolean;
  isCheckable?: boolean;
  onClick?: (key: Key) => void;
  size?: 'small' | 'medium' | 'large';
  lastFocusSourceRef?: MutableRefObject<'keyboard' | 'mouse' | 'other'>;
}

function ListBoxSection<T>(props: ListBoxSectionProps<T>) {
  const {
    item,
    state,
    optionStyles,
    optionHighlight,
    headingStyles,
    sectionStyles,
    isParentDisabled,
    isInvalid,
    isValid,
    focusOnHover,
    isListFocused,
    isCheckable,
    onClick: onOptionClick,
    lastFocusSourceRef,
  } = props;
  const heading = item.rendered;

  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <SectionWrapperElement {...itemProps} styles={sectionStyles}>
      {heading && (
        <StyledSectionHeading
          {...headingProps}
          size={props.size}
          styles={headingStyles}
        >
          {heading}
        </StyledSectionHeading>
      )}
      <SectionListElement {...groupProps}>
        {[...item.childNodes]
          .filter((node: any) => state.collection.getItem(node.key))
          .map((node: any) => (
            <Option
              key={node.key}
              size={props.size}
              item={node}
              state={state}
              styles={optionStyles}
              highlight={optionHighlight}
              isParentDisabled={isParentDisabled}
              isInvalid={isInvalid}
              isValid={isValid}
              focusOnHover={focusOnHover}
              isListFocused={isListFocused}
              isCheckable={isCheckable}
              lastFocusSourceRef={lastFocusSourceRef}
              onClick={onOptionClick}
            />
          ))}
      </SectionListElement>
    </SectionWrapperElement>
  );
}

type SectionComponent = typeof BaseSection;

const ListBoxSectionComponent = Object.assign(BaseSection, {
  displayName: 'Section',
}) as SectionComponent;

ListBox.Item = CollectionItem;

ListBox.Section = ListBoxSectionComponent;

Object.defineProperty(ListBox, 'cubeInputType', {
  value: 'ListBox',
  enumerable: false,
  configurable: false,
});
