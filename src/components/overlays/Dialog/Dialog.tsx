import { createFocusManager, getFocusableTreeWalker } from '@react-aria/focus';
import { focusSafely, getInteractionModality } from '@react-aria/interactions';
import {
  focusWithoutScrolling,
  isFocusable,
  runAfterTransition,
  useObjectRef,
} from '@react-aria/utils';
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
import {
  FocusEvent,
  forwardRef,
  ReactElement,
  Ref,
  useEffect,
  useRef,
} from 'react';
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

import { trapsFocus, useDialogContext } from './context';
import { useContentOverflow } from './use-content-overflow';
import { useRetainedDialogFocus } from './use-retained-dialog-focus';

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
    // The widest the dialog gets, also under a `width`. A tray is held by its
    // shell, whose own `styles` widen it; a takeover and a panel may span the
    // viewport.
    '$dialog-width-limit': {
      '': '$dialog-max-size',
      'type=tray': '100%',
      'type=fullscreenTakeover | type=panel': '100dvw',
    },
    width: {
      '': '$min-dialog-size $dialog-size $dialog-width-limit',
      'type=fullscreen': '$dialog-max-size $dialog-max-size',
      'type=fullscreenTakeover': '100dvw 100dvw',
      'type=panel': 'auto',
      // A `width` is the preferred width in `$dialog-size`: it keeps the
      // limit, and replaces the floor.
      'custom-width': 'initial $dialog-size $dialog-width-limit',
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
  extends
    Omit<BaseProps, 'role'>,
    AriaDialogProps,
    BaseStyleProps,
    BlockStyleProps,
    Omit<DimensionStyleProps, 'width'> {
  /**
   * The dialog's preferred width, one value (`520px`, `65x`, `600`). It keeps
   * the type's maximum, so the dialog still fits a phone, and replaces
   * `$min-dialog-size`. To clamp the width yourself, set `styles.width`.
   */
  width?: string | number;
  /** The size of the dialog */
  size?: 'S' | 'M' | 'L' | 'small' | 'medium' | 'large';
  /**
   * Whether the dialog shows its close button. Defaults to its DialogTrigger's
   * or DialogContainer's `isDismissable`, except in a popover.
   */
  isDismissable?: boolean;
  /** Trigger when the dialog is dismissed */
  onDismiss?: (arg?: any) => void;
  /** That you can replace the close icon with */
  closeIcon?: ReactElement;
  closeButtonStyles?: Styles;
  role?: 'dialog' | 'alertdialog';
}

/**
 * The control a dialog focuses when it opens: the last one marked
 * `data-autofocus` that can take focus, as kit controls mark themselves for
 * `autoFocus` (the last of several takes focus as they mount), or the first
 * control of a marked field (a date field's first segment). Otherwise a
 * submit or primary button, which in an alert dialog is never a destructive
 * (`danger`) one: a reflexive Enter would run it.
 */
function findPriorityFocusElement(dialog: HTMLElement) {
  const marked = dialog.querySelectorAll<HTMLElement>('[data-autofocus]');

  for (const element of Array.from(marked).reverse()) {
    const target = isFocusable(element)
      ? element
      : getFocusableTreeWalker(element, { tabbable: true }).nextNode();

    if (target) return target as HTMLElement;
  }

  const button =
    dialog.getAttribute('role') === 'alertdialog'
      ? 'button:not([data-theme="danger"])'
      : 'button';

  return dialog.querySelector<HTMLElement>(
    `${button}[type="submit"], ${button}[data-type="primary"]`,
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

  const shouldContainFocus = isShown && !!context.isOpen && trapsFocus(context);

  return (
    // This component traps the focus inside the dialog and restores it when
    // it unmounts (a retained dialog never does, so `DialogContent` moves
    // focus for that one). The restore is the one that matters for popover-type dialogs
    // — `DialogTrigger`'s own restore is a no-op there — so
    // `shouldRestoreFocus` has to reach it. Containment is unaffected either way.
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
    // A popover shows a close button only when its `Dialog` asks for one: its
    // trigger's `isDismissable` decides whether an outside press closes it.
    isDismissable = type === 'popover' ? undefined : contextProps.isDismissable,
    onDismiss = contextProps.onClose,
    closeIcon,
    closeButtonStyles,
    width,
    tokens,
    style,
    ...otherProps
  } = props;

  size = sizeMap[size.toUpperCase()] || size;

  const styles: Styles = extractStyles(otherProps, STYLES_LIST);

  const { t } = useI18n();

  let domRef = useObjectRef(ref);

  // Whether focus is in the dialog or in anything opened from it, portals
  // included: React focus events bubble through the component tree.
  const isFocusInTreeRef = useRef(false);
  const isRetained = useRetainedDialogFocus(domRef, isFocusInTreeRef);
  const isTrapping = trapsFocus({ ...contextProps, type });

  // Set while the dialog refocuses itself, so the blur in between does not
  // reach overlays that close when focus leaves them.
  const isRefocusingRef = useRef(false);

  // When the dialog mounted: `useDialog` refocuses it half a second later.
  const mountedAtRef = useRef(0);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

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
    // The pending timer: this one, then the refocus it may start.
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isClosed = false;

    if (contextProps.isOpen) {
      timer = setTimeout(() => {
        if (!domRef.current) return;

        // `useDialog` focuses the dialog itself when it mounts, without
        // scrolling, unless focus is already inside. A retained dialog opens
        // without remounting, so do the same here: the rules below then run as
        // for a fresh dialog, and kept content keeps its scroll.
        if (isRetained && !domRef.current.contains(document.activeElement)) {
          focusSafely(domRef.current);

          // As `useDialog` does next: VoiceOver on iOS announces a dialog only
          // once it has rendered, so blur and refocus it half a second later
          // if focus is still on it or lost to `<body>`. Unless the refocus
          // `useDialog` set up when the dialog mounted is still to come.
          if (Date.now() - mountedAtRef.current >= 500) {
            timer = setTimeout(() => {
              const dialog = domRef.current;
              const activeElement = document.activeElement;

              if (
                !dialog ||
                (activeElement !== dialog && activeElement !== document.body)
              ) {
                return;
              }

              isRefocusingRef.current = true;
              dialog.blur();
              focusSafely(dialog);
              isRefocusingRef.current = false;
            }, 500);
          }
        }

        const activeElement = document.activeElement;
        const isFocusOutsideDialog = !domRef.current.contains(activeElement);
        const isFocusOnDialogShell = activeElement === domRef.current;

        // Priority 1: an autofocused control, or a submit or primary button
        const priorityElement = findPriorityFocusElement(domRef.current);

        if (priorityElement && (isFocusOutsideDialog || isFocusOnDialogShell)) {
          priorityElement.focus();
          return;
        }

        if (isFocusOutsideDialog && getInteractionModality() === 'virtual') {
          // A screen reader's cursor: the dialog itself takes focus once the
          // open transition ends, as `focusSafely` does it. Then also when
          // something moved focus meanwhile, as a closing menu returns it to
          // its trigger, unless a dialog that leaves the page usable lost it
          // to a control there.
          runAfterTransition(() => {
            const dialog = domRef.current;
            const focused = document.activeElement;

            if (
              isClosed ||
              !dialog ||
              dialog.contains(focused) ||
              (!isTrapping &&
                focused !== document.body &&
                focused !== activeElement)
            ) {
              return;
            }

            focusWithoutScrolling(dialog);
          });
        } else if (isFocusOutsideDialog) {
          // Fallback: focus first tabbable element, or dialog itself
          const focusManager = createFocusManager(domRef);

          if (!focusManager.focusFirst({ tabbable: true })) {
            domRef.current.focus();
          }
        }
      });
    }

    return () => {
      isClosed = true;
      clearTimeout(timer);
    };
  }, [contextProps.isOpen, isRetained, isTrapping]);

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
      // `null` rather than `undefined` when there is none: slots reach nested
      // slot providers, and `undefined` does not override, so a dialog opened
      // inside an alert dialog would repeat the alert's message id.
      id: contentProps.id ?? null,
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
      {...mergeProps(dialogProps, {
        onFocus() {
          isFocusInTreeRef.current = true;
        },
        onBlur(event: FocusEvent) {
          isFocusInTreeRef.current = false;

          if (isRefocusingRef.current) event.stopPropagation();
        },
      })}
      mods={{ dismissable: isDismissable, 'custom-width': width != null }}
      tokens={{
        '$dialog-size':
          width == null
            ? `${sizePxMap[size] || sizePxMap.small}px`
            : typeof width === 'number'
              ? `${width}px`
              : width,
        ...tokens,
      }}
      // oxlint-disable-next-line react/forbid-component-props -- forwards the consumer's public `style` prop
      style={style}
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
