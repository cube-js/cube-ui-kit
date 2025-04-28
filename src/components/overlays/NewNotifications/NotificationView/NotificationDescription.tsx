import { HTMLAttributes, memo } from 'react';

import { tasty } from '../../../../tasty';
import { mergeProps } from '../../../../utils/react';
import { Paragraph } from '../../../content/Paragraph';

import { NotificationProps } from './types';

export type NotificationDescriptionProps = {
  description: NotificationProps['description'];
} & HTMLAttributes<HTMLElement>;

const Description = tasty(Paragraph, {
  as: 'p',
  preset: 't4',
  styles: {
    gridArea: 'description',
    display: '-webkit-box',
    '-webkit-line-clamp': 3,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
});

/**
 * @internal This component is unstable and must not be used outside of `NotificationView`.
 */
export const NotificationDescription = memo(function NotificationDescription(
  props: NotificationDescriptionProps,
) {
  const { description, ...descriptionProps } = props;

  return (
    <Description
      {...mergeProps(descriptionProps, {
        // To make a proper user selection
        onPointerDown: (e) => e.stopPropagation(),
        onMouseDown: (e) => e.stopPropagation(),
      })}
    >
      {description}
    </Description>
  );
});
