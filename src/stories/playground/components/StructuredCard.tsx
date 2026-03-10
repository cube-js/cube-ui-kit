import { tasty } from '@tenphi/tasty';

import type { Styles } from '@tenphi/tasty';

const StructuredCardElement = tasty({
  qa: 'PlaygroundStructuredCard',
  styles: {
    display: 'block',
  },
});

export interface StructuredCardProps {
  styles?: Styles;
}

export function StructuredCard({ styles }: StructuredCardProps) {
  return (
    <StructuredCardElement styles={styles}>
      <div data-element="Header">
        <div data-element="Title">Card Title</div>
        <div data-element="Subtitle">Updated 2 hours ago</div>
      </div>
      <div data-element="Body">
        This card demonstrates sub-element styling. Each section is targeted via
        capitalized keys in the styles object and matched by data-element
        attributes in the DOM.
      </div>
      <div data-element="Footer">
        <span>Footer action area</span>
      </div>
    </StructuredCardElement>
  );
}
