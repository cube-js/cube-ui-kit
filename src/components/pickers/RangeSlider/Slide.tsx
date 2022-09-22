import { SliderState } from '@react-stately/slider';

import { StyledSlideTrack, StyledSlide } from './styled';

export type SlideProps = {
  state: SliderState;
  ranges: number[];
};

export function Slide(props: SlideProps) {
  const { ranges, state } = props;

  const styles = {};

  ranges.forEach((rangeIndex) => {
    styles[`@thumb-${rangeIndex}-value`] = state.getThumbPercent(rangeIndex);
    styles[`@thumb-${rangeIndex}-index`] = rangeIndex;
  });

  return (
    <StyledSlide>
      <StyledSlideTrack styles={styles} />
    </StyledSlide>
  );
}
