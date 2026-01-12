import { ReactNode } from 'react';

import { tasty } from '../../../tasty';

const SpinsContainerElement = tasty({
  role: 'presentation',
  styles: {
    boxSizing: 'border-box',
    display: 'inline-block',
    padding: '(1 / 10 * $cube-spin-size)',
    width: '$cube-spin-size',
    height: '$cube-spin-size',
    opacity: 0.8,
    contain: 'size layout style paint',
    animation: {
      '': 'cube-spin-reduced-motion 2s infinite ease-in-out',
      '@media(prefers-reduced-motion)': 'none',
    },

    '@keyframes': {
      'cube-spin-reduced-motion': {
        '0%': 'opacity: 0.4;',
        '50%': 'opacity: 0.8;',
        '100%': 'opacity: 0.4;',
      },
    },
  },
});

export interface SpinsContainerProps {
  ownSize: number;
  children?: ReactNode;
}

export function SpinsContainer({ ownSize, children }: SpinsContainerProps) {
  return (
    <SpinsContainerElement tokens={{ '$cube-spin-size': `${ownSize}px` }}>
      {children}
    </SpinsContainerElement>
  );
}
