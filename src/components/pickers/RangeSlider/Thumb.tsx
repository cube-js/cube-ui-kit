import { useRef } from 'react';
import { AriaSliderThumbOptions, useSliderThumb } from '@react-aria/slider';
import { useHover } from '@react-aria/interactions';
import { SliderState } from '@react-stately/slider';
import { VisuallyHidden } from '@react-aria/visually-hidden';
import { FocusRing } from '@react-aria/focus';

import { mergeProps } from '../../../utils/react';

import { StyledThumb } from './styled';

export interface ThumbProps extends AriaSliderThumbOptions {
  state: SliderState;
  defaultValue?: number;
  isDisabled?: boolean;
}

export function Thumb(props: ThumbProps) {
  const { state, isDisabled } = props;

  const ref = useRef<HTMLInputElement>(null);

  const { thumbProps, inputProps, isDragging, isFocused } = useSliderThumb(
    {
      ...props,
      inputRef: ref,
    },
    state,
  );

  const { hoverProps, isHovered } = useHover({ isDisabled });

  return (
    <FocusRing within>
      <StyledThumb
        mods={{
          hovered: isHovered,
          dragged: isDragging,
          focused: isFocused,
        }}
        {...mergeProps(thumbProps, hoverProps)}
        role="presentation"
      >
        <VisuallyHidden>
          <input ref={ref} {...inputProps} />
        </VisuallyHidden>
      </StyledThumb>
    </FocusRing>
  );
}
