import { useFocusableRef } from '@react-spectrum/utils';
import { FocusableRef } from '@react-types/shared';
import { forwardRef, ReactNode, RefObject, useMemo, useRef } from 'react';
import { useNumberFormatter, useSlider } from 'react-aria';
import { useSliderState } from 'react-stately';

import { extractStyles, OUTER_STYLES, tasty } from '../../../tasty';
import { Text } from '../../content/Text';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';

import { SliderControlsElement, SliderElement } from './elements';

import type { SliderState } from 'react-stately';
import type { CubeSliderBaseProps } from './types';

export interface SliderBaseChildArguments {
  inputRef: RefObject<HTMLInputElement>;
  trackRef: RefObject<HTMLElement>;
  state: SliderState;
}

export interface SliderBaseProps<T = number[]> extends CubeSliderBaseProps<T> {
  children: (opts: SliderBaseChildArguments) => ReactNode;
}

const LabelValueElement = tasty(Text, {
  styles: {
    display: 'block',
    textAlign: 'right',
  },
});

function SliderBase(
  allProps: SliderBaseProps,
  ref: FocusableRef<HTMLDivElement>,
) {
  let props = useFormProps(allProps);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value != null ? value : undefined,
      onChange: onChange,
    }),
  });

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
    gradation,
    isDisabled,
    inputStyles,
    minValue = 0,
    maxValue = 100,
    inputWidth,
    formatOptions,
    getValueLabel,
    onChange,
    onChangeEnd,
    children,
    showValueLabel = true,
    orientation: formOrientation,
    ...otherProps
  } = props;

  let orientation = allProps.orientation || 'horizontal';

  // `Math.abs(Math.sign(a) - Math.sign(b)) === 2` is true if the values have a different sign.
  let alwaysDisplaySign =
    Math.abs(Math.sign(minValue) - Math.sign(maxValue)) === 2;
  if (alwaysDisplaySign) {
    if (formatOptions != null) {
      if (!('signDisplay' in formatOptions)) {
        formatOptions = {
          ...formatOptions,
          signDisplay: 'exceptZero',
        };
      }
    } else {
      formatOptions = { signDisplay: 'exceptZero' };
    }
  }

  const formatter = useNumberFormatter(formatOptions);

  const state = useSliderState({
    ...props,
    orientation,
    numberFormatter: formatter,
    minValue,
    maxValue,
  });

  const trackRef = useRef<HTMLElement>(null);

  let { groupProps, trackProps, labelProps, outputProps } = useSlider(
    props,
    state,
    trackRef,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  let domRef = useFocusableRef(ref, inputRef);

  let displayValue = '';
  let maxLabelLength = 0;

  if (typeof getValueLabel === 'function') {
    displayValue = getValueLabel(state.values);
    switch (state.values.length) {
      case 1:
        maxLabelLength = Math.max(
          getValueLabel([minValue]).length,
          getValueLabel([maxValue]).length,
        );
        break;
      case 2:
        // Try all possible combinations of min and max values.
        maxLabelLength = Math.max(
          getValueLabel([minValue, minValue]).length,
          getValueLabel([minValue, maxValue]).length,
          getValueLabel([maxValue, minValue]).length,
          getValueLabel([maxValue, maxValue]).length,
        );
        break;
      default:
        throw new Error('Only sliders with 1 or 2 handles are supported!');
    }
  } else {
    maxLabelLength = Math.max(
      [...formatter.format(minValue)].length,
      [...formatter.format(maxValue)].length,
    );
    switch (state.values.length) {
      case 1:
        displayValue = state.getThumbValueLabel(0);
        break;
      case 2:
        // This should really use the NumberFormat#formatRange proposal...
        // https://github.com/tc39/ecma402/issues/393
        // https://github.com/tc39/proposal-intl-numberformat-v3#formatrange-ecma-402-393
        displayValue = `${state.getThumbValueLabel(
          0,
        )} – ${state.getThumbValueLabel(1)}`;
        maxLabelLength =
          3 +
          2 *
            Math.max(
              maxLabelLength,
              [...formatter.format(minValue)].length,
              [...formatter.format(maxValue)].length,
            );
        break;
      default:
        throw new Error('Only sliders with 1 or 2 handles are supported!');
    }
  }

  extra =
    extra != null || !showValueLabel ? (
      extra
    ) : (
      <LabelValueElement
        {...outputProps}
        style={
          maxLabelLength
            ? {
                width: `${maxLabelLength + 1}ch`,
                minWidth: `${maxLabelLength + 1}ch`,
              }
            : undefined
        }
      >
        {displayValue}
      </LabelValueElement>
    );

  const mods = useMemo(
    () => ({
      'side-label': labelPosition === 'side',
      horizontal: orientation === 'horizontal',
    }),
    [labelPosition, orientation],
  );

  const sliderField = (
    <SliderElement ref={domRef} {...groupProps} mods={mods}>
      <SliderControlsElement {...trackProps} ref={trackRef} mods={mods}>
        {children({
          trackRef,
          inputRef,
          state,
        })}
      </SliderControlsElement>
    </SliderElement>
  );

  styles = extractStyles(otherProps, OUTER_STYLES, styles);

  return wrapWithField(sliderField, ref, {
    ...props,
    children: undefined,
    styles,
    extra,
    labelProps,
  });
}

const _SliderBase = forwardRef(SliderBase);

_SliderBase.displayName = 'SliderBase';

export { _SliderBase as SliderBase };
export { useSlider };
