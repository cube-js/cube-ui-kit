import { RefObject, useEffectEvent } from 'react';
import { flushSync } from 'react-dom';

import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';

/**
 * Measures whether a `Button` with `autoCollapse` fits the row it sits in, and
 * collapses it when the row can't fit every child at full width.
 *
 * The row is the button's parent element. Its width has to come from its own
 * container (a block, `flex: 1`, a fixed width): a row as wide as its content
 * always fits it, so its buttons never collapse.
 */

interface RowEntry {
  element: HTMLElement;
  notify: (isCollapsed: boolean) => void;
  isCollapsed: boolean;
  /** The label's inline padding while expanded, which collapsing removes. */
  expandedPadding: number;
  /** The button's full width when last seen expanded. */
  expandedWidth: number | undefined;
}

interface RowState {
  entries: Set<RowEntry>;
}

const rows = new WeakMap<HTMLElement, RowState>();
const entriesByElement = new WeakMap<Element, RowEntry>();
const pendingRows = new Set<HTMLElement>();

/**
 * One observer for every row. It watches the rows alone: collapsing changes
 * the buttons' widths but not their row's, so it never reports its own
 * decision back, and a button whose content changes asks for a check itself.
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

function getLabel(element: HTMLElement) {
  return element.querySelector<HTMLElement>(':scope > [data-element="Label"]');
}

/** Whether a collapsing button shows its collapsed form right now. */
function isShownCollapsed(element: HTMLElement, label: HTMLElement) {
  if (element.dataset.collapse === 'label') {
    const full = label.querySelector('[data-element="FullLabel"]');

    return !!full && full.getClientRects().length === 0;
  }

  return label.clientWidth === 0 && label.scrollWidth > 0;
}

/**
 * The width a button takes at full size. Expanded, that is its width plus
 * whatever its label cuts off. Collapsed to its icon, its label still reports
 * the text's width through `scrollWidth`, and the padding is the one seen last
 * expanded; collapsed to a short label, the full label is not laid out, so the
 * width last seen expanded stands in.
 */
function getFullWidth(entry: RowEntry, width: number) {
  const { element } = entry;
  const label = getLabel(element);

  if (!label) return width;

  if (!isShownCollapsed(element, label)) {
    const style = getComputedStyle(label);

    entry.expandedPadding = px(style.paddingLeft) + px(style.paddingRight);
    entry.expandedWidth =
      width + Math.max(0, label.scrollWidth - label.clientWidth);

    return entry.expandedWidth;
  }

  if (element.dataset.collapse === 'icon') {
    return width + label.scrollWidth + entry.expandedPadding;
  }

  return entry.expandedWidth ?? width;
}

/** Whether every child of the row fits it at full width. */
function fitsAtFullWidth(row: HTMLElement) {
  const rowStyle = getComputedStyle(row);
  const available =
    row.clientWidth - px(rowStyle.paddingLeft) - px(rowStyle.paddingRight);
  let required = 0;
  let count = 0;

  for (const child of Array.from(row.children)) {
    if (!(child instanceof HTMLElement)) continue;

    const style = getComputedStyle(child);

    if (
      style.display === 'none' ||
      style.position === 'absolute' ||
      style.position === 'fixed'
    ) {
      continue;
    }

    const { width } = child.getBoundingClientRect();
    const entry = entriesByElement.get(child);

    required +=
      (entry
        ? getFullWidth(entry, width)
        : width + Math.max(0, child.scrollWidth - child.clientWidth)) +
      px(style.marginLeft) +
      px(style.marginRight);
    count += 1;
  }

  required += px(rowStyle.columnGap) * Math.max(0, count - 1);

  // Half a pixel of slack for sub-pixel widths, so an exact fit stays put.
  return required <= available + 0.5;
}

/**
 * Checks every queued row and applies the decisions in one synchronous render,
 * before paint, as `useAutoTooltip` applies its overflow verdicts.
 */
function runRowChecks() {
  const queued = Array.from(pendingRows);

  pendingRows.clear();

  const decisions: [RowEntry, boolean][] = [];

  for (const row of queued) {
    const state = rows.get(row);

    if (!state || !state.entries.size || !row.isConnected) continue;

    const isCollapsed = !fitsAtFullWidth(row);

    for (const entry of state.entries) {
      if (entry.isCollapsed !== isCollapsed)
        decisions.push([entry, isCollapsed]);
    }
  }

  if (!decisions.length) return;

  flushSync(() => {
    for (const [entry, isCollapsed] of decisions) {
      entry.isCollapsed = isCollapsed;
      entry.notify(isCollapsed);
    }
  });
}

function scheduleRowCheck(row: HTMLElement) {
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
    state = { entries: new Set() };
    rows.set(row, state);
    getRowObserver().observe(row);
  }

  const entry: RowEntry = {
    element,
    notify,
    isCollapsed: false,
    expandedPadding: 0,
    expandedWidth: undefined,
  };

  state.entries.add(entry);
  entriesByElement.set(element, entry);
  scheduleRowCheck(row);

  return () => {
    state.entries.delete(entry);
    if (entriesByElement.get(element) === entry) {
      entriesByElement.delete(element);
    }
    if (!state.entries.size) {
      rows.delete(row);
      rowObserver?.unobserve(row);
    }
    // The row may fit its remaining buttons now.
    scheduleRowCheck(row);
  };
}

export interface AutoCollapseObserverProps {
  /** The button element; its parent is the measured row. */
  targetRef: RefObject<HTMLElement | null>;
  /** Changes whenever the button's full width can: its label, icons, size. */
  contentKey: string;
  onChange: (isCollapsed: boolean) => void;
}

/**
 * Renders nothing. `Button` mounts it only with `autoCollapse`, so a button
 * without the prop runs none of this.
 */
export function AutoCollapseObserver({
  targetRef,
  contentKey,
  onChange,
}: AutoCollapseObserverProps) {
  const notify = useEffectEvent((isCollapsed: boolean) => {
    onChange(isCollapsed);
  });

  useLayoutEffect(() => {
    let leave: (() => void) | undefined;
    let isActive = true;

    // The button's ref is attached after this child's layout effect, so the
    // row is joined once the commit has finished, still before paint.
    queueMicrotask(() => {
      const element = targetRef.current;
      const row = element?.parentElement;

      if (!isActive || !element || !row) return;

      leave = joinRow(row, element, (isCollapsed) => notify(isCollapsed));
    });

    return () => {
      isActive = false;
      leave?.();
      notify(false);
    };
  }, [targetRef]);

  // The button's full width can change without its row resizing.
  useLayoutEffect(() => {
    const row = targetRef.current?.parentElement;

    if (row && rows.has(row)) scheduleRowCheck(row);
  }, [contentKey, targetRef]);

  return null;
}
