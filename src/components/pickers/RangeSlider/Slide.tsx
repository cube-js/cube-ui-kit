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

  const styles = {};
  const mods = useMemo(
    () => ({
      single: isSingle,
      disabled: isDisabled,
    }),
    [isDisabled, isSingle],
  );

  ranges.forEach((rangeIndex) => {
    styles[`@thumb-${rangeIndex}-value`] = state.getThumbPercent(rangeIndex);
  });

  return (
    <StyledSlide mods={mods}>
      <StyledSlideTrack styles={styles} mods={mods} />
    </StyledSlide>
  );
}
