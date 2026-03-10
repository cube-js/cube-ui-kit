import { tasty } from '@tenphi/tasty';

import type { Styles } from '@tenphi/tasty';

const ListCardElement = tasty({
  qa: 'PlaygroundListCard',
  styles: {
    display: 'block',
  },
});

export interface ListCardProps {
  styles?: Styles;
}

export function ListCard({ styles }: ListCardProps) {
  return (
    <ListCardElement styles={styles}>
      <div data-element="Title">Tasks</div>
      <div data-element="Item">
        <div data-element="Icon">&#9679;</div>
        <span>Review pull request</span>
      </div>
      <div data-element="Item">
        <span>Write documentation</span>
      </div>
      <div data-element="Item">
        <div data-element="Icon">&#9679;</div>
        <span>Deploy to staging</span>
      </div>
      <div data-element="Item">
        <span>Send weekly update</span>
      </div>
    </ListCardElement>
  );
}
