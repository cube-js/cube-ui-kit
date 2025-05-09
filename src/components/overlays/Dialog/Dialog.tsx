import { useDOMRef } from '@react-spectrum/utils';
import { DOMRef } from '@react-types/shared';
import { forwardRef, ReactElement, useEffect, useMemo } from 'react';
import {
  AriaDialogProps,
  DismissButton,
  useDialog,
  useMessageFormatter,
} from 'react-aria';
import FocusLock from 'react-focus-lock';

import { CloseIcon } from '../../../icons';
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

import { useDialogContext } from './context';

const STYLES_LIST = [...BASE_STYLES, ...DIMENSION_STYLES, ...BLOCK_STYLES];

const DialogElement = tasty({
  as: 'section',
  styles: {
    fill: '#white',
    pointerEvents: 'auto',
    position: {
      '': 'relative',
      '[data-type="panel"]': 'absolute',
    },
    padding: {
      '': '1ow',
      '[data-type="popover"]': 0,
    },
    width: {
      '': '@min-dialog-size @dialog-size 90vw',
      '[data-type="fullscreen"]': '90vw 90vw',
      '[data-type="fullscreenTakeover"]': '100vw 100vw',
      '[data-type="panel"]': 'auto',
    },
    height: {
      '': 'auto 90vh',
      '[data-type="fullscreen"]': '90vh 90vh',
      '[data-type="fullscreenTakeover"] | [data-type="panel"]': '100vh 100vh',
      '[data-type="panel"]': 'auto',
    },
    gap: 0,
    radius: {
      '': '1cr',
      '[data-type="tray"]': '1cr top',
      '[data-type="fullscreenTakeover"]': '0r',
    },
    shadow: {
      '': '0 2x 4x #shadow',
      '[data-type="popover"] | [data-type="panel"]': '0px .5x 2x #shadow',
    },
    top: {
      '': false,
      '[data-type="modal"]': '((50vh - 50%) / -3)',
      '[data-type="panel"]': 'auto',
    },
    '@dialog-title-padding-v': {
      '': '2x',
      '[data-type="popover"]': '1x',
    },
    '@dialog-content-padding-v': {
      '': '2x',
      '[data-type="popover"]': '2x',
    },
    '@dialog-padding-h': {
      '': '2x',
      '[data-type="popover"]': '2x',
    },
    '@dialog-footer-v': {
      '': '2x',
      '[data-type="popover"]': '1x',
    },
    '@dialog-content-gap': '2x',
  },
});

const CloseButton = tasty(Button, {
  qa: 'ModalCloseButton',
  type: 'neutral',
  styles: {
    display: 'flex',
    position: 'absolute',
    top: '1x',
    right: '1x',
    placeContent: 'center',
    fill: {
      '': '#dark.0',
      hovered: '#dark.04',
      pressed: '#dark.05',
    },
    color: {
      '': '#dark-02',
      hovered: '#dark-02',
      pressed: '#purple',
    },
  },
});

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

  const context = useDialogContext();

  const content = useMemo(() => {
    return <DialogContent key="content" {...props} ref={ref} />;
  }, [props, ref]);

  return (
    // This component is actually traps the focus inside the dialog.
    <FocusLock
      returnFocus
      autoFocus={false}
      disabled={!isEntered || context.type === 'panel'}
    >
      {content}
    </FocusLock>
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

  // Focus the first focusable element in the dialog when it opens
  useEffect(() => {
    if (contextProps.isOpen) {
      setTimeout(() => {
        if (
          domRef.current &&
          !domRef.current.contains(document.activeElement)
        ) {
          (
            domRef.current.querySelector(
              'input[data-autofocus], [data-qa="ButtonGroup"] button[data-type="primary"]',
            ) as HTMLButtonElement
          )?.focus();
        }
      });
    }
  }, [contextProps.isOpen]);

  // let hasHeader = useHasChild('[data-id="Header"]', domRef);
  // let hasFooter = useHasChild('[data-id="Footer"]', domRef);

  let slots = {
    title: {
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
        padding: `@dialog-title-padding-v ${
          isDismissable ? '(@dialog-padding-h + 4x)' : '@dialog-padding-h'
        } @dialog-title-padding-v @dialog-padding-h`,
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
      tabIndex={undefined}
      mods={{ dismissable: isDismissable }}
      style={{ '--dialog-size': `${sizePxMap[size] || sizePxMap.small}px` }}
      data-type={type}
      data-size={size}
    >
      {dismissButton}

      <SlotProvider slots={slots}>
        {isDismissable && (
          <CloseButton
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
