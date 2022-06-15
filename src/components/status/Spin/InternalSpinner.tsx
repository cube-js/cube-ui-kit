import { memo } from 'react';
import { SpinCube } from './SpinCube';
import { SpinWrap } from './SpinWrap';
import { InternalSpinnerProps, SpinSize } from './types';

export const InternalSpinner = memo(function InternalSpinner(
  props: InternalSpinnerProps,
) {
  const { size } = props;

  return (
    <SpinWrap ownSize={CUBE_SIZE_MAP[size]}>
      <SpinCube position="top" />
      <SpinCube position="right" />
      <SpinCube position="bottom" />
    </SpinWrap>
  );
});

const CUBE_SIZE_MAP: Record<SpinSize, number> = {
  small: 3,
  default: 4,
  large: 6,
};
