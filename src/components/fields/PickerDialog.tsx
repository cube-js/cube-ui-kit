import { Styles } from '@tenphi/tasty';
import { ReactNode } from 'react';

import { mergeStyleLayers } from '../../utils/styles';
import { Content } from '../content/Content';
import { Header } from '../content/Header';
import { Title } from '../content/Title';
import { useDialogContext } from '../overlays/Dialog/context';
import { CubeDialogProps, Dialog } from '../overlays/Dialog/Dialog';

const POPOVER_STYLES: Styles = {
  display: 'grid',
  gridRows: '1sf',
  width: 'max($overlay-min-width, 30x) max-content 50vw',
  '$overlay-min-width': '30x',
};

interface PickerDialogProps extends Omit<CubeDialogProps, 'children'> {
  children: (isPopover: boolean) => ReactNode;
  heading: ReactNode;
  popoverStyles?: Styles;
  triggerWidth?: number;
}

// Read the presentation selected by DialogTrigger, including its mobile override.
export function PickerDialog({
  children,
  heading,
  popoverStyles,
  triggerWidth,
  ...props
}: PickerDialogProps) {
  const { type } = useDialogContext();
  const isPopover = type === 'popover';
  const content = children(isPopover);

  return (
    <Dialog
      {...props}
      aria-label={isPopover ? props['aria-label'] : undefined}
      isDismissable={!isPopover}
      styles={mergeStyleLayers(
        isPopover ? POPOVER_STYLES : undefined,
        popoverStyles,
      )}
      style={
        isPopover && triggerWidth
          ? { '--overlay-min-width': `${triggerWidth}px` }
          : undefined
      }
    >
      {isPopover ? (
        content
      ) : (
        <>
          <Header>
            <Title>{heading}</Title>
          </Header>
          <Content>{content}</Content>
        </>
      )}
    </Dialog>
  );
}
