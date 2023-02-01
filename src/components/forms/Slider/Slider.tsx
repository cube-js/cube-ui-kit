import { forwardRef } from 'react';

import { extractStyles, OUTER_STYLES } from '../../../tasty';

import { SliderThumb } from './SliderThumb';
import { SliderTrack } from './SliderTrack';
import {
  SliderBase,
  SliderBaseChildArguments,
  SliderBaseProps,
} from './SliderBase';
import { Gradation } from './Gradation';

import type { DOMRef } from '@react-types/shared';
import type { CubeSliderBaseProps } from './types';

export interface CubeSliderProps extends CubeSliderBaseProps<number> {
  gradation?: string[];
}

function Slider(props: CubeSliderProps, ref: DOMRef<HTMLDivElement>) {
  let {
    onChange,
    onChangeEnd,
    value,
    defaultValue,
    getValueLabel,
    isDisabled,
    styles,
    gradation,
    orientation,
    ...otherProps
  } = props;

  let baseProps: Omit<SliderBaseProps, 'children'> = {
    ...otherProps,
    // Normalize `value: number[]` to `value: number`
    value: value != null ? [value] : undefined,
    defaultValue: defaultValue != null ? [defaultValue] : undefined,
    onChange: (v: number[]): void => {
      onChange?.(v[0]);
    },
    onChangeEnd: (v: number[]): void => {
      onChangeEnd?.(v[0]);
    },
    getValueLabel: getValueLabel ? ([v]) => getValueLabel?.(v) : undefined,
  };

  styles = extractStyles(otherProps, OUTER_STYLES, styles);

  return (
    <SliderBase
      {...otherProps}
      {...baseProps}
      orientation={orientation}
      styles={styles}
    >
      {({ trackRef, inputRef, state }: SliderBaseChildArguments) => {
        return (
          <>
            <Gradation state={state} ranges={[0, 1]} values={gradation} />
            <SliderTrack
              state={state}
              isDisabled={isDisabled}
              orientation={orientation}
            />
            <SliderThumb
              index={0}
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

const _Slider = forwardRef(Slider);

const __Slider = Object.assign(_Slider as typeof _Slider, {
  cubeInputType: 'Number',
});

export { __Slider as Slider };
