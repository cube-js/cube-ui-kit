import {
  KeyboardEvent as AriaKeyboardEvent,
  AriaLabelingProps,
  CollectionChildren,
  FocusableRef,
  Key,
} from '@react-types/shared';
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
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useCollator, useFilter, useKeyboard } from 'react-aria';
import { Section as BaseSection, useListState } from 'react-stately';

import { useEvent } from '../../../_internal';
import { useI18n } from '../../../i18n';
import { CloseIcon } from '../../../icons/CloseIcon';
import { DirectionIcon } from '../../../icons/DirectionIcon';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { FieldBaseProps, TextFieldKeyboardProps } from '../../../shared';
import { generateRandomId } from '../../../utils/random';
import { useCombinedRefs, useLayoutEffect } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { usePopoverSync } from '../../../utils/react/usePopoverSync';
import { extractStyles } from '../../../utils/styles';
import { CollectionItem as Item } from '../../CollectionItem';
import {
  getValidationIcon,
  getValidationMods,
  useFieldProps,
  wrapWithField,
} from '../../form';
import { getListBoxOptionId } from '../ListBox/optionId';
import {
  filterCollectionNodes,
  getEdgeVisibleKey,
  getNextVisibleKey,
  ListBoxPopover,
  ListStateLike,
  markKeyboardFocus,
  useCompositeFocus,
} from '../ListBoxPopover';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

import {
  CollectionLike,
  collectOptions,
  findTypedOption,
  getItemLabel,
  highlightOption,
  resolveHighlightedKey,
  sortSelectedFirst,
} from './comboBoxOptions';

type FilterFn = (textValue: string, inputValue: string) => boolean;

export type PopoverTriggerAction = 'focus' | 'input' | 'manual';

const ComboBoxWrapperElement = tasty({
  qa: 'ComboBoxWrapper',
  styles: INPUT_WRAPPER_STYLES,
});

const InputElement = tasty({
  as: 'input',
  styles: DEFAULT_INPUT_STYLES,
});

