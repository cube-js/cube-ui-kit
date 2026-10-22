import { IconPlaystationTriangle } from '@tabler/icons-react';

import { wrapIcon } from './wrap-icon';

export const PlayCircleIcon = wrapIcon(
  'PlayCircleIcon',
  // oxlint-disable-next-line react/forbid-component-props -- a third-party Tabler icon; Tasty does not style its `<svg>`
  <IconPlaystationTriangle style={{ rotate: '90deg' }} />,
);
