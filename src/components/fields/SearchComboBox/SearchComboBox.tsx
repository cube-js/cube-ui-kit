import {
  KeyboardEvent as AriaKeyboardEvent,
  FocusableRef,
  Key,
} from '@react-types/shared';
import { Styles, tasty } from '@tenphi/tasty';
import React, {
  cloneElement,
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFilter, useKeyboard } from 'react-aria';
import { Section as BaseSection, useListState } from 'react-stately';

import { useEvent } from '../../../_internal/hooks/use-event';
import { useI18n } from '../../../i18n/useI18n';
import { CloseIcon } from '../../../icons/CloseIcon';
import { DirectionIcon } from '../../../icons/DirectionIcon';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { SearchIcon } from '../../../icons/SearchIcon';
import { useProviderProps } from '../../../provider';
import { FieldBaseProps, TextFieldKeyboardProps } from '../../../shared/form';
import { generateRandomId } from '../../../utils/random';
import { useFocus } from '../../../utils/react/interactions';
import { mergeProps } from '../../../utils/react/mergeProps';
import { settleOverlayKey } from '../../../utils/react/overlayKeyPropagation';
import { pickBaseCustomizationProps } from '../../../utils/react/pickBaseCustomizationProps';
import { useCombinedRefs } from '../../../utils/react/useCombinedRefs';
import { usePopoverSync } from '../../../utils/react/usePopoverSync';
import { CollectionItem as Item } from '../../CollectionItem';
import { asksForFieldChrome, withFieldChrome } from '../../form/field-chrome';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import { getValidationMods } from '../../form/validation/resolve-validation-props';
import { useValidationProps } from '../../form/validation/use-validation-props';
import { getValidationIcon } from '../../form/validation/ValidationIndicator';
import { wrapWithField } from '../../form/wrapper';
import { isItemDisabled } from '../../shared/disabled-behavior';
import { getListBoxOptionId } from '../ListBox/optionId';
import { EmptyLabelStatus } from '../ListBoxPopover/EmptyLabelStatus';
import { ListBoxPopover } from '../ListBoxPopover/ListBoxPopover';
import {
  collectVisibleKeys,
  filterCollectionNodes,
  getEdgeVisibleKey,
  getNextVisibleKey,
  getVisibleKeys,
  ListStateLike,
  markKeyboardFocus,
} from '../ListBoxPopover/listNavigation';
import { useCompositeFocus } from '../ListBoxPopover/useCompositeFocus';
import {
  LOADING_DELAY,
  useDelayedLoading,
} from '../ListBoxPopover/useDelayedLoading';
import {
  CubeSearchInputAttributes,
  SEARCH_TEXT_SERVICES,
} from '../search-text-services';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

import type { ComponentBasePropsWithoutChildren } from '../../../utils/react/componentBaseProps';

type FilterFn = (textValue: string, inputValue: string) => boolean;

export type PopoverTriggerAction = 'focus' | 'input' | 'manual';

const SearchComboBoxWrapperElement = tasty({
  qa: 'SearchComboBoxWrapper',
  styles: INPUT_WRAPPER_STYLES,
});

const InputElement = tasty({
  as: 'input',
  styles: DEFAULT_INPUT_STYLES,
});

