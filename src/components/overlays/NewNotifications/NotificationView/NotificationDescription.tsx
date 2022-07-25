import { HTMLAttributes, memo } from 'react';
import { tasty } from '../../../../tasty';
import { Paragraph } from '../../../content/Paragraph';
import { NotificationProps } from './types';

export type NotificationDescriptionProps = {
  description: NotificationProps['description'];
} & HTMLAttributes<HTMLElement>;

const Description = tasty(Paragraph, {
  as: 'p',
  styles: {
    gridArea: 'description',
    display: '-webkit-box',
    '-webkit-line-clamp': 3,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
});

export const NotificationDescription = memo(function NotificationDescription(
  props: NotificationDescriptionProps,
) {
  const { description, ...descriptionProps } = props;

  return (
    <Description preset="t4m" {...descriptionProps}>
      {description}
    </Description>
  );
});
