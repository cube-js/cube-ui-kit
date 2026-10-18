import { RefObject, useEffect, useEffectEvent } from 'react';
import { OverlayTriggerState } from 'react-stately';

import { useEventBus } from '../../../utils/react/useEventBus';

/**
 * Emitted, besides `popover:open`, when a modal, tray, fullscreen or panel
 * `DialogTrigger` opens. A popover that is not dismissable ignores
 * `popover:open`, but such a dialog takes over the page: left open, the popover
 * would sit over it, hidden from screen readers by it, and take its focus
 * restore. So it closes on this.
 */
const DIALOG_OPEN_EVENT = 'dialog:open';

interface DialogOpenPayload {
  triggerEl: Element | null;
}

interface DialogOpenSyncOptions {
  /** Emits `dialog:open` on opening: a dialog that is not a popover. */
  emits: boolean;
  /** Closes on another dialog's `dialog:open`: a popover that is not dismissable. */
  closes: boolean;
  state: OverlayTriggerState;
  triggerRef: RefObject<HTMLElement | null>;
  overlayRef: RefObject<HTMLElement | null>;
}

/**
 * For `DialogTrigger`: a modal, tray, fullscreen or panel dialog announces that
 * it opened (`emits`), and a popover that is not dismissable closes when one
 * does (`closes`), unless it opened from inside the popover.
 */
export function useDialogOpenSync(options: DialogOpenSyncOptions) {
  const { emits, closes, state, triggerRef, overlayRef } = options;
  const { emit, on } = useEventBus();
  const { isOpen } = state;

  useEffect(() => {
    if (!emits || !isOpen) return;

    emit<DialogOpenPayload>(DIALOG_OPEN_EVENT, {
      triggerEl: triggerRef.current,
    });
  }, [emits, isOpen, emit, triggerRef]);

  const onDialogOpen = useEffectEvent((triggerEl: Element | null) => {
    // A dialog opened from inside this popover belongs to it, and would be
    // unmounted with it.
    if (!state.isOpen || overlayRef.current?.contains(triggerEl)) return;

    state.close();
  });

  useEffect(() => {
    if (!closes) return;

    return on<DialogOpenPayload>(DIALOG_OPEN_EVENT, (data) =>
      onDialogOpen(data.triggerEl),
    );
  }, [closes, on]);
}
