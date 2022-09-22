import { forwardRef, useRef } from 'react';
import { useSlider } from '@react-aria/slider';
import { SliderStateOptions, useSliderState } from '@react-stately/slider';

import { FieldWrapper } from '../../forms/FieldWrapper';
import { FormFieldProps } from '../../../shared';
import {
  BasePropsWithoutChildren,
  BlockStyleProps,
  OuterStyleProps,
} from '../../../tasty';

import { Slide } from './Slide';
import { Gradation } from './Gradation';
import { Thumb } from './Thumb';
import { StyledControls, StyledSlider } from './styled';

import type { DOMRef } from '@react-types/shared';
import type { AriaSliderProps } from '@react-types/slider';

export interface CubeRangeSliderProps
  extends AriaSliderProps<number[]>,
    SliderStateOptions<number[]>,
    BasePropsWithoutChildren,
    OuterStyleProps,
    FormFieldProps,
    BlockStyleProps {
  showLabels?: boolean;
  gradation?: string[];
  ranges?: number[];
  onChange?: (range: number[]) => void;
  onChangeEnd?: (range: number[]) => void;
}

function RangeSlider(props: CubeRangeSliderProps, ref: DOMRef<HTMLDivElement>) {
  const {
    labelPosition,
    label,
    extra,
    styles,
    isRequired,
    validationState,
    message,
    description,
    requiredMark,
    labelSuffix,
    labelStyles,
    necessityIndicator,
    defaultValue,
    gradation,
    ranges = [0, 1],
    isDisabled,
    onChange,
    onChangeEnd,
  } = props;

  const trackRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const numberFormatter = new Intl.NumberFormat();
  const state = useSliderState({
    ...props,
    numberFormatter,
    isDisabled: isDisabled,
  });

  const { groupProps, trackProps, labelProps } = useSlider(
    {
      ...props,
      isDisabled: isDisabled,
      onChange(range: number | number[]) {
        if (onChange && Array.isArray(range)) {
          onChange(range);
        }
      },
      onChangeEnd(range) {
        if (onChangeEnd && Array.isArray(range)) {
          onChangeEnd(range);
        }
      },
    },
    state,
    trackRef,
  );

  const sliderField = (
    <StyledSlider {...groupProps}>
      <StyledControls {...trackProps} ref={trackRef}>
        <Slide state={state} ranges={ranges} />
        <Gradation state={state} ranges={ranges} values={gradation} />
        {ranges.map((thumb) => (
          <Thumb
            key={thumb}
            index={thumb}
            state={state}
            inputRef={inputRef}
            trackRef={trackRef}
            defaultValue={defaultValue && defaultValue[thumb]}
          />
        ))}
      </StyledControls>
    </StyledSlider>
  );

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        extra,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        labelProps,
        isDisabled,
        validationState,
        message,
        description,
        requiredMark,
        labelSuffix,
        Component: sliderField,
        ref: ref,
      }}
    />
  );
}

const _RangeSlider = forwardRef(RangeSlider);

const __RangeSlider = Object.assign(_RangeSlider as typeof _RangeSlider, {
  cubeInputType: 'CheckboxGroup',
});

export { __RangeSlider as RangeSlider };
