import { HTMLAttributes, memo } from 'react';
import { tasty } from '../../../../tasty';
import { Paragraph } from '../../../content/Paragraph';

export type NotificationDescriptionProps = {
  description: string;
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

  return <Description {...descriptionProps}>{description}</Description>;
});
