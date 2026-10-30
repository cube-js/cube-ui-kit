import { focusSafely } from '@react-aria/interactions';
import { useEffect, useRef, useState } from 'react';

import { useI18n } from '../../../i18n';
import { AlertDialog } from '../AlertDialog/AlertDialog';

interface PendingDismissal {
  /** What the dismissal runs once the user discards the edits. */
  dismiss: () => void;
  /** Where focus was when the dialog asked, to give it back. */
  focusTarget: Element | null;
}

interface Answer extends PendingDismissal {
  isDiscarded: boolean;
}

/**
 * The owner side of `confirmDismiss`, for `DialogTrigger` and
 * `DialogContainer`. A passive dismissal (Escape, an outside click, the close
 * button) goes through `requestDismiss`, which asks "Discard changes?" first
 * while `confirmDismiss` is `true`, or, when it is unset, while a form inside
 * (a modern `Form` root, or a legacy `DialogForm`) reports unsaved edits, or
 * its own `confirmDismiss`, through `registerUnsavedChanges`. Explicit actions
 * (submit, Cancel, a `close` the consumer calls) bypass it.
 *
 * The owner renders the question while `confirmationProps` is set:
 * `<DialogContainer {...confirmationProps}><DiscardChangesDialog /></DialogContainer>`.
 */
export function useDismissConfirmation(
  confirmDismiss: boolean | undefined,
  isDialogOpen: boolean,
) {
  const [pending, setPending] = useState<PendingDismissal | null>(null);
  // Mounted on the first question and kept, so it can play its exit.
  const [hasAsked, setHasAsked] = useState(false);
  // Every form in the dialog reports its own: tabs or a wizard step can hold
  // more than one, and any of them with edits makes the dialog ask.
  const unsavedChecks = useRef(new Set<() => boolean>());
  const answer = useRef<Answer | null>(null);
  const lastFocused = useRef<Element | null>(null);
  const canAsk = isDialogOpen && confirmDismiss !== false;

  // A dialog closed some other way takes its question with it.
  if (pending && !isDialogOpen) setPending(null);

  // A click outside drops focus to `<body>` on its way to closing the dialog,
  // so the question gives focus back to where it was last. A `confirmDismiss`
  // bound to state turns on while the user types, so start from that field.
  useEffect(() => {
    if (!canAsk) return;

    if (document.activeElement !== document.body) {
      lastFocused.current = document.activeElement;
    }

    const onFocusIn = (event: FocusEvent) => {
      lastFocused.current = event.target as Element;
    };

    document.addEventListener('focusin', onFocusIn, true);

    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      lastFocused.current = null;
    };
  }, [canAsk]);

  function requestDismiss(dismiss: () => void) {
    if (pending) return;

    if (!(confirmDismiss ?? hasUnsavedChanges())) {
      dismiss();

      return;
    }

    const focused = document.activeElement;

    setPending({
      dismiss,
      focusTarget:
        focused && focused !== document.body ? focused : lastFocused.current,
    });
    setHasAsked(true);
  }

  function hasUnsavedChanges() {
    for (const check of unsavedChecks.current) {
      if (check()) return true;
    }

    return false;
  }

  function registerUnsavedChanges(check: () => boolean) {
    const checks = unsavedChecks.current;

    checks.add(check);

    return () => {
      checks.delete(check);
    };
  }

  function settle(action?: string) {
    if (!pending) return;

    answer.current = { ...pending, isDiscarded: action === 'confirm' };
    setPending(null);
  }

  // Once the question has closed: while open it holds focus, and pulls back
  // any focus moved out of it. Focus goes back into the dialog at once, not
  // when the question has faded out. A discarded dialog then closes from
  // there, so its trigger takes focus back as after any close.
  useEffect(() => {
    const settled = answer.current;

    if (pending || !settled) return;

    answer.current = null;

    const { focusTarget } = settled;

    if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
      focusSafely(focusTarget);
    }

    if (settled.isDiscarded) settled.dismiss();
  }, [pending]);

  return {
    requestDismiss,
    registerUnsavedChanges,
    confirmationProps: hasAsked
      ? { isOpen: !!pending, onDismiss: settle }
      : null,
  };
}

/** The question `useDismissConfirmation` asks. Escape keeps editing. */
export function DiscardChangesDialog() {
  const { t } = useI18n();

  return (
    <AlertDialog
      danger
      title={t('dialog.discardChanges.title', 'Discard changes?')}
      content={t(
        'dialog.discardChanges.content',
        'All unsaved changes will be lost.',
      )}
      actions={{
        confirm: { children: t('dialog.discardChanges.discard', 'Discard') },
        cancel: {
          children: t('dialog.discardChanges.keepEditing', 'Keep editing'),
        },
      }}
    />
  );
}
