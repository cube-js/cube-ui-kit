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

function calculateWidth(suffix?: string, max?: number) {
  if (typeof max === 'undefined') {
    return undefined;
  }

  const suffixPadding = 1;
  const suffixLen = (suffix || '').length;
  const value = String(max).length;

  return `${(value + suffixLen) * 2.5 + suffixPadding}x`;
}

export function RangeInput(props: RangeInputProps) {
  const { state, index, suffix, min, max, ...otherProps } = props;

  const value = state.values[index];
  const width = calculateWidth(suffix as string, max);

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
      suffix={<Flow padding="0.5x">{suffix}</Flow>}
      width={width}
      value={value}
      minValue={state.getThumbMinValue(index)}
      maxValue={state.getThumbMaxValue(index)}
      onChange={onChange}
    />
  );
}
