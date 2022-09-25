import { forwardRef, useRef } from 'react';
import { useSlider } from '@react-aria/slider';
import { SliderStateOptions, useSliderState } from '@react-stately/slider';

import { FieldWrapper } from '../../forms/FieldWrapper';
import { FormFieldProps } from '../../../shared';
import {
  BasePropsWithoutChildren,
  BlockStyleProps,
  extractStyles,
  OUTER_STYLES,
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

function getRanges(value) {
  if (Array.isArray(value)) {
    return value.map((_, idx) => idx);
  }

  return [0];
}

function RangeSlider(props: CubeRangeSliderProps, ref: DOMRef<HTMLDivElement>) {
  let {
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
    value,
    gradation,
    step = 1,
    isDisabled,
    orientation = 'horizontal',
    onChange,
    onChangeEnd,
    ...otherProps
  } = props;

  const ranges = getRanges(defaultValue || value || [0, 1]);
  const trackRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const numberFormatter = new Intl.NumberFormat();
  const state = useSliderState({
    ...props,
    step,
    orientation,
    numberFormatter,
    isDisabled,
  });

  const { groupProps, trackProps, labelProps } = useSlider(
    {
      ...props,
      step,
      orientation,
      isDisabled,
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

  styles = extractStyles(otherProps, OUTER_STYLES, styles);
  console.log({ defaultValue });

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
