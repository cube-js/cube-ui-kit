import { ForwardedRef, forwardRef, RefObject, useRef } from 'react';
import { AriaNumberFieldProps, useLocale, useNumberField } from 'react-aria';
import { useNumberFieldState } from 'react-stately';

import { useProviderProps } from '../../../provider';
import { tasty } from '../../../tasty';
import {
  castNullableNumberValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { useFieldProps } from '../../form';
import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';

import { StepButton } from './StepButton';

export interface CubeNumberInputProps
  extends Omit<CubeTextInputBaseProps, 'defaultValue' | 'value' | 'onChange'>,
    Omit<AriaNumberFieldProps, 'validate'> {
  /** Whether or to hide stepper */
  hideStepper?: boolean;
}

const StyledTextInputBase = tasty(TextInputBase, {
  styles: {
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
  props: WithNullableValue<CubeNumberInputProps>,
  ref: ForwardedRef<HTMLElement>,
) {
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
    labelProps: userLabelProps,
    ...otherProps
  } = props;
  let showStepper = !hideStepper;
  let { locale } = useLocale();
  let state = useNumberFieldState({ ...props, locale });
  let localInputRef = useRef<HTMLInputElement>(null);

  inputRef = inputRef ?? localInputRef;

  let {
    groupProps,
    labelProps,
    inputProps,
    incrementButtonProps,
    decrementButtonProps,
  } = useNumberField(props, state, inputRef as RefObject<HTMLInputElement>);

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = { ...labelProps, ...userLabelProps };

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
      labelProps={mergedLabelProps}
      inputProps={{ ...inputProps, 'data-input-type': 'numberinput' }}
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
