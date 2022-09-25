import { SliderState } from '@react-stately/slider';

import { StyledSlideTrack, StyledSlide } from './styled';

export type SlideProps = {
  state: SliderState;
  ranges: number[];
};

export function Slide(props: SlideProps) {
  const { ranges, state } = props;

  const styles = {};
  const mods = {
    single: ranges.length <= 1,
  };

  ranges.forEach((rangeIndex) => {
    const percent = state.getThumbPercent(rangeIndex);

    console.log({ rangeIndex, percent });

    styles[`@thumb-${rangeIndex}-value`] = percent;
  });

  return (
    <StyledSlide>
      <StyledSlideTrack styles={styles} mods={mods} />
    </StyledSlide>
  );
}
