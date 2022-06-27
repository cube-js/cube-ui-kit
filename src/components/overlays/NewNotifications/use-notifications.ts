import { useEvent } from '../../../_internal';
import { CubeNotificationProps } from './types';

export function useNotifications() {
  return {
    notify: useEvent((props: CubeNotificationProps) => {}),
  };
}
