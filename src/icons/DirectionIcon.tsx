import { memo, useEffect, useRef, useState } from 'react';

import { tasty } from '../tasty/index';

import { CubeIconProps } from './Icon';
import { UpIcon } from './UpIcon';

const StyledUpIcon = tasty(UpIcon, {
  styles: {
    transformOrigin: 'center',
    transition: 'rotate linear 120ms, scale linear 120ms',
  },
});

export type DirectionIconProps = {
  /**
   * @default 'bottom'
   */
  to?: Direction;
} & CubeIconProps;

const DIRECTIONS = ['left', 'right', 'top', 'bottom'];

type Direction = (typeof DIRECTIONS)[number];

const rotationByDirection: Record<Direction, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
};

export const DirectionIcon = memo(function DirectionIcon(
  props: DirectionIconProps,
) {
  const { to: direction = 'bottom', ...iconProps } = props;
  const lastDirectionRef = useRef<Direction>(direction);
  const [rotate, setRotate] = useState(rotationByDirection[direction]);
  const [flipScale, setFlipScale] = useState(1); // Tracks flipping: 1 (normal) or -1 (flipped)
  const lastDirection = lastDirectionRef.current;

  useEffect(() => {
    if (lastDirection === direction || !DIRECTIONS.includes(direction)) {
      return;
    }

    let appliedRotate = 0;
    let nextFlipScale = flipScale;

    const lastRotate = rotationByDirection[lastDirection];
    const nextRotate = rotationByDirection[direction];
    const diffRotate = nextRotate - lastRotate;

    if (Math.abs(diffRotate) % 360 !== 180) {
      if (nextRotate < lastRotate) {
        appliedRotate = 90;
      } else {
        appliedRotate = -90;
      }

      if (Math.abs(diffRotate) !== 90) {
        appliedRotate = -appliedRotate;
      }

      if (flipScale) {
        appliedRotate = -appliedRotate;
      }
    } else {
      nextFlipScale = -flipScale;
    }

    setRotate(rotate + appliedRotate);
    setFlipScale(nextFlipScale);

    lastDirectionRef.current = direction;
  }, [direction]);

  return (
    <StyledUpIcon
      data-direction={direction}
      {...iconProps}
      style={{
        rotate: `${rotate}deg`,
        scale: `1 ${flipScale}`,
      }}
    />
  );
});
