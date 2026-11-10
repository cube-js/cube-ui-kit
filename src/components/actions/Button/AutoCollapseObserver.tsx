import { RefObject, useEffectEvent, useRef } from 'react';
import { flushSync } from 'react-dom';

import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';

/**
 * Collapses the `Button`s with `autoCollapse` in a row while the row can't fit
 * them expanded, and expands them once it can. The row is the button's parent
 * element, and its buttons collapse together.
 *
 * The decision reads the buttons, not their siblings:
 *
 * - **Expanded**, the row is too narrow when one of its buttons' labels is cut
 *   off, or the row overflows. The row then collapses its buttons, and
 *   remembers how wide it would have had to be: its width plus everything that
 *   was cut off.
 * - **Collapsed**, the row expands its buttons once it is that wide. The freed
 *   width may have gone to a sibling that grows or to an auto margin, so
 *   adding up the siblings' widths would never show the row fitting again.
 * - **After expanding**, the row checks again, before paint. If the buttons
 *   are cut off after all, they collapse again with the larger width
 *   remembered, so the estimate only grows and the decision settles.
 *
 * When something the needed width depends on changes while collapsed (a
 * button's content, a child added or removed), the remembered width is stale:
 * the row expands, checks and collapses again if it has to, all before paint.
 *
 * A row as wide as its content always fits, so its buttons never collapse: its
 * width has to come from its container (a block, `flex: 1`, a fixed width).
 * Wrapping and vertical rows give their buttons room by wrapping or stacking,
 * so their buttons never collapse either.
 */

interface RowEntry {
  element: HTMLElement;
  notify: (isCollapsed: boolean) => void;
  isCollapsed: boolean;
}

interface RowState {
  entries: Set<RowEntry>;
  isCollapsed: boolean;
  /** The row's content width at which its buttons fit expanded. */
  neededWidth: number | undefined;
  /** The needed width may be wrong: try expanded, then check. */
  isStale: boolean;
  /** Children added or removed change what the row needs. */
  childObserver: MutationObserver;
}

const rows = new WeakMap<HTMLElement, RowState>();
const pendingRows = new Set<HTMLElement>();

/**
 * One observer for every row. It watches the rows alone: collapsing changes
 * the buttons' widths but not their row's, so it never reports its own
 * decision back.
 */
let rowObserver: ResizeObserver | null = null;

function getRowObserver() {
  rowObserver ??= new ResizeObserver((records) => {
    for (const record of records) {
      scheduleRowCheck(record.target as HTMLElement);
    }
  });

  return rowObserver;
}

function px(value: string) {
  return parseFloat(value) || 0;
}

function getContentWidth(row: HTMLElement) {
  const style = getComputedStyle(row);

  return row.clientWidth - px(style.paddingLeft) - px(style.paddingRight);
}

function getLabel(element: HTMLElement) {
  return element.querySelector<HTMLElement>(':scope > [data-element="Label"]');
}

/**
 * Whether a button shows its collapsed form, whichever trigger collapsed it.
 * Read from the styles the collapse applies rather than from widths: a label
 * squeezed to nothing is not collapsed.
 */
function isShownCollapsed(element: HTMLElement, label: HTMLElement) {
  if (element.dataset.collapse === 'label') {
    const full = label.querySelector<HTMLElement>(
      ':scope > [data-element="FullLabel"]',
    );

    return !!full && getComputedStyle(full).display === 'none';
  }

  return getComputedStyle(label).maxWidth === '0px';
}

/**
 * How much wider the row has to be for its expanded buttons to show their
 * labels whole: what their labels cut off, plus what overflows the row. A
 * button another trigger collapsed has no label on show, so it adds nothing.
 */
function getShortfall(row: HTMLElement, state: RowState) {
  let shortfall = Math.max(0, row.scrollWidth - row.clientWidth);

  for (const { element } of state.entries) {
    const label = getLabel(element);

    if (!label || isShownCollapsed(element, label)) continue;

    shortfall += Math.max(0, label.scrollWidth - label.clientWidth);
  }

  return shortfall;
}

/** Whether the row's buttons should be collapsed now. */
function decide(row: HTMLElement, state: RowState) {
  const width = getContentWidth(row);

  // What the row remembered was measured on content that has since changed.
  if (state.isStale) state.neededWidth = undefined;

  if (state.isCollapsed) {
    // Half a pixel of slack for sub-pixel widths, so an exact fit expands.
    return state.neededWidth !== undefined && width + 0.5 < state.neededWidth;
  }

  const shortfall = getShortfall(row, state);

  if (shortfall <= 0) return false;

  state.neededWidth = Math.max(state.neededWidth ?? 0, width + shortfall);

  return true;
}

