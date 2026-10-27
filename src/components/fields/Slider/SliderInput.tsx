import { CubeNumberInputProps, NumberInput } from '../../../';

import type { Styles } from '@tenphi/tasty';
import type { SliderState } from 'react-stately';

// On the input itself: style props now place and size the field only.
const INPUT_STYLES: Styles = { textAlign: 'center' };

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
  const onChange = (value: number) => {
    state.setThumbValue(index, value);
  };

  const maxLength = typeof max !== 'undefined' ? String(max).length : undefined;

  return (
    <NumberInput
      isBare
      insideForm={false}
      labelPosition="top"
      {...otherProps}
      hideStepper
      size="small"
      inputStyles={INPUT_STYLES}
      formatOptions={formatOptions}
      value={value}
      minValue={state.getThumbMinValue(index)}
      maxValue={state.getThumbMaxValue(index)}
      maxLength={maxLength}
      onChange={onChange}
    />
  );
}
