import { Key } from '@react-types/shared';
import { Styles } from '@tenphi/tasty';
import React, {
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
import { useFilter, useTextField } from 'react-aria';
import { Section as BaseSection, useListState } from 'react-stately';

import { useEvent } from '../../../_internal';
import { generateRandomId } from '../../../utils/random';
import { chain, mergeProps, useCombinedRefs } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { CollectionItem as Item } from '../../CollectionItem';
import { useFieldProps } from '../../form';
import {
  collectVisibleKeys,
  filterCollectionNodes,
  getEdgeVisibleKey,
  getNextVisibleKey,
  ListBoxPopover,
  ListStateLike,
  markKeyboardFocus,
  TextFilterFn,
  useCompositeFocus,
} from '../ListBoxPopover';
import {
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';

import { useCaretAnchor } from './useCaretAnchor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single trigger character with optional placement constraint. */
export interface CommandTrigger {
  /** The character that opens the autocomplete (e.g. `/` or `@`). */
  char: string;
  /**
   * When true, the trigger token must start at the beginning of the line the
   * caret is on (right after a newline, or at the very start of the input) —
   * i.e. line-scoped slash commands. When false, the token may appear after
   * any whitespace, anywhere in the text (Slack/Notion-style).
   */
  atLineStart?: boolean;
}

/** Result of scanning the textarea for an active trigger token. */
export interface ActiveToken {
  /** The matched trigger descriptor. */
  trigger: CommandTrigger;
  /** The active token text, INCLUDING the trigger char (e.g. `/cle`). */
  token: string;
  /** Inclusive start index of the token in the textarea value. */
  start: number;
  /** Exclusive end index of the token (caret position while typing). */
  end: number;
}

export type CommandTextAreaFilterFn = TextFilterFn;

export interface CubeCommandTextAreaProps<T>
  extends Omit<CubeTextInputBaseProps, 'children' | 'multiLine'> {
  /** Whether the textarea should resize to fit its content. */
  autoSize?: boolean;
  /** Max visible rows when `autoSize` is true. Defaults to 10. */
  maxRows?: number;
  /** Number of visible rows. Defaults to 3. */
  rows?: number;

  /** Command/option source (alternative to JSX children). */
  items?: Iterable<T>;
  /** Static items or a render function (same shape as ComboBox/ListBox). */
  children?: ReactNode | ((item: T) => ReactElement);
  /**
   * Triggers that open the autocomplete. Defaults to a single slash command
   * that must start at the beginning of the input.
   */
  triggers?: CommandTrigger[];
  /**
   * Custom filter. Pass `false` to disable internal filtering (server-side).
   */
  filter?: CommandTextAreaFilterFn | false;
  /**
   * Fired when the user picks a command (Enter/Tab/click). The option's
   * `textValue` is also inserted into the textarea regardless.
   */
  onCommand?: (key: Key, item: { textValue: string; [k: string]: any }) => void;
  /** Insert a trailing space after the chosen command. Defaults to true. */
  insertSpaceAfter?: boolean;
  /** Keys of disabled options. */
  disabledKeys?: Iterable<Key>;
  /** Popover placement. Chat inputs usually want `top`. Defaults to `top`. */
  direction?: 'bottom' | 'top';
  /** Whether the popover should flip when overflowing. Defaults to true. */
  shouldFlip?: boolean;
  /** Offset between the textarea and the popover. */
  overlayOffset?: number;
  /** Padding between the popover and the viewport edge. */
  containerPadding?: number;

  // Refs
  /** Ref for the textarea element. */
  inputRef?: RefObject<HTMLTextAreaElement>;
  /** Ref for the wrapper element (popover anchor). */
  wrapperRef?: RefObject<HTMLDivElement>;
  /** Ref for the popover overlay element. */
  popoverRef?: RefObject<HTMLDivElement>;
  /** Ref for the listbox element. */
  listBoxRef?: RefObject<HTMLDivElement>;
  /** Ref through which the internal list state is exposed. */
  listStateRef?: RefObject<ListStateLike | null>;

  // Style props
  overlayStyles?: any;
  listBoxStyles?: any;
  optionStyles?: any;
  sectionStyles?: any;
  headingStyles?: any;
}

const DEFAULT_TRIGGERS: CommandTrigger[] = [{ char: '/', atLineStart: true }];

// ---------------------------------------------------------------------------
// Trigger parsing
// ---------------------------------------------------------------------------

/**
 * Inspect the textarea contents up to the caret and find the active trigger
 * token, if any. The token includes the trigger character and ends at the
 * caret (so it grows as the user types). A token ends at whitespace or the end
 * of the input.
 */
export function parseActiveToken(
  value: string,
  caret: number,
  triggers: CommandTrigger[],
): ActiveToken | null {
  if (!triggers.length) return null;
  const before = value.slice(0, caret);
  const after = value.slice(caret);

  for (const trigger of triggers) {
    const ch = trigger.char;
    if (trigger.atLineStart) {
      // Line-start command: the trigger char must sit at the start of the line
      // the caret is on (right after a newline, or at index 0), with no
      // whitespace between it and the caret. On a single-line input with no
      // newlines this is equivalent to "index 0 of the whole input".
      const lineStart = before.lastIndexOf('\n') + 1;
      const linePrefix = before.slice(lineStart);
      if (linePrefix[0] !== ch) continue;
      // No whitespace allowed within the token (after the trigger char).
      const wsIndex = linePrefix.slice(1).search(/\s/);
      if (wsIndex !== -1) continue;
      if (!linePrefix) continue;
      return { trigger, token: linePrefix, start: lineStart, end: caret };
    }

    // Caret-token mode: find the last trigger char that begins a token at or
    // after a line start / whitespace boundary, with no whitespace between it
    // and the caret.
    const match = /(?:^|\s)([\S]+)$/.exec(before);
    if (!match) continue;
    const candidate = match[1];
    if (candidate[0] !== ch) continue;
    // Ensure the token hasn't already been closed by whitespace after caret.
    // (If there's non-whitespace after the caret, the user is mid-token.)
    const start = caret - candidate.length;
    // If immediately after the caret there's whitespace (or end), the token is
    // "complete" — still offer completions as long as the caret sits on the
    // token. We accept it.
    void after;
    return { trigger, token: candidate, start, end: caret };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CommandTextArea<T extends object>(
  props: WithNullableValue<CubeCommandTextAreaProps<T>>,
  ref: ForwardedRef<HTMLElement>,
) {
  props = castNullableStringValue(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      onChange,
      value: value?.toString() ?? '',
    }),
  });

  let {
    qa,
    autoSize = false,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    onChange,
    maxRows = 10,
    rows = 3,
    labelProps: userLabelProps,
    inputRef: propsInputRef,
    value,
    defaultValue,
    placeholder,
    // command props
    items,
    children: renderChildren,
    triggers = DEFAULT_TRIGGERS,
    filter,
    onCommand,
    insertSpaceAfter = true,
    disabledKeys,
    direction = 'top',
    shouldFlip = true,
    overlayOffset = 8,
    containerPadding = 8,
    overlayStyles,
    listBoxStyles,
    optionStyles,
    sectionStyles,
    headingStyles,
    wrapperRef: propsWrapperRef,
    popoverRef: propsPopoverRef,
    listBoxRef: propsListBoxRef,
    listStateRef: propsListStateRef,
    onKeyDown,
    onFocus,
    onBlur,
    ...otherProps
  } = props;

  rows = Math.max(rows, 1);
  maxRows = Math.max(maxRows, rows);

  // ---- refs -------------------------------------------------------------
  const localInputRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = (propsInputRef ??
    localInputRef) as RefObject<HTMLTextAreaElement>;
  const wrapperRef = useCombinedRefs(propsWrapperRef);
  const popoverRef = useCombinedRefs(propsPopoverRef);
  const listBoxRef = useCombinedRefs(propsListBoxRef);
  const localListStateRef = useRef<ListStateLike | null>(null);
  const listStateRef = (propsListStateRef ??
    localListStateRef) as RefObject<ListStateLike | null>;

  const commandTextAreaId = useMemo(() => generateRandomId(), []);

  // ---- controlled / uncontrolled value ----------------------------------
  // When no `value` is provided (standalone, no form), track the text
  // internally so trigger detection and commit still work.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    (value as string) ?? (defaultValue as string) ?? '',
  );
  const effectiveValue: string = isControlled
    ? (value as string)
    : internalValue;
  const handleChange = useEvent((next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  });

  // ---- children / items normalization -----------------------------------
  let children: ReactNode = renderChildren as ReactNode;
  const renderFn = renderChildren as unknown;
  if (items && typeof renderFn === 'function') {
    const itemsArray = Array.from(items as Iterable<any>);
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
  }

  // ---- caret tracking ---------------------------------------------------
  // The caret drives trigger detection. We keep it in state so a caret move
  // (arrow keys without typing) re-renders and recomputes the active token.
  const [caret, setCaret] = useState(() => effectiveValue.length);
  const syncCaret = useEvent(() => {
    const el = inputRef.current;
    if (!el) return;
    setCaret(el.selectionStart ?? el.value.length);
  });

  // ---- trigger detection ------------------------------------------------
  const activeToken = useMemo(
    () =>
      parseActiveToken(
        effectiveValue,
        Math.min(caret, effectiveValue.length),
        triggers,
      ),
    [effectiveValue, caret, triggers],
  );

  // The active token includes the trigger char (e.g. `/co`). Strip it before
  // filtering so the query is matched against the meaningful text — this lets
  // options match by their label/description (which don't contain the trigger
  // char) as well as by their `textValue`.
  const term = useMemo(() => {
    if (!activeToken) return '';
    const { token, trigger } = activeToken;
    return token.startsWith(trigger.char)
      ? token.slice(trigger.char.length)
      : token;
  }, [activeToken]);

  // ---- filtering --------------------------------------------------------
  const { contains } = useFilter({ sensitivity: 'base' });
  const textFilterFn = useMemo<CommandTextAreaFilterFn>(
    () => (filter === false ? () => true : filter || contains),
    [filter, contains],
  );

  // Local collection used to read option textValues and to count matches.
  const localCollectionState = useListState({
    children: children as any,
    items: items as any,
    selectionMode: 'none',
  });

  const filterFn = useCallback(
    (nodes: Iterable<any>) =>
      filterCollectionNodes(nodes, term, textFilterFn, {
        matchExtraFields: true,
      }),
    [term, textFilterFn],
  );

  // Keys of the currently visible (filtered) options, in display order.
  // Derived from our own local collection + filter (rather than the ListBox's
  // exposed state ref) so it is always in sync with the current token — the
  // ListBox's `stateRef.collection` can momentarily lag by a render right after
  // the token narrows, which would otherwise leave virtual focus on (and commit)
  // an option that is no longer visible.
  const visibleFilteredKeys = useMemo<Key[]>(() => {
    if (!activeToken) return [];
    const keys: Key[] = [];
    const disabled = disabledKeys ? new Set<Key>(disabledKeys) : undefined;
    collectVisibleKeys(
      filterFn(localCollectionState.collection),
      keys,
      disabled,
    );
    return keys;
  }, [activeToken, filterFn, localCollectionState.collection, disabledKeys]);

  const filteredCount = visibleFilteredKeys.length;

  // ---- dismiss handling (Escape keeps the text but hides the popover) ---
  const [dismissedToken, setDismissedToken] = useState<string | null>(null);
  // Bumped whenever we move the virtual focus so the textarea's
  // `aria-activedescendant` (read from the ListBox's stateRef at render time)
  // stays in sync — the ListBox's own state update does not re-render us.
  const [, setFocusTick] = useState(0);
  const bumpFocus = useEvent(() => setFocusTick((t) => t + 1));
  // Reset dismissal whenever the active token changes (user typed/backspaced).
  useEffect(() => {
    setDismissedToken((prev) =>
      prev != null && activeToken?.token !== prev ? null : prev,
    );
  }, [activeToken?.token]);

  const isCommandMode = !!activeToken && activeToken.token !== dismissedToken;
  const shouldShowPopover = isCommandMode && filteredCount > 0;

  // ---- caret-anchored popover ------------------------------------------
  // A zero-size element positioned at the caret (both axes) drives the
  // popover's geometry; the wrapper remains the dismiss/outside-click trigger.
  const { anchorRef: caretAnchorRef, positionApiRef } = useCaretAnchor({
    inputRef: inputRef as RefObject<HTMLTextAreaElement>,
    wrapperRef: wrapperRef as RefObject<HTMLElement>,
    caret,
    value: effectiveValue,
    isActive: shouldShowPopover,
  });

  // ---- height autosize (mirrors TextArea) -------------------------------
  const adjustHeight = useEvent(() => {
    const textarea = inputRef.current;
    if (!textarea || !autoSize) return;

    textarea.style.height = 'auto';
    const computedStyle = getComputedStyle(textarea);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
    const lineHeight = parseInt(computedStyle.lineHeight) || 20;
    const contentHeight = textarea.scrollHeight - paddingTop - paddingBottom;
    const computedRows = Math.ceil(contentHeight / lineHeight);
    const targetRows = Math.max(Math.min(computedRows, maxRows), rows);
    const totalHeight =
      targetRows * lineHeight +
      paddingTop +
      paddingBottom +
      borderTop +
      borderBottom;
    textarea.style.height = `${totalHeight}px`;
  });

  // ---- useTextField (ARIA wiring for the textarea) ----------------------
  let { labelProps, inputProps } = useTextField(
    {
      ...otherProps,
      value: effectiveValue,
      placeholder,
      isDisabled,
      isReadOnly,
      isRequired,
      onChange: chain(handleChange, adjustHeight),
      inputElementType: 'textarea',
    } as any,
    inputRef as any,
  );

  const mergedLabelProps = mergeProps(labelProps, userLabelProps);

  const useEnvironmentalEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useEnvironmentalEffect(() => {
    if (!autoSize || !inputRef.current) return;
    adjustHeight();
    const resizeObserver = new ResizeObserver(adjustHeight);
    resizeObserver.observe(inputRef.current);
    return () => resizeObserver.disconnect();
  }, [autoSize, inputRef.current]);

  useEnvironmentalEffect(() => {
    if (autoSize && inputRef.current) {
      adjustHeight();
    }
  }, [effectiveValue]);

  // ---- caret restore after commit --------------------------------------
  const pendingCaretRef = useRef<number | null>(null);
  useEnvironmentalEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    if (pendingCaretRef.current != null) {
      // Restore caret after we programmatically inserted a command.
      const pos = pendingCaretRef.current;
      pendingCaretRef.current = null;
      el.focus();
      el.setSelectionRange(pos, pos);
      setCaret(pos);
      return;
    }

    // The value changed without our own commit (controlled update from
    // outside, form reset, or defaultValue seeding). Resync the caret from
    // the DOM selection so trigger parsing works off a valid index instead of
    // a stale one. We intentionally do not steal focus here.
    const domCaret = el.selectionStart ?? el.value.length;
    setCaret((prev) => (prev === domCaret ? prev : domCaret));
  }, [effectiveValue]);

  // ---- helpers ----------------------------------------------------------
  const getItemTextValue = useCallback(
    (key: Key): string => {
      const item = localCollectionState?.collection?.getItem(key);
      return item?.textValue || String(key);
    },
    [localCollectionState?.collection],
  );

  // ---- commit (insert the chosen option's literal value) ---------------
  const commit = useEvent((key: Key) => {
    const listState = listStateRef.current;
    // Guard against committing a stale key that has been filtered out of the
    // visible list (e.g. the token was narrowed after focus landed on it).
    // Fall back to the first still-visible option so the inserted command
    // always matches what the user can see.
    if (visibleFilteredKeys.length > 0 && !visibleFilteredKeys.includes(key)) {
      key = visibleFilteredKeys[0];
    }
    const textValue = getItemTextValue(key);
    const token = activeToken;
    const el = inputRef.current;

    if (token) {
      const next =
        effectiveValue.slice(0, token.start) +
        textValue +
        (insertSpaceAfter ? ' ' : '') +
        effectiveValue.slice(token.end);
      const caretPos =
        token.start + textValue.length + (insertSpaceAfter ? 1 : 0);
      pendingCaretRef.current = caretPos;
      handleChange(next);
      // If controlled, caret is restored by the effect above; if not, set now.
      if (el) {
        el.focus();
        try {
          el.setSelectionRange(caretPos, caretPos);
        } catch {
          /* noop */
        }
      }
    } else if (el) {
      // Fallback: insert at caret.
      const start = el.selectionStart ?? effectiveValue.length;
      const end = el.selectionEnd ?? effectiveValue.length;
      const next =
        effectiveValue.slice(0, start) +
        textValue +
        (insertSpaceAfter ? ' ' : '') +
        effectiveValue.slice(end);
      const caretPos = start + textValue.length + (insertSpaceAfter ? 1 : 0);
      pendingCaretRef.current = caretPos;
      handleChange(next);
    }

    setDismissedToken(null);
    onCommand?.(key, {
      textValue,
      ...(listState?.collection?.getItem(key)?.props ?? {}),
    });
  });

  // ---- keyboard navigation (only while the popover is open) -------------
  const onKeyDownHandler = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      if (!shouldShowPopover) {
        // While not in command mode, the textarea behaves normally; but clear
        // any dismissal when the user edits.
        return;
      }

      const listState = listStateRef.current;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!listState) return;
        e.preventDefault();
        const nextKey = getNextVisibleKey(
          listState,
          e.key === 'ArrowDown' ? 1 : -1,
        );
        if (nextKey != null) {
          markKeyboardFocus(listState);
          listState.selectionManager.setFocusedKey(nextKey);
          bumpFocus();
        }
      } else if (e.key === 'Home' || e.key === 'End') {
        if (!listState) return;
        e.preventDefault();
        const edgeKey = getEdgeVisibleKey(
          listState,
          e.key === 'Home' ? 'first' : 'last',
        );
        if (edgeKey != null) {
          markKeyboardFocus(listState);
          listState.selectionManager.setFocusedKey(edgeKey);
          bumpFocus();
        }
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (!listState) return;
        const focused = listState.selectionManager.focusedKey;
        if (focused != null) {
          e.preventDefault();
          commit(focused);
        }
        // Otherwise pass through (newline / form submit / tab navigation).
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (activeToken) {
          setDismissedToken(activeToken.token);
        }
      }
    },
    [shouldShowPopover, activeToken, commit, onKeyDown, listStateRef],
  );

  // ---- initial focus on the first option when the popover opens ---------
  const focusInitAttemptsRef = useRef(0);
  useLayoutEffect(() => {
    if (!shouldShowPopover) return;
    focusInitAttemptsRef.current = 0;

    const tick = () => {
      if (!shouldShowPopover) return;
      const listState = listStateRef.current;
      if (!listState) {
        focusInitAttemptsRef.current += 1;
        if (focusInitAttemptsRef.current < 8) {
          requestAnimationFrame(tick);
        }
        return;
      }
      if (listState.selectionManager.focusedKey == null) {
        const first = getEdgeVisibleKey(listState, 'first');
        if (first != null) {
          markKeyboardFocus(listState);
          listState.selectionManager.setFocusedKey(first);
          bumpFocus();
        }
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(tick));
  }, [shouldShowPopover]);

  // ---- keep virtual focus valid as the filtered list narrows -----------
  // When the user narrows the token, the previously focused option may drop
  // out of the filtered list. Move focus to the first still-visible option so
  // the highlight and any Enter/Tab commit stay in sync with what's shown.
  useLayoutEffect(() => {
    if (!shouldShowPopover) return;
    const listState = listStateRef.current;
    if (!listState) return;

    if (visibleFilteredKeys.length === 0) return;

    const focused = listState.selectionManager.focusedKey;
    if (focused == null || !visibleFilteredKeys.includes(focused)) {
      markKeyboardFocus(listState);
      listState.selectionManager.setFocusedKey(visibleFilteredKeys[0]);
      bumpFocus();
    }
  }, [visibleFilteredKeys, shouldShowPopover]);

  // ---- composite focus (wrapper + portaled popover) ---------------------
  const { compositeFocusProps } = useCompositeFocus({
    wrapperRef: wrapperRef as RefObject<HTMLElement>,
    popoverRef: popoverRef as RefObject<HTMLElement>,
    onFocus,
    onBlur,
    isDisabled,
  });

  // ---- aria-activedescendant -------------------------------------------
  const focusedKey = listStateRef.current?.selectionManager.focusedKey ?? null;
  const listBoxId = `CommandTextAreaListBox-${commandTextAreaId}`;

  // ---- popover width ----------------------------------------------------
  // The popover is anchored to the caret (a point), so it must not be sized to
  // the textarea. We use the same default as the shared `ListBoxPopover` /
  // `Picker` popovers: a `30x` floor (240px), `max-content` preferred, `50vw`
  // cap. The concrete floor keeps the virtualized ListBox from collapsing to a
  // sliver (it has no intrinsic width), and `max-content` lets short option
  // lists size to their content. The user's `overlayStyles` still win on top.
  const popoverOverlayStyles: Styles = {
    width: '30x max-content 50vw',
    ...overlayStyles,
  };

  // ---- assemble input props ---------------------------------------------
  const commandInputProps = mergeProps(inputProps, {
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': shouldShowPopover,
    'aria-haspopup': 'listbox',
    'aria-controls': shouldShowPopover ? listBoxId : undefined,
    'aria-activedescendant':
      shouldShowPopover && focusedKey != null
        ? `ListBoxItem-${focusedKey}`
        : undefined,
    onKeyDown: onKeyDownHandler,
    onSelect: syncCaret,
    onKeyUp: syncCaret,
    onClick: syncCaret,
    'data-input-type': 'command-textarea',
  });

  // ---- render -----------------------------------------------------------
  const field = (
    <TextInputBase
      ref={ref as any}
      {...otherProps}
      multiLine
      qa={qa}
      inputRef={inputRef}
      wrapperRef={wrapperRef}
      wrapperProps={compositeFocusProps}
      labelProps={mergedLabelProps}
      inputProps={commandInputProps}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      rows={rows}
    />
  );

  return (
    <>
      {field}
      <ListBoxPopover
        isOpen={shouldShowPopover}
        triggerRef={wrapperRef as RefObject<HTMLElement>}
        positionTargetRef={caretAnchorRef as RefObject<Element | null>}
        positionApiRef={positionApiRef}
        popoverRef={popoverRef}
        listBoxRef={listBoxRef}
        direction={direction}
        shouldFlip={shouldFlip}
        overlayOffset={overlayOffset}
        containerPadding={containerPadding}
        listBoxId={listBoxId}
        overlayStyles={popoverOverlayStyles}
        listBoxStyles={listBoxStyles}
        optionStyles={optionStyles}
        optionHighlight={term}
        sectionStyles={sectionStyles}
        headingStyles={headingStyles}
        isDisabled={isDisabled}
        disabledKeys={disabledKeys}
        items={items as any}
        listStateRef={listStateRef}
        ariaLabel={
          (props as any)['aria-label'] ||
          (typeof otherProps.label === 'string' ? otherProps.label : 'Commands')
        }
        compositeFocusProps={compositeFocusProps}
        filter={filterFn}
        onClose={() => {
          if (activeToken) setDismissedToken(activeToken.token);
        }}
        onSelectionChange={(selection) => {
          const key = Array.isArray(selection) ? selection[0] : selection;
          if (key != null) commit(key);
        }}
      >
        {children as any}
      </ListBoxPopover>
    </>
  );
}

const _CommandTextArea = forwardRef(CommandTextArea) as unknown as (<T>(
  props: CubeCommandTextAreaProps<T> & {
    ref?: ForwardedRef<HTMLElement>;
  },
) => ReactElement) & {
  Item: typeof Item;
  Section: typeof BaseSection;
};

Object.assign(_CommandTextArea, {
  Item,
  Section: BaseSection,
  displayName: 'CommandTextArea',
});

Object.defineProperty(_CommandTextArea, 'cubeInputType', {
  value: 'CommandTextArea',
  enumerable: false,
  configurable: false,
});

export { _CommandTextArea as CommandTextArea };
