import { HTMLAttributes, memo } from 'react';
import { Title } from '../../../content/Title';
import { tasty } from '../../../../tasty';

export type NotificationHeaderProps = {
  header: string;
} & HTMLAttributes<HTMLElement>;

const Header = tasty(Title, { gridArea: 'header', margin: '0.25x 0 0.5x' });

export const NotificationHeader = memo(function NotificationHeader(
  props: NotificationHeaderProps,
): JSX.Element {
  const { header, ...headerProps } = props;

  return (
    <Header as="div" preset="h6" {...headerProps}>
      {header}
    </Header>
  );
});
