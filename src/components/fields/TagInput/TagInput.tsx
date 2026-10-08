import { useControlledState } from '@react-stately/utils';
import { Node as CollectionNode, Key } from '@react-types/shared';
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
  useEffect,
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
  useCompositeFocus,
} from '../ListBoxPopover';
import { TextInputBase } from '../TextInput/TextInputBase';

import { TagList, TagListEntry } from './TagList';
import { useActiveOption } from './useActiveOption';
import { useTagError } from './useTagError';

import type { FieldBaseProps } from '../../../shared';
import type { CubeTagProps } from '../../content/Tag/Tag';
import type { CompositeBlurInfo } from '../ListBoxPopover';

type FilterFn = (textValue: string, inputValue: string) => boolean;

/**
 * `filter={false}`: the options come filtered already, as from a server.
 * Named rather than inline in the ternary that picks it: SonarJS charges a
 * function in a ternary branch to every later line of the component.
 */
const showEveryOption: FilterFn = () => true;

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
  /**
   * Which virtual keyboard the input asks for: `'email'` for addresses,
   * `'decimal'` for numbers. The input stays a text input, so the browser does
   * not validate what is typed.
   */
  inputMode?:
    | 'none'
    | 'text'
    | 'tel'
    | 'url'
    | 'email'
    | 'numeric'
    | 'decimal'
    | 'search';
  /** The label of the virtual keyboard's Enter key. */
  enterKeyHint?:
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send';
  /** Called when focus enters the component (input, chips or popover). Receives no event. */
  onFocus?: () => void;
  /**
   * Called when focus leaves the component entirely, after the typed text is
   * committed and before the press that moved focus is handled. Receives no
   * event.
   */
  onBlur?: () => void;
  /**
   * Called when a key is pressed in the input, before the component handles it.
   * Call `e.preventDefault()` to stop the component from handling the key.
   */
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;

  /**
   * Characters that commit the typed text, and that pasted text is split on.
   * Pasted text is also always split on line breaks. Pass `[]` for values that
   * may contain the default separator; only the first of several refused
   * values then stays in the input.
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
   * Text that matches an option only in case or accents is then added as
   * typed; without it, that text picks the option.
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
  /** Space between options, in pixels. Defaults to a hairline (`1bw`). */
  listGap?: number;
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
const textCollator = new Intl.Collator(undefined, { sensitivity: 'base' });
// Numbers in order: 2 before 10.
const textSorter = new Intl.Collator(undefined, { numeric: true });

function isSameText(a: string, b: string) {
  return textCollator.compare(a, b) === 0;
}

function compareText(a: string, b: string) {
  return textSorter.compare(a, b);
}

interface OptionMatch {
  /** The first option whose label is the text, or else the one whose key is. */
  exact: string | null;
  /** The first option whose label is the text ignoring case and accents. */
  loose: string | null;
}

/**
 * The options typed text names. The label comes first, since it is what the
 * user sees, then the key. An exact match is looked for in the whole list
 * before a loose one counts, so `active` finds `active` even after `Active`.
 */
function matchOptionText(
  collection: Iterable<CollectionNode<unknown>>,
  text: string,
): OptionMatch {
  let byKey: string | null = null;
  let loose: string | null = null;

  for (const node of collection) {
    const nodes = node.type === 'section' ? [...node.childNodes] : [node];

    for (const child of nodes) {
      if (child.type !== 'item') continue;

      const key = String(child.key);
      const label = child.textValue || '';

      if (label === text) return { exact: key, loose };

      if (byKey == null && key === text) byKey = key;
      if (loose == null && isSameText(label, text)) loose = key;
    }
  }

  return { exact: byKey, loose };
}

/**
 * The popover's rows: the options, then the user's own values and the typed
 * text. Those go in a section of their own when there are options to set them
 * apart from.
 */
