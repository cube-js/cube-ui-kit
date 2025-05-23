import { useCallback } from 'react';

import { CubeNumberInputProps, NumberInput } from '../../../';

import type { SliderState } from 'react-stately';

export interface RangeInputProps extends CubeNumberInputProps {
  index: number;
  state: SliderState;
  min?: number;
  max?: number;
  width?: string;
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

export function SliderInput(props: RangeInputProps) {
  const { state, index, formatOptions, width, min, max, ...otherProps } = props;

  const inputWidth = width || calculateWidth(max);
  const value = state.values[index];
  const onChange = useCallback(
    (value: number) => {
      state.setThumbValue(index, value);
    },
    [index, state],
  );

  const maxLength = typeof max !== 'undefined' ? String(max).length : undefined;

  return (
    <NumberInput
      insideForm={false}
      labelPosition="top"
      {...otherProps}
      hideStepper
      size="small"
      wrapperStyles={{
        width: inputWidth,
      }}
      textAlign="center"
      formatOptions={formatOptions}
      value={value}
      minValue={state.getThumbMinValue(index)}
      maxValue={state.getThumbMaxValue(index)}
      maxLength={maxLength}
      onChange={onChange}
    />
  );
}
