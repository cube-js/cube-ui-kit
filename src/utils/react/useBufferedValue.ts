import { useCallback, useRef, useState } from 'react';

import { useLayoutEffect } from './useLayoutEffect';

const NOTHING_PENDING: unknown[] = [];

export interface UseBufferedValueOptions<T> {
  /**
   * Identity of a value, for values `Object.is` doesn't compare usefully — an array of colour
   * stops, a settings object. Defaults to the value itself, which is what strings want.
   */
  getKey?: (value: T) => unknown;
  /** Nothing can be typed into a disabled control, so there is nothing to protect. */
  isDisabled?: boolean;
  /** Same for a read-only one. */
  isReadOnly?: boolean;
  /** Escape hatch: `false` makes the hook inert and passes `value`/`onChange` straight through. */
  isBuffered?: boolean;
}

export interface UseBufferedValueResult<T> {
  /** Render this instead of `value`. `undefined` passes through, meaning uncontrolled. */
  value: T | undefined;
  /** Call this instead of `onChange`. Still emits once per call, in the same tick. */
  onChange: (next: T) => void;
  /** Drop the buffer and let `value` win again. The text fields call it on blur. */
  reset: () => void;
}

/**
 * Holds a controlled value locally so a parent that echoes the new value back *late* cannot
 * overwrite what the user is doing.
 *
 * **Why any of this is needed.** A controlled `<input>` renders whatever string its parent hands
 * it. If the parent hands back the pre-keystroke string — because its state reaches the component
 * through a store that publishes a render late, or through a debounce, or a deferred update —
 * React writes that stale string into the DOM node, and a native `value` assignment collapses the
 * selection to the end. Typing in the middle of a field throws the caret to the end. The value
 * eventually lands, so it looks like a caret bug rather than a data-flow one.
 *
 * The buffer keeps the typed text on screen until the parent catches up, while still emitting
 * `onChange` once per keystroke — so nothing downstream changes: no debouncing, no commit-on-blur,
 * no swallowed calls.
 *
 * Generic on purpose. The same lateness affects values that aren't strings (a colour scale's array
 * of stops emitted through a chart-spec pipeline), and `getKey` is where those pass the signature
 * function they already have.
 *
 * ```tsx
 * const buffered = useBufferedValue(value, onChange, { isReadOnly, isDisabled });
 *
 * <input value={buffered.value} onChange={buffered.onChange} onBlur={buffered.reset} />
 * ```
 *
 * One case it cannot resolve: an external change that lands *between* an emit and its echo, and
 * happens to equal a value still in flight, is read as our own echo. Telling those apart needs a
 * sequence number from the store rather than value matching.
 */
export function useBufferedValue<T>(
  value: T | undefined,
  onChange?: (next: T) => void,
  options: UseBufferedValueOptions<T> = {},
): UseBufferedValueResult<T> {
  const { getKey, isDisabled, isReadOnly, isBuffered = true } = options;

  // An `undefined` value means the control is uncontrolled — it already owns its text.
  const isActive =
    isBuffered && value !== undefined && !isDisabled && !isReadOnly;

  const keyOf = (next: T | undefined): unknown =>
    getKey && next != null ? getKey(next) : next;
  const valueKey = keyOf(value);

  // The only state, and the only thing that can force a render: what the user typed. It is rendered
  // *while we are ahead of the parent* and ignored otherwise — which is what makes adopting an
  // external value free, since there is nothing to write.
  const [draft, setDraft] = useState(value);
  // Keys we have emitted that the parent hasn't echoed back yet. A queue rather than one slot: the
  // user can type again before the first echo returns, and each echo has to be recognised as ours
  // or applying it would swallow everything typed after it.
  const pendingRef = useRef<unknown[]>(NOTHING_PENDING);
  // The last value we accepted as the parent's opinion — not the last one we rendered.
  const seenKeyRef = useRef<unknown>(valueKey);
  const latestRef = useRef({ value, onChange, keyOf, isActive });

  // These three refs are read during render but written *only* in an event handler or after commit,
  // never during a render. That is what keeps them honest under concurrent rendering: React may
  // discard a render (an interrupted pass, a StrictMode double-invoke), and a discarded render runs
  // no effects, so it cannot leave the bookkeeping describing a pass that never committed.
  const pending = pendingRef.current;
  const propMoved = valueKey !== seenKeyRef.current;
  // Our own echo, a render or more late — possibly an earlier emit a later one superseded.
  const echoAt = propMoved ? pending.indexOf(valueKey) : -1;
  // A real change from the parent: undo/redo, a reset, a transformed value, another record.
  const isExternal = propMoved && echoAt < 0;
  const isAhead = isActive && !isExternal && pending.length > 0;
  // Not being ahead is the whole of "the parent wins", so an external change needs no state write
  // and costs no extra render. Being ahead — including when the value is the stale one the parent
  // held *before* the keystroke — is what stops React writing that string back and collapsing the
  // selection.
  const rendered = isAhead ? draft : value;

  useLayoutEffect(() => {
    latestRef.current = { value, onChange, keyOf, isActive };
    seenKeyRef.current = valueKey;

    if (!isActive || isExternal) {
      pendingRef.current = NOTHING_PENDING;
    } else if (echoAt >= 0) {
      pendingRef.current = pending.slice(echoAt + 1);
    }
  });

  const handleChange = useCallback((next: T) => {
    const {
      onChange: latestOnChange,
      keyOf: latestKeyOf,
      isActive: latestIsActive,
    } = latestRef.current;

    if (latestIsActive) {
      // A ref write in an event handler, which runs after a commit — never mid-render.
      pendingRef.current = [...pendingRef.current, latestKeyOf(next)];
      setDraft(next);
    }

    latestOnChange?.(next);
  }, []);

  const reset = useCallback(() => {
    const { value: latestValue } = latestRef.current;

    // Emptying the queue is what hands control back: with nothing in flight we are no longer ahead,
    // so the parent's value is rendered again. `setDraft` is only here to schedule that render.
    pendingRef.current = NOTHING_PENDING;
    setDraft(latestValue);
  }, []);

  return { value: rendered, onChange: handleChange, reset };
}
