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
  /** Whether leaving the field commits the typed text. @default true */
  shouldCommitOnBlur?: boolean;

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

  /** Props for each chip's `Tag` (theme, icon, label, …), by value. */
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

// Safari reports the Enter that confirms an IME composition with
// `isComposing: false`, but still with the composition key code.
function isComposingKey(e: KeyboardEvent<HTMLInputElement>) {
  return e.nativeEvent.isComposing || e.keyCode === 229;
}

type RejectionReason = 'invalid' | 'duplicate' | 'unknown' | 'unavailable';

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
    shouldCommitOnBlur = true,
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
  const triggerId = useId();

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
  const setTagError = useEvent((text: string | null) => {
    setTagErrorState((prev) =>
      text == null ? null : { id: (prev?.id ?? 0) + 1, text },
    );
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
  const { isEqual: isSameText } = useMemo(() => {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

    return { isEqual: (a: string, b: string) => collator.compare(a, b) === 0 };
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

  const disabledKeySet = useMemo(
    () => new Set([...(disabledKeys ?? [])].map(String)),
    [disabledKeys],
  );

  useEffect(() => {
    let next: Map<string, string> | null = null;

    for (const value of uniqueValues) {
      const label = collection.getItem(value)?.textValue;

      if (label && knownLabels.get(value) !== label) {
        if (!next) next = new Map(knownLabels);
        next.set(value, label);
      }
    }

    if (next) setKnownLabels(next);
  }, [uniqueValues, collection, knownLabels]);

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

  // The typed text as a pickable row, when it would add something new.
  const customTerm =
    hasOptions &&
    allowsCustomValue &&
    term &&
    findOptionKey(term) == null &&
    !uniqueValues.includes(term)
      ? term
      : null;

  const popoverChildren = useMemo(() => {
    if (!customTerm) return children;

    const customOption = (
      <Item key={customTerm} textValue={customTerm}>
        {customTerm}
      </Item>
    );

    if (!visibleOptionKeys.length) {
      return customOption;
    }

    const customSection = (
      <BaseSection
        key="__custom_value__"
        aria-label={t('tagInput.customValue', 'Custom value')}
      >
        {customOption}
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
  }, [customTerm, children, visibleOptionKeys.length, collection, t]);

  const hasResults = visibleOptionKeys.length > 0 || customTerm != null;
  // Options rebuild on every render when they come from `items`, so effects
  // follow what is visible rather than the collection's identity.
  const visibleOptionsSignature = visibleOptionKeys.join('\u0000');

  // ---- popover ------------------------------------------------------------
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isInteractive = !isDisabled && !isReadOnly;
  const shouldShowPopover =
    hasOptions && isInteractive && isPopoverOpen && hasResults;

  useEffect(() => {
    if (isPopoverOpen && hasOptions && !hasResults) {
      setIsPopoverOpen(false);
    }
  }, [isPopoverOpen, hasOptions, hasResults]);

  const notifiedOpenRef = useRef(false);

  useEffect(() => {
    if (notifiedOpenRef.current === shouldShowPopover) return;

    notifiedOpenRef.current = shouldShowPopover;
    onOpenChange?.(shouldShowPopover);
  }, [shouldShowPopover, onOpenChange]);

  // The option under virtual focus, mirrored in state for the input's
  // `aria-activedescendant`: the listbox's own state update does not re-render
  // this component.
  const [activeOptionKey, setActiveOptionKey] = useState<Key | null>(null);

  const moveVirtualFocus = useEvent((key: Key | null) => {
    const listState = listStateRef.current;

    if (!listState || key == null) return;

    markKeyboardFocus(listState);
    listState.selectionManager.setFocusedKey(key);
    setActiveOptionKey(key);
  });

  // The popover is at least as wide as the input box.
  const [popoverMinWidth, setPopoverMinWidth] = useState<number>();

  // An option whose label is exactly the typed text wins over the first match,
  // so typing "build" and pressing Enter picks "build", not "rebuild".
  const exactOptionKey = term ? findOptionKey(term) : null;
  const focusTermRef = useRef<string | null>(null);

  // Focus the best match when the popover opens or the text changes, and
  // whenever the focused option is filtered out, so Enter always acts on a
  // visible row. The keys come from this render's own filter: the listbox's
  // collection can lag a render behind right after the text narrows.
  useLayoutEffect(() => {
    if (!shouldShowPopover) {
      setActiveOptionKey(null);
      focusTermRef.current = null;

      return;
    }

    setPopoverMinWidth(wrapperRef.current?.offsetWidth);

    const visibleKeys: Key[] = customTerm
      ? [...visibleOptionKeys, customTerm]
      : visibleOptionKeys;
    const preferredKey =
      exactOptionKey != null && visibleKeys.includes(exactOptionKey)
        ? exactOptionKey
        : visibleKeys[0] ?? null;
    const isNewTerm = !!term && focusTermRef.current !== term;

    focusTermRef.current = term;

    let attempts = 0;

    const tick = () => {
      const listState = listStateRef.current;

      if (!listState) {
        attempts += 1;

        if (attempts < 8) requestAnimationFrame(tick);

        return;
      }

      const focused = listState.selectionManager.focusedKey;

      if (focused == null || !visibleKeys.includes(focused) || isNewTerm) {
        moveVirtualFocus(preferredKey);
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(tick));
  }, [
    shouldShowPopover,
    visibleOptionsSignature,
    customTerm,
    term,
    exactOptionKey,
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
      const optionKey = findOptionKey(part);
      const nextValue = optionKey ?? part;

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
      setValues([...uniqueValues, ...accepted]);
      messages.push(
        t('tagInput.added', 'Added {{value}}', {
          value: formatList(accepted.map(getOptionLabel)),
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

  const removeValues = useEvent((keys: string[]) => {
    const removed = new Set(keys);
    const next = uniqueValues.filter((value) => !removed.has(value));

    // Focus leaves the list before the last chip unmounts under it.
    if (!next.length) {
      inputRef.current?.focus();
    }

    setValues(next);
    setTagError(null);
    announce(
      t('tagInput.removed', 'Removed {{value}}', {
        value: formatList(keys.map(getOptionLabel)),
      }),
    );
  });

  /**
   * Picks an option in the popover, or unpicks one that already is a chip. The
   * popover stays open for the next pick, and the query is cleared so the full
   * list is back.
   */
  const toggleOption = useEvent((key: string) => {
    setTagError(null);

    if (uniqueValues.includes(key)) {
      removeValues([key]);
      setDraft('');
    } else {
      setDraft(commitParts([key]));
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
            (collection.getItem(value) != null || value === customTerm),
        ),
      ];

      changed.forEach(toggleOption);

      // The click moved the list's focus to the option; the input's
      // `aria-activedescendant` follows it.
      const clicked = changed[changed.length - 1];

      if (clicked != null) {
        listStateRef.current?.selectionManager.setFocusedKey(clicked);
        setActiveOptionKey(clicked);
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
    isTabbingRef.current = e.key === 'Tab';

    onKeyDown?.(e);

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
        );
      }

      return;
    }

    if ((e.key === 'Home' || e.key === 'End') && shouldShowPopover) {
      e.preventDefault();

      if (listState) {
        moveVirtualFocus(
          getEdgeVisibleKey(listState, e.key === 'Home' ? 'first' : 'last'),
        );
      }

      return;
    }

    if (e.key === 'Enter') {
      if (isComposingKey(e)) return;

      const focusedKey = shouldShowPopover
        ? listState?.selectionManager.focusedKey
        : null;

      if (focusedKey != null) {
        e.preventDefault();
        toggleOption(String(focusedKey));

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
      }
    }
  });

  // A separator can also arrive without a key press: autocorrect, IME, drag and
  // drop. Commit everything before the last separator and keep the rest typed.
  const handleInputChange = useEvent((next: string) => {
    setTagError(null);

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
        const isOption =
          collection.getItem(value) != null || knownLabels.has(value);
        const result = !isOption && validateTag ? validateTag(value) : true;
        const label = getOptionLabel(value);

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
          tagProps: tagProps?.(value),
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

  const tagInputProps = mergeProps(
    inputProps,
    {
      onKeyDown: handleKeyDown,
      onPaste: handlePaste,
      onBlur: handleInputBlur,
      onFocus: handleInputFocus,
      autoComplete,
      'data-input-type': 'taginput',
      // Joined, not replaced: the input keeps any description it already has.
      'aria-describedby':
        [inputProps['aria-describedby'], uniqueValues.length ? summaryId : null]
          .filter(Boolean)
          .join(' ') || undefined,
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
        // Clicking back into the input keeps the list open for the next pick.
        wrapperProps={hasOptions ? { 'data-popover-keep': '' } : undefined}
        inputProps={tagInputProps}
        mods={mods}
        icon={icon}
        prefix={prefix}
        suffix={suffix}
        suffixPosition={suffixPosition}
        actions={trigger}
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
          ? t('tagInput.summary', 'Selected: {{values}}', {
              values: formatList(tags.map((tag) => tag.label)),
            })
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
          isDisabled={isDisabled}
          disabledKeys={disabledKeys}
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
