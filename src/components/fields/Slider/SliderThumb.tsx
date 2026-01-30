import { RefObject, useMemo, useRef } from 'react';
import {
  AriaSliderThumbOptions,
  useHover,
  useSliderThumb,
  VisuallyHidden,
} from 'react-aria';

import { Styles, Tokens } from '../../../tasty';
import { mergeProps } from '../../../utils/react';

import { SliderThumbElement } from './elements';

import type { SliderState } from 'react-stately';

export interface SliderThumbProps extends AriaSliderThumbOptions {
  state: SliderState;
  isDisabled?: boolean;
  trackRef: RefObject<HTMLElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  index: number;
  styles?: Styles;
  tokens?: Tokens;
}

export function SliderThumb(props: SliderThumbProps) {
  let { state, index, inputRef, isDisabled, styles, tokens } = props;

  const backupRef = useRef<HTMLInputElement>(null);

  inputRef = inputRef || backupRef;

  const { thumbProps, inputProps, isDragging, isFocused } = useSliderThumb(
    {
      ...props,
      inputRef,
    },
    state,
  );

  const { hoverProps, isHovered } = useHover({ isDisabled });

  const isCollapsed = state.values[0] === state.values[1];
  const isStuck =
    state.values[index] === state.getThumbMaxValue(index) &&
    state.values[index] === state.getThumbMinValue(index);

  const mods = useMemo(() => {
    return {
      hovered: isHovered,
      dragged: isDragging,
      focused: !isDragging && isFocused,
      disabled: isDisabled,
      collapsed: isCollapsed,
      stuck: isStuck,
    };
  }, [isHovered, isCollapsed, isStuck, isDragging, isFocused, isDisabled]);

  return (
    <SliderThumbElement
      mods={mods}
      styles={styles}
      tokens={tokens}
      {...mergeProps(thumbProps, hoverProps)}
      role="presentation"
    >
      <VisuallyHidden>
        <input ref={inputRef} {...inputProps} />
      </VisuallyHidden>
    </SliderThumbElement>
  );
}
