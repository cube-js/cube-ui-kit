import { CubeNotificationProps } from '../types';
import { tasty } from '../../../../tasty';
import { ButtonGroup } from '../../../actions';

interface NotificationFooterProps {
  actions?: CubeNotificationProps['actions'];
}

const FooterArea = tasty(ButtonGroup, {
  gridArea: 'footer',
  gap: '2x',
  styles: { '&:not(:empty)': { margin: '1x top' } },
});

export function NotificationFooter(
  props: NotificationFooterProps,
): JSX.Element {
  const { actions } = props;

  return <FooterArea>{actions}</FooterArea>;
}
