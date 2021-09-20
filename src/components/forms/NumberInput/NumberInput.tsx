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
import { Base } from '../../Base';
import { StepButton } from './StepButton';
import { AriaNumberFieldProps } from '@react-types/numberfield';

export interface CubeNumberInputProps
  extends Omit<CubeTextInputBaseProps, 'defaultValue' | 'value' | 'onChange'>,
    AriaNumberFieldProps {}

function NumberInput(props, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

  let { hideStepper } = props;
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
      {...props}
      labelProps={labelProps}
      inputProps={inputProps}
      ref={ref}
      inputRef={inputRef}
      wrapperProps={groupProps}
      suffixPosition="after"
      suffix={
        showStepper ? (
          <Base
            styles={{
              display: 'grid',
              gridColumns: '1fr',
              gridRows: 'minmax(1px, 1fr) minmax(1px, 1fr)',
              flow: 'column',
              placeSelf: 'stretch',
            }}
          >
            <StepButton direction="up" {...incrementButtonProps} />
            <StepButton direction="down" {...decrementButtonProps} />
          </Base>
        ) : null
      }
    />
  );
}

/**
 * NumberFields allow users to enter a number, and increment or decrement the value using stepper buttons.
 */
const _NumberInput = Object.assign(forwardRef(NumberInput), {
  cubeInputType: 'Number',
});
export { _NumberInput as NumberInput };
