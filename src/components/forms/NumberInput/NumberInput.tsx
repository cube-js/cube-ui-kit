import { forwardRef, useRef } from 'react';
import { useLocale } from '@react-aria/i18n';
import { useNumberFieldState } from '@react-stately/numberfield';
import { useNumberField } from '@react-aria/numberfield';

import { useField } from '../Form';
import { useProviderProps } from '../../../provider';
import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';
import { tasty } from '../../../tasty';
import {
  castNullableNumberValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

import { StepButton } from './StepButton';

import type { AriaNumberFieldProps } from '@react-types/numberfield';

export interface CubeNumberInputProps
  extends Omit<CubeTextInputBaseProps, 'defaultValue' | 'value' | 'onChange'>,
    AriaNumberFieldProps {
  /** Whether or to hide stepper */
  hideStepper?: boolean;
}

const StepperContainer = tasty({
  styles: {
    display: 'grid',
    gridColumns: '1fr',
    gridRows: 'minmax(1px, 1fr) minmax(1px, 1fr)',
    flow: 'column',
    placeSelf: 'stretch',
  },
});

/**
 * NumberFields allow users to enter a number, and increment or decrement the value using stepper buttons.
 */
export const NumberInput = forwardRef(function NumberInput(
  props: WithNullableValue<CubeNumberInputProps>,
  ref,
) {
  props = castNullableNumberValue(props);
  props = useProviderProps(props);
  props = useField(props, {
    valuePropsMapper: ({ value, onChange }) => ({
      value: value ?? null,
      onChange,
    }),
  });

  let { hideStepper, suffix, value, defaultValue, onChange, ...otherProps } =
    props;
  let showStepper = !hideStepper;
  let { locale } = useLocale();
  let state = useNumberFieldState({ ...props, locale });
  let inputRef = useRef(null);
  let {
    groupProps,
    labelProps,
    inputProps,
    incrementButtonProps,
    decrementButtonProps,
  } = useNumberField(props, state, inputRef);

  return (
    <TextInputBase
      {...otherProps}
      ref={ref}
      labelProps={labelProps}
      inputProps={inputProps}
      inputRef={inputRef}
      wrapperProps={groupProps}
      suffixPosition="after"
      suffix={
        showStepper ? (
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
        ) : (
          suffix
        )
      }
    />
  );
});
