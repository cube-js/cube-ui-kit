import { forwardRef } from 'react';

import { SliderThumb } from './SliderThumb';
import { SliderTrack } from './SliderTrack';
import {
  SliderBase,
  SliderBaseChildArguments,
  SliderBaseProps,
} from './SliderBase';
import { Gradation } from './Gradation';

import type { DOMRef, RangeValue } from '@react-types/shared';
import type { CubeSliderBaseProps } from './types';

export interface CubeRangeSliderProps
  extends CubeSliderBaseProps<RangeValue<number>> {
  gradation?: string[];
}

const INTL_MESSAGES = {
  minimum: 'Minimum',
  maximum: 'Maximum',
};

function RangeSlider(props: CubeRangeSliderProps, ref: DOMRef<HTMLDivElement>) {
  let {
    onChange,
    onChangeEnd,
    value,
    defaultValue,
    getValueLabel,
    isDisabled,
    styles,
    gradation,
    ...otherProps
  } = props;

  let baseProps: Omit<SliderBaseProps<number[]>, 'children'> = {
    ...otherProps,
    value: value != null ? [value.start, value.end] : undefined,
    defaultValue:
      defaultValue != null
        ? [defaultValue.start, defaultValue.end]
        : // make sure that useSliderState knows we have two handles
          [props.minValue ?? 0, props.maxValue ?? 100],
    onChange(v) {
      onChange?.({ start: v[0], end: v[1] });
    },
    onChangeEnd(v) {
      onChangeEnd?.({ start: v[0], end: v[1] });
    },
    getValueLabel: getValueLabel
      ? ([start, end]) => getValueLabel?.({ start, end })
      : undefined,
  };

  return (
    <SliderBase {...otherProps} {...baseProps}>
      {({ trackRef, inputRef, state }: SliderBaseChildArguments) => {
        return (
          <>
            <Gradation state={state} ranges={[0, 1]} values={gradation} />
            <SliderTrack state={state} isDisabled={isDisabled} />
            <SliderThumb
              index={0}
              aria-label={INTL_MESSAGES['minimum']}
              state={state}
              inputRef={inputRef}
              trackRef={trackRef}
              isDisabled={isDisabled}
            />
            <SliderThumb
              index={1}
              aria-label={INTL_MESSAGES['maximum']}
              state={state}
              inputRef={inputRef}
              trackRef={trackRef}
              isDisabled={isDisabled}
            />
          </>
        );
      }}
    </SliderBase>
  );
}

const _RangeSlider = forwardRef(RangeSlider);

const __RangeSlider = Object.assign(_RangeSlider as typeof _RangeSlider, {
  cubeInputType: 'Number',
});

export { __RangeSlider as RangeSlider };
