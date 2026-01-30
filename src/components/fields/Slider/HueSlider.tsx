import { forwardRef, useCallback, useMemo, useState } from 'react';

import { Styles, Tokens } from '../../../tasty';

import { CubeSliderProps, Slider } from './Slider';

import type { FocusableRef } from '@react-types/shared';

// Generate 7 hue stops (0, 60, 120, 180, 240, 300, 359) for full color spectrum
const HUE_STOPS = [0, 60, 120, 180, 240, 300, 359];
const HUE_SATURATION = 80;
const HUE_LIGHTNESS = 50;

const HUE_GRADIENT = HUE_STOPS.map(
  (h) => `okhsl(${h} ${HUE_SATURATION}% ${HUE_LIGHTNESS}%)`,
).join(', ');

const horizontalTrackStyles: Styles = {
  image: `linear-gradient(to right, ${HUE_GRADIENT})`,
  Fill: false,
};

const verticalTrackStyles: Styles = {
  image: `linear-gradient(to top, ${HUE_GRADIENT})`,
  Fill: false,
};

export interface CubeHueSliderProps
  extends Omit<CubeSliderProps, 'minValue' | 'maxValue' | 'step'> {
  /** The current hue value (0-359) */
  value?: number;
  /** The default hue value (0-359) */
  defaultValue?: number;
}

function HueSlider(
  props: CubeHueSliderProps,
  ref: FocusableRef<HTMLDivElement>,
) {
  const {
    value,
    defaultValue = 0,
    onChange,
    orientation = 'horizontal',
    thumbTokens: userThumbTokens,
    thumbStyles: userThumbStyles,
    trackStyles: userTrackStyles,
    ...rest
  } = props;

  // Track internal value for uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Use controlled value if provided, otherwise use internal state
  const currentHue = value ?? internalValue;

  // Handle onChange to update internal state in uncontrolled mode
  const handleChange = useCallback(
    (newValue: number) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [value, onChange],
  );

  // Create dynamic thumb tokens with the current hue color
  const thumbTokens: Tokens = useMemo(
    () => ({
      '#slider-thumb': `okhsl(${currentHue} ${HUE_SATURATION}% ${HUE_LIGHTNESS}%)`,
      '#slider-thumb-hovered': `okhsl(${currentHue} ${HUE_SATURATION}% ${HUE_LIGHTNESS - 10}%)`,
      ...userThumbTokens,
    }),
    [currentHue, userThumbTokens],
  );
  const thumbStyles: Styles = useMemo(
    () => ({
      outline: {
        '': '1bw #slider-thumb-hovered.0',
        focused: '1bw #slider-thumb-hovered',
      },
      ...userThumbStyles,
    }),
    [userThumbStyles],
  );

  const trackStyles: Styles = useMemo(
    () => ({
      ...(orientation === 'vertical'
        ? verticalTrackStyles
        : horizontalTrackStyles),
      ...userTrackStyles,
    }),
    [orientation, userTrackStyles],
  );

  return (
    <Slider
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      orientation={orientation}
      minValue={0}
      maxValue={359}
      step={1}
      thumbStyles={thumbStyles}
      trackStyles={trackStyles}
      thumbTokens={thumbTokens}
      onChange={handleChange}
      {...rest}
    />
  );
}

const _HueSlider = forwardRef(HueSlider);

const __HueSlider = Object.assign(_HueSlider as typeof _HueSlider, {
  cubeInputType: 'Number',
  displayName: 'HueSlider',
});

export { __HueSlider as HueSlider };
