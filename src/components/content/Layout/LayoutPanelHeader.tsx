import { ForwardedRef, forwardRef, ReactNode, useCallback } from 'react';

import { CloseIcon } from '../../../icons/CloseIcon';
import { BaseProps, ContainerStyleProps, tasty } from '../../../tasty';
import { ItemAction } from '../../actions/ItemAction';
import { useDialogContext } from '../../overlays/Dialog/context';
import { Item } from '../Item/Item';

const PanelHeaderElement = tasty(Item, {
  qa: 'PanelHeader',
  styles: {
    border: 'bottom',
    radius: 0,
  },
});

export interface CubeLayoutPanelHeaderProps
  extends BaseProps,
    ContainerStyleProps {
  /** Panel title */
  title?: ReactNode;
  /** Title heading level (affects semantics, not visual) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Show close button */
  isClosable?: boolean;
  /** Close button click handler */
  onClose?: () => void;
  /** Custom actions to display (overrides default close button) */
  actions?: ReactNode;
  children?: ReactNode;
}

function LayoutPanelHeader(
  props: CubeLayoutPanelHeaderProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    title,
    level = 2,
    isClosable,
    onClose,
    actions,
    children,
    ...otherProps
  } = props;

  // Access dialog context if in dialog mode
  const dialogContext = useDialogContext();

  // Close handler that works for both panel and dialog modes
  const handleClose = useCallback(() => {
    onClose?.();
    // If in dialog mode, also close the dialog
    dialogContext?.onClose?.();
  }, [onClose, dialogContext]);

  const closeAction = isClosable ? (
    <ItemAction
      icon={<CloseIcon />}
      aria-label="Close panel"
      onPress={handleClose}
    />
  ) : null;

  const finalActions = actions ?? closeAction;

  // Use heading tag based on level for semantics
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <PanelHeaderElement
      ref={ref}
      as={Tag}
      size="large"
      actions={finalActions}
      {...otherProps}
    >
      {title ?? children}
    </PanelHeaderElement>
  );
}

const _LayoutPanelHeader = forwardRef(LayoutPanelHeader);

_LayoutPanelHeader.displayName = 'Layout.PanelHeader';

export { _LayoutPanelHeader as LayoutPanelHeader };
