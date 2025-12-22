import { ForwardedRef, forwardRef, ReactNode, useCallback } from 'react';

import { CloseIcon } from '../../../icons/CloseIcon';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  tasty,
} from '../../../tasty';
import { ItemAction } from '../../actions/ItemAction';
import { useDialogContext } from '../../overlays/Dialog/context';
import { CubeItemProps, Item } from '../Item/Item';

import { useLayoutPanelContext } from './LayoutContext';

const PanelHeaderElement = tasty(Item, {
  qa: 'PanelHeader',
  shape: 'sharp',
  type: 'header',
  styles: {
    border: 'bottom',
    boxSizing: 'content-box',

    '$inline-padding': '($content-padding, 1x)',
  },
});

export interface CubeLayoutPanelHeaderProps
  extends Omit<BaseProps, 'theme'>,
    ContainerStyleProps,
    CubeItemProps {
  /** Panel title */
  title?: ReactNode;
  /** Title heading level (affects semantics, not visual) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Show close button */
  isClosable?: boolean;
  /** Close button click handler */
  onClose?: () => void;
}

function LayoutPanelHeader(
  props: CubeLayoutPanelHeaderProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    title,
    level = 3,
    isClosable,
    onClose,
    actions,
    children,
    ...otherProps
  } = props;

  // Extract container styles
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  // Access dialog context if in dialog mode
  const dialogContext = useDialogContext();
  // Access panel context to update panel open state
  const panelContext = useLayoutPanelContext();

  // Close handler that works for both panel and dialog modes
  const handleClose = useCallback(() => {
    // Call user-provided onClose callback
    onClose?.();
    // Update panel's internal open state
    panelContext?.onOpenChange(false);
    // If in dialog mode, also close the dialog
    dialogContext?.onClose?.();
  }, [onClose, panelContext, dialogContext]);

  const closeAction = isClosable ? (
    <ItemAction
      icon={<CloseIcon />}
      aria-label="Close panel"
      onPress={handleClose}
    />
  ) : null;

  const finalActions = actions ?? closeAction;

  return (
    <PanelHeaderElement
      ref={ref}
      level={level}
      size="large"
      actions={finalActions}
      styles={styles}
      {...otherProps}
    >
      {title ?? children}
    </PanelHeaderElement>
  );
}

const _LayoutPanelHeader = forwardRef(LayoutPanelHeader);

_LayoutPanelHeader.displayName = 'Layout.PanelHeader';

export { _LayoutPanelHeader as LayoutPanelHeader };
