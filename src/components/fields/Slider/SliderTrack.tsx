import { useMemo } from 'react';

import { SliderTrackContainerElement } from './elements';

import type { SliderState } from 'react-stately';

export type SliderTrackProps = {
  state: SliderState;
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
};

export function SliderTrack(props: SliderTrackProps) {
  const { isDisabled, state, orientation = 'horizontal' } = props;
  const selectedTrack = [state.getThumbPercent(0), state.getThumbPercent(1)];

  const showRangeTrack = !Number.isNaN(selectedTrack[1]);

  const mods = useMemo(
    () => ({
      disabled: isDisabled,
      horizontal: orientation === 'horizontal',
      range: showRangeTrack,
    }),
    [isDisabled, showRangeTrack],
  );

  return (
    <SliderTrackContainerElement
      mods={mods}
      style={
        showRangeTrack
          ? {
              '--slider-range-start': `${selectedTrack[0] * 100}%`,
              '--slider-range-end': `${selectedTrack[1] * 100}%`,
            }
          : {
              '--slider-value': `${selectedTrack[0] * 100}%`,
            }
      }
    />
  );
}
