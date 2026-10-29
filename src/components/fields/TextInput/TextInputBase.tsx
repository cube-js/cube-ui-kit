import { useObjectRef } from '@react-aria/utils';
import { createFocusableRef } from '@react-spectrum/utils';
import { BaseProps, mergeStyles, Styles, tasty } from '@tenphi/tasty';
import {
  FocusEventHandler,
  forwardRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefObject,
  useImperativeHandle,
} from 'react';
import { AriaNumberFieldProps, AriaTextFieldProps, useHover } from 'react-aria';

import { FieldBaseProps, TextFieldKeyboardProps } from '../../../shared';
import { mergeProps, mergeRefs, useCombinedRefs } from '../../../utils/react';
import {
  getDisabledElementProps,
  getInertInputProps,
} from '../../../utils/react/disabledProps';
import { useFocus } from '../../../utils/react/interactions';
import { useAutoTooltip } from '../../content/use-auto-tooltip';
import {
  getValidationMods,
  hasValidationIndicator,
  ValidationIndicator,
  wrapWithField,
} from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import {
  mergeTooltipFocusProps,
  splitTooltipTriggerProps,
} from '../../overlays/Tooltip/split-trigger-props';

import type { Props } from '../../../props';
import type { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';

const ADD_STYLES = {
  $: '>',
  display: 'grid',
  placeContent: 'stretch',
  placeItems: 'center',
  gridRows: '1sf',
  flow: 'column',
  gap: 0,
  cursor: 'inherit',
  opacity: {
    '': 1,
    disabled: '$disabled-opacity',
  },
};

export const INPUT_WRAPPER_STYLES: Styles = {
  display: 'grid',
  flow: 'row',
  position: 'relative',
  gridColumns: {
    '': '1sf',
    prefix: 'max-content 1sf',
    suffix: '1sf max-content',
    'prefix & suffix': 'max-content 1sf max-content',
  },
  gridRows: '1sf',
  placeItems: 'stretch',
  fill: {
    '': '#surface',
    readonly: '#surface-2',
    disabled: '#disabled-surface',
  },
  border: {
    '': true,
    readonly: '#border.5',
    // High contrast keeps the full outline it raises for every field.
    'readonly & @hc': true,
    valid: '#success-text.50',
    invalid: '#danger-text.50',
    focused: '#primary-text',
    'valid & focused': '#success-text',
    'invalid & focused': '#danger-text',
    disabled: true,
    // Only an input kept focusable for its tooltip is focused while disabled,
    // and only from the keyboard: the pointer can't focus it.
    'disabled & focused': '#primary-text',
  },
  preset: 't3',
  radius: true,
  cursor: 'text',
  color: {
    '': '#dark-02',
    focused: '#dark-02',
    invalid: '#danger-text',
    disabled: '#dark.30',
  },
  zIndex: {
    '': 'initial',
    focused: 1,
  },
  boxSizing: 'border-box',
  transition: 'theme',
  backgroundClip: 'content-box',
  height: {
    '': '$size $size',
    multiline: 'min $size',
  },

  $size: {
    '': '$size-md',
    'size=small': '$size-sm',
    'size=medium': '$size-md',
    'size=large': '$size-lg',
  },

  Prefix: ADD_STYLES,

  Suffix: ADD_STYLES,

  State: {
    $: '> Suffix >',
    display: 'flex',
  },

  InputIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 'min $size-sm',
    color: 'inherit',
    fontSize: '$icon-size',
  },

  ValidationIcon: {
    $: '> Suffix > State >',
    display: 'grid',
    placeItems: 'center',
    width: {
      '': 'min $size-sm',
      suffix: 'min $size-xs',
    },
    fontSize: '$icon-size',
  },
};

const InputWrapperElement = tasty({
  qa: 'InputWrapper',
  styles: INPUT_WRAPPER_STYLES,
});

export const DEFAULT_INPUT_STYLES: Styles = {
  recipe: 'reset input / input-autofill',
  placeSelf: 'stretch',
  width: 'initial 100% 100%',
  transition: 'theme',
  radius: true,
  padding: '$vertical-padding $right-padding $vertical-padding $left-padding',
  textAlign: 'left',
  preset: 't3',
  flexGrow: 1,
  margin: {
    '': 0,
    multiline: '((($size-md - 1lh) / 2) - 1bw) 0',
    'multiline & size=small': '((($size-sm - 1lh) / 2) - 1bw) 0',
    'multiline & size=large': '((($size-lg - 1lh) / 2) - 1bw) 0',
  },
  resize: 'none',
  userSelect: 'auto',
  // The browser's own for a disabled input, which an input kept focusable for
  // its tooltip doesn't get: it is read-only, not natively disabled.
  cursor: {
    '': 'text',
    disabled: 'default',
  },

  Placeholder: {
    $: '&::placeholder',
    recipe: 'input-placeholder',
  },
  '&::-webkit-search-cancel-button': {
    recipe: 'input-search-cancel-button',
  },

  '$vertical-padding': 0,
  '$left-padding': {
    '': '(1x - 1bw)',
    'size=small': '(1x - 1bw)',
    'size=large': '(1.25x - 1bw)',
    'size=xlarge': '(1.5x - 1bw)',
    prefix: '0',
  },
  '$right-padding': {
    '': '(1x - 1bw)',
    'size=small': '(1x - 1bw)',
    'size=large': '(1.25x - 1bw)',
    'size=xlarge': '(1.5x - 1bw)',
    suffix: '0',
  },
};

