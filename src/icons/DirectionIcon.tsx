import { memo, useEffect, useRef, useState } from 'react';

import { tasty } from '../tasty/index';

import { CubeIconProps } from './Icon';
import { UpIcon } from './UpIcon';

const StyledUpIcon = tasty(UpIcon, {
  styles: {
    transformOrigin: 'center',
    transition: 'rotate linear $transition, transform linear $transition',
  },
});

export type DirectionIconProps = {
  /**
   * @default 'bottom'
   */
  to?: Direction;
} & CubeIconProps;

const DIRECTIONS = ['left', 'right', 'top', 'bottom', 'up', 'down'];

type Direction = (typeof DIRECTIONS)[number];

const rotationByDirection: Record<Direction, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
  up: 0,
  down: 180,
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

    const lastRotate = rotationByDirection[lastDirection];
    const nextRotate = rotationByDirection[direction];
    const diffRotate = lastRotate - nextRotate;
    const angle = Math.abs(diffRotate) % 360;

    if (angle === 180) {
      // For 180° changes, flip instead of rotating
      setFlipScale((prev) => -prev);
    } else {
      // Find shortest rotation path
      let shortestDiff = diffRotate;
      if (angle > 180) {
        // Wrap around: use the shorter path
        shortestDiff = diffRotate > 0 ? diffRotate - 360 : diffRotate + 360;
      }
      // When flipped, rotation direction is inverted (scaleY flips the coordinate system)
      setRotate((prev) => prev - shortestDiff);
    }

    lastDirectionRef.current = direction;
  }, [direction]);

  return (
    <StyledUpIcon
      data-direction={direction}
      {...iconProps}
      style={{
        rotate: `${rotate}deg`,
        transform: `scaleY(${flipScale})`,
      }}
    />
  );
});
