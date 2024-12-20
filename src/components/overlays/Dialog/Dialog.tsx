import styled from 'styled-components';
import { useDOMRef } from '@react-spectrum/utils';
import { DismissButton } from 'react-aria';
import { forwardRef, ReactElement } from 'react';
import { useDialog, useMessageFormatter, AriaDialogProps } from 'react-aria';
import { DOMRef } from '@react-types/shared';
import FocusLock from 'react-focus-lock';

import {
  BASE_STYLES,
  BaseProps,
  BaseStyleProps,
  BLOCK_STYLES,
  BlockStyleProps,
  DIMENSION_STYLES,
  DimensionStyleProps,
  extractStyles,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, SlotProvider } from '../../../utils/react';
import { Button } from '../../actions';
import { useOpenTransitionContext } from '../Modal/OpenTransition';
import { CloseIcon } from '../../../icons';

import { useDialogContext } from './context';

const STYLES_LIST = [...BASE_STYLES, ...DIMENSION_STYLES, ...BLOCK_STYLES];

const DialogElement = tasty({
  as: 'section',
  styles: {
    pointerEvents: 'auto',
    position: 'relative',
    display: 'flex',
    placeItems: 'stretch',
    placeContent: 'stretch',
    width: {
      '': '288px @dialog-size 90vw',
      '[data-type="fullscreen"]': '90vw 90vw',
      '[data-type="fullscreenTakeover"]': '100vw 100vw',
      '[data-type="panel"]': '100vw 100vw',
    },
    height: {
      '': 'max 90vh',
      '[data-type="fullscreenTakeover"] | [data-type="panel"]': 'max 100vh',
    },
    gap: 0,
    flow: 'column',
    radius: {
      '': '(@large-radius + 1bw)',
      '[data-type="tray"]': '(@large-radius + 1bw) top',
      '[data-type="fullscreenTakeover"] | [data-type="panel"]': '0r',
    },
    fill: '#white',
    shadow: {
      '': '0 20px 30px #shadow',
      '[data-type="popover"]': '0px 4px 16px #shadow',
    },
    top: {
      '': false,
      '[data-type="modal"]': '((50vh - 50%) / -3)',
    },
    placeSelf: 'stretch',
    '@dialog-heading-padding-v': {
      '': '2x',
      '[data-type="popover"]': '1x',
    },
    '@dialog-content-padding-v': {
      '': '3x',
      '[data-type="popover"]': '2x',
    },
    '@dialog-padding-h': {
      '': '3x',
      '[data-type="popover"]': '2x',
    },
    '@dialog-footer-v': {
      '': '2x',
      '[data-type="popover"]': '1x',
    },
    '@dialog-content-gap': '3x',
  },
});

const StyledFocusLock = styled(FocusLock)`
  display: contents;
`;

const CLOSE_BUTTON_STYLES: Styles = {
  display: 'flex',
  position: 'absolute',
  top: '1x',
  right: '1x',
  width: '5x',
  height: '5x',
  placeContent: 'center',
};

const sizeMap = {
  S: 'small',
  M: 'medium',
  L: 'large',
};
const sizePxMap = {
  small: 360,
  medium: 479,
  large: 798,
};

const intlMessages = {
  'en-US': {
    dismiss: 'Dismiss',
    alert: 'Alert',
  },
};

export interface CubeDialogProps
  extends Omit<BaseProps, 'role'>,
    AriaDialogProps,
    BaseStyleProps,
    BlockStyleProps,
    DimensionStyleProps {
  /** The size of the dialog */
  size?: 'S' | 'M' | 'L' | 'small' | 'medium' | 'large';
  /** Whether the dialog is dismissable */
  isDismissable?: boolean;
  /** Trigger when the dialog is dismissed */
  onDismiss?: (arg?: any) => void;
  /** That you can replace the close icon with */
  closeIcon?: ReactElement;
  closeButtonStyles?: Styles;
  role?: 'dialog' | 'alertdialog';
}

