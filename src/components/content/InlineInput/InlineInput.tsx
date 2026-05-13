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
import { FocusScope, OverlayProps, useFocusWithin } from 'react-aria';

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

  /** Placeholder text shown in the input when the draft is empty. */
  placeholder?: string;
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
    display: 'inline-block',
    verticalAlign: 'baseline',
    position: 'relative',
    maxWidth: '100%',
    whiteSpace: { '': 'nowrap', editing: 'normal' },
    overflow: { '': 'hidden', editing: 'visible' },
    textOverflow: 'ellipsis',
    color: 'inherit',
    preset: 'inherit',
    cursor: {
      '': 'inherit',
      'editable & !editing': 'text',
    },

    Input: {
      recipe: 'reset input / input-autofill',
      preset: 'inherit',
      color: 'inherit',
      fill: 'transparent',
      width: 'initial $input-width 100%',
      minWidth: '1em',
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
      placeholder,
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

    // Token to invalidate in-flight onSubmit promises if a newer commit /
    // re-entry happens before they settle.
    const submitTokenRef = useRef(0);

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

    const commit = useEvent((rawValue: string) => {
      // Re-entry guard. `onSubmit`/`onCancel` may synchronously refocus and
      // trigger another blur-driven commit before the state update lands.
      if (!isEditingRef.current) return;

      const next = trimOnSubmit ? rawValue.trim() : rawValue;

      if (!next && !allowEmpty) {
        isEditingRef.current = false;
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

    const cancel = useEvent(() => {
      if (!isEditingRef.current) return;
      isEditingRef.current = false;
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

    // Measure the draft so the input width follows the typed glyphs.
    useLayoutEffect(() => {
      if (!isEditing) return;
      const measure = measureRef.current;

      if (!measure) return;
      setInputWidth(measure.scrollWidth);
    }, [isEditing, draft, placeholder]);

    const handleKeyDown = useEvent((e: KeyboardEvent<HTMLInputElement>) => {
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
      setDraft(e.target.value);
    });

    const { focusWithinProps } = useFocusWithin({
      isDisabled: !isEditing,
      onBlurWithin: () => {
        if (!submitOnBlur) return;
        commit(draft);
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
        startEditing: () => enterEditing(),
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

    const mods = useMemo(
      () => ({
        editing: isEditing,
        editable: isEditable,
        disabled: isDisabled,
        'read-only': isReadOnly,
        empty: !displayedValue,
        ...customMods,
      }),
      [
        isEditing,
        isEditable,
        isDisabled,
        isReadOnly,
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
          {...mergeProps(baseProps, focusWithinProps, triggerProps ?? {}, {
            onDoubleClick: wantsDblClick ? handleDblClick : undefined,
            onClick: wantsClick ? handleClick : undefined,
            onKeyDown: wantsKeyboard ? handleRootKeyDown : undefined,
            ...a11yProps,
          })}
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
                disabled={isDisabled}
                readOnly={isReadOnly}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
            </FocusScope>
          ) : (
            displayContent
          )}
        </InlineInputRoot>
      );
    };

    return renderWithTooltip(renderRoot, tooltipPlacement);
  },
);
