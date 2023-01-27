import { SliderState } from '@react-stately/slider';
import { useMemo } from 'react';

import { SliderTrackContainerElement } from './elements';

export type SliderTrackProps = {
  state: SliderState;
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
};

export function SliderTrack(props: SliderTrackProps) {
  const { isDisabled, orientation = 'horizontal' } = props;
  const mods = useMemo(
    () => ({
      disabled: isDisabled,
      horizontal: orientation === 'horizontal',
    }),
    [isDisabled],
  );

  return <SliderTrackContainerElement mods={mods} />;
}
