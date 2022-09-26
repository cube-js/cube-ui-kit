import { useCallback } from 'react';
import { SliderState } from '@react-stately/slider';

import { Flow } from '../../layout/Flow';
import { CubeNumberInputProps, NumberInput } from '../../forms';

export interface RangeInputProps extends CubeNumberInputProps {
  index: number;
  state: SliderState;
  min?: number;
  max?: number;
}

function calculateWidth(max?: number) {
  if (typeof max === 'undefined') {
    return undefined;
  }

  const value = String(max).length;
  const charWidth = 2;

  return `${value * charWidth}x`;
}

export function RangeInput(props: RangeInputProps) {
  const { state, index, suffix, min, max, isLoading, ...otherProps } = props;

  const value = state.values[index];
  const width = calculateWidth(max);
  const onChange = useCallback(
    (value: number) => {
      state.setThumbValue(index, value);
    },
    [index, state],
  );

  return (
    <NumberInput
      {...otherProps}
      hideStepper
      inputProps={{
        maxLength: max && String(max).length,
      }}
      inputStyles={{
        width,
      }}
      isLoading={isLoading}
      suffix={suffix && <Flow padding="0.5x">{suffix}</Flow>}
      value={value}
      minValue={state.getThumbMinValue(index)}
      maxValue={state.getThumbMaxValue(index)}
      onChange={onChange}
    />
  );
}