export interface CubeSearchComboBoxProps<T>
  extends
    ComponentBasePropsWithoutChildren,
    FieldLayoutStyleProps,
    // SearchComboBox is not form-connected: it holds no persistent value, so
    // form-binding and form-validation props are excluded from the public API.
    Omit<
      FieldBaseProps,
      | 'name'
      | 'form'
      | 'rules'
      | 'shouldUpdate'
      | 'validationDelay'
      | 'validateTrigger'
      | 'insideForm'
      | 'idPrefix'
    > {
  /**
   * Callback fired when the user picks a suggestion from the list.
   * Receives the option key and its text value. The input is cleared afterwards.
   */
  onSelect?: (key: string, textValue: string) => void;
  /**
   * Opt-in callback fired when the user presses Enter while no suggestion is
   * visible (the popover has no results). Receives the trimmed input text. The
   * input is cleared afterwards. When suggestions are visible, Enter selects the
   * top result via `onSelect` instead. When not provided, Enter with no visible
   * suggestion is a no-op.
   */
  onSubmit?: (value: string) => void;
  /**
   * Label displayed when the list is empty (no results). Defaults to a
   * context-aware "No results found" / "Loading…" message.
   */
  emptyLabel?: ReactNode;

  /** The input value in controlled mode */
  inputValue?: string;
  /** The default input value in uncontrolled mode */
  defaultInputValue?: string;
  /** Callback fired when input value changes */
  onInputChange?: (value: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input should have autofocus */
  autoFocus?: boolean;
  /** HTML autocomplete attribute for the input */
  autoComplete?: string;
  /** Callback fired when focus enters the component (input or popover). Does not receive event object. */
  onFocus?: () => void;
  /** Callback fired when focus leaves the component entirely. Does not receive event object. */
  onBlur?: () => void;
  /**
   * Callback fired when a key is pressed on the input, before the built-in
   * key handling. Receives React Aria's keyboard event: `e.preventDefault()`
   * skips the built-in handling for the key. `Escape` and `Tab` go on to
   * ancestors, such as a surrounding dialog, unless SearchComboBox acts on
   * them or the handler prevents them. It acts on `Escape` while the list is
   * open or the input has text: it closes the list, or clears the text, or,
   * when not clearable, keeps the browser from clearing it. Other keys stop
   * at the input unless the handler calls `e.continuePropagation()`.
   */
  onKeyDown?: TextFieldKeyboardProps['onKeyDown'];

  /** Popover trigger behavior: 'focus', 'input', or 'manual'. Defaults to 'input' */
  popoverTrigger?: PopoverTriggerAction;

  /** Items for the listbox (alternative to children) */
  items?: Iterable<T>;
  /** Children for the listbox (static items or render function) */
  children?: ReactNode | ((item: T) => ReactElement);

  /**
   * Custom filter function for determining if an option should be included.
   * Pass `false` to disable internal filtering completely (external/server-side filtering).
   */
  filter?: FilterFn | false;

  /** Whether the search combobox is clearable using ESC key or clear button. Defaults to true. */
  isClearable?: boolean;
  /** Callback called when the clear button is pressed */
  onClear?: () => void;

  /** Left input icon. Defaults to a search icon. */
  icon?: ReactElement | null;
  /** Input decoration before the main input */
  prefix?: ReactNode;
  /** Input decoration after the main input */
  suffix?: ReactNode;
  /** Whether to show the trigger button. Hidden by default (search field look). */
  hideTrigger?: boolean;
  /** Size of the search combobox */
  size?: 'small' | 'medium' | 'large' | (string & {});

  /** Ref for accessing the input element */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Ref for accessing the wrapper element */
  wrapperRef?: RefObject<HTMLDivElement>;
  /** Ref for accessing the listbox element */
  listBoxRef?: RefObject<HTMLDivElement>;
  /** Ref for accessing the popover element */
  popoverRef?: RefObject<HTMLDivElement>;
  /** Ref for accessing the trigger button element */
  triggerRef?: FocusableRef<HTMLButtonElement>;

  /**
   * Attributes for the input, such as `enterKeyHint`, `autoCorrect` or `inputMode`.
   * They win over the search defaults: `enterKeyHint="search"`, `autoCapitalize="none"`,
   * `autoCorrect="off"` and `spellCheck={false}`.
   */
  inputProps?: Omit<CubeSearchInputAttributes, 'autoComplete'>;
  /** Custom styles for the input */
  inputStyles?: Styles;
  /** Custom styles for the trigger button */
  triggerStyles?: Styles;
  /** Custom styles for the listbox */
  listBoxStyles?: Styles;
  /** Custom styles for the popover overlay */
  overlayStyles?: Styles;
  /** Custom styles for individual options */
  optionStyles?: Styles;
  /** Custom styles for sections */
  sectionStyles?: Styles;
  /** Custom styles for section headings */
  headingStyles?: Styles;
  /** Space between options, in pixels. Defaults to a hairline (`$item-gap`, `1px`). */
  listGap?: number;

  /** Whether the search combobox is disabled */
  isDisabled?: boolean;
  /**
   * Whether items are being loaded (e.g. from a server). While loading, the
   * previous results stay visible, and a list already shown stays shown even
   * when the load empties it. The loading indicator, and a list that opens
   * empty while loading, only appear after `loadingDelay` to avoid flicker on
   * fast responses.
   */
  isLoading?: boolean;
  /** Delay in milliseconds before the loading indicator is shown. Defaults to 1000. */
  loadingDelay?: number;
  /** Keys of disabled items */
  disabledKeys?: Iterable<Key>;
  /** Whether to flip the popover placement */
  shouldFlip?: boolean;
  /** Placement direction for the popover */
  direction?: 'bottom' | 'top';
  /** Offset for the popover */
  overlayOffset?: number;
  /** Minimum padding in pixels between the popover and viewport edges */
  containerPadding?: number;
  /** Whether the search combobox is read-only */
  isReadOnly?: boolean;
  /** Suffix position goes before or after the validation and loading statuses */
  suffixPosition?: 'before' | 'after';
  /** Callback called when the popover open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

// ============================================================================
// Component: SearchComboBoxInput
// ============================================================================
interface SearchComboBoxInputProps {
  customizationProps: ReturnType<typeof pickBaseCustomizationProps>;
  qa?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  id?: string;
  value: string;
  placeholder?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  size: string;
  mods: Record<string, any>;
  inputProps?: Omit<CubeSearchInputAttributes, 'autoComplete'>;
  inputStyles?: Styles;
  keyboardProps: any;
  focusProps: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Whether the listbox popover is actually visible (results, loading, or empty state). */
  isExpanded: boolean;
  searchComboBoxId: string;
  listStateRef: RefObject<any>;
}

const SearchComboBoxInput = forwardRef<
  HTMLInputElement,
  SearchComboBoxInputProps
>(function SearchComboBoxInput(
  {
    qa,
    customizationProps,
    inputRef,
    id,
    value,
    placeholder,
    isDisabled,
    isReadOnly,
    autoFocus,
    autoComplete,
    size,
    mods,
    inputProps,
    inputStyles,
    keyboardProps,
    focusProps,
    onChange,
    onFocus,
    isExpanded,
    searchComboBoxId,
    listStateRef,
  },
  ref,
) {
  const combinedRef = useCombinedRefs(ref, inputRef);

  return (
    <InputElement
      {...customizationProps}
      {...mergeProps(SEARCH_TEXT_SERVICES, inputProps)}
      ref={combinedRef}
      qa={qa}
      id={id}
      type="search"
      value={value}
      placeholder={placeholder}
      isDisabled={isDisabled}
      readOnly={isReadOnly}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      {...(autoFocus ? { 'data-autofocus': '' } : undefined)}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={focusProps.onBlur}
      {...keyboardProps}
      styles={inputStyles}
      mods={mods}
      data-size={size}
      data-input-type="searchcombobox"
      role="combobox"
      aria-expanded={isExpanded}
      aria-haspopup="listbox"
      aria-controls={
        isExpanded ? `SearchComboBoxListBox-${searchComboBoxId}` : undefined
      }
      aria-activedescendant={
        isExpanded && listStateRef.current?.selectionManager.focusedKey != null
          ? getListBoxOptionId(
              `SearchComboBoxListBox-${searchComboBoxId}`,
              listStateRef.current.selectionManager.focusedKey,
            )
          : undefined
      }
    />
  );
});

// ============================================================================
// Main Component: SearchComboBox
// ============================================================================
export const SearchComboBox = forwardRef(function SearchComboBox<
  T extends object,
>(props: CubeSearchComboBoxProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  // SearchComboBox is a standalone control, not a form field, so it does not use `useFieldProps`.
  // Without a label, it still shows a description or message under the control.
  if (asksForFieldChrome(props)) props = withFieldChrome(props);
  props = useProviderProps(props);
  props = useValidationProps(props);

  const { t } = useI18n();

  let {
    qa,
    label,
    labelStyles,
    isRequired,
    necessityIndicator,
    isInvalid,
    isValid,
    id,
    icon,
    prefix,
    isDisabled,
    autoFocus,
    autoComplete = 'off',
    wrapperRef,
    inputRef,
    triggerRef,
    popoverRef,
    listBoxRef,
    isLoading,
    loadingDelay = LOADING_DELAY,
    inputProps,
    inputStyles,
    optionStyles,
    triggerStyles,
    listBoxStyles,
    overlayStyles,
    suffix,
    hideTrigger = true,
    message,
    description,
    size = 'medium',
    direction = 'bottom',
    shouldFlip = true,
    popoverTrigger = 'input',
    suffixPosition = 'before',
    filter,
    styles,
    labelSuffix,
    inputValue,
    defaultInputValue,
    onInputChange,
    isClearable = true,
    onClear,
    placeholder,
    emptyLabel,
    onSelect,
    onSubmit,
    items,
    children: renderChildren,
    sectionStyles,
    headingStyles,
    listGap,
    isReadOnly,
    overlayOffset = 8,
    containerPadding = 8,
    onOpenChange,
    onFocus,
    onBlur,
    onKeyDown,
    disabledKeys,
  } = props;

  // Generate a unique ID for this instance
  const searchComboBoxId = useMemo(() => generateRandomId(), []);

  // Normalize the wrapper/popover refs above popover-sync so it sees stable refs.
  // The field's ref is the wrapper's, with or without the field chrome.
  wrapperRef = useCombinedRefs(wrapperRef, ref);
  popoverRef = useCombinedRefs(popoverRef);

  // Input value state (controlled/uncontrolled)
  const isControlledInput = inputValue !== undefined;
  const [internalInputValue, setInternalInputValue] = useState(
    defaultInputValue ?? '',
  );
  const effectiveInputValue = isControlledInput
    ? (inputValue as string)
    : internalInputValue;

  // Popover state — open *intent*. The overlay is gated separately by
  // `shouldShowPopover` (results / delayed loading / empty-query state).
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const fieldLayout = splitFieldLayout(props);

  styles = fieldLayout.styles;

  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  const children = renderChildren as ReactNode;

  // Filtering
  const [isFilterActive, setIsFilterActive] = useState(false);
  const { contains } = useFilter({ sensitivity: 'base' });

  const textFilterFn = useMemo<FilterFn>(
    () => (filter === false ? () => true : filter || contains),
    [filter, contains],
  );

  const filterFn = useCallback(
    (nodes: Iterable<any>) => {
      const term = effectiveInputValue.trim();

      if (!isFilterActive || !term) {
        return nodes;
      }

      return filterCollectionNodes(nodes, term, textFilterFn);
    },
    [isFilterActive, effectiveInputValue, textFilterFn],
  );

  // Local collection state for reading item labels (textValue) before/without a selection.
  const localCollectionState = useListState({
    children: children as any,
    items,
    selectionMode: 'none',
  });

  const { isFocused, focusProps } = useFocus();
  const validationIcon = getValidationIcon({ isInvalid, isValid });

  const listStateRef = useRef<any>(null);
  // Bumped whenever we move the virtual focus so the input's
  // `aria-activedescendant` (read from the ListBox's stateRef at render time)
  // stays in sync — the ListBox's own state update does not re-render us.
  const [, setFocusTick] = useState(0);
  const bumpFocus = useEvent(() => setFocusTick((t) => t + 1));

  const getItemLabel = useCallback(
    (key: Key): string => {
      const item = localCollectionState?.collection?.getItem(key);
      return item?.textValue || String(key);
    },
    [localCollectionState?.collection],
  );

  // Delayed loading indicator
  const showLoading = useDelayedLoading(!!isLoading, loadingDelay);

  // Check if there are any results after filtering
  const hasResults = useMemo(() => {
    const collection = localCollectionState?.collection;
    if (!collection) return false;

    for (const node of filterFn(collection) as Iterable<any>) {
      if (node.type === 'section') {
        if (node.childNodes && [...node.childNodes].length > 0) return true;
      } else {
        return true;
      }
    }

    return false;
  }, [localCollectionState?.collection, filterFn]);

  const disabledKeySet = useMemo(
    () => new Set<Key>(disabledKeys ? Array.from(disabledKeys) : []),
    [disabledKeys],
  );

  // Flat lists of the keys after filtering, disabled ones included, and of the
  // ones the user can pick. They follow the typed text at once, where the
  // list's own state can lag a render behind it, and they re-trigger the
  // highlight whenever the results change.
  const visibleItemKeys = useMemo(() => {
    const collection = localCollectionState?.collection;
    const keys: Key[] = [];
    if (collection) {
      collectVisibleKeys(filterFn(collection) as Iterable<any>, keys);
    }
    return keys;
  }, [localCollectionState?.collection, filterFn]);
  const selectableItemKeys = useMemo(() => {
    const collection = localCollectionState?.collection;
    if (!collection) return [];

    return visibleItemKeys.filter(
      (key) =>
        !isItemDisabled({ collection, disabledKeys: disabledKeySet }, key),
    );
  }, [localCollectionState?.collection, visibleItemKeys, disabledKeySet]);

  const trimmedInput = effectiveInputValue.trim();

  // Whether the popover showed on the last render.
  const [wasPopoverShown, setWasPopoverShown] = useState(false);

  // Keep the popover visible while there's something meaningful to show:
  // results, a loading indicator, or an empty state for a non-empty query.
  // A load that has no results yet shows the empty state only once the
  // delayed indicator kicks in, so a fast response never flashes it, unless
  // the popover is already shown: a load never hides it, so a search that
  // empties the results doesn't make it blink out between keystrokes.
  //
  // `isPopoverOpen` can still be true while this is false (loading delay with
  // no results, or opening an empty collection). Sync, notifications, and
  // keyboard commit must key off *this* flag so we never advertise or act on
  // an invisible overlay (incl. stale keys left in `listStateRef`).
  const shouldShowPopover = Boolean(
    isPopoverOpen &&
    (hasResults ||
      showLoading ||
      (isLoading && wasPopoverShown) ||
      (trimmedInput.length > 0 && !isLoading)),
  );

  if (wasPopoverShown !== shouldShowPopover) {
    setWasPopoverShown(shouldShowPopover);
  }

  usePopoverSync({
    menuId: searchComboBoxId,
    isOpen: shouldShowPopover,
    onClose: () => setIsPopoverOpen(false),
    triggerRef: wrapperRef as RefObject<HTMLElement | null>,
    containerRef: popoverRef as RefObject<HTMLElement | null>,
  });

  // Notify when the overlay is actually shown/hidden, not merely intended open.
  useEffect(() => {
    onOpenChange?.(shouldShowPopover);
  }, [shouldShowPopover]);

  // When we programmatically return focus to the input after a commit, the
  // resulting focus event must not reopen the popover (relevant for
  // `popoverTrigger="focus"`). Consumed once by `handleInputFocus`.
  const suppressFocusOpenRef = useRef(false);

  // Shared tail for commit actions (select/submit): reset the filter, clear the
  // input, close the popover, and return focus to the input.
  const clearAndClose = useEvent(() => {
    setIsFilterActive(false);

    if (!isControlledInput) {
      setInternalInputValue('');
    }
    onInputChange?.('');

    setIsPopoverOpen(false);

    suppressFocusOpenRef.current = true;
    setTimeout(() => {
      inputRef.current?.focus();
      // Clear right after the (synchronous) focus dispatch so a stale flag can
      // never suppress a later, genuine user focus — even if `focus()` was a
      // no-op because the input already held focus.
      suppressFocusOpenRef.current = false;
    }, 0);
  });

  // Selection handler — fire onSelect and clear the input.
  const handleSelectionChange = useEvent((selection: Key | Key[] | null) => {
    const key = Array.isArray(selection) ? selection[0] : selection;

    if (key != null) {
      const textValue = getItemLabel(key);
      onSelect?.(String(key), textValue);
    }

    clearAndClose();
  });

  // Submit handler — fire onSubmit and clear the input.
  const handleSubmit = useEvent((value: string) => {
    onSubmit?.(value);

    clearAndClose();
  });

  // Clear handler
  const clearValue = useEvent(() => {
    if (!isControlledInput) {
      setInternalInputValue('');
    }
    onInputChange?.('');

    setIsFilterActive(false);

    if (isPopoverOpen) {
      setIsPopoverOpen(false);
    }

    // Same suppress as clearAndClose: programmatic refocus must not reopen the
    // popover when popoverTrigger="focus" (e.g. clear button steal+restore focus).
    suppressFocusOpenRef.current = true;
    setTimeout(() => {
      inputRef.current?.focus();
      suppressFocusOpenRef.current = false;
    }, 0);

    onClear?.();
  });

  // Input change handler
  const handleInputChange = useEvent(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (!isControlledInput) {
        setInternalInputValue(value);
      }
      onInputChange?.(value);

      const trimmed = value.trim();
      setIsFilterActive(trimmed.length > 0);

      if (popoverTrigger !== 'manual') {
        if (trimmed && !isPopoverOpen) {
          setIsPopoverOpen(true);
        } else if (!trimmed && isPopoverOpen && popoverTrigger === 'input') {
          setIsPopoverOpen(false);
        }
      }
    },
  );

  // Input focus handler
  const handleInputFocus = useEvent((e: React.FocusEvent<HTMLInputElement>) => {
    focusProps.onFocus?.(e as any);

    // Skip the focus-triggered open exactly once when we refocused the input
    // ourselves right after a commit, so select/submit truly resets the field.
    if (suppressFocusOpenRef.current) {
      return;
    }

    if (popoverTrigger === 'focus' && !isPopoverOpen) {
      setIsPopoverOpen(true);
    }
  });

  // Composite blur — fires when focus leaves the whole component.
  // Always clear open intent: while the overlay is suppressed (e.g. loading
  // delay with no results), `useOverlay` is not mounted and cannot dismiss
  // on outside interaction, so blur is the only chance to drop `isPopoverOpen`.
  // Otherwise a late result arrival would flip `shouldShowPopover` true and
  // show the popover after focus has already left.
  const handleCompositeBlur = useEvent(() => {
    setIsFilterActive(false);
    setIsPopoverOpen(false);
    onBlur?.();
  });

  const { compositeFocusProps } = useCompositeFocus({
    wrapperRef,
    popoverRef,
    onFocus,
    onBlur: handleCompositeBlur,
    isDisabled,
  });

  // ---- keyboard -----------------------------------------------------------
  // Moves the virtual focus to `key`, if there is one, and scrolls it into view.
  const focusOption = (listState: ListStateLike, key: Key | null) => {
    if (key == null) return;

    markKeyboardFocus(listState);
    listState.selectionManager.setFocusedKey(key);
    bumpFocus();
  };

  const handleArrowKey = (e: AriaKeyboardEvent) => {
    e.preventDefault();

    if (!shouldShowPopover) {
      // Open intent may already be set while nothing is shown (loading delay).
      if (!isPopoverOpen) {
        if (!hasResults) setIsFilterActive(false);
        setIsPopoverOpen(true);
      }

      return;
    }

    const listState = listStateRef.current;

    if (listState) {
      focusOption(
        listState,
        getNextVisibleKey(listState, e.key === 'ArrowDown' ? 1 : -1),
      );
    }
  };

  // The option Enter commits. Prefer the highlighted option, but only when
  // it's still visible (further typing may have filtered it out); otherwise
  // fall back to the first option the user can pick, so typing a match and
  // pressing Enter always selects the top result. Read from this field's own
  // keys: `listStateRef` can lag a render behind the text, or be null while
  // the popover mounts, and a matching query must still commit via `onSelect`
  // instead of leaking through to `onSubmit`.
  const getKeyToSelect = (listState: ListStateLike | null): Key | null => {
    const focusedKey = listState?.selectionManager.focusedKey;

    if (focusedKey != null && visibleItemKeys.includes(focusedKey)) {
      return focusedKey;
    }

    return selectableItemKeys[0] ?? null;
  };

  // Enter commits an option, else submits the raw text, else does nothing
  // (keeping any empty state visible). It never reaches a surrounding form.
  const handleEnterKey = (e: AriaKeyboardEvent) => {
    e.preventDefault();

    // Commit an option only when the overlay is actually shown. Gate on
    // `shouldShowPopover` (not `isPopoverOpen`): during the loading delay or
    // an empty open, intent can be open while nothing is mounted, and a stale
    // `listStateRef` must not be committed.
    const listState = listStateRef.current;
    const keyToSelect = shouldShowPopover ? getKeyToSelect(listState) : null;

    if (
      keyToSelect != null &&
      listState &&
      isItemDisabled(listState, keyToSelect)
    ) {
      // A disabled option the arrow keys reached: Enter neither picks it nor
      // submits the text.
      return;
    }

    if (keyToSelect != null) {
      if (listState) {
        listState.selectionManager.select(keyToSelect, e);
      } else {
        // No mounted list state to route through — commit directly.
        handleSelectionChange(keyToSelect);
      }
    } else if (onSubmit && trimmedInput) {
      handleSubmit(trimmedInput);
    }
  };

  const handleEscapeKey = (e: AriaKeyboardEvent) => {
    if (shouldShowPopover) {
      e.preventDefault();
      setIsPopoverOpen(false);
      inputRef.current?.focus();

      return;
    }

    // A list a load holds back would show later: Escape cancels it too, and
    // goes on as it does with the list closed. A closed list stays closed.
    setIsPopoverOpen(false);

    if (effectiveInputValue) {
      // Always preventDefault: type="search" clears natively on Escape
      // unless cancelled, which would bypass isClearable={false}.
      e.preventDefault();
      if (isClearable) clearValue();
    }
  };

  const handleEdgeKey = (e: AriaKeyboardEvent) => {
    if (!shouldShowPopover) return;

    e.preventDefault();

    const listState = listStateRef.current;

    if (listState) {
      focusOption(
        listState,
        getEdgeVisibleKey(listState, e.key === 'Home' ? 'first' : 'last'),
      );
    }
  };

  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      // The user's handler runs first, and a key it prevents is theirs: skip
      // the built-in handling. Read `isDefaultPrevented()`, not
      // `defaultPrevented` — `useKeyboard` hands over a copy of the event whose
      // `defaultPrevented` field is fixed at the moment it was made.
      onKeyDown?.(e);

      if (!e.isDefaultPrevented()) {
        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowUp':
            handleArrowKey(e);
            break;
          case 'Enter':
            handleEnterKey(e);
            break;
          case 'Escape':
            handleEscapeKey(e);
            break;
          case 'Home':
          case 'End':
            handleEdgeKey(e);
            break;
        }
      }

      // An `Escape` that closed the list or cleared the text is prevented and
      // stays; otherwise it, and `Tab`, go on to a surrounding dialog.
      settleOverlayKey(e);
    },
  });

  if (icon === undefined) {
    icon = <SearchIcon />;
  }

  if (icon) {
    icon = <div data-element="InputIcon">{icon}</div>;

    if (prefix) {
      prefix = (
        <>
          {icon}
          {prefix}
        </>
      );
    } else {
      prefix = icon;
    }
  }

  const showClearButton =
    isClearable && effectiveInputValue !== '' && !isDisabled && !isReadOnly;

  const mods = {
    ...getValidationMods({ isInvalid, isValid }),
    disabled: isDisabled,
    readonly: !!isReadOnly,
    // Hover is handled purely via CSS `:hover`, so it never flows through mods.
    hovered: false,
    focused: isFocused,
    loading: showLoading,
    prefix: !!prefix,
    // Always reserve the suffix slot (it holds validation/loading/clear/trigger).
    suffix: true,
    clearable: showClearButton,
    ...props.mods,
  };

  const searchComboBoxWidth = wrapperRef?.current?.offsetWidth;

  // Highlight the first suggestion the user can pick when the popover opens or
  // the filtered results change, so the top match is visibly pre-selected
  // (parity with ComboBox's initial-focus behaviour). The user's own highlight
  // is left untouched while the focused option is still visible; a missing or
  // filtered-out focus falls back to the first option the user can pick, or to
  // none. A layout effect, so the first option is highlighted before paint;
  // ListBox's `useDisabledFocusReset` keeps any other reset off a disabled
  // option.
  useLayoutEffect(() => {
    if (!shouldShowPopover) return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const applyFocus = () => {
      if (!shouldShowPopover) return;

      const listState = listStateRef.current;

      if (listState && getVisibleKeys(listState).length > 0) {
        const focusedKey = listState.selectionManager.focusedKey;

        // Checked against this field's own keys: the list's can lag.
        if (focusedKey == null || !visibleItemKeys.includes(focusedKey)) {
          // The first option Enter can pick, or none, so Enter submits the
          // text; the arrow keys still reach a disabled one.
          markKeyboardFocus(listState);
          listState.selectionManager.setFocusedKey(
            selectableItemKeys[0] ?? null,
          );
          bumpFocus();
        }

        return;
      }

      // The listbox mounts inside a portal/transition, so its state may not be
      // ready on the first tick; retry a few times before giving up.
      attempts += 1;
      if (attempts < 8) {
        timer = setTimeout(applyFocus, 16);
      }
    };

    applyFocus();

    return () => {
      if (timer != null) clearTimeout(timer);
    };
  }, [shouldShowPopover, visibleItemKeys, selectableItemKeys]);

  // A load the popover stays shown through says so before the delayed
  // indicator, never a false "No results found".
  const resolvedEmptyLabel =
    emptyLabel !== undefined
      ? emptyLabel
      : isLoading
        ? t('searchComboBox.loading', 'Loading…')
        : t('searchComboBox.noResults', 'No results found');

  const searchComboBoxField = (
    <SearchComboBoxWrapperElement
      ref={wrapperRef}
      mods={mods}
      styles={styles}
      data-size={size}
      {...compositeFocusProps}
    >
      {prefix ? <div data-element="Prefix">{prefix}</div> : null}
      <SearchComboBoxInput
        customizationProps={pickBaseCustomizationProps(props)}
        qa={qa || 'SearchComboBox'}
        inputRef={inputRef}
        id={id}
        value={effectiveInputValue}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        size={size}
        mods={mods}
        inputProps={inputProps}
        inputStyles={inputStyles}
        keyboardProps={keyboardProps}
        focusProps={focusProps}
        isExpanded={shouldShowPopover}
        searchComboBoxId={searchComboBoxId}
        listStateRef={listStateRef}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
      />
      {/* Screen readers hear the empty state once the list settles on it, not
      while a load is still running. */}
      <EmptyLabelStatus>
        {shouldShowPopover && !hasResults && !isLoading
          ? resolvedEmptyLabel
          : null}
      </EmptyLabelStatus>
      <div data-element="Suffix">
        {suffixPosition === 'before' ? suffix : null}
        {showLoading ? (
          <LoadingIcon data-element="InputIcon" />
        ) : (
          validationIcon
        )}
        {suffixPosition === 'after' ? suffix : null}
        {showClearButton && (
          <Item.Action
            icon={<CloseIcon />}
            size={size}
            // No `theme` — see `ComboBox`: the default `current` type inherits
            // the input's already validation-tinted text color.
            qa="SearchComboBoxClearButton"
            data-no-trigger={hideTrigger ? '' : undefined}
            data-popover-dismiss=""
            aria-label={t('searchComboBox.clearValue', 'Clear value')}
            onPress={clearValue}
          />
        )}
        {!hideTrigger ? (
          <Item.Action
            ref={triggerRef}
            data-popover-trigger
            icon={<DirectionIcon to={shouldShowPopover ? 'up' : 'down'} />}
            qa="SearchComboBoxTrigger"
            mods={{
              pressed: shouldShowPopover,
              disabled: isDisabled,
              loading: showLoading,
            }}
            data-size={size}
            isDisabled={isDisabled}
            styles={triggerStyles}
            aria-expanded={shouldShowPopover}
            aria-haspopup="listbox"
            aria-label={t('searchComboBox.showOptions', 'Show options')}
            onPress={() => {
              if (!isDisabled) {
                const willOpen = !isPopoverOpen;
                setIsPopoverOpen(willOpen);
                if (willOpen) {
                  inputRef.current?.focus();
                  if (!hasResults) {
                    setIsFilterActive(false);
                  }
                }
              }
            }}
          />
        ) : null}
      </div>
      <ListBoxPopover
        isOpen={shouldShowPopover}
        triggerRef={wrapperRef as RefObject<HTMLElement>}
        popoverRef={popoverRef}
        listBoxRef={listBoxRef}
        direction={direction}
        shouldFlip={shouldFlip}
        overlayOffset={overlayOffset}
        containerPadding={containerPadding}
        comboBoxWidth={searchComboBoxWidth}
        listBoxId={`SearchComboBoxListBox-${searchComboBoxId}`}
        overlayStyles={overlayStyles}
        listBoxStyles={listBoxStyles}
        optionStyles={optionStyles}
        sectionStyles={sectionStyles}
        headingStyles={headingStyles}
        listGap={listGap}
        selectedKey={null}
        isDisabled={isDisabled}
        disabledKeys={disabledKeys}
        items={items}
        listStateRef={listStateRef}
        label={label}
        ariaLabel={(props as any)['aria-label']}
        compositeFocusProps={compositeFocusProps}
        filter={filterFn}
        size={size}
        emptyLabel={resolvedEmptyLabel}
        onSelectionChange={handleSelectionChange}
        onClose={() => setIsPopoverOpen(false)}
      >
        {children}
      </ListBoxPopover>
    </SearchComboBoxWrapperElement>
  );

  const { children: _, ...propsWithoutChildren } = props;

  return wrapWithField<Omit<CubeSearchComboBoxProps<T>, 'children'>>(
    searchComboBoxField,
    { ...propsWithoutChildren, ...fieldLayout.field },
  );
}) as unknown as (<T>(
  props: CubeSearchComboBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

SearchComboBox.Item = Item;

SearchComboBox.Section = BaseSection;
