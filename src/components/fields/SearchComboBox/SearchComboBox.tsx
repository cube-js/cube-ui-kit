import { FocusableRef, Key } from '@react-types/shared';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
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

import { useEvent } from '../../../_internal';
import { useI18n } from '../../../i18n';
import {
  CloseIcon,
  DirectionIcon,
  LoadingIcon,
  SearchIcon,
} from '../../../icons';
import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import { generateRandomId } from '../../../utils/random';
import { useCombinedRefs } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { usePopoverSync } from '../../../utils/react/usePopoverSync';
import { extractStyles } from '../../../utils/styles';
import { CollectionItem as Item } from '../../CollectionItem';
import { wrapWithField } from '../../form';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
import {
  filterCollectionNodes,
  getEdgeVisibleKey,
  getNextVisibleKey,
  getVisibleKeys,
  ListBoxPopover,
  markKeyboardFocus,
  useCompositeFocus,
} from '../ListBoxPopover';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

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
  extends BasePropsWithoutChildren,
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps,
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
  /** Callback fired when a key is pressed on the input */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

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

  /** Whether the search combobox is disabled */
  isDisabled?: boolean;
  /**
   * Whether items are being loaded (e.g. from a server). While loading, the
   * previous results stay visible; the loading indicator only appears after
   * `loadingDelay` to avoid flicker on fast responses.
   */
  isLoading?: boolean;
  /** Delay in milliseconds before the loading indicator is shown. Defaults to 1000. */
  loadingDelay?: number;
  /** Validation state of the search combobox */
  validationState?: 'valid' | 'invalid';
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

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

// ============================================================================
// Hook: useDelayedFlag
// ----------------------------------------------------------------------------
// Turns `true` only after `delay` ms of `active` staying true, and back to
// `false` immediately when `active` becomes false. Used to defer the loading
// indicator so fast responses never flash a loading state.
// ============================================================================
function useDelayedFlag(active: boolean, delay: number): boolean {
  const [flag, setFlag] = useState(false);

  useEffect(() => {
    if (!active) {
      setFlag(false);
      return;
    }

    if (delay <= 0) {
      setFlag(true);
      return;
    }

    const id = setTimeout(() => setFlag(true), delay);
    return () => clearTimeout(id);
  }, [active, delay]);

  return flag;
}

// ============================================================================
// Component: SearchComboBoxInput
// ============================================================================
interface SearchComboBoxInputProps {
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
      data-autofocus={autoFocus ? '' : undefined}
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
          ? `ListBoxItem-${listStateRef.current?.selectionManager.focusedKey}`
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
  props = useProviderProps(props);

  const { t } = useI18n();

  let {
    qa,
    label,
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
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
    loadingDelay = 1000,
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
    isReadOnly,
    overlayOffset = 8,
    containerPadding = 8,
    onOpenChange,
    onFocus,
    onBlur,
    onKeyDown,
    disabledKeys,
    ...otherProps
  } = props;

  // Generate a unique ID for this instance
  const searchComboBoxId = useMemo(() => generateRandomId(), []);

  // Normalize the wrapper/popover refs above popover-sync so it sees stable refs.
  wrapperRef = useCombinedRefs(wrapperRef);
  popoverRef = useCombinedRefs(popoverRef);

  // Input value state (controlled/uncontrolled)
  const isControlledInput = inputValue !== undefined;
  const [internalInputValue, setInternalInputValue] = useState(
    defaultInputValue ?? '',
  );
  const effectiveInputValue = isControlledInput
    ? (inputValue as string)
    : internalInputValue;

  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  usePopoverSync({
    menuId: searchComboBoxId,
    isOpen: isPopoverOpen,
    onClose: () => setIsPopoverOpen(false),
    triggerRef: wrapperRef as RefObject<HTMLElement | null>,
    containerRef: popoverRef as RefObject<HTMLElement | null>,
  });

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  const children = renderChildren as ReactNode;

  // Call onOpenChange when popover state changes
  useEffect(() => {
    onOpenChange?.(isPopoverOpen);
  }, [isPopoverOpen]);

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

  const { isFocused, focusProps } = useFocus({ isDisabled });

