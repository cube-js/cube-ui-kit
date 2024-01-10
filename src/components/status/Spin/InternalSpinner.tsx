import { memo } from 'react';

import { tasty } from '../../../tasty';

import { Cube } from './Cube';
import { SpinsContainer } from './SpinsContainer';
import { InternalSpinnerProps, SpinSize } from './types';

const SpinsBox = tasty({ styles: { position: 'relative', blockSize: '100%' } });

export const InternalSpinner = memo(function InternalSpinner(
  props: InternalSpinnerProps,
): JSX.Element {
  const { size } = props;

  return (
    // Even though using size as a key resets the animation, it helps safari to resize the cubes.
    <SpinsContainer key={size} $ownSize={CUBE_SIZE_MAP[size]}>
      <SpinsBox>
        <Cube $position="top" />
        <Cube $position="right" />
        <Cube $position="bottom" />
      </SpinsBox>
    </SpinsContainer>
  );
});

const CUBE_SIZE_MAP: Record<SpinSize, number> = {
  small: 24,
  default: 32,
  large: 48,
};
