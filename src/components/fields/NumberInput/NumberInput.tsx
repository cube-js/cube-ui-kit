import { forwardRef, RefObject, useRef } from 'react';
import { useLocale, useNumberField, AriaNumberFieldProps } from 'react-aria';
import { useNumberFieldState } from 'react-stately';

import { useFieldProps } from '../../form';
import { useProviderProps } from '../../../provider';
import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';
import { tasty } from '../../../tasty';
import {
  castNullableNumberValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

import { StepButton } from './StepButton';

export interface CubeNumberInputProps
  extends Omit<CubeTextInputBaseProps, 'defaultValue' | 'value' | 'onChange'>,
    Omit<AriaNumberFieldProps, 'validate'> {
  /** Whether or to hide stepper */
  hideStepper?: boolean;
}

const StyledTextInputBase = tasty(TextInputBase, {
  wrapperStyles: {
    width: 'initial 13x 100%',
  },
});

const StepperContainer = tasty({
  styles: {
    display: 'grid',
    gridColumns: '1fr',
    gridRows: 'minmax(1px, 1fr) minmax(1px, 1fr)',
    flow: 'column',
    placeSelf: 'stretch',
  },
});

function NumberInput(props: WithNullableValue<CubeNumberInputProps>, ref) {
  props = castNullableNumberValue(props);
  props = useProviderProps(props);
  props = useFieldProps(props);

  let {
    hideStepper,
    suffix,
    value,
    defaultValue,
    onChange,
    inputRef,
    ...otherProps
  } = props;
  let showStepper = !hideStepper;
  let { locale } = useLocale();
  let state = useNumberFieldState({ ...props, locale });
  let defaultInputRef = useRef(null);

  inputRef = inputRef || defaultInputRef;

  let {
    groupProps,
    labelProps,
    inputProps,
    incrementButtonProps,
    decrementButtonProps,
  } = useNumberField(props, state, inputRef as RefObject<HTMLInputElement>);

  const steppers = showStepper ? (
    <StepperContainer>
      <StepButton
        isDisabled={props.isDisabled}
        direction="up"
        {...incrementButtonProps}
        size={otherProps.size}
      />
      <StepButton
        isDisabled={props.isDisabled}
        direction="down"
        {...decrementButtonProps}
        size={otherProps.size}
      />
    </StepperContainer>
  ) : undefined;

  return (
    <StyledTextInputBase
      {...otherProps}
      ref={ref}
      labelProps={labelProps}
      inputProps={inputProps}
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
 * NumberFields allow users to enter a number, and increment or decrement the value using stepper buttons.
 */
const _NumberInput = forwardRef(NumberInput);

(_NumberInput as any).cubeInputType = 'Number';

_NumberInput.displayName = 'NumberInput';

export { _NumberInput as NumberInput };
export type { AriaNumberFieldProps };
