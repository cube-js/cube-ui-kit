import { CSSProperties } from 'react';

import { tasty } from '../../../tasty';
import { Block, CubeBlockProps } from '../../Block';

const CUBE_IMAGE =
  "data:image/svg+xml,%3Csvg width='36' height='41' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M35.899 10.351l-18 10.25L.1 10.25l18-10.25L35.9 10.351z' fill='%23FAFAFF'/%3E%3Cpath d='M18 41L0 30.75l.101-20.5L18 20.5' fill='%23E5E5F6'/%3E%3Cpath d='M36 30.75L18 41V20.6l17.899-10.25L36 30.75z' fill='%23C0C0EA'/%3E%3C/svg%3E";

const CubeElement = tasty({
  as: 'img',
  role: 'presentation',
  src: CUBE_IMAGE,
  alt: '',
  styles: {
    display: 'block',
    position: 'absolute',
    width: '50%',
    height: '50%',

    animationName: {
      'index=0': 'dice0',
      'index=1': 'dice1',
      'index=2': 'dice2',
    },
    animationDuration: {
      'index=0 | index=1 | index=2': '2s',
    },
    animationIterationCount: {
      'index=0 | index=1 | index=2': 'infinite',
    },
    animationTimingFunction: {
      'index=0 | index=1 | index=2': 'ease',
    },
    zIndex: {
      'index=0 | index=1 | index=2': 0,
    },

    '@keyframes': {
      dice0: {
        from: 'transform: translate(49%, 0.5%); z-index: 0;',
        '25%': 'transform: translate(49%, 0.5%); z-index: 0;',
        '50%': 'transform: translate(0%, 25%); z-index: 0;',
        '51%': 'z-index: 1;',
        '75%': 'z-index: 1;',
        to: 'transform: translate(0%, 25%); z-index: 1;',
      },
      dice1: {
        from: 'transform: translate(0%, 25%); z-index: 3;',
        '25%': 'transform: translate(49%, 49%); z-index: 3;',
        '75%': 'transform: translate(49%, 49%); z-index: 2;',
        to: 'transform: translate(98%, 25%); z-index: 1;',
      },
      dice2: {
        from: 'transform: translate(98%, 25%); z-index: 1;',
        '50%': 'transform: translate(98%, 25%); z-index: 0;',
        '75%': 'transform: translate(49%, 0.5%); z-index: 0;',
        to: 'transform: translate(49%, 0.5%); z-index: 0;',
      },
    },
  },
});

interface CubeProps {
  index?: 0 | 1 | 2;
  style?: CSSProperties;
}

function Cube({ index, style }: CubeProps) {
  return (
    <CubeElement mods={index != null ? { index } : undefined} style={style} />
  );
}

const SIZE_MAP = {
  small: 32,
  medium: 64,
  large: 96,
};

export interface CubeLoadingAnimationProps extends CubeBlockProps {
  size?: 'small' | 'medium' | 'large' | number;
}

export function LoadingAnimation({
  size = 'medium',
  ...props
}: CubeLoadingAnimationProps) {
  const numSize: number = SIZE_MAP[size] || size || SIZE_MAP.medium;

  return (
    <Block
      role="img"
      aria-label="Loading animation"
      width={numSize}
      height={numSize * 1.1388888889}
      style={{ position: 'relative' }}
      {...props}
    >
      <Cube style={{ transform: 'translate(0%, 72.5%)' }} />
      <Cube style={{ transform: 'translate(98%, 72.5%)' }} />
      <Cube style={{ transform: 'translate(49%, 96.5%)' }} />
      <Cube index={0} />
      <Cube index={1} />
      <Cube index={2} />
    </Block>
  );
}
