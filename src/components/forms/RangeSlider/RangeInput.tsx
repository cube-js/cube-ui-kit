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
  // for 2 digit values 1.6 is better with suffix
  const suffixWidth = value > 2 ? 1.6 : 1.75;
  const charWidth = hasSuffix ? suffixWidth : 2;

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

  const maxLength = typeof max !== 'undefined' ? String(max).length : undefined;

  return (
    <NumberInput
      {...otherProps}
      hideStepper
      size="small"
      inputStyles={{
        width,
      }}
      suffix={suffix && <Flow padding="1.5x right">{suffix}</Flow>}
      value={value}
      minValue={state.getThumbMinValue(index)}
      maxValue={state.getThumbMaxValue(index)}
      maxLength={maxLength}
      onChange={onChange}
    />
  );
}