export interface CubeComboBoxProps<T>
  extends BasePropsWithoutChildren,
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps,
    FieldBaseProps<string | null | undefined> {
  /** The selected key in controlled mode */
  selectedKey?: string | null;
  /** The default selected key in uncontrolled mode */
  defaultSelectedKey?: string | null;
  /** Callback fired when selection changes */
  onSelectionChange?: (key: string | null) => void;

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
  /** Callback fired when focus enters the component (input, trigger, or popover). Does not receive event object. */
  onFocus?: () => void;
  /** Callback fired when focus leaves the component entirely. Does not receive event object. */
  onBlur?: () => void;
  /**
   * Callback fired when a key is pressed on the input, before the built-in
   * key handling. Receives React Aria's keyboard event: `e.preventDefault()`
   * skips the built-in handling for the key. `Escape` and `Tab` go on to
   * ancestors, such as a surrounding dialog, unless ComboBox acts on them
   * (`Escape` closing the list or clearing the value); other keys stop at the
   * input unless the handler calls `e.continuePropagation()`.
   */
  onKeyDown?: TextFieldKeyboardProps['onKeyDown'];

  /**
   * When the list opens on its own: `'input'` on typing or a press in the
   * input, `'focus'` on focus as well, `'manual'` only from the chevron and
   * the arrow keys. Defaults to `'input'`.
   */
  popoverTrigger?: PopoverTriggerAction;

  /** Items for the listbox (alternative to children) */
  items?: Iterable<T>;
  /** Children for the listbox (static items or render function) */
  children?: ReactNode | ((item: T) => ReactElement);

  /**
   * Custom filter function for determining if an option should be included.
   * Pass `false` to disable internal filtering completely.
   */
  filter?: FilterFn | false;

  /**
   * Whether to allow entering custom values that are not in the predefined
   * options. The typed text is committed trimmed; empty text commits `null`.
   */
  allowsCustomValue?: boolean;
  /**
   * Whether to commit custom value on blur in allowsCustomValue mode (default:
   * true). When `false`, only Enter or a pick commits, and blur discards the
   * uncommitted text: the input shows the selected option's label again, or
   * nothing when no option is selected.
   */
  shouldCommitOnBlur?: boolean;
  /** Whether to clear selection and input on blur when the text names no selectable item (default: false, only applies to non-custom-value mode) */
  clearOnBlur?: boolean;
  /** Whether the combobox is clearable using ESC key or clear button */
  isClearable?: boolean;
  /** Callback called when the clear button is pressed */
  onClear?: () => void;

  /** Left input icon */
  icon?: ReactElement;
  /** Input decoration before the main input */
  prefix?: ReactNode;
  /** Input decoration after the main input */
  suffix?: ReactNode;
  /** Whether to hide the trigger button */
  hideTrigger?: boolean;
  /** Size of the combobox */
  size?: 'small' | 'medium' | 'large' | (string & {});

  /** Ref for accessing the input element */
  inputRef?: RefObject<HTMLInputElement>;
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
  /** Space between options, in pixels. Defaults to a hairline (`1bw`). */
  listGap?: number;

  /** Whether the combobox is disabled */
  isDisabled?: boolean;
  /** Whether the combobox is in loading state */
  isLoading?: boolean;
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
  /**
   * Whether the combobox is read-only: the list doesn't open, and neither
   * keys nor blur change the value or the text.
   */
  isReadOnly?: boolean;
  /** Suffix position goes before or after the validation and loading statuses */
  suffixPosition?: 'before' | 'after';
  /**
   * Sort selected item to the top when the popover opens.
   * Only works when using the `items` prop (data-driven mode).
   * Ignored when using JSX children.
   * @default true when items are provided, false when using JSX children
   */
  sortSelectedToTop?: boolean;
  /**
   * Callback called when the list shows or hides. Not called on mount, nor
   * while typed text that matches nothing keeps it hidden.
   */
  onOpenChange?: (isOpen: boolean) => void;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

// ============================================================================
// Hook: useComboBoxState
// ============================================================================
interface UseComboBoxStateProps {
  selectedKey?: string | null;
  defaultSelectedKey?: string | null;
  inputValue?: string;
  defaultInputValue?: string;
  comboBoxId: string;
  triggerRef?: RefObject<HTMLElement | null>;
  popoverRef?: RefObject<HTMLElement | null>;
}

interface UseComboBoxStateReturn {
  effectiveSelectedKey: Key | null;
  /**
   * The uncontrolled input text. `null` until the user types, and again after
   * the text settles on the selection: the input then shows the selected
   * option's label, following the options as they load.
   */
  internalInputValue: string | null;
  isPopoverOpen: boolean;
  setIsPopoverOpen: (open: boolean) => void;
  setInternalSelectedKey: (key: Key | null) => void;
  setInternalInputValue: (value: string | null) => void;
  isControlledKey: boolean;
  isControlledInput: boolean;
}

function useComboBoxState({
  selectedKey,
  defaultSelectedKey,
  inputValue,
  defaultInputValue,
  comboBoxId,
  triggerRef,
  popoverRef,
}: UseComboBoxStateProps): UseComboBoxStateReturn {
  // Internal state for uncontrolled mode
  const [internalSelectedKey, setInternalSelectedKey] = useState<Key | null>(
    defaultSelectedKey ?? null,
  );
  const [internalInputValue, setInternalInputValue] = useState<string | null>(
    defaultInputValue ?? null,
  );

  const isControlledKey = selectedKey !== undefined;
  const isControlledInput = inputValue !== undefined;

  const effectiveSelectedKey = isControlledKey
    ? selectedKey
    : internalSelectedKey;

  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  usePopoverSync({
    menuId: comboBoxId,
    isOpen: isPopoverOpen,
    onClose: () => setIsPopoverOpen(false),
    triggerRef,
    containerRef: popoverRef,
  });

  return {
    effectiveSelectedKey,
    internalInputValue,
    isPopoverOpen,
    setIsPopoverOpen,
    setInternalSelectedKey,
    setInternalInputValue,
    isControlledKey,
    isControlledInput,
  };
}

// ============================================================================
// Hook: useSelectedLabel
// ============================================================================
interface UseSelectedLabelReturn {
  /**
   * The text the input shows for the selection: its option's label, else the
   * last label found for that key while the options leave it out (loading, a
   * refetch, a server-side search), else the key itself — a custom value or an
   * option that has not loaded yet.
   */
  selectedLabel: string;
  /**
   * The label of `key`'s option, remembered for the key so the input keeps it
   * when the same update drops the option.
   */
  pickLabel: (key: Key) => string;
}

function useSelectedLabel(
  collection: CollectionLike,
  selectedKey: Key | null,
): UseSelectedLabelReturn {
  const [knownLabel, setKnownLabel] = useState<{
    key: Key;
    label: string;
  } | null>(null);

  const pickLabel = (key: Key) => {
    const picked = getItemLabel(collection, key);

    setKnownLabel({ key, label: picked });

    return picked;
  };

  if (selectedKey == null) return { selectedLabel: '', pickLabel };

  const label = collection.getItem(selectedKey)?.textValue;

  if (
    label &&
    (knownLabel?.key !== selectedKey || knownLabel.label !== label)
  ) {
    setKnownLabel({ key: selectedKey, label });
  }

  const selectedLabel =
    label ||
    (knownLabel?.key === selectedKey ? knownLabel.label : String(selectedKey));

  return { selectedLabel, pickLabel };
}

// ============================================================================
// Hook: useComboBoxFiltering
// ============================================================================
interface UseComboBoxFilteringProps {
  effectiveInputValue: string;
  filter: FilterFn | false | undefined;
}

interface UseComboBoxFilteringReturn {
  filterFn: (nodes: Iterable<any>) => Iterable<any>;
  /** Whether the typed text is an option's label, compared like the filter. */
  isSameText: (textValue: string, text: string) => boolean;
  isFilterActive: boolean;
  setIsFilterActive: (active: boolean) => void;
}

function useComboBoxFiltering({
  effectiveInputValue,
  filter,
}: UseComboBoxFilteringProps): UseComboBoxFilteringReturn {
  const [isFilterActive, setIsFilterActive] = useState(false);

  const { contains } = useFilter({ sensitivity: 'base' });
  // The collator `useFilter` matches with, so the filter and the exact-match
  // check agree on case, accents and locale rules.
  const collator = useCollator({ usage: 'search', sensitivity: 'base' });

  const isSameText = (textValue: string, text: string) =>
    collator.compare(textValue.normalize('NFC'), text.normalize('NFC')) === 0;

  const textFilterFn: FilterFn =
    filter === false ? () => true : filter || contains;

  // Create a filter function for collection nodes
  const filterFn = (nodes: Iterable<any>) => {
    const term = effectiveInputValue.trim();

    // Don't filter if not active or no search term
    if (!isFilterActive || !term) {
      return nodes;
    }

    return filterCollectionNodes(nodes, term, textFilterFn);
  };

  return {
    filterFn,
    isSameText,
    isFilterActive,
    setIsFilterActive,
  };
}

// ============================================================================
// Hook: useComboBoxKeyboard
// ============================================================================
interface UseComboBoxKeyboardProps {
  /** Whether the list is shown: open, with options to show. */
  isListShown: boolean;
  isReadOnly?: boolean;
  listStateRef: RefObject<any>;
  hasResults: boolean;
  allowsCustomValue?: boolean;
  effectiveInputValue: string;
  selectedKey: Key | null;
  /** The text the input shows for the selection. */
  selectedLabel: string;
  isClearable?: boolean;
  onSelectionChange: (selection: Key | Key[] | null) => void;
  onClearValue: () => void;
  onOpenList: () => void;
  onCloseList: () => void;
  inputRef: RefObject<HTMLInputElement>;
  /** Called with the option the arrow keys moved virtual focus to. */
  onVirtualFocus: (key: Key) => void;
  onKeyDown?: TextFieldKeyboardProps['onKeyDown'];
}

// Keys that go on to a surrounding dialog unless the field acts on them:
// Escape closes it, and its focus containment listens for Tab.
const OVERLAY_KEYS = new Set(['Escape', 'Tab']);

// An IME takes Enter, the arrow keys and Escape while it composes text: they
// confirm, pick or cancel its candidate.
function isComposing(e: AriaKeyboardEvent) {
  return e.nativeEvent?.isComposing || e.keyCode === 229;
}

function useComboBoxKeyboard({
  isListShown,
  isReadOnly,
  listStateRef,
  hasResults,
  allowsCustomValue,
  effectiveInputValue,
  selectedKey,
  selectedLabel,
  isClearable,
  onSelectionChange,
  onClearValue,
  onOpenList,
  onCloseList,
  inputRef,
  onVirtualFocus,
  onKeyDown,
}: UseComboBoxKeyboardProps) {
  // Moves the virtual focus to `key`, if there is one, and scrolls it into view.
  const focusOption = (listState: ListStateLike, key: Key | null) => {
    if (key == null) return;

    markKeyboardFocus(listState);
    listState.selectionManager.setFocusedKey(key);
    onVirtualFocus(key);
  };

  const handleArrowKey = (e: AriaKeyboardEvent) => {
    e.preventDefault();

    if (!isListShown) {
      onOpenList();

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

  // With `allowsCustomValue`, Enter commits the typed text, trimmed, and empty
  // text clears the selection. The selection's own label is already
  // committed.
  const commitTypedText = (e: AriaKeyboardEvent) => {
    const value = effectiveInputValue.trim();

    // A closed list lets Enter go on to submit the form with the value.
    if (isListShown || !value) e.preventDefault();

    if (value && selectedKey != null && value === selectedLabel) return;

    onSelectionChange(value || null);
  };

  const handleEnterKey = (e: AriaKeyboardEvent) => {
    const listState = isListShown ? listStateRef.current : null;
    // Read the highlight here rather than from the list: the list highlights
    // the first match a couple of frames after the text changes, and a fast
    // Enter comes first.
    const key = listState
      ? resolveHighlightedKey(listState, selectedKey)
      : null;

    if (key != null) {
      e.preventDefault();
      listState.selectionManager.select(key, e);
      // Close even when the selection stays the same.
      onCloseList();
      inputRef.current?.focus();
    } else if (allowsCustomValue) {
      commitTypedText(e);
    } else if (!hasResults || !effectiveInputValue.trim()) {
      // Text that names nothing, or none, clears the selection.
      e.preventDefault();
      onSelectionChange(null);
    }
  };

  // Returns whether Escape did something; otherwise it goes on to close a
  // surrounding dialog.
  const handleEscapeKey = (e: AriaKeyboardEvent) => {
    if (isListShown) {
      e.preventDefault();
      onCloseList();
      inputRef.current?.focus();

      return true;
    }

    if (effectiveInputValue && isClearable) {
      e.preventDefault();
      onClearValue();

      return true;
    }

    return false;
  };

  const handleEdgeKey = (e: AriaKeyboardEvent) => {
    if (!isListShown) return;

    e.preventDefault();

    const listState = listStateRef.current;

    if (listState) {
      focusOption(
        listState,
        getEdgeVisibleKey(listState, e.key === 'Home' ? 'first' : 'last'),
      );
    }
  };

  // Handles the key and returns whether it stays at the input.
  const handleKey = (e: AriaKeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        handleArrowKey(e);
        return true;
      case 'Enter':
        handleEnterKey(e);
        return true;
      case 'Escape':
        return handleEscapeKey(e);
      case 'Home':
      case 'End':
        handleEdgeKey(e);
        return true;
      case 'Tab':
        // Focus moves on, so the list closes; Tab itself is never held.
        if (isListShown) onCloseList();
        return false;
      default:
        return true;
    }
  };

  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      // The user's handler runs first, and a key it prevents is theirs: skip
      // the built-in handling. Read `isDefaultPrevented()`, not
      // `defaultPrevented` — `useKeyboard` hands over a copy of the event whose
      // `defaultPrevented` field is fixed at the moment it was made.
      onKeyDown?.(e);

      if (e.isDefaultPrevented() || isComposing(e)) return;

      // A read-only field neither opens, picks nor clears. Escape and Tab go
      // on to a surrounding dialog unless handled here, as for any field.
      if ((isReadOnly || !handleKey(e)) && OVERLAY_KEYS.has(e.key)) {
        e.continuePropagation();
      }
    },
  });

  return { keyboardProps };
}

