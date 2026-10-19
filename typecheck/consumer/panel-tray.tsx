import { Dialog, DialogContainer, Layout } from '@cube-dev/ui-kit';

import type {
  CubeDialogContainerProps,
  CubeLayoutPanelProps,
} from '@cube-dev/ui-kit';

const dimensions = { width: '(100dvw - 2x)', height: '60dvh' };
const containerProps = {
  type: 'tray',
  styles: dimensions,
} satisfies CubeDialogContainerProps;
const panelProps = {
  side: 'right',
  mode: 'dialog',
  dialogProps: containerProps,
  dialogStyles: dimensions,
} satisfies CubeLayoutPanelProps;

export const standaloneTray = (
  <DialogContainer {...containerProps} isOpen>
    <Dialog aria-label="Details" styles={dimensions}>
      Details
    </Dialog>
  </DialogContainer>
);
export const panelTray = (
  <Layout height="100dvh">
    <Layout.Panel {...panelProps} isDialogOpen>
      Details
    </Layout.Panel>
  </Layout>
);
