import { forwardRef, useRef } from 'react';
import { useSlider } from '@react-aria/slider';
import { useSliderState } from '@react-stately/slider';

import { FieldWrapper } from '../../forms/FieldWrapper';
import { FormFieldProps } from '../../../shared';
import {
  BasePropsWithoutChildren,
  BlockStyleProps,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
} from '../../../tasty';

import { Slide } from './Slide';
import { Gradation } from './Gradation';
import { Thumb } from './Thumb';
import { RangeInput } from './RangeInput';
import { StyledControls, StyledSlider, StyledContent } from './styled';
import {
  getMinMaxValue,
  getRanges,
  getValidValue,
  SliderValue,
} from './helpers';

import type { DOMRef } from '@react-types/shared';
import type { AriaSliderProps, SliderProps } from '@react-types/slider';

export interface CubeRangeSliderProps
  extends AriaSliderProps<SliderValue>,
    SliderProps<SliderValue>,
    BasePropsWithoutChildren,
    OuterStyleProps,
    FormFieldProps,
    BlockStyleProps {
  showInput?: boolean;
  inputSuffix?: string;
  inputStyles?: Styles;
  gradation?: string[];
  onChange?: (range: SliderValue) => void;
  onChangeEnd?: (range: SliderValue) => void;
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
    showInput,
    inputStyles,
    inputSuffix,
    minValue,
    maxValue,
    onChange,
    onChangeEnd,
    ...otherProps
  } = props;

  const [min, max] = getMinMaxValue(minValue, maxValue, value || defaultValue);
  const ranges = getRanges(defaultValue || value || [0, 1]);
  const isSingle = ranges.length <= 1;
  const trackRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const numberFormatter = new Intl.NumberFormat();
  const baseProps = {
    step,
    orientation,
    isDisabled,
    minValue: min,
    maxValue: max,
    value: getValidValue(value, min, max),
    defaultValue: getValidValue(defaultValue, min, max),
    onChange(range) {
      if (onChange) {
        onChange(Array.isArray(range) ? range : [range]);
      }
    },
    onChangeEnd(range) {
      if (onChangeEnd) {
        onChangeEnd(Array.isArray(range) ? range : [range]);
      }
    },
  };
  const state = useSliderState({
    ...props,
    ...baseProps,
    numberFormatter,
  });

  const { groupProps, trackProps, labelProps } = useSlider(
    {
      ...props,
      ...baseProps,
    },
    state,
    trackRef,
  );

  const inputProps = {
    step,
    state,
    isDisabled,
    suffix: inputSuffix,
    styles: inputStyles,
    min: baseProps.minValue,
    max: baseProps.maxValue,
  };

  const sliderField = (
    <StyledSlider
      {...groupProps}
      mods={{
        sideLabel: labelPosition === 'side',
        inputs: showInput,
      }}
    >
      {!isSingle && showInput && <RangeInput index={0} {...inputProps} />}
      <StyledContent>
        <StyledControls {...trackProps} ref={trackRef}>
          <Slide
            state={state}
            ranges={ranges}
            isSingle={isSingle}
            isDisabled={isDisabled}
          />
          <Gradation state={state} ranges={ranges} values={gradation} />
          {ranges.map((thumb) => (
            <Thumb
              key={thumb}
              index={thumb}
              state={state}
              inputRef={inputRef}
              trackRef={trackRef}
              isDisabled={isDisabled}
              defaultValue={
                baseProps.defaultValue && baseProps.defaultValue[thumb]
              }
            />
          ))}
        </StyledControls>
      </StyledContent>
      {showInput && <RangeInput index={1} {...inputProps} />}
    </StyledSlider>
  );

  styles = extractStyles(otherProps, OUTER_STYLES, styles);

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
