import { Title } from '../../../content/Title';
import { tasty } from '../../../../tasty';

export type NotificationHeaderProps = {
  header: string;
};

const Header = tasty(Title, { gridArea: 'header', margin: '0.25x 0 0.5x' });

export function NotificationHeader(
  props: NotificationHeaderProps,
): JSX.Element {
  const { header } = props;

  return (
    <Header as="span" preset="h6">
      {header}
    </Header>
  );
}