// ============================================================================
// Component: ComboBoxInput
// ============================================================================
interface ComboBoxInputProps {
  qa?: string;
  inputRef: RefObject<HTMLInputElement>;
  id?: string;
  value: string;
  placeholder?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  size: string;
  mods: Record<string, any>;
  inputStyles?: Styles;
  keyboardProps: any;
  focusProps: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  onPointerDown: () => void;
  onClick: () => void;
  /** Whether the list is shown: open, with options to show. */
  isListShown: boolean;
  comboBoxId: string;
  /** The id of the option under virtual focus, while the popover is open. */
  activeDescendant?: string;
  /**
   * The caller's naming and the field's description and message. The input is
   * the control, so they belong on it rather than on the wrapper.
   */
  ariaProps: AriaLabelingProps;
  isInvalid?: boolean;
}

const ComboBoxInput = forwardRef<HTMLInputElement, ComboBoxInputProps>(
  function ComboBoxInput(
    {
      qa,
      inputRef,
      id,
      value,
      placeholder,
      isDisabled,
      isReadOnly,
      isRequired,
      autoFocus,
      autoComplete,
      size,
      mods,
      inputStyles,
      keyboardProps,
      focusProps,
      onChange,
      onFocus,
      onPointerDown,
      onClick,
      isListShown,
      comboBoxId,
      activeDescendant,
      ariaProps,
      isInvalid,
    },
    ref,
  ) {
    const combinedRef = useCombinedRefs(ref, inputRef);

    return (
      <InputElement
        ref={combinedRef}
        qa={qa}
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        isDisabled={isDisabled}
        readOnly={isReadOnly}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        data-autofocus={autoFocus ? '' : undefined}
        onChange={onChange}
        onFocus={onFocus}
        onPointerDown={onPointerDown}
        onClick={onClick}
        onBlur={focusProps.onBlur}
        {...keyboardProps}
        styles={inputStyles}
        mods={mods}
        data-size={size}
        data-input-type="combobox"
        role="combobox"
        // `ComboBox` builds its own trigger rather than going through a
        // react-aria field hook, so nothing else would announce that the field
        // is mandatory — the label marker alone is not exposed to assistive
        // technology.
        aria-required={isRequired || undefined}
        aria-expanded={isListShown}
        aria-haspopup="listbox"
        aria-controls={
          isListShown ? `ComboBoxListBox-${comboBoxId}` : undefined
        }
        // Typing filters the options.
        aria-autocomplete="list"
        aria-activedescendant={activeDescendant}
        aria-invalid={isInvalid || undefined}
        {...ariaProps}
      />
    );
  },
);

