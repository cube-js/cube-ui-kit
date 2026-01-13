import { memo } from 'react';

import { tasty } from '../../../tasty';

import { SpinCubeProps } from './types';

const CubeElement = tasty({
  role: 'presentation',
  styles: {
    '$cube-border-width': '(4 / 100 * $cube-spin-size)',
    '$cube-border-compensation': '(-1 * $cube-border-width)',
    '$cube-size': '((100% - 2 * $cube-border-width) / 2)',

    boxSizing: 'content-box',
    position: 'absolute',
    top: '$cube-border-compensation',
    left: '$cube-border-compensation',
    width: '$cube-size',
    height: '$cube-size',
    border: '$cube-border-width solid transparent',
    overflow: 'hidden',
    contain: 'size layout style paint',
    pointerEvents: 'none',
    userSelect: 'none',

    animationName: {
      'position=top': 'cube-spin-top',
      'position=right': 'cube-spin-right',
      'position=bottom': 'cube-spin-bottom',
    },
    animationDuration: '2.2s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'cubic-bezier(0.5, 0.05, 0.3, 0.95)',
    animationPlayState: {
      '': 'running',
      '@media(prefers-reduced-motion)': 'paused',
    },

    '&::before': {
      '$cube-round-radius': '(4 / 100 * $cube-spin-size)',
      content: '""',
      display: 'block',
      width: '100%',
      height: '100%',
      radius: '$cube-round-radius',
      fill: {
        'position=top': '#7a77ff',
        'position=right': '#727290',
        'position=bottom': '#ff6492',
      },
    },

    '@keyframes': {
      'cube-spin-top': {
        '0%': 'transform: translate(0%, 0);',
        '8%': 'transform: translate(100%, 0);',
        '17%': 'transform: translate(100%, 0);',
        '25%': 'transform: translate(100%, 0);',
        '33%': 'transform: translate(100%, 100%);',
        '42%': 'transform: translate(100%, 100%);',
        '50%': 'transform: translate(100%, 100%);',
        '58%': 'transform: translate(0, 100%);',
        '67%': 'transform: translate(0, 100%);',
        '75%': 'transform: translate(0, 100%);',
        '83%': 'transform: translate(0, 0);',
        '92%': 'transform: translate(0, 0);',
        '100%': 'transform: translate(0, 0);',
      },
      'cube-spin-right': {
        '0%': 'transform: translate(100%, 100%);',
        '8%': 'transform: translate(100%, 100%);',
        '17%': 'transform: translate(100%, 100%);',
        '25%': 'transform: translate(0, 100%);',
        '33%': 'transform: translate(0, 100%);',
        '42%': 'transform: translate(0, 100%);',
        '50%': 'transform: translate(0, 0);',
        '58%': 'transform: translate(0, 0);',
        '67%': 'transform: translate(0, 0);',
        '75%': 'transform: translate(100%, 0);',
        '83%': 'transform: translate(100%, 0);',
        '92%': 'transform: translate(100%, 0);',
        '100%': 'transform: translate(100%, 100%);',
      },
      'cube-spin-bottom': {
        '0%': 'transform: translate(0, 100%);',
        '8%': 'transform: translate(0, 100%);',
        '17%': 'transform: translate(0, 0);',
        '25%': 'transform: translate(0, 0);',
        '33%': 'transform: translate(0, 0);',
        '42%': 'transform: translate(100%, 0);',
        '50%': 'transform: translate(100%, 0);',
        '58%': 'transform: translate(100%, 0);',
        '67%': 'transform: translate(100%, 100%);',
        '75%': 'transform: translate(100%, 100%);',
        '83%': 'transform: translate(100%, 100%);',
        '92%': 'transform: translate(0, 100%);',
        '100%': 'transform: translate(0, 100%);',
      },
    },
  },
});

export const Cube = memo(function Cube({ $position }: SpinCubeProps) {
  return <CubeElement mods={{ position: $position }} />;
});
