import { HTMLAttributes, memo } from 'react';

import { tasty } from '../../../../tasty';
import { Title } from '../../../content/Title';

import { NotificationProps } from './types';

export type NotificationHeaderProps = {
  header: NotificationProps['header'];
} & HTMLAttributes<HTMLElement>;

const Header = tasty(Title, {
  as: 'div',
  preset: 'h6',
  styles: {
    gridArea: 'header',
    cursor: 'default',

    '&:not(:empty)': {
      margin: '0.25x 0 0.5x',
    },
  },
});

/**
 * @internal This component is unstable and must not be used outside of `NotificationView`.
 */
export const NotificationHeader = memo(function NotificationHeader(
  props: NotificationHeaderProps,
) {
  const { header, ...headerProps } = props;

  return <Header {...headerProps}>{header}</Header>;
});
