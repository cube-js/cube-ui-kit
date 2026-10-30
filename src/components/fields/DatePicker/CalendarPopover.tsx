import { getFocusableTreeWalker } from '@react-aria/focus';
import { useControlledState } from '@react-stately/utils';
import { FocusableRefValue } from '@react-types/shared';
import { tasty } from '@tenphi/tasty';
import {
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  RefObject,
  useId,
  useRef,
  useState,
} from 'react';
import {
  DismissButton,
  FocusScope,
  Placement,
  useOverlayPosition,
} from 'react-aria';

import { usePopoverSync } from '../../../utils/react/usePopoverSync';
import { Popover } from '../../overlays/Modal/Popover';

// Keys that change a segment's value: typing goes through any one-character
// key, the rest are the spin and clear keys.
const EDIT_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  'Backspace',
  'Delete',
]);

const CalendarPopoverElement = tasty({
  qa: 'CalendarPopover',
  role: 'dialog',
  styles: {
    display: 'flex',
    flow: 'column',
    fill: '#surface',
    border: true,
    radius: '1cr',
    shadow: '$shadow',
    outline: 0,
    width: 'max-content',
    height: 'initial initial (50dvh - 5x)',
    overflow: 'auto',
  },
});

export interface FieldCalendarOptions {
  /** The field the calendar opens from. */
  fieldRef: RefObject<HTMLElement | null>;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * A calendar that opens from its date field instead of a button: a press in
 * the field, an edit of a date, or Alt+Down, which also moves focus into the
 * calendar. Tabbing into the field doesn't open it. While the dates are typed
 * it stays non-modal, and focus stays in the field.
 */
export function useFieldCalendar(options: FieldCalendarOptions) {
  let { fieldRef, isDisabled, isReadOnly } = options;
  let [isOpen, setOpen] = useControlledState(
    options.isOpen,
    options.defaultOpen ?? false,
    options.onOpenChange,
  );
  // Opened with Alt+Down, the calendar takes focus as it mounts.
  let [shouldFocusCalendar, setShouldFocusCalendar] = useState(false);
  let popoverRef = useRef<HTMLDivElement>(null);
  let calendarRef = useRef<FocusableRefValue<HTMLElement>>(null);
  // The segment focus goes back to when it leaves the calendar.
  let segmentRef = useRef<HTMLElement | null>(null);
  let canOpen = !isDisabled && !isReadOnly;

  let isInField = (target: EventTarget | null) =>
    target instanceof Node && !!fieldRef.current?.contains(target);

  let open = (focusCalendar: boolean) => {
    if (!canOpen) return;

    if (focusCalendar && isOpen) calendarRef.current?.focus();

    setShouldFocusCalendar(focusCalendar);
    setOpen(true);
  };

  let close = () => {
    // Before the calendar unmounts and drops focus on the page.
    if (popoverRef.current?.contains(document.activeElement)) {
      let segment = segmentRef.current?.isConnected
        ? segmentRef.current
        : fieldRef.current?.querySelector<HTMLElement>('[role="spinbutton"]');

      segment?.focus();
    }

    setShouldFocusCalendar(false);
    setOpen(false);
  };

  let fieldProps: HTMLAttributes<HTMLElement> = {
    onFocus(e: FocusEvent) {
      if (isInField(e.target)) segmentRef.current = e.target as HTMLElement;
    },
    // Capture, since each date's own press handling stops the click there.
    onClickCapture(e: MouseEvent) {
      if (isInField(e.target)) open(false);
    },
    // Capture, so the keys reach this before the segments and React Aria's
    // own Alt+Down handling take them.
    onKeyDownCapture(e: KeyboardEvent) {
      if (!isInField(e.target)) return;

      if (e.key === 'Escape') {
        if (!isOpen) return;

        // A surrounding dialog stays open.
        e.preventDefault();
        e.stopPropagation();
        close();

        return;
      }

      if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        e.stopPropagation();
        open(true);

        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key.length === 1 || EDIT_KEYS.has(e.key)) open(false);
    },
    onBlur(e: FocusEvent) {
      if (!isOpen || !isInField(e.target)) return;

      let next = e.relatedTarget;

      if (
        next instanceof Node &&
        (fieldRef.current?.contains(next) || popoverRef.current?.contains(next))
      ) {
        return;
      }

      close();
    },
  };

  return {
    isOpen,
    shouldFocusCalendar,
    close,
    fieldProps,
    popoverRef,
    calendarRef,
  };
}

export interface CalendarPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  /** The field the calendar opens from: a press there keeps it open. */
  fieldRef: RefObject<HTMLElement | null>;
  popoverRef: RefObject<HTMLDivElement | null>;
  /** What the popover is positioned against. */
  anchorRef: RefObject<HTMLElement | null>;
  placement: Placement;
  shouldFlip?: boolean;
  /** React Aria's dialog props: the id that keeps the field focused while focus is in here, and its label. */
  dialogProps: HTMLAttributes<HTMLElement>;
  children: ReactNode;
}

/** The non-modal popover `useFieldCalendar` opens. */
export function CalendarPopover(props: CalendarPopoverProps) {
  let {
    isOpen,
    onClose: close,
    fieldRef,
    popoverRef,
    anchorRef,
    placement,
    shouldFlip,
    dialogProps,
    children,
  } = props;
  let id = useId();

  usePopoverSync({
    menuId: id,
    isOpen,
    onClose: close,
    triggerRef: fieldRef,
    containerRef: popoverRef,
    // The calendar's own buttons page through months.
    dismissOnInnerButtonPress: false,
  });

  let { overlayProps: positionProps, placement: actualPlacement } =
    useOverlayPosition({
      targetRef: anchorRef,
      overlayRef: popoverRef,
      placement,
      shouldFlip,
      offset: 8,
      isOpen,
      onClose: close,
    });

  let shouldCloseOnInteractOutside = (el: Element) => {
    // While it animates out, a press goes through to whatever it lands on.
    if (!isOpen) return false;

    // The field opens the calendar, so a press there keeps it open.
    if (fieldRef.current?.contains(el)) return false;
    if (el.closest('[data-popover-keep]')) return false;
    // Another popover's trigger opens its popover, which closes this one.
    if (el.closest('[data-popover-trigger]')) return false;

    // A button's own press runs first, then the calendar closes.
    if (el.closest('[data-popover-dismiss]')) {
      setTimeout(close, 0);

      return false;
    }

    return true;
  };

  // Tab off either end of the calendar goes back to the field.
  let onKeyDown = (e: KeyboardEvent) => {
    let popover = popoverRef.current;

    if (e.key !== 'Tab' || !popover) return;

    let walker = getFocusableTreeWalker(popover, { tabbable: true });
    let first = walker.firstChild();

    walker.currentNode = popover;

    let last = walker.lastChild();

    if (document.activeElement === (e.shiftKey ? first : last)) {
      e.preventDefault();
      close();
    }
  };

  return (
    <Popover
      ref={popoverRef}
      isNonModal
      shouldCloseOnBlur
      isOpen={isOpen}
      // oxlint-disable-next-line tasty/no-style-prop -- React Aria's overlay positioning computes these coordinates
      style={positionProps.style}
      placement={actualPlacement ?? undefined}
      shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
      onClose={close}
    >
      <FocusScope>
        <CalendarPopoverElement {...dialogProps} onKeyDown={onKeyDown}>
          {children}
          <DismissButton onDismiss={close} />
        </CalendarPopoverElement>
      </FocusScope>
    </Popover>
  );
}
