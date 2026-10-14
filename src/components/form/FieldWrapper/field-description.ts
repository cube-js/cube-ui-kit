import { useSyncExternalStore } from 'react';

import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';

/**
 * The ids `FieldWrapper` gives a control's description and message. Both are
 * derived from the control's own id, so the wrapper and the control agree on
 * them without handing anything to each other.
 */
export function getFieldDescriptionId(controlId: string) {
  return `${controlId}-description`;
}

export function getFieldMessageId(controlId: string) {
  return `${controlId}-message`;
}

/**
 * How many mounted elements carry each id. Counted, not a set, so a remount
 * under Strict Mode — or two fields that share an id — never drops one still
 * on the page.
 */
const mountedIds = new Map<string, number>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Registers `id` as rendered while the calling `FieldWrapper` shows the
 * element that carries it. `undefined` registers nothing.
 */
export function useFieldTextId(id: string | undefined) {
  useLayoutEffect(() => {
    if (!id) return;

    mountedIds.set(id, (mountedIds.get(id) ?? 0) + 1);
    notify();

    return () => {
      const count = (mountedIds.get(id) ?? 1) - 1;

      if (count) mountedIds.set(id, count);
      else mountedIds.delete(id);

      notify();
    };
  }, [id]);
}

/**
 * The control's `aria-describedby`: the caller's own ids, then the field
 * description and message `FieldWrapper` has rendered.
 *
 * Taken from what the wrapper registered rather than predicted from props,
 * as React Aria's `useSlotId` does, because whether `FieldWrapper` renders
 * either one depends on more than the control's props: a label or
 * `forceField`, a disabled field hiding its message, `TagInput` putting a
 * rejection in at wrap time. Without the reference, a screen reader announces
 * the field as invalid and never says why.
 */
export function useFieldDescribedBy(
  controlId: string | undefined,
  describedBy: string | undefined,
): string | undefined {
  const rendered = useSyncExternalStore(
    subscribe,
    () =>
      controlId
        ? [getFieldDescriptionId(controlId), getFieldMessageId(controlId)]
            .filter((id) => mountedIds.has(id))
            .join(' ')
        : '',
    // The wrapper registers after it mounts, so nothing is linked yet.
    () => '',
  );

  return [describedBy, rendered].filter(Boolean).join(' ') || undefined;
}
