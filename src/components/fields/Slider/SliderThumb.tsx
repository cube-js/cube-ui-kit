import { RefObject, useMemo, useRef } from 'react';
import {
  AriaSliderThumbOptions,
  useHover,
  useSliderThumb,
  VisuallyHidden,
} from 'react-aria';

import { mergeProps } from '../../../utils/react';

import { SliderThumbElement } from './elements';

import type { SliderState } from 'react-stately';

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

  const mods = useMemo(() => {
    return {
      hovered: isHovered,
      dragged: isDragging,
      focused: !isDragging && isFocused,
      disabled: isDisabled,
    };
  }, [isHovered, isDragging, isFocused, isDisabled]);

  return (
    <SliderThumbElement
      mods={mods}
      {...mergeProps(thumbProps, hoverProps)}
      role="presentation"
    >
      <VisuallyHidden>
        <input ref={inputRef} {...inputProps} />
      </VisuallyHidden>
    </SliderThumbElement>
  );
}
