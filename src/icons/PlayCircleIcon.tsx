import { IconPlaystationTriangle } from '@tabler/icons-react';
import { tasty } from '@tenphi/tasty';

import { wrapIcon } from './wrap-icon';

const RotatedTriangleIcon = tasty({
  as: IconPlaystationTriangle,
  styles: { rotate: '90deg' },
});

export const PlayCircleIcon = wrapIcon(
  'PlayCircleIcon',
  <RotatedTriangleIcon />,
);
