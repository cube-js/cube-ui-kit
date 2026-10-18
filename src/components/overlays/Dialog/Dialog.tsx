import { createFocusManager } from '@react-aria/focus';
import { useObjectRef } from '@react-aria/utils';
import {
  BASE_STYLES,
  BaseProps,
  BaseStyleProps,
  BLOCK_STYLES,
  BlockStyleProps,
  DIMENSION_STYLES,
  DimensionStyleProps,
  FLOW_STYLES,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { forwardRef, ReactElement, Ref, useEffect } from 'react';
import {
  AriaDialogProps,
  DismissButton,
  FocusScope,
  useDialog,
} from 'react-aria';

import { useI18n } from '../../../i18n';
import { CloseIcon } from '../../../icons/CloseIcon';
import { mergeProps, SlotProvider } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { ItemButton } from '../../actions/ItemButton/ItemButton';
import { useOpenTransitionContext } from '../Modal/OpenTransitionContext';

import { useDialogContext } from './context';
import { useContentOverflow } from './use-content-overflow';

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
    fill: '#surface',
    pointerEvents: 'auto',
    outline: 0,
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
      'type=popover | type=panel': '$shadow',
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

    // A `Form` placed directly here (`Dialog > Form > Content + Footer`) lays
    // itself out as this flex column — see `FormElement`. It is the form's own
    // state rather than a rule here, so the form's `styles` still win.
  },
});

const CloseButton = tasty(ItemButton, {
  qa: 'ModalCloseButton',
  type: 'clear',
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
 * The control a dialog focuses when it opens: an input marked
 * `data-autofocus`, or a submit or primary button. In an alert dialog never a
 * destructive (`danger`) button, which a reflexive Enter would run.
 */
function findPriorityFocusElement(dialog: HTMLElement) {
  const button =
    dialog.getAttribute('role') === 'alertdialog'
      ? 'button:not([data-theme="danger"])'
      : 'button';

  return dialog.querySelector<HTMLElement>(
    `input[data-autofocus], ${button}[type="submit"], ${button}[data-type="primary"]`,
  );
}

/**
 * Dialogs are windows containing contextual information, tasks, or workflows that appear over the user interface.
 * Depending on the kind of Dialog, further interactions may be blocked until the Dialog is acknowledged.
 */
export const Dialog = forwardRef(function Dialog(
  props: CubeDialogProps,
  ref: Ref<HTMLDivElement>,
) {
  const transitionState = useOpenTransitionContext()?.transitionState;

  // From the first frame of the enter transition, not only once it has
  // ended: a Tab pressed while the dialog animates in would otherwise land on
  // the page behind it, and nothing would pull it back. Released as soon as
  // the dialog closes, so focus can return to the trigger during the exit.
  const isShown = transitionState === 'enter' || transitionState === 'entered';

  const context = useDialogContext();

  const content = <DialogContent key="content" {...props} ref={ref} />;

  const shouldContainFocus =
    isShown && !!context.isOpen && context.type !== 'panel';

  return (
    // This component traps the focus inside the dialog and restores it on
    // close. The restore is the one that matters for popover-type dialogs —
    // `DialogTrigger`'s own restore is a no-op there — so `shouldRestoreFocus`
    // has to reach it. Containment is unaffected either way.
    <FocusScope
      restoreFocus={context.shouldRestoreFocus ?? true}
      contain={shouldContainFocus}
    >
      {content}
    </FocusScope>
  );
});

const DialogContent = forwardRef(function DialogContent(
  props: CubeDialogProps,
  ref: Ref<HTMLDivElement>,
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
    style,
    ...otherProps
  } = props;

  size = sizeMap[size.toUpperCase()] || size;

  const styles: Styles = extractStyles(otherProps, STYLES_LIST);

  const { t } = useI18n();

  let domRef = useObjectRef(ref);
  // `contentProps` carries an id only for `role="alertdialog"` without an
  // explicit `aria-describedby`: an alert is described by its message, while a
  // plain dialog links nothing, so opening a form does not read it aloud.
  let { dialogProps, titleProps, contentProps } = useDialog(
    mergeProps(contextProps, props),
    domRef,
  );

  // If rendered in a popover or tray there won't be a visible dismiss button,
  // so we render a hidden one for screen readers.
  let dismissButton;
  if (type === 'popover' || type === 'tray') {
    dismissButton = <DismissButton onDismiss={onDismiss} />;
  }

  // Focus the first focusable element in the dialog when it opens.
  //
  // We also re-run the priority focus logic when the dialog <section>
  // itself is the active element. This recovers from a race that occurs
  // when a popover-based component (FilterPicker, Picker, Select, …) opens
  // inside another contained Dialog: React's native `autoFocus` on the
  // inner control fires during the mutation phase, before the popover's
  // FocusScope registers in react-aria's focus-scope tree, so the outer
  // FocusScope yanks focus back. useDialog then defaults focus to the
  // dialog <section>; without re-promoting it here, the priority element
  // (e.g. the search input) is never focused.
  useEffect(() => {
    if (contextProps.isOpen) {
      setTimeout(() => {
        if (!domRef.current) return;

        const activeElement = document.activeElement;
        const isFocusOutsideDialog = !domRef.current.contains(activeElement);
        const isFocusOnDialogShell = activeElement === domRef.current;

        // Priority 1: autofocus input or primary button
        const priorityElement = findPriorityFocusElement(domRef.current);

        if (priorityElement && (isFocusOutsideDialog || isFocusOnDialogShell)) {
          priorityElement.focus();
          return;
        }

        if (isFocusOutsideDialog) {
          // Fallback: focus first tabbable element, or dialog itself
          const focusManager = createFocusManager(domRef);

          if (!focusManager.focusFirst({ tabbable: true })) {
            domRef.current.focus();
          }
        }
      });
    }
  }, [contextProps.isOpen]);

  // let hasHeader = useHasChild('[data-id="Header"]', domRef);
  // let hasFooter = useHasChild('[data-id="Footer"]', domRef);

  const contentOverflows = useContentOverflow(domRef);

  let slots = {
    title: {
      level: 2,
      preset: 'h4',
      ...titleProps,
    },
    content: {
      ...contentProps,
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
      mods: { 'content-overflow': contentOverflows },
      styles: {
        display: 'flex',
        gap: '1x',
        flow: 'row-reverse',
        placeItems: 'baseline stretch',
        placeContent: 'space-between',
        padding: '$dialog-footer-v $dialog-padding-h',
        // A line only while the body scrolls: the footer then sits over
        // content that carries on beneath it, and the line is what says so.
        // Under a body that fits, the actions simply end it and a rule there
        // reads as clutter.
        border: {
          '': false,
          'content-overflow': 'top',
        },
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
      style={{
        '--dialog-size': `${sizePxMap[size] || sizePxMap.small}px`,
        ...style,
      }}
      data-type={type}
      data-size={size}
    >
      {dismissButton}

      <SlotProvider slots={slots}>
        {isDismissable && (
          <CloseButton
            icon={closeIcon || <CloseIcon size={20} />}
            aria-label={t('dialog.dismiss', 'Dismiss')}
            onPress={() => onDismiss && onDismiss()}
          />
        )}
        {children}
      </SlotProvider>
    </DialogElement>
  );
});
