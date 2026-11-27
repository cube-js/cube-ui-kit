import { tasty } from '@tenphi/tasty';
import {
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  RefObject,
  useRef,
} from 'react';
import {
  AriaNumberFieldProps,
  mergeProps as mergeAriaProps,
  useKeyboard,
  useLocale,
  useNumberField,
} from 'react-aria';
import { useNumberFieldState } from 'react-stately';

import { useI18n } from '../../../i18n/use-i18n';
import { mergeProps } from '../../../utils/react/merge-props';
import {
  castNullableNumberValue,
  WithNullableValue,
} from '../../../utils/react/nullable-value';
import { settleOverlayKey } from '../../../utils/react/overlay-key-propagation';
import { useFieldProps } from '../../form/Form/use-field/use-field-props';
import { useDisplayedValidation } from '../TextInput/displayed-validation';
import {
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';

import { StepButton } from './StepButton';

import type { TextInputDOMEvents } from '@react-types/shared';
import type {
  FieldBaseProps,
  FieldValidationRule,
  TextFieldKeyboardProps,
} from '../../../shared/form';

export interface CubeNumberInputProps
  extends
    Omit<
      CubeTextInputBaseProps,
      | 'defaultValue'
      | 'value'
      | 'onChange'
      | 'field'
      | 'validate'
      | 'onFocus'
      | 'onBlur'
      | keyof TextInputDOMEvents
    >,
    Omit<
      AriaNumberFieldProps,
      'form' | 'name' | 'errorMessage' | 'onKeyDown' | 'onKeyUp'
    >,
    TextFieldKeyboardProps {
  field?: FieldBaseProps<number | null | undefined>['field'];
  /** Whether or to hide stepper */
  hideStepper?: boolean;
  /**
   * Accepts whole numbers only: a phone shows its digit keyboard, and a
   * typed fraction stays as typed and marks the field invalid, with the
   * message of a `{ type: 'integer', message }` rule if it has one. Use it instead
   * of `formatOptions.maximumFractionDigits: 0`, which drops a typed decimal
   * separator, and leave `step` unset, as a `step` rounds a fraction.
   */
  isInteger?: boolean;
  /**
   * Whether the suffix goes before or after the stepper buttons. Defaults to
   * `before`, so a unit sits next to the number. The validation and loading
   * icons always come before both.
   */
  suffixPosition?: 'before' | 'after';
}

/**
 * The caller's own `{ type: 'integer' }` rule with a text message, from the
 * field's descriptor (whose rules replace the `rules` prop) or its `rules`.
 */
const findIntegerRule = ({ field, rules }: CubeNumberInputProps) =>
  (field && 'rules' in field.options ? field.options.rules : rules)
    ?.flat(Infinity)
    .find(
      (rule): rule is FieldValidationRule & { message: string } =>
        rule?.type === 'integer' && typeof rule.message === 'string',
    );

/** An empty field is `isRequired`'s concern, not a fraction. */
const isFraction = (value: unknown) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  !Number.isInteger(value);

const StyledTextInputBase = tasty(TextInputBase, {
  inputStyles: {
    textAlign: 'right',
  },
});

const StepperContainer = tasty({
  styles: {
    display: 'grid',
    gridColumns: '1sf',
    gridRows: '1sf 1sf',
    flow: 'column',
    placeSelf: 'stretch',
    margin: '(.5x - 1bw) left',
  },
});

function NumberInput(
  rawProps: WithNullableValue<CubeNumberInputProps>,
  ref: ForwardedRef<HTMLElement>,
) {
  const { t } = useI18n();

  // `NaN` is the number field's own empty value.
  rawProps = castNullableNumberValue(rawProps);

  let { isInteger, validate } = rawProps;
  // A caller's own `{ type: 'integer', message }` rule gives the text.
  let integerError =
    (isInteger ? findIntegerRule(rawProps)?.message : undefined) ??
    t('numberInput.integer', 'Enter a whole number.');

  // The field keeps a fraction rather than dropping its separator, and refuses
  // it: under the field through `validate`, and in a form through a rule.
  // React Aria rounds a committed value to `maximumFractionDigits` (3 by
  // default, and 0 drops the separator), so every typed digit is kept. A whole
  // number shows no fraction digits, even in a currency, which shows 2 by
  // default.
  if (isInteger) {
    rawProps = {
      ...rawProps,
      formatOptions: {
        ...rawProps.formatOptions,
        minimumFractionDigits:
          rawProps.formatOptions?.minimumFractionDigits ?? 0,
        maximumFractionDigits: 20,
      },
      validate: (value) =>
        isFraction(value) ? integerError : validate?.(value),
    };
  }

  let props = useFieldProps(rawProps, {
    showsValidateErrors: true,
    // Kept next to a caller's integer rule, which a `transform` may defeat:
    // running first with the same text, it shows that text once.
    controlRules: isInteger
      ? [
          {
            message: integerError,
            // Rejected, not returned: the legacy form ignores a returned error.
            validator: (_rule, value) =>
              isFraction(value) ? Promise.reject() : undefined,
          },
        ]
      : undefined,
  });

  let {
    hideStepper,
    isInteger: _isInteger,
    suffix,
    value,
    defaultValue,
    onChange,
    inputRef,
    labelProps: userLabelProps,
    inputProps: userInputProps,
    wrapperProps,
    ...otherProps
  } = props;
  let showStepper = !hideStepper;
  let { locale } = useLocale();
  // The state commits typed text on blur and Enter, so its `onChange` is the
  // change `validate` sees.
  let displayedValidation = useDisplayedValidation();
  let ariaProps = displayedValidation.trackTouched(props);
  let state = useNumberFieldState({ ...ariaProps, locale });
  let localInputRef = useRef<HTMLInputElement>(null);

  inputRef = inputRef ?? localInputRef;

  let {
    groupProps: ariaGroupProps,
    labelProps,
    inputProps,
    incrementButtonProps,
    decrementButtonProps,
    ...validation
  } = useNumberField(
    { ...ariaProps, onKeyDown: undefined, onKeyUp: undefined },
    state,
    inputRef as RefObject<HTMLInputElement>,
  );
  let groupProps = mergeProps(ariaGroupProps, wrapperProps);

  // React Aria names each stepper after the field: a text label goes into the
  // name, any other label is composed in through the `aria-labelledby` it sets.
  // The UI Kit strings take the label the same way, so they replace React
  // Aria's own without losing the field name. Without a text label the name
  // has to read on its own, so it has strings of its own rather than an
  // empty `{{label}}` slot.
  let fieldLabel =
    props['aria-label'] || (typeof props.label === 'string' ? props.label : '');
  let stepUpLabel =
    props.incrementAriaLabel ??
    (fieldLabel
      ? t('numberInput.stepUp', 'Increase {{label}}', { label: fieldLabel })
      : t('numberInput.increase', 'Increase'));
  let stepDownLabel =
    props.decrementAriaLabel ??
    (fieldLabel
      ? t('numberInput.stepDown', 'Decrease {{label}}', { label: fieldLabel })
      : t('numberInput.decrease', 'Decrease'));
  // Keep native commits and user callbacks inside one Aria event wrapper so
  // continuePropagation can still undo the native shortcut's propagation stop.
  let { keyboardProps } = useKeyboard({
    isDisabled: props.isDisabled,
    onKeyDown: (event) => {
      inputProps.onKeyDown?.(event as KeyboardEvent<HTMLInputElement>);
      event.defaultPrevented = event.isDefaultPrevented();
      // NumberInput historically lets every key except Enter reach ancestors.
      if (event.key !== 'Enter') event.continuePropagation();
      props.onKeyDown?.(event);
      // Number handling never prevents `Escape` or `Tab`, so a prevented one
      // is the caller's and stops here, as in every other field. An
      // unprevented one already goes on, unless the caller stopped it.
      if (event.isDefaultPrevented()) settleOverlayKey(event);
    },
    onKeyUp: props.onKeyUp,
  });

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = mergeProps(labelProps, userLabelProps);

  const steppers = showStepper ? (
    <StepperContainer>
      <StepButton
        isDisabled={props.isDisabled}
        direction="up"
        {...incrementButtonProps}
        aria-label={stepUpLabel}
        size={otherProps.size}
        isPlain={otherProps.shape === 'plain'}
      />
      <StepButton
        isDisabled={props.isDisabled}
        direction="down"
        {...decrementButtonProps}
        aria-label={stepDownLabel}
        size={otherProps.size}
        isPlain={otherProps.shape === 'plain'}
      />
    </StepperContainer>
  ) : undefined;

  return (
    <StyledTextInputBase
      {...otherProps}
      {...displayedValidation.getDisplayedValidation(otherProps, validation)}
      ref={ref}
      labelProps={mergedLabelProps}
      inputProps={mergeProps(
        // `useNumberField` seeds its input id once. Merging the current id
        // through react-aria's own `mergeProps` updates that seed, so the
        // input, its label and the steppers' `aria-controls` follow the id
        // when the form binding changes after mount.
        mergeAriaProps(
          {
            ...inputProps,
            // React Aria picks `decimal` only for a field that takes
            // fractions; what it picks for one that doesn't is `numeric`.
            inputMode:
              isInteger && inputProps.inputMode === 'decimal'
                ? 'numeric'
                : inputProps.inputMode,
            ...keyboardProps,
          },
          { id: props.id },
        ),
        { 'data-input-type': 'numberinput' },
        userInputProps,
      )}
      inputRef={inputRef}
      wrapperProps={groupProps}
      // The validation/loading icon always comes first; `suffixPosition`
      // places the suffix against the steppers instead.
      suffixPosition="after"
      suffix={
        showStepper ? (
          props.suffixPosition === 'after' ? (
            <>
              {steppers}
              {suffix}
            </>
          ) : (
            <>
              {suffix}
              {steppers}
            </>
          )
        ) : (
          suffix
        )
      }
    >
      {/* `useNumberField` keeps `name` off the input, whose text is formatted, so a native `<form>` submits the number from here. */}
      {props.name ? (
        <input
          type="hidden"
          name={props.name}
          value={isNaN(state.numberValue) ? '' : state.numberValue}
          disabled={props.isDisabled}
        />
      ) : null}
    </StyledTextInputBase>
  );
}

/**
 * NumberFields allow users to enter a number and increment or decrement the value using stepper buttons.
 */
const _NumberInput = forwardRef(NumberInput);

(_NumberInput as any).cubeInputType = 'Number';

_NumberInput.displayName = 'NumberInput';

export { _NumberInput as NumberInput };
export type { AriaNumberFieldProps };