const InputElement = tasty({ qa: 'Input', styles: DEFAULT_INPUT_STYLES });

const INTERACTIVE_ELEMENTS =
  'a[href], button, input, select, textarea, [tabindex], [contenteditable]';

/**
 * A press inside the field box but outside the input — the prefix or suffix area, an icon, a
 * textarea's margins — focuses the input, as a press anywhere in a native field does. Presses on
 * the input itself and on interactive children, such as a clear button or the steppers, stay
 * theirs.
 */
function focusInputOnBoxPress(
  event: MouseEvent<HTMLElement>,
  input: HTMLInputElement | HTMLTextAreaElement | null | undefined,
) {
  if (event.button !== 0 || event.defaultPrevented) return;
  // An input kept focusable for its tooltip is still disabled to the pointer.
  if (
    !input ||
    input.disabled ||
    input.getAttribute('aria-disabled') === 'true'
  ) {
    return;
  }

  const box = event.currentTarget;
  const target = event.target as Element;

  // React bubbles presses from a portal (a popover opened from a field action)
  // through the box; those belong to the portal.
  if (!box.contains(target)) return;

  const interactive = target.closest(INTERACTIVE_ELEMENTS);

  if (interactive && box.contains(interactive)) return;

  // The default action would move focus to the press target first, blurring the input.
  event.preventDefault();
  input.focus();
}

/** A press doesn't focus a natively disabled input, so it doesn't focus an inert one either. */
function preventPointerFocus(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
}

export interface CubeTextInputBaseProps
  extends
    BaseProps,
    FieldLayoutStyleProps,
    Omit<
      AriaTextFieldProps<HTMLInputElement | HTMLTextAreaElement>,
      | 'validate'
      | 'form'
      | 'name'
      | 'errorMessage'
      | 'onKeyDown'
      | 'onKeyUp'
      | 'onFocus'
      | 'onBlur'
    >,
    TextFieldKeyboardProps,
    FieldBaseProps {
  validate?: AriaTextFieldProps['validate'] | AriaNumberFieldProps['validate'];
  onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  /** Left input icon */
  icon?: ReactElement | null;
  /** Input decoration before the main input */
  prefix?: ReactNode;
  /** Input decoration after the main input */
  suffix?: ReactNode;
  /** Suffix position goes before or after the validation and loading statuses */
  suffixPosition?: 'before' | 'after';
  /**
   * Controls placed last in the suffix, after the validation and loading
   * statuses and after `suffix` whatever its position, such as a popover
   * trigger.
   */
  actions?: ReactNode;
  /** Whether the input is multiline */
  multiLine?: boolean;
  /** Whether the input should have autofocus */
  autoFocus?: boolean;
  /**
   * Direct input props. The explicit props above (`isDisabled`, `maxLength`, `minLength`,
   * `autoFocus`, `rows`, `autoComplete`) win over the same attributes here when they are set; an
   * unset one leaves the value given here in place.
   */
  inputProps?: Props;
  /** Direct input wrapper props */
  wrapperProps?: Props;
  /** The input ref */
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** The wrapper ref */
  wrapperRef?: RefObject<HTMLDivElement | null>;
  /** Whether the input has the loading status */
  isLoading?: boolean;
  /** Rendered in place of the default loading icon while `isLoading` is set */
  loadingIndicator?: ReactNode;
  /** Style map for the input */
  inputStyles?: Styles;
  /** The number of rows for the input. Only applies to textarea. */
  rows?: number;
  /** The resize CSS property sets whether an element is resizable, and if so, in which directions. */
  resize?: Styles['resize'];
  /** The size of the input */
  size?: 'small' | 'medium' | 'large' | (string & {});
  /**
   * What kind of autofill the browser may offer for the input, as the HTML `autocomplete` token
   * (`email`, `current-password`, `off`, …). See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete).
   */
  autoComplete?: string;
  /**
   * @deprecated Use `autoComplete` instead. Kept as an alias so existing callers keep working;
   * `autoComplete` wins when both are set.
   */
  autocomplete?: string;
  /**
   * The input's own tooltip: a short hint, such as what the value means or defaults to, or why the
   * field is disabled. It opens on hover over the field box and on keyboard focus, and describes
   * the input. A disabled input with a tooltip stays focusable, so the keyboard reaches it too. A
   * string, or `TooltipProvider` props (`title`, `placement`, …). Never the field's name, an error
   * or anything needed to fill the field in: touch users don't see it. The info badge next to a
   * field label is `labelTooltip`.
   */
  tooltip?: string | Omit<CubeTooltipProviderProps, 'children'>;
}

