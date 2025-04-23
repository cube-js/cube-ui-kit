import { forwardRef } from 'react';

import { extractStyles, OUTER_STYLES } from '../../../tasty';
import { mergeProps } from '../../../utils/react/index';

import { Gradation } from './Gradation';
import {
  SliderBase,
  SliderBaseChildArguments,
  SliderBaseProps,
} from './SliderBase';
import { SliderThumb } from './SliderThumb';
import { SliderTrack } from './SliderTrack';

import type { FocusableRef } from '@react-types/shared';
import type { CubeSliderBaseProps } from './types';

export interface CubeSliderProps extends CubeSliderBaseProps<number> {
  gradation?: string[];
}

function Slider(props: CubeSliderProps, ref: FocusableRef<HTMLDivElement>) {
  const {
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
    getValueLabel: getValueLabel ? ([v]) => getValueLabel(v) : undefined,
  };

  const extractedStyles = extractStyles(otherProps, OUTER_STYLES, styles);

  return (
    <SliderBase
      {...mergeProps(otherProps, baseProps)}
      ref={ref}
      orientation={orientation}
      styles={extractedStyles}
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
  displayName: 'Slider',
});

export { __Slider as Slider };
