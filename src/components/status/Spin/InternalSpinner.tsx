import { memo } from 'react';
import { Cube } from './Cube';
import { SpinsContainer } from './SpinsContainer';
import { InternalSpinnerProps, SpinSize } from './types';
import { tasty } from '../../../tasty';

const SpinsBox = tasty({ styles: { position: 'relative', width: '100%' } });

export const InternalSpinner = memo(function InternalSpinner(
  props: InternalSpinnerProps,
) {
  const { size } = props;

  return (
    <SpinsContainer ownSize={CUBE_SIZE_MAP[size]}>
      <SpinsBox>
        <Cube position="top" />
        <Cube position="right" />
        <Cube position="bottom" />
      </SpinsBox>
    </SpinsContainer>
  );
});

const CUBE_SIZE_MAP: Record<SpinSize, number> = {
  small: 3,
  default: 4,
  large: 6,
};
