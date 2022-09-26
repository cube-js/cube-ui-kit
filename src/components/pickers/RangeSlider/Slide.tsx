import { SliderState } from '@react-stately/slider';
import { useMemo } from 'react';

import { StyledSlideTrack, StyledSlide } from './styled';

export type SlideProps = {
  state: SliderState;
  ranges: number[];
  isDisabled?: boolean;
};

export function Slide(props: SlideProps) {
  const { ranges, state, isDisabled } = props;

  const styles = {};
  const mods = useMemo(
    () => ({
      single: ranges.length <= 1,
      disabled: isDisabled,
    }),
    [isDisabled, ranges.length],
  );

  ranges.forEach((rangeIndex) => {
    const percent = state.getThumbPercent(rangeIndex);

    console.log({ rangeIndex, percent });

    styles[`@thumb-${rangeIndex}-value`] = percent;
  });

  return (
    <StyledSlide mods={mods}>
      <StyledSlideTrack styles={styles} mods={mods} />
    </StyledSlide>
  );
}
