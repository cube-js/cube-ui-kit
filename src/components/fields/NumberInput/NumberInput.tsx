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

import { useI18n } from '../../../i18n';
import { mergeProps } from '../../../utils/react';
import {
  castNullableNumberValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { useFieldProps } from '../../form';
import { useDisplayedValidation } from '../TextInput/displayed-validation';
import {
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';

import { StepButton } from './StepButton';

import type { TextInputDOMEvents } from '@react-types/shared';
import type {
  FieldBaseProps,
  TextFieldKeyboardProps,
} from '../../../shared/form';

export interface CubeNumberInputProps
  extends Omit<
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
}

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
  let props = useFieldProps(rawProps);

  let {
    hideStepper,
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
      />
      <StepButton
        isDisabled={props.isDisabled}
        direction="down"
        {...decrementButtonProps}
        aria-label={stepDownLabel}
        size={otherProps.size}
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
        mergeAriaProps({ ...inputProps, ...keyboardProps }, { id: props.id }),
        { 'data-input-type': 'numberinput' },
        userInputProps,
      )}
      inputRef={inputRef}
      wrapperProps={groupProps}
      suffixPosition="after"
      suffix={
        showStepper ? (
          props.suffixPosition === 'before' ? (
            <>
              {suffix}
              {steppers}
            </>
          ) : (
            <>
              {steppers}
              {suffix}
            </>
          )
        ) : (
          suffix
        )
      }
    />
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
