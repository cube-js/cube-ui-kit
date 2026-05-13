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
import { FocusScope, useFocusWithin } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { mergeProps } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

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
    display: 'inline-flex',
    verticalAlign: 'baseline',
    position: 'relative',
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
      submitOnBlur = true,
      trimOnSubmit = true,
      allowEmpty = false,
      isDisabled = false,
      isReadOnly = false,
      placeholder,
      renderDisplay,
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

    // Clear the optimistic value once `value` catches up or changes externally.
    useEffect(() => {
      setOptimisticValue(null);
    }, [value]);

    const enterEditing = useEvent(() => {
      if (isDisabled || isReadOnly || isEditing) return;
      // Invalidate any in-flight onSubmit promise — its outcome no longer
      // matters because the user is about to commit a new value anyway.
      submitTokenRef.current += 1;
      // Start from the actual prop value, not optimistic — gives the user a
      // way to recover if a previous commit was rejected by the parent.
      setOptimisticValue(null);
      setDraft(value);
      setIsEditing(true);
    });

    const commit = useEvent((rawValue: string) => {
      const next = trimOnSubmit ? rawValue.trim() : rawValue;

      if (!next && !allowEmpty) {
        setIsEditing(false);
        onCancel?.();

        return;
      }

      const token = ++submitTokenRef.current;

      if (isControlled) {
        // Show the new value optimistically until the parent re-renders.
        setOptimisticValue(next);
      }
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
      if (editTrigger !== 'dblclick') return;
      e.preventDefault();
      e.stopPropagation();
      enterEditing();
    });

    const handleClick = useEvent((e: MouseEvent) => {
      if (editTrigger !== 'click') return;
      e.preventDefault();
      e.stopPropagation();
      enterEditing();
    });

    useImperativeHandle(
      ref,
      () => ({
        startEditing: () => enterEditing(),
        stopEditing: (submit = true) => {
          if (!isEditing) return;
          if (submit) commit(draft);
          else cancel();
        },
        focus: () => {
          if (isEditing) inputRef.current?.focus();
          else rootRef.current?.focus();
        },
        getValue: () => displayedValue,
      }),
      [enterEditing, commit, cancel, draft, displayedValue, isEditing],
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

    const displayContent = renderDisplay
      ? renderDisplay(displayedValue)
      : displayedValue;

    const baseProps = filterBaseProps(otherProps, { eventProps: true });

    return (
      <InlineInputRoot
        ref={rootRef}
        qa={qa ?? 'InlineInput'}
        qaVal={qaVal}
        mods={mods}
        tokens={tokens}
        styles={extractedStyles}
        {...mergeProps(baseProps, focusWithinProps, {
          onDoubleClick: isEditing ? undefined : handleDblClick,
          onClick: isEditing ? undefined : handleClick,
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
  },
);
