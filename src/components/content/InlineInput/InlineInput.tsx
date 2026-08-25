import { useControlledState } from '@react-stately/utils';
import {
  BaseProps,
  BLOCK_STYLES,
  BlockStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FocusScope,
  OverlayProps,
  useFocusRing,
  useFocusWithin,
} from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { mergeProps } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { AutoTooltipValue, useAutoTooltip } from '../use-auto-tooltip';

import type {
  ChangeEvent,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  RefObject,
} from 'react';

// =============================================================================
// Types
// =============================================================================

export type CubeInlineInputEditTrigger = 'dblclick' | 'click' | 'none';

export interface CubeInlineInputProps
  extends BaseProps,
    BlockStyleProps,
    OuterStyleProps,
    ColorStyleProps {
  /** Controlled value. When provided, the component is controlled. */
  value?: string;
  /** Initial value for uncontrolled usage. */
  defaultValue?: string;
  /**
   * Fires on commit *only when the value actually changed*. Use this to update
   * external state. Pair with `value` for the controlled pattern.
   */
  onChange?: (value: string) => void;

  /** Controlled editing state. When provided, the editing state is controlled. */
  isEditing?: boolean;
  /** Default editing state for uncontrolled usage. */
  defaultIsEditing?: boolean;
  /** Called when editing mode starts or ends. */
  onEditingChange?: (isEditing: boolean) => void;

  /**
   * Fires every time the user commits (Enter / submit-on-blur / `ref.stopEditing(true)`),
   * even if the value did not change. Use for side effects like analytics or
   * "save" toasts. For state updates, prefer `onChange`.
   *
   * May return a Promise. If the returned Promise **rejects**, the component
   * automatically reverts its optimistic display to the actual `value` prop —
   * this gives async-save flows free rollback on failure (in controlled mode).
   */
  onSubmit?: (value: string) => void | Promise<unknown>;
  /** Called when editing is cancelled (Escape or empty submit when `allowEmpty` is false). */
  onCancel?: () => void;

  /** How edit mode is activated from the display element. Default: `'dblclick'`. */
  editTrigger?: CubeInlineInputEditTrigger;
  /**
   * When true (default) the display element is keyboard-focusable and
   * responds to `Enter`, `F2` and `Space` by entering edit mode. Set to
   * `false` when a host (e.g. an editable tab inside a button) already
   * routes keyboard activation through `ref.startEditing()` — exposing the
   * display element as a separate tab stop would create a nested keyboard
   * focus inside the host.
   *
   * @default true
   */
  keyboardActivation?: boolean;
  /** Whether to submit when focus leaves the input. Default: `true`. */
  submitOnBlur?: boolean;
  /** Whether to trim the value on submit. Default: `true`. */
  trimOnSubmit?: boolean;
  /** When false, submitting an empty/whitespace value cancels instead. Default: `false`. */
  allowEmpty?: boolean;
  /** When true, edit mode cannot be entered (programmatically or otherwise). */
  isDisabled?: boolean;
  /** When true, edit mode cannot be entered, but the display reads as enabled. */
  isReadOnly?: boolean;

  /**
   * When true, applies a styled wrapper to the component (border, fill, padding,
   * fixed height) so it visually matches a `TextInput`. Useful when swapping a
   * field component (e.g. `Select`) for an `InlineInput` to rename / edit the
   * current value without a visual jump.
   *
   * @default false
   */
  isStyled?: boolean;

  /** Placeholder text shown in the input when the draft is empty. */
  placeholder?: string;
  /**
   * What kind of autofill the browser may offer for the input, as the HTML `autocomplete` token
   * (`email`, `off`, …). See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete).
   */
  autoComplete?: string;
  /** Custom render for display (non-editing) mode. Receives the currently-displayed value (including optimistic). */
  renderDisplay?: (value: string) => ReactNode;
  /** ARIA label for the input (used when no visible label is associated). */
  'aria-label'?: string;
  /** ARIA labelledby for the input. */
  'aria-labelledby'?: string;

  /**
   * Tooltip behaviour for the display value:
   * - `true` (default): auto-tooltip — show the full value when the text is truncated.
   * - `false`: never show a tooltip.
   * - `string`: always show this tooltip text.
   * - object: full `TooltipProvider` configuration (with optional `auto`).
   *
   * The tooltip is automatically suppressed while editing and when `renderDisplay` is used.
   */
  tooltip?: AutoTooltipValue;
  /** Default tooltip placement. @default 'top' */
  tooltipPlacement?: OverlayProps['placement'];

  /** Convenience prop for styling the `Input` sub-element. Merged into `styles.Input`. */
  inputStyles?: Styles;
}

