import { SliderState } from '@react-stately/slider';
import { useMemo } from 'react';

import { StyledSlide, StyledSlideTrack } from './styled';

export type SlideProps = {
  state: SliderState;
  ranges: number[];
  isDisabled?: boolean;
  isSingle?: boolean;
};

export function Slide(props: SlideProps) {
  const { ranges, state, isDisabled, isSingle } = props;
  const style = {};
  const mods = useMemo(
    () => ({
      single: isSingle,
      disabled: isDisabled,
    }),
    [isDisabled, isSingle],
  );

  ranges.forEach((rangeIndex) => {
    style[`--thumb-${rangeIndex}-value`] = state.getThumbPercent(rangeIndex);
  });

  return (
    <StyledSlide mods={mods}>
      <StyledSlideTrack style={style} mods={mods} />
    </StyledSlide>
  );
}
