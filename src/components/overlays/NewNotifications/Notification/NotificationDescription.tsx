import { memo } from 'react';
import { tasty } from '../../../../tasty';
import { Paragraph } from '../../../content/Paragraph';

export type NotificationDescriptionProps = {
  description: string;
};

const Description = tasty(Paragraph, {
  gridArea: 'description',
});

export const NotificationDescription = memo(function NotificationDescription(
  props: NotificationDescriptionProps,
) {
  const { description } = props;

  return <Description>{description}</Description>;
});
