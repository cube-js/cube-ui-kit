import { useCallback } from 'react';
import { SliderState } from '@react-stately/slider';

import { Flow, CubeNumberInputProps, NumberInput } from '../../../';

export interface RangeInputProps extends CubeNumberInputProps {
  index: number;
  state: SliderState;
  min?: number;
  max?: number;
}

function calculateWidth(max?: number, hasSuffix?: boolean) {
  if (typeof max === 'undefined') {
    return undefined;
  }

  const value = String(max).length;
  const charWidth = hasSuffix ? 1.5 : 1.75;

  return `${value * charWidth}x`;
}

export function RangeInput(props: RangeInputProps) {
  const { state, index, suffix, min, max, ...otherProps } = props;

  const value = state.values[index];
  const width = calculateWidth(max, !!suffix);
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
      size="small"
      inputProps={{
        maxLength: max && String(max).length,
      }}
      inputStyles={{
        width,
      }}
      suffix={suffix && <Flow padding="1.5x right">{suffix}</Flow>}
      value={value}
      minValue={state.getThumbMinValue(index)}
      maxValue={state.getThumbMaxValue(index)}
      onChange={onChange}
    />
  );
}