export interface CubeInlineInputRef {
  /** Programmatically enter edit mode. */
  startEditing(): void;
  /** Programmatically exit edit mode. `submit=true` commits, `submit=false` cancels. Defaults to commit. */
  stopEditing(submit?: boolean): void;
  /** Focus the underlying element (input when editing, root span otherwise). */
  focus(): void;
  /** Current committed value (includes optimistic value if a parent hasn't synced yet). */
  getValue(): string;
}

// =============================================================================
// Styled element
// =============================================================================

const InlineInputRoot = tasty({
  as: 'span',
  styles: {
    // `inline-flex` with `alignItems: baseline` is used (instead of
    // `inline-block` + `overflow: hidden`) so the container's baseline comes
    // from the first flex item's content baseline. With `inline-block` +
    // `overflow: hidden`, the CSS spec forces the baseline to the bottom
    // margin edge, which visibly shifts the text upward inside surrounding
    // line boxes (notably inside Tabs' centered `Item.Label`).
    display: 'inline-flex',
    alignItems: {
      '': 'baseline',
      styled: 'center',
    },
    verticalAlign: {
      '': 'baseline',
      styled: 'middle',
    },
    position: 'relative',
    width: 'initial 100%',
    boxSizing: 'border-box',
    color: {
      '': 'inherit',
      styled: '#dark-02',
      'styled & disabled': '#dark.30',
    },
    preset: {
      '': 'inherit',
      styled: 't3',
    },
    cursor: {
      '': 'inherit',
      'editable & !editing': 'text',
    },
    fill: {
      '': '#clear',
      styled: '#surface',
      'styled & disabled': '#disabled-surface',
    },
    border: {
      '': false,
      styled: true,
      'styled & focused': '#primary-text',
      'styled & disabled': true,
    },
    // Focus ring. Shown when the display element is keyboard-focused
    // (driven on the React side by `isFocusVisible`) and *always* while
    // editing — so swapping into the input always presents a clear focus
    // indicator regardless of how the user activated it (click vs keyboard).
    // In `styled` mode the border colour transition is enough to indicate
    // focus (matching `TextInput`'s visual), so the outline is suppressed.
    // Outline doesn't take layout space and respects rounded corners via
    // `outlineOffset`.
    outline: {
      '': '1bw #primary.0',
      'focused & !styled': '1bw #primary',
    },
    outlineOffset: 1,
    radius: {
      '': 0,
      focused: true,
      styled: true,
    },
    padding: {
      '': 0,
      styled: '(.75x - 1bw) (1x - 1bw)',
    },
    height: {
      '': 'auto',
      styled: '$size-md',
    },
    transition: 'theme',

    // Display flex item: owns the truncation (`overflow: hidden` here is a
    // block-level rule that does *not* alter the parent's baseline, unlike
    // an `inline-block` overflow rule).
    Display: {
      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      width: 'initial 100%',
      preset: 'inherit',
      color: 'inherit',
    },

    Input: {
      recipe: 'reset input / input-autofill',
      preset: 'inherit',
      color: 'inherit',
      fill: '#clear',
      textAlign: 'left',
      // In `styled` mode the wrapper has a fixed size and we want the input
      // to fill it (matches `TextInput`). In the default inline mode the
      // input auto-sizes to its content via `$input-width`.
      width: {
        '': '1em $input-width 100%',
        styled: '0 100% initial',
      },
      '&::placeholder': { recipe: 'input-placeholder' },
    },

    Measure: {
      position: 'absolute',
      visibility: 'hidden',
      pointerEvents: 'none',
      whiteSpace: 'pre',
      preset: 'inherit',
      height: 0,
      overflow: 'hidden',
    },

    Placeholder: {
      recipe: 'input-placeholder',
      preset: 'inherit',
    },
  },
});

