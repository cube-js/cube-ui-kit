import { useControlledState } from '@react-stately/utils';
import { Key } from '@react-types/shared';
import {
  BasePropsWithoutChildren,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  ClipboardEvent,
  cloneElement,
  FocusEvent,
  ForwardedRef,
  forwardRef,
  isValidElement,
  KeyboardEvent,
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
import { useFilter, useId, useTextField, VisuallyHidden } from 'react-aria';
import { Section as BaseSection, useListState } from 'react-stately';

import { useEvent } from '../../../_internal';
import { useFormatter, useI18n } from '../../../i18n';
import { CloseIcon } from '../../../icons/CloseIcon';
import { DirectionIcon } from '../../../icons/DirectionIcon';
import { generateRandomId } from '../../../utils/random';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import {
  castNullableArrayValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { extractStyles } from '../../../utils/styles';
import { ItemAction } from '../../actions/ItemAction/ItemAction';
import { CollectionItem as Item } from '../../CollectionItem';
import { useFieldProps } from '../../form/Form/use-field/use-field-props';
import { wrapWithField } from '../../form/wrapper';
import { getListBoxOptionId } from '../ListBox/optionId';
import {
  collectVisibleKeys,
  filterCollectionNodes,
  getEdgeVisibleKey,
  getNextVisibleKey,
  ListBoxPopover,
  ListStateLike,
  markKeyboardFocus,
  useCompositeFocus,
} from '../ListBoxPopover';
import { TextInputBase } from '../TextInput/TextInputBase';

import { TagList, TagListEntry } from './TagList';

import type { FieldBaseProps } from '../../../shared';
import type { CubeTagProps } from '../../content/Tag/Tag';

type FilterFn = (textValue: string, inputValue: string) => boolean;

export type TagInputPopoverTrigger = 'focus' | 'input' | 'manual';

/**
 * What `validateTag` returns: `true` (or nothing) accepts the value, `false`
 * rejects it with the default message, and a string rejects it with that
 * message.
 */
export type TagValidationResult = boolean | string | null | undefined;

export interface CubeTagInputProps<T = object>
  extends BasePropsWithoutChildren,
    ContainerStyleProps,
    FieldBaseProps<readonly string[] | null | undefined> {
  /** The values in controlled mode. */
  value?: readonly string[];
  /** The initial values in uncontrolled mode. */
  defaultValue?: readonly string[];
  /** Called with the whole new list whenever a value is added or removed. */
  onChange?: (value: string[]) => void;

  /** The text being typed, in controlled mode. */
  inputValue?: string;
  /** The initial text in uncontrolled mode. */
  defaultInputValue?: string;
  /** Called when the text being typed changes. */
  onInputChange?: (value: string) => void;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** HTML `autocomplete` attribute for the input. */
  autoComplete?: string;
  /** Called when focus enters the component (input, chips or popover). Receives no event. */
  onFocus?: () => void;
  /** Called when focus leaves the component entirely. Receives no event. */
  onBlur?: () => void;
  /**
   * Called when a key is pressed in the input, before the component handles it.
   * Call `e.preventDefault()` to stop the component from handling the key.
   */
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;

  /**
   * Characters that commit the typed text, and that pasted text is split on.
   * Pasted text is also always split on line breaks. Pass `[]` for values that
   * may contain the default separator.
   * @default [',']
   */
  delimiters?: string[];
  /**
   * Checks one value before it becomes a chip. Return `true` or nothing to
   * accept it, `false` to reject it with the default message, or a string to
   * reject it with that message. Also paints existing chips that fail it in the
   * danger theme. Values picked from the options are not checked.
   */
  validateTag?: (value: string) => TagValidationResult;
  /**
   * Rewrites a typed value before it is checked and added: lowercase an
   * address, write a number one way. Duplicates are found after it runs.
   * Return an empty string to drop the value. Values picked from the options
   * are not rewritten.
   */
  normalizeTag?: (value: string) => string;
  /**
   * The most values the field holds. Values past it are refused with a
   * message and stay in the input.
   */
  maxTags?: number;
  /** Whether leaving the field commits the typed text. @default true */
  shouldCommitOnBlur?: boolean;
  /**
   * Whether a button in the input clears the typed text. It shows while there
   * is text; the chips have their own remove buttons.
   */
  isClearable?: boolean;
  /** Called when the clear button is pressed. */
  onClear?: () => void;

  /** Options to suggest, as data. Pair with a render function in `children`. */
  items?: Iterable<T>;
  /**
   * Options to suggest: `TagInput.Item` elements or a render function for
   * `items`. Without options the field accepts any typed value.
   */
  children?: ReactNode | ((item: T) => ReactElement);
  /**
   * Whether typed values that are not among the options are accepted. Only
   * applies when options are given; without options every value is custom.
   * @default false
   */
  allowsCustomValue?: boolean;
  /**
   * Custom filter for the options, or `false` to show every option (for
   * server-side filtering).
   */
  filter?: FilterFn | false;
  /** Keys of options that cannot be picked. */
  disabledKeys?: Iterable<Key>;
  /** When the suggestions popover opens. @default 'input' */
  popoverTrigger?: TagInputPopoverTrigger;
  /** Called when the suggestions popover opens or closes. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Whether to hide the button that toggles the suggestions popover. */
  hideTrigger?: boolean;
  /** Where the suggestions popover opens. @default 'bottom' */
  direction?: 'bottom' | 'top';
  /** Whether the popover flips when there is no room. @default true */
  shouldFlip?: boolean;
  /** Distance between the input and the popover, in pixels. @default 8 */
  overlayOffset?: number;
  /** Minimum space between the popover and the viewport edge, in pixels. @default 8 */
  containerPadding?: number;

  /**
   * Props for each chip's `Tag` (theme, icon, label, …), by value. A string
   * `children` also names the value to screen readers. `isDisabled` locks the
   * chip: it cannot be removed.
   */
  tagProps?: (value: string) => Partial<CubeTagProps> | undefined;

  /** Left input icon. */
  icon?: ReactElement;
  /** Input decoration before the main input. */
  prefix?: ReactNode;
  /** Input decoration after the main input. */
  suffix?: ReactNode;
  /** Whether the suffix goes before or after the validation and loading icons. */
  suffixPosition?: 'before' | 'after';
  /** Size of the input. The chips follow it. @default 'medium' */
  size?: 'small' | 'medium' | 'large' | (string & {});

  /** Ref to the input element. */
  inputRef?: RefObject<HTMLInputElement>;
  /** Ref to the bordered input box. */
  wrapperRef?: RefObject<HTMLDivElement>;
  /** Ref to the popover element. */
  popoverRef?: RefObject<HTMLDivElement>;
  /** Ref to the listbox in the popover. */
  listBoxRef?: RefObject<HTMLDivElement>;

  /** Styles for the bordered input box. */
  wrapperStyles?: Styles;
  /** Styles for the input element. */
  inputStyles?: Styles;
  /** Styles for the list of chips. */
  tagListStyles?: Styles;
  /** Styles for every chip. */
  tagStyles?: Styles;
  /** Styles for the button that toggles the popover. */
  triggerStyles?: Styles;
  /** Styles for the popover. */
  overlayStyles?: Styles;
  /** Styles for the listbox in the popover. */
  listBoxStyles?: Styles;
  /** Styles for each option. */
  optionStyles?: Styles;
  /** Styles for option sections. */
  sectionStyles?: Styles;
  /** Styles for option section headings. */
  headingStyles?: Styles;
}

const TagInputElement = tasty({
  qa: 'TagInputContainer',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '1x',
  },
});

// The chips sit a step below the input, so a row of them reads as the field's
// value rather than as a second row of controls. Never below `xsmall`: the
// `inline` tag is set in the bold badge type, which reads as a label.
const TAG_SIZES: Record<string, CubeTagProps['size']> = {
  small: 'xsmall',
  medium: 'xsmall',
  large: 'small',
};

const DEFAULT_DELIMITERS = [','];
const LINE_BREAK = /\r\n|\r|\n/;

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function delimiterPattern(delimiters: string[]): RegExp | null {
  const separators = delimiters.filter(Boolean).map(escapeRegExp);

  return separators.length ? new RegExp(separators.join('|')) : null;
}

/** Splits `text` on the delimiters and line breaks into trimmed, non-empty parts. */
export function splitTagText(text: string, delimiters: string[]): string[] {
  const separators = delimiters.filter(Boolean).map(escapeRegExp);
  const pattern = new RegExp([LINE_BREAK.source, ...separators].join('|'), 'g');

  return text
    .split(pattern)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** A chip's own label, when `tagProps` gives it one as plain text. */
function textLabel(node: ReactNode): string | undefined {
  return typeof node === 'string' && node !== '' ? node : undefined;
}

// Safari reports the Enter that confirms an IME composition with
// `isComposing: false`, but still with the composition key code.
function isComposingKey(e: KeyboardEvent<HTMLInputElement>) {
  return e.nativeEvent.isComposing || e.keyCode === 229;
}

type RejectionReason =
  | 'invalid'
  | 'duplicate'
  | 'unknown'
  | 'unavailable'
  | 'limit';

interface Rejection {
  text: string;
  reason: RejectionReason;
  message?: string;
}

function TagInput<T extends object>(
  props: WithNullableValue<CubeTagInputProps<T>>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  props = castNullableArrayValue(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value ?? [],
      onChange,
    }),
  });

  const { t } = useI18n();
  const { formatList } = useFormatter();

  let {
    qa,
    id,
    label,
    value: valueProp,
    defaultValue,
    onChange,
    inputValue: inputValueProp,
    defaultInputValue,
    onInputChange,
    placeholder,
    autoFocus,
    autoComplete = 'off',
    onFocus,
    onBlur,
    onKeyDown,
    delimiters = DEFAULT_DELIMITERS,
    validateTag,
    normalizeTag,
    maxTags,
    shouldCommitOnBlur = true,
    isClearable,
    onClear,
    items,
    children: renderChildren,
    allowsCustomValue,
    filter,
    disabledKeys,
    popoverTrigger = 'input',
    onOpenChange,
    hideTrigger,
    direction = 'bottom',
    shouldFlip = true,
    overlayOffset = 8,
    containerPadding = 8,
    tagProps,
    icon,
    prefix,
    suffix,
    suffixPosition,
    size = 'medium',
    isDisabled,
    isReadOnly,
    isRequired,
    isLoading,
    isInvalid,
    isValid,
    message,
    errorMessage,
    inputRef: inputRefProp,
    wrapperRef: wrapperRefProp,
    popoverRef: popoverRefProp,
    listBoxRef: listBoxRefProp,
    wrapperStyles,
    inputStyles,
    tagListStyles,
    tagStyles,
    triggerStyles,
    overlayStyles,
    listBoxStyles,
    optionStyles,
    sectionStyles,
    headingStyles,
    labelProps: userLabelProps,
    mods,
    className,
    style,
    qaVal,
    // The input holds the text being typed, not the field's value: a native
    // form must not submit it under the field's name.
    name,
    form,
    ...otherProps
  } = props;

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  const rootRef = useCombinedRefs(ref);
  const inputRef = useCombinedRefs(inputRefProp);
  const wrapperRef = useCombinedRefs(wrapperRefProp);
  const popoverRef = useCombinedRefs(popoverRefProp);
  const listBoxRef = useCombinedRefs(listBoxRefProp);
  const tagListRef = useRef<HTMLDivElement>(null);
  const listStateRef = useRef<ListStateLike | null>(null);

  const tagInputId = useMemo(() => generateRandomId(), []);
  const listBoxId = `TagInputListBox-${tagInputId}`;
  const tagListId = useId();
  const summaryId = useId();
  const hintId = useId();
  const triggerId = useId();
  const clearId = useId();

  // ---- values -------------------------------------------------------------
  const [values, setValues] = useControlledState<readonly string[]>(
    valueProp as readonly string[] | undefined,
    (defaultValue as readonly string[] | undefined) ?? [],
    onChange as ((value: readonly string[]) => void) | undefined,
  );
  // A controlled value may repeat an entry; the chips are keyed by value, so
  // render each one once.
  const uniqueValues = useMemo(
    () => [...new Set((values ?? []).map(String))],
    [values],
  );

  // ---- typed text ---------------------------------------------------------
  const [draft, setDraftState] = useControlledState<string>(
    inputValueProp as string | undefined,
    defaultInputValue ?? '',
    onInputChange,
  );
  // The id gives a repeated rejection a fresh message node, so it is announced
  // again.
  const [tagError, setTagErrorState] = useState<{
    id: number;
    text: string;
  } | null>(null);
  // Only ever grows: a clear and a new rejection can land in one batch.
  const tagErrorIdRef = useRef(0);
  const setTagError = useEvent((text: string | null) => {
    if (text == null) {
      setTagErrorState(null);

      return;
    }

    tagErrorIdRef.current += 1;
    setTagErrorState({ id: tagErrorIdRef.current, text });
  });
  const [announcement, setAnnouncement] = useState({ id: 0, text: '' });

  // ---- options ------------------------------------------------------------
  let children: ReactNode = renderChildren as ReactNode;

  if (items && typeof renderChildren === 'function') {
    children = Array.from(items).map((item, index) => {
      const rendered = (renderChildren as (item: T) => ReactNode)(item);

      if (isValidElement(rendered) && rendered.key == null) {
        return cloneElement(rendered, {
          key:
            (item as { key?: Key })?.key ?? (item as { id?: Key })?.id ?? index,
        });
      }

      return rendered;
    });
  }

  const hasOptions = children != null && children !== false;

  // Reads option labels, and matches typed text to an option, whether or not
  // the popover is open.
  const localCollectionState = useListState({
    children: children as never,
    selectionMode: 'none',
  });
  const collection = localCollectionState.collection;

  const { contains } = useFilter({ sensitivity: 'base' });
  const { isEqual: isSameText, compare: compareText } = useMemo(() => {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
    // Numbers in order: 2 before 10.
    const sorter = new Intl.Collator(undefined, { numeric: true });

    return {
      isEqual: (a: string, b: string) => collator.compare(a, b) === 0,
      compare: (a: string, b: string) => sorter.compare(a, b),
    };
  }, []);

  const textFilterFn = useMemo<FilterFn>(
    () => (filter === false ? () => true : filter || contains),
    [filter, contains],
  );

  const [isFilterActive, setIsFilterActive] = useState(false);
  const term = draft.trim();

  // Labels of picked options, kept after the option leaves the collection, as
  // it does with server-side filtering (`items` + `filter={false}`).
  const [knownLabels, setKnownLabels] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  const getOptionLabel = useCallback(
    (key: string) =>
      collection.getItem(key)?.textValue || knownLabels.get(key) || key,
    [collection, knownLabels],
  );

  // What a chip reads as, and what announcements name it by: a string label
  // the chip is given, then the option's own.
  const getTagLabel = useCallback(
    (key: string) =>
      textLabel(tagProps?.(key)?.children) ?? getOptionLabel(key),
    [tagProps, getOptionLabel],
  );

  // A locked chip stays put: no remove button, Delete or unpick.
  const isTagLocked = useCallback(
    (key: string) => !!tagProps?.(key)?.isDisabled,
    [tagProps],
  );

  const disabledKeySet = useMemo(
    () => new Set([...(disabledKeys ?? [])].map(String)),
    [disabledKeys],
  );

  // Called before the text changes (and the options with it) and when values
  // are added, while the options still hold the labels.
  const rememberLabels = useEvent((keys: readonly string[]) => {
    let next: Map<string, string> | null = null;

    for (const key of keys) {
      const label = collection.getItem(key)?.textValue;

      if (label && knownLabels.get(key) !== label) {
        if (!next) next = new Map(knownLabels);
        next.set(key, label);
      }
    }

    if (next) setKnownLabels(next);
  });

  /** The key of the option whose key or label is `text`, if any. */
  const findOptionKey = useCallback(
    (text: string): string | null => {
      if (!hasOptions) return null;

      for (const node of collection) {
        const nodes = node.type === 'section' ? [...node.childNodes] : [node];

        for (const child of nodes) {
          if (child.type !== 'item') continue;

          if (
            String(child.key) === text ||
            isSameText(child.textValue || '', text)
          ) {
            return String(child.key);
          }
        }
      }

      return null;
    },
    [collection, hasOptions, isSameText],
  );

  const optionFilterFn = useCallback(
    (nodes: Iterable<any>) => {
      if (!isFilterActive || !term) return nodes;

      return filterCollectionNodes(nodes, term, textFilterFn);
    },
    [isFilterActive, term, textFilterFn],
  );

  const visibleOptionKeys = useMemo(() => {
    if (!hasOptions) return [];

    const keys: Key[] = [];

    collectVisibleKeys(
      optionFilterFn(collection),
      keys,
      disabledKeys ? new Set(disabledKeys) : undefined,
    );

    return keys;
  }, [hasOptions, optionFilterFn, collection, disabledKeys]);

  // Custom values unpicked in the list during this visit. They stay listed,
  // unchecked, until focus leaves the field: the row does not vanish under the
  // pointer, and it can be picked back.
  const [unpickedCustomValues, setUnpickedCustomValues] = useState<
    readonly string[]
  >([]);

  // The user's own values, listed after the options so they can be unpicked
  // where they were picked. Only with `allowsCustomValue`: without it an
  // unpicked value could not be added back. Sorted, so toggling one does not
  // move it.
  const customValueKeys = useMemo(() => {
    if (!hasOptions || !allowsCustomValue) return [];

    const keys = new Set(
      [...uniqueValues, ...unpickedCustomValues].filter(
        (value) => collection.getItem(value) == null && !knownLabels.has(value),
      ),
    );

    return [...keys].sort(compareText);
  }, [
    hasOptions,
    allowsCustomValue,
    uniqueValues,
    unpickedCustomValues,
    collection,
    knownLabels,
    compareText,
  ]);

  // The typed text narrows them as it narrows the options, even when the
  // options are filtered on the server (`filter={false}`): these rows are
  // this component's own.
  const visibleCustomKeys = useMemo(() => {
    if (!isFilterActive || !term) return customValueKeys;

    const matches = typeof filter === 'function' ? filter : contains;

    return customValueKeys.filter((key) => matches(key, term));
  }, [customValueKeys, isFilterActive, term, filter, contains]);

  // The typed text as a pickable row, when it would add something new.
  const customTerm =
    hasOptions &&
    allowsCustomValue &&
    term &&
    findOptionKey(term) == null &&
    !uniqueValues.includes(term) &&
    !customValueKeys.includes(term)
      ? term
      : null;

  const popoverChildren = useMemo(() => {
    if (!customTerm && !visibleCustomKeys.length) return children;

    const customOptions = visibleCustomKeys.map((key) => (
      <Item key={key} textValue={key}>
        {key}
      </Item>
    ));

    if (customTerm) {
      customOptions.push(
        <Item key={customTerm} textValue={customTerm}>
          {customTerm}
        </Item>,
      );
    }

    if (!visibleOptionKeys.length) {
      return customOptions;
    }

    const customSection = (
      <BaseSection
        key="__custom_values__"
        aria-label={t('tagInput.customValues', 'Custom values')}
      >
        {customOptions}
      </BaseSection>
    );

    // A section cannot nest in another one, so options that already come in
    // sections only get the custom section appended.
    const hasSections = [...collection].some((node) => node.type === 'section');

    if (hasSections) {
      return [
        ...(Array.isArray(children) ? children : [children]),
        customSection,
      ];
    }

    return [
      <BaseSection
        key="__options__"
        aria-label={t('tagInput.options', 'Options')}
      >
        {children as never}
      </BaseSection>,
      customSection,
    ];
  }, [
    customTerm,
    visibleCustomKeys,
    children,
    visibleOptionKeys.length,
    collection,
    t,
  ]);

  const hasResults =
    visibleOptionKeys.length > 0 ||
    visibleCustomKeys.length > 0 ||
    customTerm != null;
  // Options rebuild on every render when they come from `items`, so effects
  // follow what is visible rather than the collection's identity.
  const visibleOptionsSignature = [
    ...visibleOptionKeys,
    ...visibleCustomKeys,
  ].join('\u0000');

  // ---- popover ------------------------------------------------------------
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isInteractive = !isDisabled && !isReadOnly;
  const shouldShowPopover =
    hasOptions && isInteractive && isPopoverOpen && hasResults;

  // With no matching option the popover hides but stays open, so it comes back
  // as soon as the text matches again.
  const notifiedOpenRef = useRef(false);

  useEffect(() => {
    if (notifiedOpenRef.current === shouldShowPopover) return;

    notifiedOpenRef.current = shouldShowPopover;
    onOpenChange?.(shouldShowPopover);
  }, [shouldShowPopover, onOpenChange]);

  // The option under virtual focus, mirrored in state for the input's
  // `aria-activedescendant`: the listbox's own state update does not re-render
  // this component. It is also what Enter acts on, so Enter only ever picks the
  // option a screen reader was told about. `term` is the text it was chosen
  // for; `source` tells a user's own pick (arrows, a click) from focus the
  // component placed while the text changed.
  const [activeOption, setActiveOption] = useState<{
    key: Key;
    term: string;
    source: 'auto' | 'user';
  } | null>(null);
  const activeOptionKey = activeOption?.key ?? null;

  const moveVirtualFocus = useEvent(
    (key: Key | null, source: 'auto' | 'user', forTerm: string) => {
      const listState = listStateRef.current;

      if (!listState || key == null) return;

      markKeyboardFocus(listState);
      listState.selectionManager.setFocusedKey(key);
      setActiveOption({ key, term: forTerm, source });
    },
  );

  // The popover is at least as wide as the input box.
  const [popoverMinWidth, setPopoverMinWidth] = useState<number>();

  // An option whose label is exactly the typed text wins over the first match,
  // so typing "build" and pressing Enter picks "build", not "rebuild".
  let exactOptionKey = term ? findOptionKey(term) : null;

  if (exactOptionKey == null && term && customValueKeys.includes(term)) {
    exactOptionKey = term;
  }

  const visibleTargetKeys: Key[] = [...visibleOptionKeys, ...visibleCustomKeys];

  if (customTerm) visibleTargetKeys.push(customTerm);
  // Typed text means "add", so past an exact match the first row that is not
  // added yet wins: typing "def" next to a picked "undefined" lands on "def".
  let preferredOptionKey: Key | null = null;

  if (exactOptionKey != null && visibleTargetKeys.includes(exactOptionKey)) {
    preferredOptionKey = exactOptionKey;
  } else if (term) {
    preferredOptionKey =
      visibleTargetKeys.find((key) => !uniqueValues.includes(String(key))) ??
      null;
  }

  if (preferredOptionKey == null) {
    preferredOptionKey = visibleTargetKeys[0] ?? null;
  }
  const focusTermRef = useRef<string | null>(null);

  // Focus the best match when the popover opens or the text changes, and
  // whenever the focused option is filtered out, so Enter always acts on a
  // visible row. The keys come from this render's own filter: the listbox's
  // collection can lag a render behind right after the text narrows.
  useLayoutEffect(() => {
    // `aria-activedescendant` is only set while the popover shows, so a stale
    // active option needs no reset here; the next pass re-syncs it.
    if (!shouldShowPopover) {
      focusTermRef.current = null;

      return;
    }

    setPopoverMinWidth(wrapperRef.current?.offsetWidth);

    // Rebuilt from the signature: the key arrays themselves are new on every
    // render when options come from `items`. Collection keys are strings.
    const visibleKeys: Key[] = visibleOptionsSignature
      ? visibleOptionsSignature.split('\u0000')
      : [];

    if (customTerm) visibleKeys.push(customTerm);

    const isNewTerm = !!term && focusTermRef.current !== term;

    focusTermRef.current = term;

    let attempts = 0;
    let isCancelled = false;

    const tick = () => {
      if (isCancelled) return;

      const listState = listStateRef.current;

      if (!listState) {
        attempts += 1;

        if (attempts < 8) requestAnimationFrame(tick);

        return;
      }

      const focused = listState.selectionManager.focusedKey;
      const keepsFocus =
        focused != null && visibleKeys.includes(focused) && !isNewTerm;

      // Re-announced even when focus stays: after a close and reopen the list
      // still has it, but the input no longer points at it.
      if (keepsFocus) {
        setActiveOption((prev) =>
          prev?.key === focused
            ? { ...prev, term }
            : { key: focused, term, source: 'auto' },
        );
      } else {
        moveVirtualFocus(preferredOptionKey, 'auto', term);
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(tick));

    // Text typed after this pass was scheduled owns the focus now.
    return () => {
      isCancelled = true;
    };
  }, [
    shouldShowPopover,
    visibleOptionsSignature,
    customTerm,
    term,
    preferredOptionKey,
    moveVirtualFocus,
    wrapperRef,
  ]);

  const setDraft = useEvent((next: string) => {
    setDraftState(next);
    setIsFilterActive(!!next.trim());
  });

  // A fresh node per message, so a repeated one ("Added a", remove, "Added a")
  // is announced again.
  const announce = useEvent((text: string) => {
    setAnnouncement((prev) => ({ id: prev.id + 1, text }));
  });

  // ---- commit -------------------------------------------------------------
  const rejectionMessage = useEvent((rejection: Rejection) => {
    if (rejection.message) return rejection.message;

    switch (rejection.reason) {
      case 'duplicate':
        return t('tagInput.duplicateValue', '"{{value}}" is already added', {
          value: rejection.text,
        });
      case 'unknown':
        return t('tagInput.unknownValue', '"{{value}}" is not in the list', {
          value: rejection.text,
        });
      case 'unavailable':
        return t('tagInput.unavailableValue', '"{{value}}" is not available', {
          value: rejection.text,
        });
      case 'limit':
        return t('tagInput.limitReached', 'You can add up to {{count}}', {
          count: maxTags,
        });
      default:
        return t('tagInput.invalidValue', '"{{value}}" is not a valid value', {
          value: rejection.text,
        });
    }
  });

  const joiner = delimiters[0] ? `${delimiters[0]} ` : ' ';

  // Without a label or `forceField` there is no field wrapper to show the
  // message, so a rejection is announced instead.
  const hasFieldMessage = !!label || !!props.forceField;

  /**
   * Turns typed parts into values. Accepted parts become chips; rejected ones
   * come back as text for the input, with a message, so nothing typed is lost.
   */
  const commitParts = useEvent((parts: string[]): string => {
    if (!parts.length) return '';

    const present = new Set(uniqueValues);
    const accepted: string[] = [];
    const rejected: Rejection[] = [];

    for (const part of parts) {
      let optionKey = findOptionKey(part);
      let typed = part;

      // Only text of its own is rewritten; an option keeps its key.
      if (optionKey == null && normalizeTag) {
        typed = normalizeTag(part).trim();

        if (!typed) continue;

        optionKey = findOptionKey(typed);
      }

      const nextValue = optionKey ?? typed;

      if (optionKey != null && disabledKeySet.has(optionKey)) {
        rejected.push({ text: part, reason: 'unavailable' });
        continue;
      }

      if (optionKey == null && hasOptions && !allowsCustomValue) {
        rejected.push({ text: part, reason: 'unknown' });
        continue;
      }

      if (present.has(nextValue)) {
        rejected.push({ text: part, reason: 'duplicate' });
        continue;
      }

      if (maxTags != null && present.size >= maxTags) {
        rejected.push({ text: part, reason: 'limit' });
        continue;
      }

      if (optionKey == null && validateTag) {
        const result = validateTag(nextValue);

        if (result === false || typeof result === 'string') {
          rejected.push({
            text: part,
            reason: 'invalid',
            message: typeof result === 'string' ? result : undefined,
          });
          continue;
        }
      }

      present.add(nextValue);
      accepted.push(nextValue);
    }

    const error = rejected.length ? rejectionMessage(rejected[0]) : null;
    const messages: string[] = [];

    if (accepted.length) {
      rememberLabels(accepted);
      setValues([...uniqueValues, ...accepted]);
      messages.push(
        t('tagInput.added', 'Added {{value}}', {
          value: formatList(accepted.map(getTagLabel)),
        }),
      );
    }

    if (error && !hasFieldMessage) messages.push(error);
    if (messages.length) announce(messages.join(' '));

    setTagError(error);

    return rejected.map((rejection) => rejection.text).join(joiner);
  });

  const commitDraft = useEvent(() => {
    setDraft(commitParts(splitTagText(draft, delimiters)));
  });

  // Focusing the row itself tells the tag group which chip is focused, as a
  // click would.
  const focusLastTag = useEvent(() => {
    const rows = tagListRef.current?.querySelectorAll<HTMLElement>(
      '[role="row"]:not([aria-disabled="true"])',
    );

    rows?.[rows.length - 1]?.focus();
  });

  const removeValues = useEvent((requested: string[]) => {
    const keys = requested.filter((key) => !isTagLocked(key));

    if (!keys.length) return;

    const removed = new Set(keys);
    const next = uniqueValues.filter((value) => !removed.has(value));

    // Focus leaves the list before the last chip it can land on unmounts under
    // it; locked chips take no focus.
    if (!next.some((value) => !isTagLocked(value))) {
      inputRef.current?.focus();
    }

    setValues(next);
    setTagError(null);
    announce(
      t('tagInput.removed', 'Removed {{value}}', {
        value: formatList(keys.map(getTagLabel)),
      }),
    );
  });

  /**
   * Picks an option in the popover, or unpicks one that already is a chip. The
   * popover stays open for the next pick, and the query is cleared so the full
   * list is back.
   */
  const toggleOption = useEvent((key: string) => {
    if (isTagLocked(key)) return;

    setTagError(null);

    if (uniqueValues.includes(key)) {
      removeValues([key]);
      setDraft('');

      if (customValueKeys.includes(key)) {
        setUnpickedCustomValues((prev) =>
          prev.includes(key) ? prev : [...prev, key],
        );
      }
    } else if (!commitParts([key])) {
      // An accepted pick clears the query. A refused one (past `maxTags`)
      // keeps it, next to the message saying why.
      setDraft('');
    }
  });

  // A click in the popover list. The list reports its whole new selection, so
  // compare it with the chips to find the option that changed.
  const handlePopoverSelection = useEvent(
    (selection: Key | Key[] | null | 'all') => {
      if (!Array.isArray(selection)) return;

      const next = new Set(selection.map(String));
      const changed = [
        ...[...next].filter((key) => !uniqueValues.includes(key)),
        ...uniqueValues.filter(
          (value) =>
            !next.has(value) &&
            (collection.getItem(value) != null ||
              visibleCustomKeys.includes(value)),
        ),
      ];

      changed.forEach(toggleOption);

      // The click moved the list's focus to the option; the input's
      // `aria-activedescendant` follows it.
      const clicked = changed[changed.length - 1];

      if (clicked != null) {
        listStateRef.current?.selectionManager.setFocusedKey(clicked);
        // The pick clears the text.
        setActiveOption({ key: clicked, term: '', source: 'user' });
      }

      // A click can take DOM focus off the input; keep typing where it was.
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  );

  // ---- keyboard -----------------------------------------------------------
  // Set while Tab moves focus out of the input, so the blur can tell a Tab to
  // the chips (commit the text) from a click on a remove button (keep it).
  const isTabbingRef = useRef(false);

  const handleKeyDown = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);

    // A Tab the consumer prevented moves no focus.
    isTabbingRef.current = e.key === 'Tab' && !e.defaultPrevented;

    if (e.defaultPrevented || !isInteractive) return;

    const listState = listStateRef.current;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!hasOptions) return;

      e.preventDefault();

      if (!shouldShowPopover) {
        if (!hasResults) setIsFilterActive(false);
        setIsPopoverOpen(true);

        return;
      }

      if (listState) {
        moveVirtualFocus(
          getNextVisibleKey(listState, e.key === 'ArrowDown' ? 1 : -1),
          'user',
          term,
        );
      }

      return;
    }

    if ((e.key === 'Home' || e.key === 'End') && shouldShowPopover) {
      e.preventDefault();

      if (listState) {
        moveVirtualFocus(
          getEdgeVisibleKey(listState, e.key === 'Home' ? 'first' : 'last'),
          'user',
          term,
        );
      }

      return;
    }

    // The chips sit below the input, not beside the caret, so Backspace in an
    // empty input moves to the last chip instead of removing it out of view.
    // The chip comes into view with focus and says it is removable; the next
    // Backspace removes it and moves to the one before.
    if (
      e.key === 'Backspace' &&
      !draft &&
      uniqueValues.some((value) => !isTagLocked(value))
    ) {
      if (isComposingKey(e)) return;

      e.preventDefault();

      // A held Backspace that just emptied the input stops there, so it does
      // not run on into the chips.
      if (e.repeat) return;

      setIsPopoverOpen(false);
      focusLastTag();

      return;
    }

    if (e.key === 'Enter') {
      if (isComposingKey(e)) return;

      // The announced option, unless the text changed since it was chosen and
      // its focus pass has not run yet: then the best match for this text.
      const isCurrent = activeOption != null && activeOption.term === term;
      const targetKey = shouldShowPopover
        ? isCurrent
          ? activeOption.key
          : preferredOptionKey
        : null;

      if (targetKey != null) {
        e.preventDefault();

        const key = String(targetKey);

        // Typed text means "add". An option that is already a chip is refused
        // as a duplicate, as a comma or blur would; unpicking one takes the
        // arrows, a click, or an empty input.
        if (
          term &&
          uniqueValues.includes(key) &&
          !(isCurrent && activeOption.source === 'user')
        ) {
          setTagError(
            rejectionMessage({
              text: getTagLabel(key),
              reason: 'duplicate',
            }),
          );

          return;
        }

        toggleOption(key);

        return;
      }

      // With nothing typed, Enter keeps its usual meaning (submitting a form).
      if (!term) return;

      e.preventDefault();
      commitDraft();

      return;
    }

    if (delimiters.includes(e.key)) {
      if (isComposingKey(e)) return;

      e.preventDefault();

      // The separator splits the text where it is typed: what comes before the
      // caret is committed, what comes after stays in the input.
      const el = e.currentTarget;
      const start = el.selectionStart ?? draft.length;
      const end = el.selectionEnd ?? start;
      const rejected = commitParts(
        splitTagText(draft.slice(0, start), delimiters),
      );

      setDraft(
        [rejected, draft.slice(end).trimStart()].filter(Boolean).join(joiner),
      );

      return;
    }

    if (e.key === 'Escape') {
      if (shouldShowPopover) {
        e.preventDefault();
        e.stopPropagation();
        setIsPopoverOpen(false);
      } else if (draft) {
        e.preventDefault();
        e.stopPropagation();
        setDraft('');
        setTagError(null);
        // It may be open but hidden for want of a match; the full list must
        // not appear when the text goes.
        setIsPopoverOpen(false);
      }
    }
  });

  // A separator can also arrive without a key press: autocorrect, IME, drag and
  // drop. Commit everything before the last separator and keep the rest typed.
  const handleInputChange = useEvent((next: string) => {
    setTagError(null);
    rememberLabels(uniqueValues);

    const pattern = delimiterPattern(delimiters);
    const parts = pattern ? next.split(pattern) : [next];

    let nextDraft = next;

    if (parts.length > 1) {
      const rest = (parts.pop() ?? '').trimStart();
      const rejected = commitParts(
        parts.map((part) => part.trim()).filter(Boolean),
      );

      nextDraft = [rejected, rest].filter(Boolean).join(joiner);
    }

    setDraft(nextDraft);

    if (hasOptions && popoverTrigger !== 'manual' && nextDraft.trim()) {
      setIsPopoverOpen(true);
    }
  });

  // An `<input>` drops line breaks from pasted text, so split a pasted list
  // here, where they are still visible.
  const handlePaste = useEvent((e: ClipboardEvent<HTMLInputElement>) => {
    if (!isInteractive) return;

    const pasted = e.clipboardData.getData('text');

    if (!pasted || splitTagText(pasted, delimiters).length < 2) return;

    e.preventDefault();

    const el = e.currentTarget;
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;

    setTagError(null);
    setDraft(
      commitParts(
        splitTagText(
          `${draft.slice(0, start)}\n${pasted}\n${draft.slice(end)}`,
          delimiters,
        ),
      ),
    );
  });

  // ---- focus --------------------------------------------------------------
  // What leaving the input does to the typed text.
  const settleDraft = useEvent(() => {
    if (!term || !shouldCommitOnBlur || !isInteractive) return;

    if (hasOptions && !allowsCustomValue && findOptionKey(term) == null) {
      // Leaving a filter query behind is not an entry: drop it, as ComboBox
      // does with text that matches no option.
      setDraft('');
      setTagError(null);
    } else {
      commitDraft();
    }
  });

  const handleCompositeBlur = useEvent(() => {
    setIsPopoverOpen(false);
    setUnpickedCustomValues([]);
    settleDraft();
    onBlur?.();
  });

  const { compositeFocusProps } = useCompositeFocus({
    wrapperRef: rootRef as RefObject<HTMLElement>,
    popoverRef: popoverRef as RefObject<HTMLElement>,
    onFocus,
    onBlur: handleCompositeBlur,
    isDisabled,
  });

  // Tabbing from the input to the chips stays inside the component, so the
  // composite blur never fires: close the popover and settle the text on the
  // way. A click on a chip's remove button also moves focus there, and leaves
  // both alone.
  const handleInputBlur = useEvent((e: FocusEvent<HTMLInputElement>) => {
    const isTabbing = isTabbingRef.current;
    const next = e.relatedTarget as Node | null;

    isTabbingRef.current = false;

    if (!isTabbing || !next || !rootRef.current?.contains(next)) return;

    setIsPopoverOpen(false);
    settleDraft();
  });

  const handleInputFocus = useEvent(() => {
    if (hasOptions && popoverTrigger === 'focus' && isInteractive) {
      setIsPopoverOpen(true);
    }
  });

  // ---- chips --------------------------------------------------------------
  const tags = useMemo<TagListEntry[]>(
    () =>
      uniqueValues.map((value) => {
        const ownProps = tagProps?.(value);
        const isOption =
          collection.getItem(value) != null || knownLabels.has(value);
        const result = !isOption && validateTag ? validateTag(value) : true;
        const label = textLabel(ownProps?.children) ?? getOptionLabel(value);

        return {
          key: value,
          label,
          // Put in words as well as in color, for the chip's description.
          invalidMessage:
            typeof result === 'string'
              ? result
              : result === false
                ? t(
                    'tagInput.invalidValue',
                    '"{{value}}" is not a valid value',
                    {
                      value: label,
                    },
                  )
                : undefined,
          tagProps: ownProps,
          isDisabled: !!ownProps?.isDisabled,
        };
      }),
    [
      uniqueValues,
      collection,
      knownLabels,
      validateTag,
      getOptionLabel,
      tagProps,
      t,
    ],
  );

  const effectiveIsInvalid = tagError ? true : isInvalid;
  const hasRemovableTags = tags.some((tag) => !tag.isDisabled);
  // Backspace in an empty input is how the keyboard gets to the chips without
  // Tab; nothing on screen says so.
  const hasBackspaceHint = isInteractive && hasRemovableTags;

  // A locked value's option stays checked but cannot be unpicked.
  const optionDisabledKeys = useMemo(() => {
    const locked = tags.filter((tag) => tag.isDisabled).map((tag) => tag.key);

    return locked.length ? [...disabledKeySet, ...locked] : disabledKeys;
  }, [tags, disabledKeySet, disabledKeys]);

  // ---- input --------------------------------------------------------------
  const { labelProps, inputProps } = useTextField(
    {
      ...otherProps,
      id,
      label,
      value: draft,
      placeholder,
      isDisabled,
      isReadOnly,
      isRequired,
      isInvalid: effectiveIsInvalid,
      autoFocus,
      onChange: handleInputChange,
    } as never,
    inputRef,
  );
  // Names the chips and the trigger after the field: "Selected values, Also
  // send to", rather than the same words for every field on the page.
  const labelId = label ? (labelProps.id as string | undefined) : undefined;

  // Joined, not replaced: the input keeps any description it already has.
  const describedBy: string[] = [];

  if (inputProps['aria-describedby']) {
    describedBy.push(inputProps['aria-describedby']);
  }
  if (tags.length) describedBy.push(summaryId);
  if (hasBackspaceHint) describedBy.push(hintId);

  const tagInputProps = mergeProps(
    inputProps,
    {
      onKeyDown: handleKeyDown,
      onPaste: handlePaste,
      onBlur: handleInputBlur,
      onFocus: handleInputFocus,
      autoComplete,
      'data-input-type': 'taginput',
      'aria-describedby': describedBy.join(' ') || undefined,
    },
    hasOptions
      ? {
          role: 'combobox',
          'aria-autocomplete': 'list',
          'aria-haspopup': 'listbox',
          'aria-expanded': shouldShowPopover,
          'aria-controls': shouldShowPopover ? listBoxId : undefined,
          'aria-activedescendant':
            shouldShowPopover && activeOptionKey != null
              ? getListBoxOptionId(listBoxId, activeOptionKey)
              : undefined,
        }
      : null,
  );

  const handleTriggerPress = useEvent(() => {
    const willOpen = !shouldShowPopover;

    if (willOpen && !hasResults) setIsFilterActive(false);

    setIsPopoverOpen(willOpen);
    inputRef.current?.focus();
  });

  const trigger =
    hasOptions && !hideTrigger ? (
      <ItemAction
        data-popover-trigger
        id={triggerId}
        qa="TagInputTrigger"
        icon={<DirectionIcon to={shouldShowPopover ? 'up' : 'down'} />}
        size={size}
        isDisabled={!isInteractive}
        styles={triggerStyles}
        mods={{ pressed: shouldShowPopover }}
        // Arrow keys open the list from the input, so the button stays out of
        // the Tab order and Tab goes from the input straight to the chips.
        tabIndex={-1}
        aria-expanded={shouldShowPopover}
        aria-haspopup="listbox"
        aria-label={t('tagInput.showOptions', 'Show options')}
        aria-labelledby={labelId ? `${triggerId} ${labelId}` : undefined}
        onPress={handleTriggerPress}
      />
    ) : null;

  // Clears what is typed, as Escape does. The chips below have their own
  // remove buttons, so a button inside the input is about the text only.
  const clearText = useEvent(() => {
    // The button goes away with the text; keep focus in the field.
    inputRef.current?.focus();
    setDraft('');
    setTagError(null);
    setIsPopoverOpen(false);
    onClear?.();
  });

  const canClear = !!isClearable && isInteractive && draft !== '';
  const clearButton = canClear ? (
    <ItemAction
      id={clearId}
      qa="TagInputClearButton"
      icon={<CloseIcon />}
      size={size}
      // Escape does the same from the keyboard. As a Tab stop it would take
      // focus just as tabbing away commits the text and removes it.
      tabIndex={-1}
      aria-label={t('tagInput.clearText', 'Clear text')}
      aria-labelledby={labelId ? `${clearId} ${labelId}` : undefined}
      onPress={clearText}
    />
  ) : null;

  // Not a bare fragment: an empty one would still mark the input as having a
  // suffix.
  const hasActions = clearButton != null || trigger != null;

  const tagInputField = (
    <TagInputElement
      ref={rootRef}
      className={className}
      style={style}
      qaVal={qaVal}
      styles={styles}
      {...compositeFocusProps}
    >
      <TextInputBase
        qa={qa || 'TagInput'}
        inputRef={inputRef}
        wrapperRef={wrapperRef}
        inputProps={tagInputProps}
        mods={mods}
        icon={icon}
        prefix={prefix}
        suffix={suffix}
        suffixPosition={suffixPosition}
        actions={
          hasActions ? (
            <>
              {clearButton}
              {trigger}
            </>
          ) : null
        }
        size={size}
        autoFocus={autoFocus}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isInvalid={effectiveIsInvalid}
        isValid={isValid}
        styles={wrapperStyles}
        inputStyles={inputStyles}
      />
      {tags.length ? (
        <TagList
          id={tagListId}
          listRef={tagListRef}
          inputRef={inputRef}
          aria-label={t('tagInput.selectedValues', 'Selected values')}
          aria-labelledby={labelId}
          tags={tags}
          size={TAG_SIZES[size] ?? 'xsmall'}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          styles={tagListStyles}
          tagStyles={tagStyles}
          onRemove={removeValues}
        />
      ) : null}
      {/* Read only as the input's description, never on its own in browse mode. */}
      <span hidden id={summaryId}>
        {tags.length
          ? t('tagInput.summary', 'Selected: {{values}}.', {
              values: formatList(tags.map((tag) => tag.label)),
            })
          : null}
      </span>
      <span hidden id={hintId}>
        {hasBackspaceHint
          ? t(
              'tagInput.backspaceHint',
              'Press Backspace to go to the selected values.',
            )
          : null}
      </span>
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        <span key={announcement.id}>{announcement.text}</span>
      </VisuallyHidden>
      {hasOptions ? (
        <ListBoxPopover
          isOpen={shouldShowPopover}
          triggerRef={wrapperRef as RefObject<HTMLElement>}
          popoverRef={popoverRef}
          listBoxRef={listBoxRef}
          direction={direction}
          shouldFlip={shouldFlip}
          overlayOffset={overlayOffset}
          containerPadding={containerPadding}
          comboBoxWidth={popoverMinWidth}
          listBoxId={listBoxId}
          overlayStyles={overlayStyles}
          listBoxStyles={listBoxStyles}
          optionStyles={optionStyles}
          optionHighlight={isFilterActive ? term : undefined}
          sectionStyles={sectionStyles}
          headingStyles={headingStyles}
          selectionMode="multiple"
          selectedKeys={uniqueValues}
          isCheckable
          // Clicking back into the input keeps the list open for the next pick.
          shouldCloseOnTriggerInteraction={false}
          isDisabled={isDisabled}
          disabledKeys={optionDisabledKeys}
          listStateRef={listStateRef}
          label={label}
          ariaLabel={(props as { 'aria-label'?: string })['aria-label']}
          compositeFocusProps={compositeFocusProps}
          filter={optionFilterFn}
          size={size}
          onSelectionChange={handlePopoverSelection}
          onClose={() => setIsPopoverOpen(false)}
        >
          {popoverChildren}
        </ListBoxPopover>
      ) : null}
    </TagInputElement>
  );

  const { children: _children, ...fieldProps } = props;

  // The forwarded ref sits on the component's root, labelled or not, so the
  // field wrapper gets a ref of its own that nothing reads.
  const fieldRef = useCombinedRefs<HTMLDivElement>();

  return wrapWithField(tagInputField, fieldRef, {
    ...(fieldProps as Omit<CubeTagInputProps<T>, 'children'>),
    labelProps: mergeProps(labelProps, userLabelProps),
    isInvalid: effectiveIsInvalid,
    // A rejected entry speaks for itself until the text is edited. Keyed, so
    // the same rejection twice in a row is announced twice.
    message: tagError ? (
      <span key={tagError.id}>{tagError.text}</span>
    ) : (
      message
    ),
    errorMessage: tagError ? undefined : errorMessage,
  });
}

/**
 * A field for a list of values, shown as removable chips below a single-line
 * input. Values are typed (Enter or a separator commits them) or picked from
 * suggested options.
 */
const _TagInput = forwardRef(TagInput) as unknown as (<T extends object>(
  props: WithNullableValue<CubeTagInputProps<T>> & {
    ref?: ForwardedRef<HTMLDivElement>;
  },
) => ReactElement) & {
  Item: typeof Item;
  Section: typeof BaseSection;
};

Object.assign(_TagInput, {
  Item,
  Section: BaseSection,
  displayName: 'TagInput',
});

// The legacy `<Field>` picks its value mapper from this. The `CheckboxGroup`
// mapper is the one for an array value: `[]` when empty, validated on change.
Object.defineProperty(_TagInput, 'cubeInputType', {
  value: 'CheckboxGroup',
  enumerable: false,
  configurable: false,
});

export { _TagInput as TagInput };
