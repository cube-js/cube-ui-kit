import { HTMLAttributes, memo } from 'react';
import { tasty } from '../../../../tasty';
import { Paragraph } from '../../../content/Paragraph';
import { NotificationProps } from './types';
import { mergeProps } from '../../../../utils/react';

export type NotificationDescriptionProps = {
  description: NotificationProps['description'];
} & HTMLAttributes<HTMLElement>;

const Description = tasty(Paragraph, {
  as: 'p',
  preset: 't4m',
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