  const isInvalid = validationState === 'invalid';
  const validationIcon = isInvalid ? InvalidIcon : ValidIcon;
  const validation = cloneElement(validationIcon);

  const listStateRef = useRef<any>(null);

  const getItemLabel = useCallback(
    (key: Key): string => {
      const item = localCollectionState?.collection?.getItem(key);
      return item?.textValue || String(key);
    },
    [localCollectionState?.collection],
  );

  // Delayed loading indicator
  const showLoading = useDelayedFlag(!!isLoading, loadingDelay);

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

  // Flat list of selectable keys after filtering. Doubles as the dependency
  // that re-triggers auto-focus whenever the visible results change.
  const visibleItemKeys = useMemo(() => {
    const collection = localCollectionState?.collection;
    const keys: Key[] = [];
    if (!collection) return keys;

    const walk = (nodes: Iterable<any>) => {
      for (const node of nodes) {
        if (node.type === 'item') {
          if (!disabledKeySet.has(node.key)) keys.push(node.key);
        } else if (node.childNodes) {
          walk(node.childNodes);
        }
      }
    };

    walk(filterFn(collection) as Iterable<any>);
    return keys;
  }, [localCollectionState?.collection, filterFn, disabledKeySet]);

  const trimmedInput = effectiveInputValue.trim();

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

    inputRef.current?.focus();

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
  const handleCompositeBlur = useEvent(() => {
    setIsFilterActive(false);
    onBlur?.();
  });

  const { compositeFocusProps } = useCompositeFocus({
    wrapperRef,
    popoverRef,
    onFocus,
    onBlur: handleCompositeBlur,
    isDisabled,
  });

  // Keyboard navigation
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      onKeyDown?.(e as React.KeyboardEvent<HTMLInputElement>);

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        if (!isPopoverOpen) {
          if (!hasResults) {
            setIsFilterActive(false);
          }
          setIsPopoverOpen(true);
          return;
        }

        const listState = listStateRef.current;
        if (!listState) return;

        const isArrowDown = e.key === 'ArrowDown';
        const nextKey = getNextVisibleKey(listState, isArrowDown ? 1 : -1);