function withCustomOptions(
  children: ReactNode,
  {
    customKeys,
    customTerm,
    hasOptionRows,
    hasSections,
    optionsLabel,
    customValuesLabel,
  }: {
    customKeys: readonly string[];
    customTerm: string | null;
    hasOptionRows: boolean;
    hasSections: boolean;
    optionsLabel: string;
    customValuesLabel: string;
  },
) {
  if (!customTerm && !customKeys.length) return children;

  const customOptions = customKeys.map((key) => (
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

  if (!hasOptionRows) {
    return customOptions;
  }

  const customSection = (
    <BaseSection key="__custom_values__" aria-label={customValuesLabel}>
      {customOptions}
    </BaseSection>
  );

  // A section cannot nest in another one, so options that already come in
  // sections only get the custom section appended.
  if (hasSections) {
    return [
      ...(Array.isArray(children) ? children : [children]),
      customSection,
    ];
  }

  return [
    <BaseSection key="__options__" aria-label={optionsLabel}>
      {children as never}
    </BaseSection>,
    customSection,
  ];
}

interface CustomRows {
  /** The user's own values, as rows. */
  keys: readonly string[];
  /** The ones the typed text leaves listed. */
  visibleKeys: readonly string[];
  /** The typed text as a pickable row, when it would add something new. */
  typedKey: string | null;
}

const NO_CUSTOM_ROWS: CustomRows = {
  keys: [],
  visibleKeys: [],
  typedKey: null,
};

/**
 * The rows listed after the options: the user's own values, so they can be
 * unpicked where they were picked, and the typed text. `unpicked` holds the
 * custom values unpicked during this visit, which stay listed.
 */
function getCustomRows({
  values,
  unpicked,
  isOption,
  term,
  isFiltering,
  matches,
  termOptionKey,
}: {
  values: readonly string[];
  unpicked: readonly string[];
  /** Whether a value is an option, or was one when it was picked. */
  isOption: (value: string) => boolean;
  term: string;
  /** Whether the typed text narrows the rows. */
  isFiltering: boolean;
  matches: FilterFn;
  /** The option the typed text names, if any. */
  termOptionKey: string | null;
}): CustomRows {
  // Sorted, so toggling one does not move it.
  const keys = [
    ...new Set([...values, ...unpicked].filter((value) => !isOption(value))),
  ].sort(compareText);

  return {
    keys,
    visibleKeys:
      isFiltering && term ? keys.filter((key) => matches(key, term)) : keys,
    typedKey:
      term &&
      termOptionKey == null &&
      !values.includes(term) &&
      !keys.includes(term)
        ? term
        : null,
  };
}

/**
 * The row the typed text names: the option it stands for, or else a custom
 * value it spells. Text that names a row only in another case is a value of
 * its own, so its own row wins over that one: Enter adds `paris` as typed, not
 * `Paris`.
 */
function getExactRowKey(
  collection: Iterable<CollectionNode<unknown>>,
  {
    term,
    termOptionKey,
    customTerm,
    customValueKeys,
  }: {
    term: string;
    termOptionKey: string | null;
    customTerm: string | null;
    customValueKeys: readonly string[];
  },
): string | null {
  if (termOptionKey != null) return termOptionKey;
  if (term && customValueKeys.includes(term)) return term;

  if (
    customTerm &&
    (matchOptionText(collection, customTerm).loose != null ||
      customValueKeys.some((key) => isSameText(key, customTerm)))
  ) {
    return customTerm;
  }

  return null;
}

/**
 * The row the focus pass lands on, and Enter with it. The row the typed text
 * names wins over the first match, so typing "build" and pressing Enter picks
 * "build", not "rebuild". Typed text means "add", so past an exact match the
 * first row that is not added yet wins: typing "def" next to a picked
 * "undefined" lands on "def".
 */
function getPreferredRowKey(
  rows: readonly Key[],
  exactKey: Key | null,
  term: string,
  values: readonly string[],
): Key | null {
  if (exactKey != null && rows.includes(exactKey)) return exactKey;

  const firstNew = term
    ? rows.find((key) => !values.includes(String(key)))
    : undefined;

  return firstNew ?? rows[0] ?? null;
}

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

/**
 * Where a committed part comes from: typed text, which may name an option, an
 * option row's key, or a custom value's row, which is only ever itself.
 */
type CommitSource = 'text' | 'option' | 'custom';

/** What a value must pass to become a chip. */
interface TagRules {
  /** Keys of options that cannot be picked. */
  disabledKeys: ReadonlySet<string>;
  /** Only options are accepted: there are options, and no custom values. */
  isOptionOnly: boolean;
  maxTags?: number;
  validateTag?: (value: string) => TagValidationResult;
}

/**
 * Why a value is refused, or `null` when it may be added. `optionKey` is the
 * option the part resolved to, if any: an option is not validated. `present`
 * holds the values already there, the ones this commit accepted so far among
 * them.
 */
function getRejection(
  value: string,
  optionKey: string | null,
  present: ReadonlySet<string>,
  { disabledKeys, isOptionOnly, maxTags, validateTag }: TagRules,
): Omit<Rejection, 'text'> | null {
  if (optionKey != null && disabledKeys.has(optionKey)) {
    return { reason: 'unavailable' };
  }

  if (optionKey == null && isOptionOnly) return { reason: 'unknown' };
  if (present.has(value)) return { reason: 'duplicate' };
  if (maxTags != null && present.size >= maxTags) return { reason: 'limit' };

  if (optionKey == null && validateTag) {
    const result = validateTag(value);

    if (result === false || typeof result === 'string') {
      return {
        reason: 'invalid',
        message: typeof result === 'string' ? result : undefined,
      };
    }
  }

  return null;
}

/** The input's combobox wiring, for a field with options to suggest. */
function getComboboxProps(
  listBoxId: string,
  isOpen: boolean,
  activeKey: Key | null,
) {
  return {
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-haspopup': 'listbox',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? listBoxId : undefined,
    'aria-activedescendant':
      isOpen && activeKey != null
        ? getListBoxOptionId(listBoxId, activeKey)
        : undefined,
  };
}

interface FieldButtonProps {
  id: string;
  size: CubeTagInputProps['size'];
  /** The field's `aria-label`, joined into the button's own name. */
  ariaLabel?: string;
  /** The ids that label the field, read after the button's own name. */
  fieldLabelledby?: string;
  onPress: () => void;
}

/** The button in the input that toggles the suggestions popover. */
function TagInputTrigger({
  id,
  size,
  ariaLabel,
  fieldLabelledby,
  onPress,
  isOpen,
  isDisabled,
  styles,
}: FieldButtonProps & {
  isOpen: boolean;
  isDisabled: boolean;
  styles?: Styles;
}) {
  const { t } = useI18n();

  return (
    <ItemAction
      data-popover-trigger
      id={id}
      qa="TagInputTrigger"
      icon={<DirectionIcon to={isOpen ? 'up' : 'down'} />}
      size={size}
      isDisabled={isDisabled}
      styles={styles}
      mods={{ pressed: isOpen }}
      // Arrow keys open the list from the input, so the button stays out of
      // the Tab order and Tab goes from the input straight to the chips.
      tabIndex={-1}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-label={
        ariaLabel
          ? t('tagInput.showOptionsFor', 'Show options, {{label}}', {
              label: ariaLabel,
            })
          : t('tagInput.showOptions', 'Show options')
      }
      aria-labelledby={fieldLabelledby ? `${id} ${fieldLabelledby}` : undefined}
      onPress={onPress}
    />
  );
}

/** The button in the input that clears the typed text. */
function TagInputClearButton({
  id,
  size,
  ariaLabel,
  fieldLabelledby,
  onPress,
}: FieldButtonProps) {
  const { t } = useI18n();

  return (
    <ItemAction
      id={id}
      qa="TagInputClearButton"
      icon={<CloseIcon />}
      size={size}
      // Escape does the same from the keyboard. As a Tab stop it would take
      // focus just as tabbing away commits the text and removes it.
      tabIndex={-1}
      aria-label={
        ariaLabel
          ? t('tagInput.clearTextFor', 'Clear text, {{label}}', {
              label: ariaLabel,
            })
          : t('tagInput.clearText', 'Clear text')
      }
      aria-labelledby={fieldLabelledby ? `${id} ${fieldLabelledby}` : undefined}
      onPress={onPress}
    />
  );
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
    listGap,
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
  const uniqueValues = [...new Set((values ?? []).map(String))];

  // ---- typed text ---------------------------------------------------------
  const [draft, setDraftState] = useControlledState<string>(
    inputValueProp as string | undefined,
    defaultInputValue ?? '',
    onInputChange,
  );
  const { tagError, setTagError, clearTagErrorAfterPress, cancelPendingClear } =
    useTagError();
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

  // An option's node. Sections are in the collection too, under keys of their
  // own, but a value that shares one is still the user's own text.
  const getOption = (key: string) => {
    const node = collection.getItem(key);

    return node?.type === 'item' ? node : null;
  };

  const { contains } = useFilter({ sensitivity: 'base' });

  const textFilterFn: FilterFn =
    filter === false ? showEveryOption : filter || contains;

  const [isFilterActive, setIsFilterActive] = useState(false);
  const term = draft.trim();

  // Labels of picked options, kept after the option leaves the collection, as
  // it does with server-side filtering (`items` + `filter={false}`).
  const [knownLabels, setKnownLabels] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  const getOptionLabel = (key: string) =>
    getOption(key)?.textValue || knownLabels.get(key) || key;

  // What a chip reads as, and what announcements name it by: a string label
  // the chip is given, then the option's own.
  const getTagLabel = (key: string) =>
    textLabel(tagProps?.(key)?.children) ?? getOptionLabel(key);

  // A locked chip stays put: no remove button, Delete or unpick.
  const isTagLocked = (key: string) => !!tagProps?.(key)?.isDisabled;

  const disabledKeySet = new Set([...(disabledKeys ?? [])].map(String));

  // Called before the text changes (and the options with it) and when values
  // are added, while the options still hold the labels.
  const rememberLabels = useEvent((keys: readonly string[]) => {
    let next: Map<string, string> | null = null;

    for (const key of keys) {
      const label = getOption(key)?.textValue;

      if (label && knownLabels.get(key) !== label) {
        if (!next) next = new Map(knownLabels);
        next.set(key, label);
      }
    }

    if (next) setKnownLabels(next);
  });

  /**
   * The option typed text stands for, if any. Without `allowsCustomValue` a
   * label in another case or without its accents counts, so `production`
   * finds `Production`. With it, such text is a value of its own and is added
   * as typed: `paris` is not `Paris` to a case-sensitive filter.
   */
  const findOptionKey = (text: string): string | null => {
    if (!hasOptions) return null;

    const match = matchOptionText(collection, text);

    return match.exact ?? (allowsCustomValue ? null : match.loose);
  };

  /**
   * What typed text commits as: the option it names, or else the text itself,
   * rewritten by `normalizeTag`, and the option that names if any. Enter, a
   * delimiter, a paste and blur all go through this, so they agree.
   */
  const resolveTypedText = (text: string) => {
    const optionKey = findOptionKey(text);

    if (optionKey != null || !normalizeTag) return { optionKey, typed: text };

    const typed = normalizeTag(text).trim();

    return { optionKey: typed ? findOptionKey(typed) : null, typed };
  };

  /**
   * What a part commits as. Only typed text is matched to an option. An option
   * row commits its own key; a custom value's row is the user's own text, so
   * `normalizeTag` still rewrites it, but it never turns into an option.
   */
  const resolvePart = (part: string, source: CommitSource = 'text') => {
    if (source === 'text') return resolveTypedText(part);
    if (source === 'option') return { optionKey: part, typed: part };

    return {
      optionKey: null,
      typed: normalizeTag ? normalizeTag(part).trim() : part,
    };
  };

  const termOptionKey = term ? resolveTypedText(term).optionKey : null;

  // The option the text names stays listed even when the filter would hide
  // it (a key typed, a custom filter), so Enter can land on it.
  const optionFilterFn = (nodes: Iterable<any>) => {
    if (!isFilterActive || !term) return nodes;

    return filterCollectionNodes(nodes, term, textFilterFn, {
      keep:
        termOptionKey == null
          ? undefined
          : (node) => String(node.key) === termOptionKey,
    });
  };

  const visibleOptionKeys: Key[] = [];

  if (hasOptions) {
    collectVisibleKeys(
      optionFilterFn(collection),
      visibleOptionKeys,
      disabledKeys ? new Set(disabledKeys) : undefined,
    );
  }

  // Custom values unpicked in the list during this visit. They stay listed,
  // unchecked, until focus leaves the field: the row does not vanish under the
  // pointer, and it can be picked back.
  const [unpickedCustomValues, setUnpickedCustomValues] = useState<
    readonly string[]
  >([]);

  // The user's own values and the typed text, listed after the options. Only
  // with `allowsCustomValue`: without it an unpicked value could not be added
  // back.
  const {
    keys: customValueKeys,
    visibleKeys: visibleCustomKeys,
    typedKey: customTerm,
  } = hasOptions && allowsCustomValue
    ? getCustomRows({
        values: uniqueValues,
        unpicked: unpickedCustomValues,
        isOption: (value) => getOption(value) != null || knownLabels.has(value),
        term,
        isFiltering: isFilterActive,
        // The typed text narrows them as it narrows the options, even when
        // the options are filtered on the server (`filter={false}`): these
        // rows are this component's own.
        matches: typeof filter === 'function' ? filter : contains,
        termOptionKey,
      })
    : NO_CUSTOM_ROWS;

  const popoverChildren = withCustomOptions(children, {
    customKeys: visibleCustomKeys,
    customTerm,
    hasOptionRows: visibleOptionKeys.length > 0,
    hasSections: [...collection].some((node) => node.type === 'section'),
    optionsLabel: t('tagInput.options', 'Options'),
    customValuesLabel: t('tagInput.customValues', 'Custom values'),
  });

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

  const visibleTargetKeys: Key[] = [...visibleOptionKeys, ...visibleCustomKeys];

  if (customTerm) visibleTargetKeys.push(customTerm);

  const preferredOptionKey = getPreferredRowKey(
    visibleTargetKeys,
    getExactRowKey(collection, {
      term,
      termOptionKey,
      customTerm,
      customValueKeys,
    }),
    term,
    uniqueValues,
  );

  const { activeOption, setActiveOption, moveVirtualFocus, popoverMinWidth } =
    useActiveOption({
      listStateRef,
      wrapperRef,
      isOpen: shouldShowPopover,
      visibleOptionsSignature,
      customTerm,
      term,
      preferredOptionKey,
    });
  const activeOptionKey = activeOption?.key ?? null;

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

  // Refused parts go back to the input joined by a delimiter, so they split
  // back into the same values. A line break cannot join them: the input drops
  // it. Typing a delimiter always leaves one to join with.
  const joinDelimiter = delimiters.find(
    (delimiter) => delimiter && !LINE_BREAK.test(delimiter),
  );
  const joiner = joinDelimiter ? `${joinDelimiter} ` : ' ';

  // Without a label or `forceField` there is no field wrapper to show the
  // message, so a rejection is announced instead.
  const hasFieldMessage = !!label || !!props.forceField;

  /**
   * Turns typed parts into values. Accepted parts become chips. Refused ones
   * come back as text for the input, with a message, except a duplicate: it is
   * a chip already, and the message says so. With no delimiter to join them,
   * only the first refused part comes back, since glued together they would
   * commit as one value nobody typed. A row picked from the list says where it
   * comes from (`source`), so it is never matched to another option.
   */
  const commitParts = useEvent((parts: string[], source?: CommitSource) => {
    if (!parts.length) return '';

    const rules: TagRules = {
      disabledKeys: disabledKeySet,
      isOptionOnly: hasOptions && !allowsCustomValue,
      maxTags,
      validateTag,
    };
    const present = new Set(uniqueValues);
    const accepted: string[] = [];
    const rejected: Rejection[] = [];

    for (const part of parts) {
      // Only text of its own is rewritten; an option keeps its key.
      const { optionKey, typed } = resolvePart(part, source);

      if (!typed) continue;

      const nextValue = optionKey ?? typed;
      const rejection = getRejection(nextValue, optionKey, present, rules);

      if (rejection) {
        rejected.push({ text: part, ...rejection });
        continue;
      }

      present.add(nextValue);
      accepted.push(nextValue);
    }

    const returned = rejected.filter(
      (rejection) => rejection.reason !== 'duplicate',
    );
    const kept = joinDelimiter ? returned : returned.slice(0, 1);
    // The message is about the text left in the input, if there is any.
    const shown = kept[0] ?? rejected[0];
    const error = shown ? rejectionMessage(shown) : null;
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

    return kept.map((rejection) => rejection.text).join(joiner);
  });

  /** Commits the typed text and returns what is left in the input. */
  const commitDraft = useEvent(() => {
    const rest = commitParts(splitTagText(draft, delimiters));

    setDraft(rest);

    return rest;
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
   * list is back. A picked row is never swapped for an option with a similar
   * or the same text. A custom value's row is still the user's own text, so
   * `normalizeTag` and `validateTag` apply to it. The typed text's row is the
   * typed text, so it commits as a delimiter would.
   */
  const toggleOption = useEvent((key: string) => {
    if (isTagLocked(key)) return;

    const source: CommitSource =
      getOption(key) != null
        ? 'option'
        : customValueKeys.includes(key)
          ? 'custom'
          : 'text';

    setTagError(null);

    if (uniqueValues.includes(key)) {
      removeValues([key]);
      setDraft('');

      if (customValueKeys.includes(key)) {
        setUnpickedCustomValues((prev) =>
          prev.includes(key) ? prev : [...prev, key],
        );
      }
    } else if (!commitParts([key], source)) {
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
            (getOption(value) != null || visibleCustomKeys.includes(value)),
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

  const handleArrowKey = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
    if (!hasOptions) return;

    e.preventDefault();

    if (!shouldShowPopover) {
      if (!hasResults) setIsFilterActive(false);
      setIsPopoverOpen(true);

      return;
    }

    const listState = listStateRef.current;

    if (listState) {
      moveVirtualFocus(
        getNextVisibleKey(listState, e.key === 'ArrowDown' ? 1 : -1),
        'user',
        term,
      );
    }
  });

  const handleEdgeKey = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const listState = listStateRef.current;

    if (listState) {
      moveVirtualFocus(
        getEdgeVisibleKey(listState, e.key === 'Home' ? 'first' : 'last'),
        'user',
        term,
      );
    }
  });

  // The chips sit below the input, not beside the caret, so Backspace in an
  // empty input moves to the last chip instead of removing it out of view.
  // The chip comes into view with focus and says it is removable; the next
  // Backspace removes it and moves to the one before.
  const handleBackspaceKey = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
    if (isComposingKey(e)) return;

    e.preventDefault();

    // A held Backspace that just emptied the input stops there, so it does
    // not run on into the chips.
    if (e.repeat) return;

    setIsPopoverOpen(false);
    focusLastTag();
  });

  const handleEnterKey = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
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
      // as a duplicate and the text cleared, as a comma or blur would;
      // unpicking one takes the arrows, a click, or an empty input.
      if (
        term &&
        uniqueValues.includes(key) &&
        !(isCurrent && activeOption.source === 'user')
      ) {
        setDraft('');
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

    // Enter is for adding values and never submits a form, even with nothing
    // typed: pressing it once more after the last value must not send a
    // half-filled dialog.
    e.preventDefault();

    if (term) commitDraft();
  });

  const handleDelimiterKey = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
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
  });

  // Escape takes back one thing at a time: the list, then the text. A message
  // goes with either, or on its own when the input is already empty, as after
  // a refused duplicate.
  const handleEscapeKey = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
    if (shouldShowPopover) {
      e.preventDefault();
      e.stopPropagation();
      setIsPopoverOpen(false);
      setTagError(null);
    } else if (draft || tagError) {
      e.preventDefault();
      e.stopPropagation();
      setDraft('');
      setTagError(null);
      // It may be open but hidden for want of a match; the full list must
      // not appear when the text goes.
      setIsPopoverOpen(false);
    }
  });

  const handleKeyDown = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);

    // A Tab the consumer prevented moves no focus.
    isTabbingRef.current = e.key === 'Tab' && !e.defaultPrevented;

    if (e.defaultPrevented || !isInteractive) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      handleArrowKey(e);
    } else if ((e.key === 'Home' || e.key === 'End') && shouldShowPopover) {
      handleEdgeKey(e);
    } else if (
      e.key === 'Backspace' &&
      !draft &&
      uniqueValues.some((value) => !isTagLocked(value))
    ) {
      handleBackspaceKey(e);
    } else if (e.key === 'Enter') {
      handleEnterKey(e);
    } else if (delimiters.includes(e.key)) {
      handleDelimiterKey(e);
    } else if (e.key === 'Escape') {
      handleEscapeKey(e);
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
  // What leaving the input does to the typed text. Returns the text left.
  const settleDraft = useEvent((): string => {
    if (!term) return '';
    if (!shouldCommitOnBlur || !isInteractive) return draft;

    if (hasOptions && !allowsCustomValue && termOptionKey == null) {
      // Leaving a filter query behind is not an entry: drop it, as ComboBox
      // does with text that matches no option.
      setDraft('');
      setTagError(null);

      return '';
    }

    return commitDraft();
  });

  const handleCompositeFocus = useEvent(() => {
    cancelPendingClear();
    onFocus?.();
  });

  const handleCompositeBlur = useEvent(({ isPressing }: CompositeBlurInfo) => {
    setIsPopoverOpen(false);
    setUnpickedCustomValues([]);

    const wasShowingMessage = tagError != null;

    // A message can only be about text in the input. Once none is left, as
    // after a refused duplicate, the field does not stay marked invalid.
    if (!settleDraft()) {
      // One set while settling is cleared in the same render, and never shows.
      if (isPressing && wasShowingMessage) clearTagErrorAfterPress();
      else setTagError(null);
    }

    onBlur?.();
  });

  const { compositeFocusProps } = useCompositeFocus({
    wrapperRef: rootRef as RefObject<HTMLElement>,
    popoverRef: popoverRef as RefObject<HTMLElement>,
    onFocus: handleCompositeFocus,
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
  const tags: TagListEntry[] = uniqueValues.map((value) => {
    const ownProps = tagProps?.(value);
    const isOption = getOption(value) != null || knownLabels.has(value);
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
            ? t('tagInput.invalidValue', '"{{value}}" is not a valid value', {
                value: label,
              })
            : undefined,
      tagProps: ownProps,
      isDisabled: !!ownProps?.isDisabled,
    };
  });

  const effectiveIsInvalid = tagError ? true : isInvalid;
  const hasRemovableTags = tags.some((tag) => !tag.isDisabled);
  // Backspace in an empty input is how the keyboard gets to the chips without
  // Tab; nothing on screen says so.
  const hasBackspaceHint = isInteractive && hasRemovableTags;

  // A locked value's option stays checked but cannot be unpicked.
  const lockedKeys = tags.filter((tag) => tag.isDisabled).map((tag) => tag.key);
  const optionDisabledKeys = lockedKeys.length
    ? [...disabledKeySet, ...lockedKeys]
    : disabledKeys;

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
  // Names the chips, the buttons and the options after the field: "Selected
  // values Also send to", rather than the same words for every field on the
  // page. The ids go in the order the input reads them: the visible label,
  // then `aria-labelledby`.
  const ariaLabel = (props as { 'aria-label'?: string })['aria-label'];
  const ariaLabelledby = (props as { 'aria-labelledby'?: string })[
    'aria-labelledby'
  ];
  const labelId = label ? (labelProps.id as string | undefined) : undefined;
  const fieldLabelledby =
    [labelId, ariaLabelledby].filter(Boolean).join(' ') || undefined;
  // An `aria-label` has no element to point at, so its words are joined into
  // each part's own name instead, ahead of the ids. That is the input's order
  // too: given `aria-label` with a `label` or `aria-labelledby`, React Aria
  // puts the input's own id first in its `aria-labelledby`, so it reads
  // "Values Primary key" and the chips "Selected values, Values Primary key".

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
      ? getComboboxProps(listBoxId, shouldShowPopover, activeOptionKey)
      : undefined,
  );

  const handleTriggerPress = useEvent(() => {
    const willOpen = !shouldShowPopover;

    if (willOpen && !hasResults) setIsFilterActive(false);

    setIsPopoverOpen(willOpen);
    inputRef.current?.focus();
  });

  const trigger =
    hasOptions && !hideTrigger ? (
      <TagInputTrigger
        id={triggerId}
        size={size}
        ariaLabel={ariaLabel}
        fieldLabelledby={fieldLabelledby}
        isOpen={shouldShowPopover}
        isDisabled={!isInteractive}
        styles={triggerStyles}
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
    <TagInputClearButton
      id={clearId}
      size={size}
      ariaLabel={ariaLabel}
      fieldLabelledby={fieldLabelledby}
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
          aria-label={
            ariaLabel
              ? t('tagInput.selectedValuesFor', 'Selected values, {{label}}', {
                  label: ariaLabel,
                })
              : t('tagInput.selectedValues', 'Selected values')
          }
          aria-labelledby={fieldLabelledby}
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
          listGap={listGap}
          selectionMode="multiple"
          selectedKeys={uniqueValues}
          isCheckable
          // Clicking back into the input keeps the list open for the next pick.
          shouldCloseOnTriggerInteraction={false}
          // A press on an outside control reaches it, so a Save button saves
          // on the first click: focus moves there, and the blur commits the
          // text. A press elsewhere, as on a dialog's backdrop, only closes it.
          shouldPassControlPresses
          isDisabled={isDisabled}
          disabledKeys={optionDisabledKeys}
          listStateRef={listStateRef}
          // The ids the input reads, the visible label's among them, so the
          // list reads as the input does, a label that is not a string too.
          ariaLabel={ariaLabel}
          ariaLabelledby={fieldLabelledby}
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
