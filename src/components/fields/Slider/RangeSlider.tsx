import { forwardRef } from 'react';

import { SliderThumb } from './SliderThumb';
import { SliderTrack } from './SliderTrack';
import { SliderBase, SliderBaseChildArguments } from './SliderBase';
import { Gradation } from './Gradation';

import type { DOMRef } from '@react-types/shared';
import type { CubeSliderBaseProps } from './types';
import type { RangeValue } from '../../../shared';

export interface CubeRangeSliderProps
  extends CubeSliderBaseProps<RangeValue<number>> {
  gradation?: string[];
}

const INTL_MESSAGES = {
  minimum: 'Minimum',
  maximum: 'Maximum',
};

function RangeSlider(props: CubeRangeSliderProps, ref: DOMRef<HTMLDivElement>) {
  let { isDisabled, styles, gradation, ...otherProps } = props;

  return (
    <SliderBase {...(otherProps as CubeSliderBaseProps<number[]>)}>
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
  displayName: 'RangeSlider',
});

export { __RangeSlider as RangeSlider };
