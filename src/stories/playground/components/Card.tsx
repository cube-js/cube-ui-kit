import { tasty } from '@tenphi/tasty';
import { ReactNode } from 'react';

import type { Styles } from '@tenphi/tasty';

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
            <p style={{ margin: '0 0 8px' }}>
              This is a simple card component for demonstrating tasty styles.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              Cards are one of the most common UI patterns. They group related
              content and actions, providing a clear visual boundary.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              Try adjusting padding, radius, fill, border, and shadow properties
              in the editor to see how the card changes.
            </p>
            <p style={{ margin: 0 }}>
              You can also experiment with overflow-related features like
              scrollbar styling and fade edges using this content.
            </p>
          </div>
        </>
      )}
    </CardElement>
  );
}
