import { RefObject, useRef } from 'react';
import {
  AriaSliderThumbOptions,
  useHover,
  useSliderThumb,
  VisuallyHidden,
} from 'react-aria';
import { SliderState } from 'react-stately';

import { mergeProps } from '../../../utils/react';

import { SliderThumbElement } from './elements';

export interface SliderThumbProps extends AriaSliderThumbOptions {
  state: SliderState;
  isDisabled?: boolean;
  trackRef: RefObject<HTMLElement>;
  inputRef: RefObject<HTMLInputElement>;
  index: number;
}

export function SliderThumb(props: SliderThumbProps) {
  let { state, inputRef, isDisabled } = props;

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

  return (
    <SliderThumbElement
      mods={{
        hovered: isHovered,
        dragged: isDragging,
        focused: !isDragging && isFocused,
        disabled: isDisabled,
      }}
      {...mergeProps(thumbProps, hoverProps)}
      role="presentation"
    >
      <VisuallyHidden>
        <input ref={inputRef} {...inputProps} />
      </VisuallyHidden>
    </SliderThumbElement>
  );
}