        if (nextKey != null) {
          markKeyboardFocus(listState);
          listState.selectionManager.setFocusedKey(nextKey);
        }
      } else if (e.key === 'Enter') {
        // Commit an option when the popover is open. Prefer the highlighted
        // option, but only when it's still visible (further typing may have
        // filtered it out); otherwise fall back to the first visible option so
        // typing a match and pressing Enter always selects the top result.
        //
        // `listStateRef` can still be null while the popover is mounting/
        // transitioning. In that window we fall back to the parent-computed
        // `visibleItemKeys` so a matching query commits via `onSelect` instead
        // of leaking through to `onSubmit`.
        if (isPopoverOpen) {
          const listState = listStateRef.current;
          const visibleKeys = listState
            ? getVisibleKeys(listState)
            : visibleItemKeys;
          const focusedKey = listState?.selectionManager.focusedKey;
          const keyToSelect =
            focusedKey != null && visibleKeys.includes(focusedKey)
              ? focusedKey
              : visibleKeys[0] ?? null;

          if (keyToSelect != null) {
            e.preventDefault();

            if (listState) {
              listState.selectionManager.select(keyToSelect, e);
            } else {
              // No mounted list state to route through — commit directly.
              handleSelectionChange(keyToSelect);
            }

            return;
          }
        }

        // No option available — optionally submit the raw text.
        const value = trimmedInput;
        if (onSubmit && value) {
          e.preventDefault();
          handleSubmit(value);
          return;
        }

        // Without onSubmit, Enter is a no-op (keep any empty state visible).
        e.preventDefault();
      } else if (e.key === 'Escape') {
        if (isPopoverOpen) {
          e.preventDefault();
          setIsPopoverOpen(false);
          inputRef.current?.focus();
        } else if (effectiveInputValue) {
          // Always preventDefault: type="search" clears natively on Escape
          // unless cancelled, which would bypass isClearable={false}.
          e.preventDefault();
          if (isClearable) {
            clearValue();
          }
        }
      } else if (e.key === 'Home' || e.key === 'End') {
        if (isPopoverOpen) {
          e.preventDefault();

          const listState = listStateRef.current;
          if (!listState) return;

          const targetKey = getEdgeVisibleKey(
            listState,
            e.key === 'Home' ? 'first' : 'last',
          );

          if (targetKey != null) {
            markKeyboardFocus(listState);
            listState.selectionManager.setFocusedKey(targetKey);
          }
        }
      }
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

  const mods = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: isDisabled,
      // Hover is handled purely via CSS `:hover`, so it never flows through mods.
      hovered: false,
      focused: isFocused,
      loading: showLoading,
      prefix: !!prefix,
      // Always reserve the suffix slot (it holds validation/loading/clear/trigger).
      suffix: true,
      clearable: showClearButton,
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isFocused,
      showLoading,
      prefix,
      showClearButton,
    ],
  );

  const searchComboBoxWidth = wrapperRef?.current?.offsetWidth;

  // Keep the popover visible while there's something meaningful to show:
  // results, a loading indicator, or an empty state for a non-empty query.
  // While a load is in flight but the delayed indicator hasn't kicked in yet,
  // suppress the empty state so users never see a false "No results found".
  const shouldShowPopover = Boolean(
    isPopoverOpen &&
      (hasResults || showLoading || (trimmedInput.length > 0 && !isLoading)),
  );

  // Highlight the first visible suggestion when the popover opens or when the
  // filtered results change, so the top match is visibly pre-selected (parity
  // with ComboBox's initial-focus behaviour). The user's own highlight is left
  // untouched while the focused option is still visible; a missing or
  // filtered-out focus falls back to the first visible key. This only drives
  // the visual highlight — Enter always resolves the option itself, so
  // correctness never depends on this effect's timing.
  useLayoutEffect(() => {
    if (!shouldShowPopover) return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const applyFocus = () => {
      if (!shouldShowPopover) return;

      const listState = listStateRef.current;

      if (listState) {
        const keys = getVisibleKeys(listState);

        if (keys.length > 0) {
          const focusedKey = listState.selectionManager.focusedKey;
          const isFocusValid = focusedKey != null && keys.includes(focusedKey);

          if (!isFocusValid) {
            markKeyboardFocus(listState);
            listState.selectionManager.setFocusedKey(keys[0]);
          }

          return;
        }
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
  }, [shouldShowPopover, visibleItemKeys]);

  const resolvedEmptyLabel =
    emptyLabel !== undefined
      ? emptyLabel
      : showLoading
        ? t('searchComboBox.loading', 'Loading…')
        : t('searchComboBox.noResults', 'No results found');

  const searchComboBoxField = (
    <SearchComboBoxWrapperElement
      ref={wrapperRef}
      mods={mods}
      styles={styles}
      style={{
        zIndex: isFocused ? 1 : 'initial',
      }}
      data-size={size}
      {...compositeFocusProps}
    >
      {prefix ? <div data-element="Prefix">{prefix}</div> : null}
      <SearchComboBoxInput
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
        inputStyles={inputStyles}
        keyboardProps={keyboardProps}
        focusProps={focusProps}
        isExpanded={shouldShowPopover}
        searchComboBoxId={searchComboBoxId}
        listStateRef={listStateRef}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
      />
      <div data-element="Suffix">
        {suffixPosition === 'before' ? suffix : null}
        {validationState || showLoading ? (
          <>
            {validationState && !showLoading ? validation : null}
            {showLoading ? <LoadingIcon data-element="InputIcon" /> : null}
          </>
        ) : null}
        {suffixPosition === 'after' ? suffix : null}
        {showClearButton && (
          <Item.Action
            icon={<CloseIcon />}
            size={size}
            theme={validationState === 'invalid' ? 'danger' : undefined}
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
            icon={<DirectionIcon to={isPopoverOpen ? 'up' : 'down'} />}
            qa="SearchComboBoxTrigger"
            mods={{
              pressed: isPopoverOpen,
              disabled: isDisabled,
              loading: showLoading,
            }}
            data-size={size}
            isDisabled={isDisabled}
            styles={triggerStyles}
            aria-expanded={isPopoverOpen}
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
    ref,
    propsWithoutChildren,
  );
}) as unknown as (<T>(
  props: CubeSearchComboBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

SearchComboBox.Item = Item;

SearchComboBox.Section = BaseSection;