/**
 * Mixed into the fields that actually buffer their value — `TextInput`, `TextArea`,
 * `PasswordInput`, `SearchInput` — rather than declared on `CubeTextInputBaseProps`. Every field
 * built on that base would otherwise inherit the prop, including `NumberInput` and
 * `CommandTextArea`, which keep their own text and ignore it: a public API that accepts a flag and
 * does nothing with it.
 */
export interface CubeBufferedValueProps {
  /**
   * Whether the typed text is held locally until the controlled `value` catches up. On by default,
   * which is what keeps the caret in place when the value round-trips through a store that
   * re-renders a pass late. Set to `false` for a caller that must see the value snap back to its
   * own `value` prop the instant it declines a keystroke. See `useBufferedValue`.
   */
  isBuffered?: boolean;
}

/**
 * The presentational base for text-like inputs. It renders the input chrome and the field wrapper, but
 * never wires form state — that is the job of the component rendering it (`TextInput`, `TextArea`,
 * `PasswordInput`, `NumberInput`, `SearchInput`, `CommandTextArea`).
 */
function TextInputBase(props: CubeTextInputBaseProps, ref) {
  let {
    qa,
    mods,
    isInvalid,
    isValid,
    prefix,
    isDisabled,
    isReadOnly,
    multiLine,
    autoFocus,
    inputProps,
    wrapperProps,
    inputRef,
    isLoading,
    loadingIndicator,
    value,
    inputStyles = {},
    suffix,
    suffixPosition = 'before',
    actions,
    wrapperRef,
    rows,
    size = 'medium',
    autoComplete,
    autocomplete,
    icon,
    maxLength,
    minLength,
    form,
    resize,
    tooltip,
    children,
    ...otherProps
  } = props;

  // A text area grows with its flex line when bare, so it fills a field
  // sized by flex props too.
  const { styles, field } = splitFieldLayout(props, {
    fillHeightOnFlex: !!multiLine,
  });
  let type = otherProps.type;

  if (resize) {
    // oxlint-disable-next-line tasty/no-runtime-styles-mutation -- forwards the consumer's `resize` prop
    inputStyles = mergeStyles(inputStyles, { resize });
  }

  let ElementType: 'textarea' | 'input' = multiLine ? 'textarea' : 'input';
  let { isFocused, focusProps } = useFocus();
  // A read-only field takes no hover state: nothing it could change would follow.
  let { hoverProps, isHovered } = useHover({
    isDisabled: isDisabled || isReadOnly,
  });
  // The input box, with or without the field chrome, so the field's ref never
  // resolves to `null`; `wrapperRef` reaches the same element.
  let domRef = useObjectRef(wrapperRef);

  inputRef = useCombinedRefs(inputRef);

  let { renderWithTooltip, isTooltipActive } = useAutoTooltip({
    tooltip,
    children: null,
  });

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(domRef, inputRef),
    select() {
      if (inputRef?.current) {
        inputRef.current.select();
      }
    },
    getInputElement() {
      return inputRef?.current;
    },
  }));

  const showValidationIndicator = hasValidationIndicator({
    isInvalid,
    isValid,
    isLoading,
  });

  // Fix safari bug: https://github.com/philipwalton/flexbugs/issues/270
  if (!inputProps?.placeholder) {
    if (!inputProps) {
      inputProps = {};
    }

    inputProps.placeholder = ' ';
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

  const modifiers = {
    ...getValidationMods({ isInvalid, isValid }),
    loadable: !!loadingIndicator,
    focused: isFocused,
    hovered: isHovered,
    disabled: isDisabled,
    readonly: !!isReadOnly,
    multiline: multiLine,
    prefix: !!prefix,
    suffix: showValidationIndicator || !!suffix || !!actions,
    ...mods,
  };

  // The explicit props win when they are set; an unset one falls back to the merged `inputProps`
  // instead of overwriting it with `undefined`. For `autoComplete` that keeps both a caller's
  // `inputProps={{ autoComplete }}` and `useNumberField`'s own `off`. `autocomplete` is the
  // deprecated alias.
  const resolvedAutoComplete =
    autoComplete ?? autocomplete ?? inputProps.autoComplete;
  const resolvedAutoFocus = autoFocus ?? inputProps.autoFocus;

  const hasTextSecurity = multiLine && type === 'password';
  const textSecurityStyles =
    hasTextSecurity && inputProps.value?.length
      ? {
          fontFamily: 'text-security-disc',
        }
      : {};

  const isInputDisabled = !!(isDisabled ?? inputProps.disabled);

  // A disabled input with a tooltip keeps its focus, as `Checkbox` and `Switch` do: the tooltip is
  // usually the reason it is disabled, and focus is how the keyboard opens it. It is
  // `aria-disabled` and read-only instead, and the pointer still can't focus it.
  const { isInert } = getDisabledElementProps({
    isDisabled: isInputDisabled,
    keepEvents: isTooltipActive,
    as: 'input',
  });

  let ownInputProps = mergeProps(inputProps, focusProps, hoverProps);

  if (isInert) {
    ownInputProps = mergeProps(
      getInertInputProps(
        mergeProps(
          // The field's own focus handlers never run on a natively disabled input, and
          // `useNumberField` commits on blur: it would round a value the user can't edit.
          { ...inputProps, onFocus: undefined, onBlur: undefined },
          focusProps,
          hoverProps,
        ),
        { excludeFromTabOrder: props.excludeFromTabOrder },
      ),
      { readOnly: true, onMouseDown: preventPointerFocus },
    );
  }

  // The field box takes the tooltip's hover side and positions it, so it
  // covers the prefix, suffix and steppers and never the text being typed. The
  // input, where keyboard focus lands, takes the focus side. The box keeps the
  // field's ref, which `wrapperRef` also reaches.
  const textField = renderWithTooltip((tooltipTriggerProps, tooltipRef) => {
    const { pointerProps, focusProps: tooltipFocusProps } =
      splitTooltipTriggerProps(tooltipTriggerProps);

    return (
      <InputWrapperElement
        ref={tooltipRef ? mergeRefs(domRef, tooltipRef) : domRef}
        mods={modifiers}
        data-size={size}
        styles={styles}
        {...mergeProps(wrapperProps, pointerProps, {
          onMouseDown: (event: MouseEvent<HTMLElement>) =>
            focusInputOnBoxPress(event, inputRef?.current),
        })}
      >
        {prefix ? <div data-element="Prefix">{prefix}</div> : null}
        <InputElement
          qa={qa || 'Input'}
          as={ElementType}
          data-input-type="textinput"
          {...mergeTooltipFocusProps(ownInputProps, tooltipFocusProps)}
          ref={inputRef}
          rows={multiLine ? (rows ?? inputProps.rows ?? 1) : inputProps.rows}
          mods={modifiers}
          // oxlint-disable-next-line tasty/no-style-prop -- `preset` owns font-family, and a `fontFamily` state map would replace the preset's in every state
          style={textSecurityStyles}
          {...(resolvedAutoFocus ? { 'data-autofocus': '' } : undefined)}
          autoFocus={resolvedAutoFocus}
          data-size={size}
          autoComplete={resolvedAutoComplete}
          styles={inputStyles}
          disabled={isInputDisabled && !isInert}
          maxLength={maxLength ?? inputProps.maxLength}
          minLength={minLength ?? inputProps.minLength}
        />
        {/* Inside the box, so a parent's `:last-child` rules still see the field: `NumberInput`'s hidden form value goes here. */}
        {children}
        {showValidationIndicator || suffix || actions ? (
          <div data-element="Suffix">
            {suffixPosition === 'before' ? suffix : null}
            {isLoading && loadingIndicator ? (
              <div data-element="State">{loadingIndicator}</div>
            ) : (
              <ValidationIndicator
                isInvalid={isInvalid}
                isValid={isValid}
                isLoading={isLoading}
              />
            )}
            {suffixPosition === 'after' ? suffix : null}
            {actions}
          </div>
        ) : null}
      </InputWrapperElement>
    );
  }, 'top');

  // `renderWithTooltip` is typed for any node; here it returns an element.
  // `tooltip` is the input's own, not the legacy spelling of `labelTooltip`.
  return wrapWithField(textField as ReactElement, {
    ...props,
    ...field,
    tooltip: undefined,
    // A click on its label doesn't focus a natively disabled input either. The input keeps its
    // name through `aria-labelledby`.
    ...(isInert
      ? {
          labelProps: {
            ...props.labelProps,
            htmlFor: undefined,
            for: undefined,
          },
        }
      : null),
  });
}

const _TextInputBase = forwardRef(TextInputBase);

export { _TextInputBase as TextInputBase };
export type { AriaTextFieldProps };
