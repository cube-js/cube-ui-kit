import { forwardRef, useRef } from 'react';
import { useFormProps } from '../Form/Form';
import { useProviderProps } from '../../../provider';
import { useLocale } from '@react-aria/i18n';
import {
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';
import { useNumberFieldState } from '@react-stately/numberfield';
import { useNumberField } from '@react-aria/numberfield';
import { StepButton } from './StepButton';
import { AriaNumberFieldProps } from '@react-types/numberfield';
import { styled } from '../../../styled';
import {
  castNullableNumberValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';

export interface CubeNumberInputProps
  extends Omit<CubeTextInputBaseProps, 'defaultValue' | 'value' | 'onChange'>,
    AriaNumberFieldProps {
  /** Whether or to hide stepper */
  hideStepper?: boolean;
}

const StepperContainer = styled({
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
  props = useFormProps(props);

  let { hideStepper, value, defaultValue, onChange, ...otherProps } = props;
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
      labelProps={labelProps}
      inputProps={inputProps}
      ref={ref}
      inputRef={inputRef}
      wrapperProps={groupProps}
      suffixPosition="after"
      suffix={
        showStepper ? (
          <StepperContainer>
            <StepButton direction="up" {...incrementButtonProps} />
            <StepButton direction="down" {...decrementButtonProps} />
          </StepperContainer>
        ) : null
      }
    />
  );
}

/**
 * NumberFields allow users to enter a number, and increment or decrement the value using stepper buttons.
 */
const _NumberInput = forwardRef(NumberInput);

(_NumberInput as any).cubeInputType = 'Number';

export { _NumberInput as NumberInput };