// ============================================================================
// Main Component: ComboBox
// ============================================================================
export const ComboBox = forwardRef(function ComboBox<T extends object>(
  props: CubeComboBoxProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => {
      return {
        // Form value maps to selectedKey (the committed value) in both modes
        selectedKey: value ?? null,
        onSelectionChange(val: string | null) {
          // Commit selection changes to the form
          onChange(val);
        },
      };
    },
  });

  const { t } = useI18n();

  let {
    qa,
    label,
    extra,
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
    inputStyles,
    optionStyles,
    triggerStyles,
    listBoxStyles,
    overlayStyles,
    suffix,
    hideTrigger,
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
    selectedKey,
    defaultSelectedKey,
    inputValue,
    defaultInputValue,
    onInputChange,
    isClearable,
    onClear,
    placeholder,
    allowsCustomValue,
    shouldCommitOnBlur = true,
    clearOnBlur,
    items,
    children: renderChildren,
    sectionStyles,
    headingStyles,
    listGap,
    isReadOnly,
    overlayOffset = 8,
    containerPadding = 8,
    onSelectionChange: externalOnSelectionChange,
    sortSelectedToTop: sortSelectedToTopProp,
    onOpenChange,
    onFocus,
    onBlur,
    onKeyDown,
    form,
    ...otherProps
  } = props;

  // Generate a unique ID for this combobox instance
  const comboBoxId = useMemo(() => generateRandomId(), []);

  // Hoist the wrapper/popover ref normalization above `useComboBoxState` so
  // the popover-sync inside it sees stable, attached refs. Other ref combines
  // happen below alongside the legacy ordering.
  // The field's ref is the wrapper's, with or without the field chrome.
  wrapperRef = useCombinedRefs(wrapperRef, ref);
  popoverRef = useCombinedRefs(popoverRef);

  // State management hook
  const {
    effectiveSelectedKey,
    internalInputValue,
    isPopoverOpen,
    setIsPopoverOpen,
    setInternalSelectedKey,
    setInternalInputValue,
    isControlledKey,
    isControlledInput,
  } = useComboBoxState({
    selectedKey,
    defaultSelectedKey,
    inputValue,
    defaultInputValue,
    comboBoxId,
    triggerRef: wrapperRef as RefObject<HTMLElement | null>,
    popoverRef: popoverRef as RefObject<HTMLElement | null>,
  });

  // Default to true if items are provided, false otherwise
  const sortSelectedToTop = sortSelectedToTopProp ?? (items ? true : false);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  // The selection the options are sorted by. It follows the selection while
  // the list is closed and holds still while it is open, so a pick doesn't
  // reorder the list under the pointer.
  const [sortKey, setSortKey] = useState(effectiveSelectedKey);

  if (!isPopoverOpen && sortKey !== effectiveSelectedKey) {
    setSortKey(effectiveSelectedKey);
  }

  // Sort items with selected on top if enabled
  const sortedItems =
    items && sortSelectedToTop ? sortSelectedFirst(items, sortKey) : items;

  // Preserve the original `children` (may be a render function) before we
  // potentially overwrite it.
  let children: ReactNode = renderChildren as ReactNode;

  const renderFn = renderChildren as unknown;

  if (sortedItems && typeof renderFn === 'function') {
    try {
      const itemsArray = Array.from(sortedItems as Iterable<any>);
      children = itemsArray.map((item, idx) => {
        const rendered = (renderFn as (it: any) => ReactNode)(item);
        if (
          React.isValidElement(rendered) &&
          (rendered as ReactElement).key == null
        ) {
          return React.cloneElement(rendered as ReactElement, {
            key: (rendered as any)?.key ?? item?.key ?? idx,
          });
        }

        return rendered as ReactNode;
      });
    } catch {
      // If conversion fails, proceed with the original children
    }
  }

  // Create local collection state for reading item data (labels, etc.)
  // This allows us to read item labels even before the popover opens
  const localCollectionState = useListState({
    children: children as CollectionChildren<T>,
    items: sortedItems,
    disabledKeys: props.disabledKeys,
    selectionMode: 'none', // Don't manage selection in this state
  });

  const { selectedLabel, pickLabel } = useSelectedLabel(
    localCollectionState.collection,
    effectiveSelectedKey,
  );
  const effectiveInputValue = isControlledInput
    ? (inputValue as string)
    : internalInputValue ?? selectedLabel;

  // Filtering hook
  const { filterFn, isSameText, isFilterActive, setIsFilterActive } =
    useComboBoxFiltering({
      effectiveInputValue,
      filter,
    });

  // The options the typed text leaves in the list.
  const filteredOptions = collectOptions(
    filterFn(localCollectionState.collection),
  );
  const hasResults = filteredOptions.length > 0;
  const shouldShowPopover = isPopoverOpen && hasResults;

  // Report the list showing or hiding, as the user sees it: not on mount, and
  // not for text that reopens an empty list keystroke after keystroke.
  const reportedOpenRef = useRef(shouldShowPopover);

  useEffect(() => {
    if (reportedOpenRef.current === shouldShowPopover) return;

    reportedOpenRef.current = shouldShowPopover;
    onOpenChange?.(shouldShowPopover);
  }, [shouldShowPopover, onOpenChange]);

  const { isFocused, focusProps } = useFocus();

  // ---- selection and text -------------------------------------------------
  // Writes the selected key, unless it is controlled. It does not report:
  // each outcome calls `onSelectionChange` itself, in the order it has always
  // fired relative to `onInputChange`.
  const setSelectedKey = (key: Key | null) => {
    if (!isControlledKey) setInternalSelectedKey(key);
  };

  // Settles the uncontrolled text on the selection, so it shows the selected
  // option's label — the controlled one when a parent declines a change — and
  // reports `label`, the text for the selection being settled on, when it
  // differs from the text shown now.
  const showSelectionLabel = (label: string) => {
    if (!isControlledInput) setInternalInputValue(null);
    if (label !== effectiveInputValue) onInputChange?.(label);
  };

  // ---- blur ---------------------------------------------------------------
  // Blur reports only what it changes.
  const clearSelectionAndInput = () => {
    if (effectiveSelectedKey != null) {
      externalOnSelectionChange?.(null);
      setSelectedKey(null);
    }

    showSelectionLabel('');
  };

  // Reset input to show current selection (or empty if none)
  const restoreSelectedLabel = () => showSelectionLabel(selectedLabel);

  // In allowsCustomValue mode: commit the trimmed text if it's non-empty and
  // nothing is selected, clear the selection if the text is empty. Otherwise,
  // including with `shouldCommitOnBlur={false}`, the input shows the selection
  // again and the uncommitted text is dropped.
  const settleCustomValueOnBlur = () => {
    const value = effectiveInputValue.trim();

    if (shouldCommitOnBlur && value && effectiveSelectedKey == null) {
      externalOnSelectionChange?.(value);
      setSelectedKey(value);
      showSelectionLabel(value);
    } else if (!value) {
      clearSelectionAndInput();
    } else {
      restoreSelectedLabel();
    }
  };

  // In non-custom-value mode: auto-select the exact match, or the only filtered
  // result, unless it is disabled; keep a selected item even when it is
  // disabled; clear invalid input (no selectable match) when clearOnBlur is set
  // or the input is empty.
  const settleOptionOnBlur = () => {
    const matchKey = findTypedOption(
      filteredOptions,
      effectiveInputValue,
      effectiveSelectedKey,
      localCollectionState.disabledKeys,
      isSameText,
    );

    if (matchKey != null && matchKey !== effectiveSelectedKey) {
      setSelectedKey(matchKey);
      showSelectionLabel(pickLabel(matchKey));
      externalOnSelectionChange?.(matchKey as string);
    } else if (
      matchKey == null &&
      (clearOnBlur || !effectiveInputValue.trim())
    ) {
      clearSelectionAndInput();
    } else {
      restoreSelectedLabel();
    }
  };

  // Composite blur handler - fires when focus leaves the entire component
  const handleCompositeBlur = useEvent(() => {
    setIsPopoverOpen(false);

    // A read-only field keeps its value and text.
    if (isReadOnly) {
      // Nothing to settle.
    } else if (allowsCustomValue) {
      settleCustomValueOnBlur();
    } else {
      settleOptionOnBlur();
    }

    onBlur?.();
    // Only now: the match above needs the filter still active.
    setIsFilterActive(false);
  });

  // Composite focus hook - handles focus tracking across wrapper and portaled popover
  const { compositeFocusProps } = useCompositeFocus({
    wrapperRef,
    popoverRef,
    onFocus,
    onBlur: handleCompositeBlur,
    isDisabled,
  });

  let validationIcon = getValidationIcon({ isInvalid, isValid });

  // Ref to access internal ListBox state
  const listStateRef = useRef<any>(null);
  // The option under virtual focus, mirrored in state for the input's
  // `aria-activedescendant`: the listbox's own state update does not re-render
  // this component.
  const [activeOptionKey, setActiveOptionKey] = useState<Key | null>(null);

  // Selection change handler
  const handleSelectionChange = useEvent((selection: Key | Key[] | null) => {
    // Extract single key from selection (we only support single selection)
    const key = Array.isArray(selection) ? selection[0] : selection;

    setSelectedKey(key ?? null);
    setIsFilterActive(false);
    showSelectionLabel(key != null ? pickLabel(key) : '');
    externalOnSelectionChange?.(key as string | null);

    // Close popover after selection
    setIsPopoverOpen(false);

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  });

  const lastSyncedSelectedKey = useRef<Key | null | undefined>(undefined);
  const selectionClearedByTyping = useRef(false);

  // Input change handler
  const handleInputChange = useEvent(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Update input value
      if (!isControlledInput) {
        setInternalInputValue(value);
      }
      onInputChange?.(value);

      const trimmed = value.trim();
      setIsFilterActive(trimmed.length > 0);

      // Only clear selection in allowsCustomValue mode
      // In normal mode, typing just filters - selection stays until explicitly changed
      if (allowsCustomValue && effectiveSelectedKey != null) {
        selectionClearedByTyping.current = true;
        if (!isControlledKey) {
          setInternalSelectedKey(null);
        }
        externalOnSelectionChange?.(null);
      }

      // Open popover based on trigger
      if (popoverTrigger !== 'manual' && value && !isPopoverOpen) {
        setIsPopoverOpen(true);
      }
    },
  );

  // When a controlled selection changes, the uncontrolled text settles on it
  // and shows its label, which follows the options as they load.
  useEffect(() => {
    const preserveTypedInput = selectionClearedByTyping.current;
    selectionClearedByTyping.current = false;
    // Only run when selectedKey is controlled but inputValue is uncontrolled
    if (!isControlledKey || isControlledInput) return;

    // Skip if the key hasn't actually changed (prevents unnecessary resets when collection rebuilds)
    if (
      lastSyncedSelectedKey.current !== undefined &&
      lastSyncedSelectedKey.current === effectiveSelectedKey
    ) {
      return;
    }

    lastSyncedSelectedKey.current = effectiveSelectedKey;

    // Acknowledging the selection cleared by this edit must not erase the
    // text that caused it. Later external clears still reset the input.
    if (preserveTypedInput && effectiveSelectedKey == null) return;

    setInternalInputValue(null);
  }, [
    isControlledKey,
    isControlledInput,
    effectiveSelectedKey,
    effectiveInputValue,
    setInternalInputValue,
  ]);

  // Clear button logic
  let hasValue = allowsCustomValue
    ? effectiveInputValue !== ''
    : effectiveSelectedKey != null;
  let showClearButton = isClearable && hasValue && !isDisabled && !isReadOnly;

  // Opens the list, showing every option when the typed text matches none. A
  // read-only field never opens it.
  const openList = () => {
    if (isReadOnly || isDisabled) return;
    if (!hasResults) setIsFilterActive(false);

    setIsPopoverOpen(true);
  };

  // The chevron toggles the list and leaves focus in the input.
  const toggleList = () => {
    if (shouldShowPopover) {
      setIsPopoverOpen(false);
    } else {
      openList();
    }

    inputRef.current?.focus();
  };

  // Input focus handler
  const handleInputFocus = useEvent((e: React.FocusEvent<HTMLInputElement>) => {
    // Call focus props handler if it exists
    focusProps.onFocus?.(e as any);

    if (popoverTrigger === 'focus' && !isPopoverOpen) {
      openList();
    }
  });

  // Whether the pointer went down on the input itself. The field's label
  // forwards its own click to the input, and that click only focuses.
  const pressStartedOnInputRef = useRef(false);

  // A press in the input opens a closed list, focused or not, with the options
  // the typed text leaves. Text that matches nothing keeps the list hidden, so
  // a press that moves the caret doesn't change what Enter commits; the
  // chevron and the arrow keys show every option instead. A press on an open
  // list only moves the caret.
  const handleInputClick = () => {
    const isInputPress = pressStartedOnInputRef.current;

    pressStartedOnInputRef.current = false;

    if (!isInputPress || popoverTrigger === 'manual') return;
    if (!shouldShowPopover && hasResults) openList();
  };

  // Input blur handler - just handles internal focus props
  const handleInputBlur = useEvent((e: React.FocusEvent<HTMLInputElement>) => {
    focusProps.onBlur?.(e as any);
  });

  // Clear function
  let clearValue = useEvent(() => {
    // Clear input
    if (!isControlledInput) {
      setInternalInputValue(null);
    }
    onInputChange?.('');

    // Clear selection
    setSelectedKey(null);
    externalOnSelectionChange?.(null);

    // Close popover
    if (isPopoverOpen) {
      setIsPopoverOpen(false);
    }

    // Focus input
    inputRef.current?.focus();

    onClear?.();
  });

  // Keyboard navigation hook
  const { keyboardProps } = useComboBoxKeyboard({
    isListShown: shouldShowPopover,
    isReadOnly,
    listStateRef,
    hasResults,
    allowsCustomValue,
    effectiveInputValue,
    selectedKey: effectiveSelectedKey,
    selectedLabel,
    isClearable,
    onSelectionChange: handleSelectionChange,
    onClearValue: clearValue,
    onOpenList: openList,
    onCloseList: () => setIsPopoverOpen(false),
    inputRef,
    onVirtualFocus: setActiveOptionKey,
    onKeyDown,
  });

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

  let mods = useMemo(
    () => ({
      ...getValidationMods({ isInvalid, isValid }),
      disabled: isDisabled,
      hovered: false,
      focused: isFocused,
      loading: isLoading,
      prefix: !!prefix,
      suffix: true,
      clearable: showClearButton,
    }),
    [
      isInvalid,
      isValid,
      isDisabled,
      isFocused,
      isLoading,
      prefix,
      showClearButton,
    ],
  );

  // The list is at least as wide as the field, measured as it shows.
  const [comboBoxWidth, setComboBoxWidth] = useState<number>();

  // Close popover if no results
  useEffect(() => {
    if (isPopoverOpen && !hasResults) {
      setIsPopoverOpen(false);
    }
  }, [isPopoverOpen, hasResults, setIsPopoverOpen]);

  // Highlight an option once the list shows, and again whenever the typed
  // text filters the list, so the input's active descendant follows it. The
  // list mounts its collection over the next few frames.
  useLayoutEffect(() => {
    if (!shouldShowPopover) return;

    setComboBoxWidth(wrapperRef.current?.offsetWidth);

    let attempts = 0;
    let frame = 0;

    const tick = () => {
      const key = highlightOption(listStateRef.current, effectiveSelectedKey);

      if (key != null) setActiveOptionKey(key);

      attempts += 1;

      if (key == null && attempts < 8) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(frame);
  }, [
    shouldShowPopover,
    effectiveSelectedKey,
    effectiveInputValue,
    wrapperRef,
  ]);

  // Only an option the filter keeps is rendered.
  const activeDescendant =
    shouldShowPopover &&
    activeOptionKey != null &&
    filteredOptions.some((option) => option.key === activeOptionKey)
      ? getListBoxOptionId(`ComboBoxListBox-${comboBoxId}`, activeOptionKey)
      : undefined;

  const comboBoxField = (
    <ComboBoxWrapperElement
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
      <ComboBoxInput
        qa={qa || 'ComboBox'}
        inputRef={inputRef}
        id={id}
        value={effectiveInputValue}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isRequired={isRequired}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        size={size}
        mods={mods}
        inputStyles={inputStyles}
        keyboardProps={keyboardProps}
        focusProps={{ ...focusProps, onBlur: handleInputBlur }}
        isListShown={shouldShowPopover}
        comboBoxId={comboBoxId}
        activeDescendant={activeDescendant}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onPointerDown={() => {
          pressStartedOnInputRef.current = true;
        }}
        onClick={handleInputClick}
        ariaProps={{
          'aria-label': (props as AriaLabelingProps)['aria-label'],
          'aria-labelledby': (props as AriaLabelingProps)['aria-labelledby'],
          'aria-describedby': (props as AriaLabelingProps)['aria-describedby'],
        }}
        isInvalid={isInvalid}
      />
      <div data-element="Suffix">
        {suffixPosition === 'before' ? suffix : null}
        {isLoading ? <LoadingIcon data-element="InputIcon" /> : validationIcon}
        {suffixPosition === 'after' ? suffix : null}
        {showClearButton && (
          <Item.Action
            excludeFromTabOrder
            icon={<CloseIcon />}
            size={size}
            // No `theme` — the default `current` type inherits the input's own
            // text color, which is already validation-tinted, so the button
            // matches the text beside it exactly instead of using the fixed
            // `danger.clear` palette.
            qa="ComboBoxClearButton"
            data-no-trigger={hideTrigger ? '' : undefined}
            data-popover-dismiss=""
            aria-label={t('comboBox.clearValue', 'Clear value')}
            onPress={clearValue}
          />
        )}
        {!hideTrigger ? (
          // Pointer-only, as is the clear button: the input opens, closes
          // and clears from the keyboard itself.
          <Item.Action
            ref={triggerRef}
            excludeFromTabOrder
            data-popover-trigger
            icon={<DirectionIcon to={shouldShowPopover ? 'up' : 'down'} />}
            qa="ComboBoxTrigger"
            mods={{
              pressed: shouldShowPopover,
              disabled: isDisabled,
              loading: isLoading,
            }}
            data-size={size}
            isDisabled={isDisabled}
            styles={triggerStyles}
            aria-expanded={shouldShowPopover}
            aria-haspopup="listbox"
            aria-label={t('comboBox.showOptions', 'Show options')}
            onPress={toggleList}
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
        comboBoxWidth={comboBoxWidth}
        listBoxId={`ComboBoxListBox-${comboBoxId}`}
        overlayStyles={overlayStyles}
        listBoxStyles={listBoxStyles}
        optionStyles={optionStyles}
        sectionStyles={sectionStyles}
        headingStyles={headingStyles}
        listGap={listGap}
        selectedKey={effectiveSelectedKey}
        // A press in the field, such as one that moves the caret, keeps the
        // list open; the chevron toggles it on its own.
        shouldCloseOnTriggerInteraction={false}
        isDisabled={isDisabled}
        disabledKeys={props.disabledKeys}
        items={sortedItems}
        listStateRef={listStateRef}
        label={label}
        ariaLabel={(props as any)['aria-label']}
        compositeFocusProps={compositeFocusProps}
        filter={filterFn}
        size={size}
        onSelectionChange={handleSelectionChange}
        onClose={() => setIsPopoverOpen(false)}
      >
        {children}
      </ListBoxPopover>
    </ComboBoxWrapperElement>
  );

  const { children: _, ...propsWithoutChildren } = props;

  return wrapWithField<Omit<CubeComboBoxProps<T>, 'children'>>(
    comboBoxField,
    propsWithoutChildren,
  );
}) as unknown as (<T>(
  props: CubeComboBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

ComboBox.Item = Item;

ComboBox.Section = BaseSection;

Object.defineProperty(ComboBox, 'cubeInputType', {
  value: 'ComboBox',
  enumerable: false,
  configurable: false,
});