const STYLE_PROPS = [...BLOCK_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

// Grace window after a programmatic `startEditing()` during which a blur
// re-focuses the input rather than committing. ~500ms covers the
// Menu/Popover EXIT_DURATION (350ms in `Overlay.tsx`) with margin, since a
// host that starts editing from a closing overlay is the case that needs the
// widest window.
const PROGRAMMATIC_EDIT_BLUR_GRACE_MS = 500;

// =============================================================================
// Component
// =============================================================================

/**
 * Inline editable text. Renders the value as inline content by default and
 * swaps to an auto-sizing text input when entering edit mode.
 *
 * Designed to drop into any text context (tab title, heading, paragraph,
 * table cell) without style customization: typography, color, and font family
 * are all inherited from the parent.
 *
 * Value and `isEditing` can each be controlled or uncontrolled independently.
 * Programmatic entry via the imperative ref (`startEditing`/`stopEditing`)
 * works regardless of `editTrigger`.
 */
export const InlineInput = forwardRef<CubeInlineInputRef, CubeInlineInputProps>(
  function InlineInput(allProps, ref) {
    const {
      value: valueProp,
      defaultValue,
      onChange,
      isEditing: isEditingProp,
      defaultIsEditing,
      onEditingChange,
      onSubmit,
      onCancel,
      editTrigger = 'dblclick',
      keyboardActivation = true,
      submitOnBlur = true,
      trimOnSubmit = true,
      allowEmpty = false,
      isDisabled = false,
      isReadOnly = false,
      isStyled = false,
      placeholder,
      autoComplete,
      renderDisplay,
      tooltip = true,
      tooltipPlacement = 'top',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      qa,
      qaVal,
      styles: stylesProp,
      inputStyles,
      mods: customMods,
      tokens: customTokens,
      ...otherProps
    } = allProps;

    const isControlled = valueProp !== undefined;

    const inputRef = useRef<HTMLInputElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);
    const rootRef = useRef<HTMLSpanElement>(null);

    const [value, setValue] = useControlledState<string>(
      valueProp as string,
      (defaultValue ?? '') as string,
      onChange,
    );

    const [isEditing, setIsEditing] = useControlledState<boolean>(
      isEditingProp as boolean,
      (defaultIsEditing ?? false) as boolean,
      onEditingChange,
    );

    // Optimistic value. Holds the just-committed value while we wait for the
    // (potentially async) controlled parent to sync `value`. In uncontrolled
    // mode `value` updates immediately so this stays null after each render.
    const [optimisticValue, setOptimisticValue] = useState<string | null>(null);
    const displayedValue = optimisticValue ?? value;

    const [draft, setDraft] = useState<string>(value);
    const [inputWidth, setInputWidth] = useState<number | null>(null);

    // Reliable focus presence for the whole component, driven by
    // `useFocusWithin` (which, unlike `useFocusRing`/`useFocus` on a bare
    // span, has an element-removal fallback). Used to gate the display focus
    // ring so it can never get stuck on after editing ends or after focus
    // moves to another component.
    const [isFocusWithin, setIsFocusWithin] = useState(false);

    // Suppresses the display focus ring for a single programmatic focus
    // restore (when we return focus to the display span after a keyboard /
    // programmatic edit-end). Reset whenever focus truly leaves the component
    // so a later real keyboard Tab back shows the ring again.
    const [ringSuppressed, setRingSuppressed] = useState(false);

    // Token to invalidate in-flight onSubmit promises if a newer commit /
    // re-entry happens before they settle.
    const submitTokenRef = useRef(0);

    // Timestamp of the most recent programmatic `startEditing()` call (via
    // the imperative ref). Used to defeat a focus-theft race: something else
    // takes focus in the same tick the input mounts, and the resulting blur
    // would fire `submitOnBlur` and unmount the input the user just opened.
    //
    // The thief varies by host — a host's own focus restoration (`TabButton`
    // re-focuses the tab button when editing ends), a collection's focus
    // manager, or an overlay closing around the `startEditing()` call. It is
    // NOT the closing `Menu` popover: `MenuTrigger` leaves focus alone once
    // an action has moved it (see CUB-3962). The guard is host-agnostic on
    // purpose — the imperative path cannot know who else wants focus.
    //
    // Cleared on first user interaction inside the input (`handleInputChange`
    // / `handleKeyDown`) and on leaving editing mode, so any later blur
    // commits normally.
    const programmaticEditStartRef = useRef<number | null>(null);

    // Set when an edit-end should return focus to the display span (keyboard
    // Enter/Escape, imperative `stopEditing`). NOT set for submit-on-blur /
    // tab-away, where focus has already moved elsewhere. Consumed by a layout
    // effect after the display span re-mounts.
    const pendingRestoreFocusRef = useRef(false);

    // Synchronous mirror of `isEditing`. We need this because cancel/commit
    // call user callbacks (`onCancel`/`onSubmit`) that may synchronously
    // re-focus another element — that causes a synchronous blur on the
    // input which would otherwise re-enter `commit` via `onBlurWithin` (the
    // state update from `setIsEditing(false)` isn't committed yet, so the
    // closure still sees `isEditing === true`).
    //
    // The ref is kept in sync via `useLayoutEffect` so concurrent renders
    // that get thrown away don't leak a stale value into the next commit.
    const isEditingRef = useRef(isEditing);

    useLayoutEffect(() => {
      isEditingRef.current = isEditing;
    }, [isEditing]);

    // Clear the optimistic value once `value` catches up or changes externally.
    useEffect(() => {
      setOptimisticValue(null);
    }, [value]);

    const enterEditing = useEvent(() => {
      if (isDisabled || isReadOnly || isEditing) return;
      // Invalidate any in-flight onSubmit promise — its outcome no longer
      // matters because the user is about to commit a new value anyway.
      submitTokenRef.current += 1;
      isEditingRef.current = true;
      // Start from the actual prop value, not optimistic — gives the user a
      // way to recover if a previous commit was rejected by the parent.
      setOptimisticValue(null);
      setDraft(value);
      setIsEditing(true);
    });

    // Whether an edit-end should return focus to the display span. Only when
    // this component owns its own keyboard/focus story (standalone usage).
    // Hosts that drive editing through `ref.startEditing()` with
    // `keyboardActivation={false}` (e.g. `Tabs`) keep ownership of focus.
    const canRestoreFocus = () =>
      keyboardActivation &&
      editTrigger !== 'none' &&
      !isDisabled &&
      !isReadOnly;

    const commit = useEvent((rawValue: string, restoreFocus = true) => {
      // Re-entry guard. `onSubmit`/`onCancel` may synchronously refocus and
      // trigger another blur-driven commit before the state update lands.
      if (!isEditingRef.current) return;

      const next = trimOnSubmit ? rawValue.trim() : rawValue;

      if (restoreFocus && canRestoreFocus()) {
        pendingRestoreFocusRef.current = true;
      }

      if (!next && !allowEmpty) {
        isEditingRef.current = false;
        programmaticEditStartRef.current = null;
        setIsEditing(false);
        onCancel?.();

        return;
      }

      const token = ++submitTokenRef.current;

      if (isControlled) {
        // Show the new value optimistically until the parent re-renders.
        setOptimisticValue(next);
      }
      isEditingRef.current = false;
      programmaticEditStartRef.current = null;
      setValue(next);
      setIsEditing(false);

      const result = onSubmit?.(next);
      // If onSubmit returns a Promise that rejects, the parent is signalling
      // a save failure — revert the optimistic value back to the actual prop.
      // We guard with a token so a slow rejection doesn't clobber a newer
      // commit's optimistic display.
      if (
        result != null &&
        typeof (result as Promise<unknown>).then === 'function'
      ) {
        (result as Promise<unknown>).then(
          () => {},
          () => {
            if (submitTokenRef.current === token && isControlled) {
              setOptimisticValue(null);
            }
          },
        );
      }
    });

    const cancel = useEvent((restoreFocus = true) => {
      if (!isEditingRef.current) return;
      if (restoreFocus && canRestoreFocus()) {
        pendingRestoreFocusRef.current = true;
      }
      isEditingRef.current = false;
      programmaticEditStartRef.current = null;
      setIsEditing(false);
      onCancel?.();
    });

    // Keep draft in sync with the external value while NOT editing.
    useEffect(() => {
      if (!isEditing) setDraft(value);
    }, [value, isEditing]);

    // Select all text synchronously when entering edit mode.
    useLayoutEffect(() => {
      if (!isEditing) return;
      inputRef.current?.select();
    }, [isEditing]);

    // Return focus to the display span after a keyboard / programmatic
    // edit-end so keyboard navigation continues from this control. The focus
    // is programmatic (react-aria treats it as non-keyboard) and we set
    // `ringSuppressed` so it does not draw a focus ring; a later real Tab to
    // the element resets the suppression (see `onFocusWithinChange`).
    //
    // `onSubmit`/`onCancel` may synchronously move focus elsewhere. When the
    // input unmounts, the browser drops focus to `<body>`, so we only restore
    // focus to the display span when focus actually landed there (or nowhere).
    // If a handler deliberately moved focus to another element, we leave it.
    useLayoutEffect(() => {
      if (isEditing || !pendingRestoreFocusRef.current) return;
      pendingRestoreFocusRef.current = false;

      const root = rootRef.current;
      if (!root) return;

      const active = root.ownerDocument.activeElement;
      const focusLost = !active || active === root.ownerDocument.body;
      // A handler moved focus to a real element outside this control — respect
      // it and don't pull focus back.
      if (!focusLost && !root.contains(active)) return;

      setRingSuppressed(true);
      root.focus();
    }, [isEditing]);

    // Measure the draft so the input width follows the typed glyphs.
    useLayoutEffect(() => {
      if (!isEditing) return;
      const measure = measureRef.current;

      if (!measure) return;
      setInputWidth(measure.scrollWidth);
    }, [isEditing, draft, placeholder]);

    const handleKeyDown = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
      // User is interacting with the input — drop the post-`startEditing()`
      // blur guard so a subsequent click-away commits normally.
      programmaticEditStartRef.current = null;

      if (e.key === 'Enter') {
        e.preventDefault();
        commit(draft);

        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();

        return;
      }

      // Prevent the host (e.g. Tabs) from intercepting text-editing keys.
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === ' ' ||
        e.key === 'Delete' ||
        e.key === 'Backspace'
      ) {
        e.stopPropagation();
      }
    });

    const handleInputChange = useEvent((e: ChangeEvent<HTMLInputElement>) => {
      programmaticEditStartRef.current = null;
      setDraft(e.target.value);
    });

    // Keyboard focus-visible modality (mouse vs keyboard). Used together with
    // `isFocusWithin` to drive the display focus ring. We rely on
    // `useFocusWithin` (below) for the *presence* of focus because, unlike
    // `useFocusRing`/`useFocus` on a bare span, it has an element-removal
    // fallback — so the ring can never get stuck on after the inner input is
    // unmounted on edit-end or after focus moves away.
    const { isFocusVisible, focusProps: focusRingProps } = useFocusRing();

    // Always enabled so it reliably reports focus presence in BOTH display
    // and edit modes. The submit-on-blur logic is internally guarded by
    // `isEditingRef`, so running `onBlurWithin` in display mode is a no-op.
    const { focusWithinProps } = useFocusWithin({
      onFocusWithinChange: (within) => {
        setIsFocusWithin(within);
        // Once focus truly leaves the component, clear the one-shot ring
        // suppression so a later real keyboard Tab back shows the ring again.
        if (!within) setRingSuppressed(false);
      },
      onBlurWithin: () => {
        if (!isEditingRef.current) return;
        if (!submitOnBlur) return;

        // Spurious-blur guard. `useFocusWithin` fires a synthetic blur via its
        // element-removal fallback when the display span unmounts as we enter
        // edit mode (focus actually moved INTO the inner input). Ignore it if
        // focus is in fact still within the component.
        const active = rootRef.current?.ownerDocument.activeElement;
        if (active && rootRef.current?.contains(active)) return;

        // Grace-period guard against focus theft right after a programmatic
        // `startEditing()` — see `programmaticEditStartRef` for who steals it.
        // Re-focus the input on the next frame so the focus-stealing element
        // finishes its own handler first, then we steal focus back. The guard
        // is cleared on the first real user interaction with the input
        // (keydown / input change) so subsequent click-aways commit normally.
        const startedAt = programmaticEditStartRef.current;
        if (
          startedAt != null &&
          Date.now() - startedAt < PROGRAMMATIC_EDIT_BLUR_GRACE_MS &&
          isEditingRef.current
        ) {
          requestAnimationFrame(() => {
            if (isEditingRef.current) {
              inputRef.current?.focus();
              inputRef.current?.select();
            }
          });

          return;
        }

        // Focus has already moved elsewhere (tab-away / click-away), so do
        // NOT pull it back to the display span.
        commit(draft, false);
      },
    });

    const handleDblClick = useEvent((e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      enterEditing();
    });

    const handleClick = useEvent((e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      enterEditing();
    });

    // Keyboard activation from the display element (standalone usage).
    // Hosts that own keyboard handling themselves should pass
    // `keyboardActivation={false}` (see `TabButton` for an example).
    const handleRootKeyDown = useEvent((e: KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter' || e.key === 'F2' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        enterEditing();
      }
    });

    useImperativeHandle(
      ref,
      () => ({
        startEditing: () => {
          // Arm the grace-period blur guard for the imperative path only.
          // Pointer-triggered entries (dblclick / click) don't suffer from
          // the focus-theft race that motivates this guard — the user's own
          // press is what put focus here.
          const wasEditing = isEditingRef.current;
          enterEditing();
          if (!wasEditing && isEditingRef.current) {
            programmaticEditStartRef.current = Date.now();
          }
        },
        stopEditing: (submit = true) => {
          if (!isEditingRef.current) return;
          if (submit) commit(draft);
          else cancel();
        },
        focus: () => {
          if (isEditingRef.current) inputRef.current?.focus();
          else rootRef.current?.focus();
        },
        getValue: () => displayedValue,
      }),
      [enterEditing, commit, cancel, draft, displayedValue],
    );

    const isEditable = editTrigger !== 'none' && !isDisabled && !isReadOnly;

    // `focused` controls the visible focus indicator on the root.
    //
    // While editing, the inner `<input>` always has focus (FocusScope
    // `autoFocus`), so we show the focus indicator on the root regardless
    // of how the user activated edit mode (click vs keyboard).
    //
    // In display mode we show the indicator only on keyboard focus
    // (`isFocusVisible`) AND when focus is actually within the component
    // (`isFocusWithin`) AND the display element is focusable (`isEditable`).
    // The `isFocusWithin` gate is the key fix: it reliably drops to `false`
    // on edit-end / tab-away (it has an element-removal fallback that
    // `useFocusRing` lacks on a bare span), so the ring can never get stuck
    // on. `ringSuppressed` hides the ring for a single programmatic focus
    // restore after a keyboard / programmatic edit-end.
    //
    // When `keyboardActivation` is `false` the host (e.g. `Tabs`) owns the
    // entire focus story for this control, so we suppress the focus ring
    // entirely — including while editing — to avoid drawing a redundant
    // indicator on top of the host's own focus ring.
    const showFocusRing =
      keyboardActivation &&
      (isEditing ||
        (isFocusVisible && isFocusWithin && isEditable && !ringSuppressed));

    const mods = useMemo(
      () => ({
        editing: isEditing,
        editable: isEditable,
        focused: showFocusRing,
        disabled: isDisabled,
        'read-only': isReadOnly,
        styled: isStyled,
        empty: !displayedValue,
        ...customMods,
      }),
      [
        isEditing,
        isEditable,
        showFocusRing,
        isDisabled,
        isReadOnly,
        isStyled,
        displayedValue,
        customMods,
      ],
    );

    const mergedStyles = useMemo<Styles | undefined>(() => {
      if (!stylesProp && !inputStyles) return undefined;
      if (!inputStyles) return stylesProp;
      const existingInput =
        (stylesProp?.Input as Styles | undefined) ?? undefined;

      return {
        ...stylesProp,
        Input: existingInput
          ? { ...existingInput, ...inputStyles }
          : inputStyles,
      };
    }, [stylesProp, inputStyles]);

    const extractedStyles = extractStyles(
      otherProps,
      STYLE_PROPS,
      mergedStyles,
    );

    const tokens = useMemo(
      () => ({
        ...customTokens,
        '$input-width': inputWidth != null ? `${inputWidth}px` : 'auto',
      }),
      [customTokens, inputWidth],
    );

    // In display mode, render the placeholder when the value is empty so the
    // component remains visible / clickable. Consumers using `renderDisplay`
    // take full control and are responsible for handling empty values
    // themselves.
    const displayContent = renderDisplay
      ? renderDisplay(displayedValue)
      : displayedValue ||
        (placeholder ? (
          <span data-element="Placeholder">{placeholder}</span>
        ) : (
          ''
        ));

    const baseProps = filterBaseProps(otherProps, { eventProps: true });

    // Overflow detection / auto-tooltip. Suppressed while editing (the input
    // owns the visible text and isn't truncated), and when the consumer
    // provides `renderDisplay` (they own the display story and should attach
    // their own tooltip if needed).
    const { labelRef: tooltipLabelRef, renderWithTooltip } = useAutoTooltip({
      tooltip: isEditing || renderDisplay ? false : tooltip,
      children: displayedValue,
    });

    // Wire pointer/keyboard activators only when relevant. Hosts that drive
    // editing through `ref.startEditing()` keep all of these `undefined` so
    // they don't intercept their own keyboard / focus story.
    const wantsClick = !isEditing && isEditable && editTrigger === 'click';
    const wantsDblClick =
      !isEditing && isEditable && editTrigger === 'dblclick';
    const wantsKeyboard = !isEditing && isEditable && keyboardActivation;

    const renderRoot = (
      triggerProps?: HTMLAttributes<HTMLElement>,
      tooltipRef?: RefObject<HTMLElement>,
    ) => {
      const handleRootRef = (element: HTMLSpanElement | null) => {
        rootRef.current = element;
        if (tooltipRef) {
          (tooltipRef as { current: HTMLElement | null }).current = element;
        }
      };

      // Overflow detection has to look at the truncating element, which is now
      // the inner `Display` (the root is `inline-flex` and doesn't clip). The
      // tooltip still anchors to the root via `tooltipRef` above.
      const handleDisplayRef = (element: HTMLSpanElement | null) => {
        tooltipLabelRef(element);
      };

      const a11yProps: HTMLAttributes<HTMLElement> = {};

      if (wantsKeyboard) {
        a11yProps.tabIndex = 0;
        a11yProps.role = 'button';
        a11yProps['aria-roledescription'] = 'editable text';
        if (ariaLabel) a11yProps['aria-label'] = ariaLabel;
        if (ariaLabelledby) a11yProps['aria-labelledby'] = ariaLabelledby;
      }

      if (isDisabled) a11yProps['aria-disabled'] = true;
      if (isReadOnly) a11yProps['aria-readonly'] = true;

      return (
        <InlineInputRoot
          ref={handleRootRef}
          qa={qa ?? 'InlineInput'}
          qaVal={qaVal}
          mods={mods}
          tokens={tokens}
          styles={extractedStyles}
          {...mergeProps(
            baseProps,
            focusWithinProps,
            // Always attach focusRingProps so the hook sees the blur event
            // when focus moves into the inner input on edit-mode entry. If
            // we only attached them while `wantsKeyboard` is true, the hook
            // would miss the blur (since `wantsKeyboard` flips to false the
            // moment editing starts), leaving `isFocused` stale and the
            // ring stuck on after editing ends. `useFocusRing` filters
            // bubbled focus from descendants internally (`target ===
            // currentTarget`), so spreading these on a non-focusable span
            // is a no-op.
            focusRingProps,
            triggerProps ?? {},
            {
              onDoubleClick: wantsDblClick ? handleDblClick : undefined,
              onClick: wantsClick ? handleClick : undefined,
              onKeyDown: wantsKeyboard ? handleRootKeyDown : undefined,
              ...a11yProps,
            },
          )}
        >
          {isEditing ? (
            <FocusScope autoFocus restoreFocus={false} contain={false}>
              <span ref={measureRef} data-element="Measure" aria-hidden="true">
                {draft || placeholder || ' '}
              </span>
              <input
                ref={inputRef}
                data-element="Input"
                type="text"
                value={draft}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={isDisabled}
                readOnly={isReadOnly}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
            </FocusScope>
          ) : (
            <span ref={handleDisplayRef} data-element="Display">
              {displayContent}
            </span>
          )}
        </InlineInputRoot>
      );
    };

    return renderWithTooltip(renderRoot, tooltipPlacement);
  },
);
