import { Button } from '../../actions';
import { useDOMRef } from '@react-spectrum/utils';
import { useDialogContext } from './context';
import { DismissButton } from '@react-aria/overlays';
import { FocusScope } from '@react-aria/focus';
import { forwardRef, ReactNode } from 'react';
import { useDialog } from '@react-aria/dialog';
import { useMessageFormatter } from '@react-aria/i18n';
import { Base } from '../../Base';
import { CloseOutlined } from '@ant-design/icons';
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
  useContextStyles,
} from '../../../tasty';
import { mergeProps, SlotProvider } from '../../../utils/react';
import type { AriaDialogProps } from '@react-types/dialog';
import { DOMRef } from '@react-types/shared';

const STYLES_LIST = [...BASE_STYLES, ...DIMENSION_STYLES, ...BLOCK_STYLES];

const DEFAULT_STYLES: Styles = {
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
    '': '2r',
    '[data-type="tray"]': '2r top',
    '[data-type="fullscreenTakeover"] | [data-type="panel"]': '0r',
  },
  fill: '#white',
  shadow: {
    '': '0 20px 30px #shadow',
    '[data-type="popover"]': '0px 4px 16px #shadow',
  },
  transform: {
    '': false,
    '[data-type="modal"]': 'translate(0, ((50vh - 50%) / -3))',
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
};

const CLOSE_BUTTON_STYLES: Styles = {
  position: 'absolute',
  top: '1x',
  right: '1x',
  width: '5x',
  height: '5x',
  display: 'flex',
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
  closeIcon?: ReactNode;
}

/**
 * Dialogs are windows containing contextual information, tasks, or workflows that appear over the user interface.
 * Depending on the kind of Dialog, further interactions may be blocked until the Dialog is acknowledged.
 */
export const Dialog = forwardRef(function Dialog(
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
    ...otherProps
  } = props;

  size = sizeMap[size.toUpperCase()] || size;

  const styles: Styles = {
    ...DEFAULT_STYLES,
    ...useContextStyles('Dialog', props),
    ...extractStyles(otherProps, STYLES_LIST),
    '@dialog-size': `${sizePxMap[size] || 288}px`,
  };

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
    <FocusScope contain restoreFocus>
      <Base
        data-id="Dialog"
        data-qa={qa || 'Dialog'}
        styles={styles}
        as="section"
        {...dialogProps}
        mods={{
          dismissable: isDismissable,
        }}
        data-type={type}
        data-size={size}
        ref={domRef}
      >
        {dismissButton}

        <SlotProvider slots={slots}>
          {isDismissable && (
            <Button
              qa="ModalCloseButton"
              type="neutral"
              styles={CLOSE_BUTTON_STYLES}
              icon={closeIcon || <CloseOutlined />}
              label={formatMessage('dismiss')}
              onPress={() => onDismiss && onDismiss()}
            />
          )}
          {children}
        </SlotProvider>
      </Base>
    </FocusScope>
  );
});
