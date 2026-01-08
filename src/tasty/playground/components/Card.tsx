import { ReactNode } from 'react';

import { Styles } from '../../styles/types';
import { tasty } from '../../tasty';

const CardElement = tasty({
  qa: 'PlaygroundCard',
  styles: {
    display: 'block',
  },
});

export interface CardProps {
  styles?: Styles;
  children?: ReactNode;
}

export function Card({ styles, children }: CardProps) {
  return (
    <CardElement styles={styles}>
      {children || (
        <>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Card Title</div>
          <div style={{ opacity: 0.7 }}>
            This is a simple card component for demonstrating tasty styles.
          </div>
        </>
      )}
    </CardElement>
  );
}