/**
 * Checks every queued row and applies the decisions in one synchronous render,
 * before paint, as `useAutoTooltip` applies its overflow verdicts. A row that
 * expanded is checked once more, which can only collapse it again.
 */
function runRowChecks() {
  const queued = Array.from(pendingRows);

  pendingRows.clear();

  const changes: [RowEntry, boolean][] = [];
  const expanded: HTMLElement[] = [];

  for (const row of queued) {
    const state = rows.get(row);

    if (!state || !state.entries.size || !row.isConnected) continue;

    const wasCollapsed = state.isCollapsed;
    const isCollapsed = decide(row, state);

    state.isCollapsed = isCollapsed;
    state.isStale = false;
    if (wasCollapsed && !isCollapsed) expanded.push(row);

    for (const entry of state.entries) {
      if (entry.isCollapsed !== isCollapsed) changes.push([entry, isCollapsed]);
    }
  }

  if (changes.length) {
    flushSync(() => {
      for (const [entry, isCollapsed] of changes) {
        entry.isCollapsed = isCollapsed;
        entry.notify(isCollapsed);
      }
    });
  }

  for (const row of expanded) scheduleRowCheck(row);
}

function scheduleRowCheck(row: HTMLElement, isStale = false) {
  const state = rows.get(row);

  if (!state) return;
  if (isStale) state.isStale = true;
  if (!pendingRows.size) queueMicrotask(runRowChecks);

  pendingRows.add(row);
}

function joinRow(
  row: HTMLElement,
  element: HTMLElement,
  notify: RowEntry['notify'],
) {
  let state = rows.get(row);

  if (!state) {
    const childObserver = new MutationObserver(() =>
      scheduleRowCheck(row, true),
    );

    state = {
      entries: new Set(),
      isCollapsed: false,
      neededWidth: undefined,
      isStale: false,
      childObserver,
    };
    rows.set(row, state);
    getRowObserver().observe(row);
    childObserver.observe(row, { childList: true });
  }

  const entry: RowEntry = { element, notify, isCollapsed: false };
  const joined = state;

  joined.entries.add(entry);
  scheduleRowCheck(row, true);

  return () => {
    joined.entries.delete(entry);

    if (joined.entries.size) {
      // The row may fit its remaining buttons now.
      scheduleRowCheck(row, true);
    } else {
      rows.delete(row);
      rowObserver?.unobserve(row);
      joined.childObserver.disconnect();
    }
  };
}

export interface AutoCollapseObserverProps {
  /** The button element; its parent is the measured row. */
  targetRef: RefObject<HTMLElement | null>;
  /**
   * Changes whenever the button's full width can: its label, short label,
   * icons, size, and whether another trigger collapses it.
   */
  contentKey: string;
  /**
   * Whether the button's label is cut off, from its automatic tooltip. A
   * sibling that grows squeezes the button without resizing the row.
   */
  isLabelCut: boolean;
  onChange: (isCollapsed: boolean) => void;
}

/**
 * Renders nothing. `Button` mounts it only with `autoCollapse`, so a button
 * without the prop runs none of this.
 */
export function AutoCollapseObserver({
  targetRef,
  contentKey,
  isLabelCut,
  onChange,
}: AutoCollapseObserverProps) {
  const notify = useEffectEvent((isCollapsed: boolean) => {
    onChange(isCollapsed);
  });
  // The row joined. The button's ref can't be read from this child's layout
  // effects: on every update React detaches the button's callback ref before
  // they run and attaches it again only after them.
  const rowRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let leave: (() => void) | undefined;
    let isActive = true;

    // The button's ref is attached after this child's layout effect, so the
    // row is joined once the commit has finished, still before paint.
    queueMicrotask(() => {
      const element = targetRef.current;
      const row = element?.parentElement;

      if (!isActive || !element || !row) return;

      rowRef.current = row;
      leave = joinRow(row, element, (isCollapsed) => notify(isCollapsed));
    });

    return () => {
      isActive = false;
      rowRef.current = null;
      leave?.();
      notify(false);
    };
  }, [targetRef]);

  // What the button needs changed, so what the row remembers may be wrong.
  // Joining checks the row anyway, so before that there is nothing to do.
  useLayoutEffect(() => {
    if (rowRef.current) scheduleRowCheck(rowRef.current, true);
  }, [contentKey]);

  // The row didn't resize, but the button may no longer fit it.
  useLayoutEffect(() => {
    if (rowRef.current) scheduleRowCheck(rowRef.current);
  }, [isLabelCut]);

  return null;
}