/**
 * Dialogs are windows containing contextual information, tasks, or workflows that appear over the user interface.
 * Depending on the kind of Dialog, further interactions may be blocked until the Dialog is acknowledged.
 */
export const Dialog = forwardRef(function Dialog(
  props: CubeDialogProps,
  ref: DOMRef<HTMLDivElement>,
) {
  const transitionContext = useOpenTransitionContext();

  const isEntered = transitionContext?.transitionState === 'entered';

  return (
    <StyledFocusLock returnFocus disabled={!isEntered}>
      <DialogContent key="content" {...props} ref={ref} />
    </StyledFocusLock>
  );
});

const DialogContent = forwardRef(function DialogContent(
  props: CubeDialogProps,
  ref: DOMRef<HTMLDivElement>,
) {
  let { type = 'modal', ...contextProps } = useDialogContext();

  let {
    qa,
    children,
    size = 'S',
    isDismissable = contextProps.isDismissable,
    onDismiss = contextProps.onClose,
    closeIcon,
    closeButtonStyles,
    ...otherProps
  } = props;

  size = sizeMap[size.toUpperCase()] || size;

  const styles: Styles = extractStyles(otherProps, STYLES_LIST);

  let formatMessage = useMessageFormatter(intlMessages);

  let domRef = useDOMRef(ref);
  let { dialogProps, titleProps } = useDialog(
    mergeProps(contextProps, props),
    domRef,
  );

  // If rendered in a popover or tray there won't be a visible dismiss button,
  // so we render a hidden one for screen readers.
  let dismissButton;
  if (type === 'popover' || type === 'tray') {
    dismissButton = <DismissButton onDismiss={onDismiss} />;
  }

  // let hasHeader = useHasChild('[data-id="Header"]', domRef);
  // let hasFooter = useHasChild('[data-id="Footer"]', domRef);

  let slots = {
    heading: {
      level: 2,
      preset: 'h4',
      ...titleProps,
    },
    content: {
      styles: {
        flexGrow: 1,
        padding: '@dialog-content-padding-v @dialog-padding-h',
        gap: '@dialog-content-gap',
        height: {
          '': 'max (100% - (2 * @dialog-content-padding-v))',
          ':last-child': 'max (100% - @dialog-content-padding-v)',
        },
      },
    },
    header: {
      ellipsis: true,
      styles: {
        display: 'flex',
        flow: 'row',
        gap: '1x',
        placeItems: 'baseline stretch',
        placeContent: 'space-between',
        padding: `@dialog-heading-padding-v ${
          isDismissable ? '(@dialog-padding-h + 4x)' : '@dialog-padding-h'
        } @dialog-heading-padding-v @dialog-padding-h`,
        border: 'bottom',
      },
    },
    footer: {
      styles: {
        display: 'flex',
        gap: '1x',
        flow: 'row',
        placeItems: 'baseline stretch',
        placeContent: 'space-between',
        padding: '@dialog-footer-v @dialog-padding-h',
      },
    },
  };

  return (
    <DialogElement
      ref={domRef}
      data-id="Dialog"
      data-qa={qa || 'Dialog'}
      styles={styles}
      as="section"
      {...dialogProps}
      mods={{ dismissable: isDismissable }}
      style={{ '--dialog-size': `${sizePxMap[size] || 288}px` }}
      data-type={type}
      data-size={size}
    >
      {dismissButton}

      <SlotProvider slots={slots}>
        {isDismissable && (
          <Button
            qa="ModalCloseButton"
            type="neutral"
            styles={CLOSE_BUTTON_STYLES}
            icon={closeIcon || <CloseIcon />}
            label={formatMessage('dismiss')}
            onPress={() => onDismiss && onDismiss()}
          />
        )}
        {children}
      </SlotProvider>
    </DialogElement>
  );
});
