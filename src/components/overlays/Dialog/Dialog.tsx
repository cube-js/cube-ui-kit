import { createFocusManager } from '@react-aria/focus';
import { useDOMRef } from '@react-spectrum/utils';
import { DOMRef } from '@react-types/shared';
import { forwardRef, ReactElement, useEffect, useMemo } from 'react';
import {
  AriaDialogProps,
  DismissButton,
  FocusScope,
  useDialog,
  useMessageFormatter,
} from 'react-aria';

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
  FLOW_STYLES,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, SlotProvider } from '../../../utils/react';
import { ItemButton } from '../../actions';
import { useOpenTransitionContext } from '../Modal/OpenTransition';

import { useDialogContext } from './context';

const STYLES_LIST = [
  ...BASE_STYLES,
  ...DIMENSION_STYLES,
  ...BLOCK_STYLES,
  ...FLOW_STYLES,
];

const DialogElement = tasty({
  as: 'section',
  styles: {
    display: 'flex',
    flow: 'column',
    fill: '#white',
    pointerEvents: 'auto',
    position: {
      '': 'relative',
      'type=panel': 'absolute',
    },
    width: {
      '': '$min-dialog-size $dialog-size (100dvw - 8x)',
      'type=fullscreen': '(100dvw - 8x) (100dvw - 8x)',
      'type=fullscreenTakeover': '100dvw 100dvw',
      'type=panel': 'auto',
    },
    height: {
      '': 'auto (100dvh - 8x)',
      'type=fullscreen': '(100dvh - 8x) (100dvh - 8x)',
      'type=fullscreenTakeover | type=panel': '100dvh 100dvh',
      'type=popover': 'initial initial (50dvh - 5x)',
    },
    gap: 0,
    border: {
      '': false,
      'type=popover': true,
    },
    radius: {
      '': '1cr',
      'type=tray': '1cr top',
      'type=fullscreenTakeover': '0r',
    },
    shadow: {
      '': '$dialog-shadow',
      'type=popover | type=panel': '$card-shadow',
    },
    top: {
      '': false,
      'type=modal': '((50vh - 50%) / -3)',
      'type=panel': 'auto',
    },
    '$dialog-title-padding-v': {
      '': '1.5x',
      'type=popover': '1x',
    },
    '$dialog-content-padding-v': {
      '': '1.5x',
      'type=popover': '1x',
    },
    '$dialog-padding-h': {
      '': '1.5x',
      'type=popover': '1x',
    },
    '$dialog-footer-v': {
      '': '1.5x',
      'type=popover': '1x',
    },
    '$dialog-content-gap': {
      '': '1.5x',
      'type=popover': '1x',
    },
  },
});

const CloseButton = tasty(ItemButton, {
  qa: 'ModalCloseButton',
  type: 'neutral',
  styles: {
    position: 'absolute',
    top: '1x',
    right: '1x',
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

  const shouldContainFocus = isEntered && context.type !== 'panel';

  return (
    // This component traps the focus inside the dialog and restores it on close.
    <FocusScope restoreFocus contain={shouldContainFocus}>
      {content}
    </FocusScope>
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
    size = 'M',
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
          // Priority 1: autofocus input or primary button
          const priorityElement = domRef.current.querySelector(
            'input[data-autofocus], button[type="submit"], button[data-type="primary"]',
          ) as HTMLElement | null;

          if (priorityElement) {
            priorityElement.focus();
          } else {
            // Fallback: focus first tabbable element, or dialog itself
            const focusManager = createFocusManager(domRef);

            if (!focusManager.focusFirst({ tabbable: true })) {
              domRef.current.focus();
            }
          }
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
        padding: '$dialog-content-padding-v $dialog-padding-h',
        gap: '$dialog-content-gap',
        height: {
          '': 'max (100% - (2 * $dialog-content-padding-v))',
          ':last-child': 'max (100% - $dialog-content-padding-v)',
        },
      },
    },
    header: {
      ellipsis: true,
      styles: {
        display: 'flex',
        flow: 'row',
        gap: '1x',
        placeItems: 'center stretch',
        placeContent: 'space-between',
        padding: `$dialog-title-padding-v ${
          isDismissable ? '($dialog-padding-h + 4x)' : '$dialog-padding-h'
        } $dialog-title-padding-v $dialog-padding-h`,
        border: 'bottom',
      },
    },
    footer: {
      styles: {
        display: 'flex',
        gap: '1x',
        flow: 'row-reverse',
        placeItems: 'baseline stretch',
        placeContent: 'space-between',
        padding: '$dialog-footer-v $dialog-padding-h',
      },
    },
    buttonGroup: {
      styles: {
        flow: 'row-reverse',
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
      style={{ '--dialog-size': `${sizePxMap[size] || sizePxMap.small}px` }}
      data-type={type}
      data-size={size}
    >
      {dismissButton}

      <SlotProvider slots={slots}>
        {isDismissable && (
          <CloseButton
            icon={closeIcon || <CloseIcon size={20} />}
            label={formatMessage('dismiss')}
            onPress={() => onDismiss && onDismiss()}
          />
        )}
        {children}
      </SlotProvider>
    </DialogElement>
  );
});
