import { useEffect, useMemo, useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';

import type { MutableRefObject } from 'react';
import type { LayoutItem } from './grid-core';

export type BoardSelectionMode = 'none' | 'single' | 'multiple';

export interface UseBoardSelectionOptions {
  selectionMode: BoardSelectionMode;
  /** Controlled selection. */
  selectedKeys?: string[];
  /** Initial selection for uncontrolled usage. */
  defaultSelectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Live layout — supplies both the key order and the set of valid keys. */
  layout: LayoutItem[];
  /** Accessible name of a widget, for the single-selection announcement. */
  getLabel: (key: string) => string;
}

export interface UseBoardSelectionResult {
  /** The effective selection: provided keys ∩ live layout, in layout order. */
  selectedKeySet: ReadonlySet<string>;
  /**
   * Synchronously-updated mirror of `selectedKeySet`. Handlers that run before
   * React re-renders — notably `useMove`'s `onMoveStart`, which has to decide
   * single-drag vs. group-drag on the spot — must read this rather than the
   * state, which would be one render stale.
   */
  selectedKeysRef: MutableRefObject<ReadonlySet<string>>;
  /** Replace the selection wholesale (marquee, programmatic). */
  setSelection: (keys: Iterable<string>) => void;
  /**
   * Apply a single-key gesture.
   *
   * `additive` (a modifier-held click, or any keyboard toggle) flips the key's
   * membership. A plain gesture replaces the selection with just this key — it
   * never clears, because a widget is a large surface the user also clicks to
   * work with, and having the second click silently deselect reads as a bug.
   * Deselecting is <kbd>Escape</kbd>, or an additive gesture.
   */
  select: (key: string, additive: boolean) => void;
  clearSelection: () => void;
  /** Live-region text. Only changes when the selection commits. */
  announcement: string;
}

const EMPTY_KEYS: readonly string[] = [];

/** Zero-width space. See `announce` below. */
const ANNOUNCEMENT_NUDGE = '\u200B';

/**
 * Headless selection state for a single board.
 *
 * Deliberately shaped like `useBoardLayout`: controlled (`selectedKeys`) or
 * uncontrolled (`defaultSelectedKeys`), with a synchronous ref mirror for the
 * drag engine and a single commit path so every entry point — click, keyboard,
 * marquee, pruning — produces exactly one `onSelectionChange` and one
 * announcement.
 */
export function useBoardSelection(
  options: UseBoardSelectionOptions,
): UseBoardSelectionResult {
  const {
    selectionMode,
    selectedKeys: controlledKeys,
    defaultSelectedKeys,
    onSelectionChange,
    layout,
    getLabel,
  } = options;

  const { t } = useI18n();
  const isControlled = controlledKeys !== undefined;
  const isEnabled = selectionMode !== 'none';

  const [uncontrolledKeys, setUncontrolledKeys] = useState<readonly string[]>(
    () => defaultSelectedKeys ?? EMPTY_KEYS,
  );

  // Layout order, not click order: a marquee has no meaningful click order, and
  // a stable order makes group operations reproducible for consumers.
  const orderedIds = useMemo(() => layout.map((it) => it.i), [layout]);

  const selectedKeys = useMemo(() => {
    if (!isEnabled) {
      return EMPTY_KEYS as string[];
    }

    const requested = new Set(controlledKeys ?? uncontrolledKeys);

    // Intersecting with the live layout on every render is what makes a stale
    // key harmless: it simply highlights nothing. No effect, no flash, and no
    // need for the consumer to clean up after removing a widget.
    return orderedIds.filter((id) => requested.has(id));
  }, [isEnabled, controlledKeys, uncontrolledKeys, orderedIds]);

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const selectedKeysRef = useRef<ReadonlySet<string>>(selectedKeySet);
  selectedKeysRef.current = selectedKeySet;

  const onSelectionChangeEvent = useEvent((next: string[]) =>
    onSelectionChange?.(next),
  );

  // ---- Announcements --------------------------------------------------------

  const [announcement, setAnnouncement] = useState('');
  // Screen readers skip a live-region update whose text is identical to the
  // previous one, which would silently drop the very common select → deselect →
  // reselect sequence. Alternating an invisible suffix keeps every update
  // distinct without changing what is spoken.
  const announcementParityRef = useRef(false);

  const announce = useEvent((keys: string[], hadSelection: boolean) => {
    let message: string;

    if (keys.length === 0) {
      if (!hadSelection) {
        return;
      }
      message = t('board.selectionCleared', 'Selection cleared');
    } else if (keys.length === 1) {
      message = t('board.widgetSelected', '{{name}} selected', {
        name: getLabel(keys[0]!),
      });
    } else {
      message = t('board.widgetsSelected', '{{count}} widgets selected', {
        count: keys.length,
      });
    }

    announcementParityRef.current = !announcementParityRef.current;
    setAnnouncement(
      announcementParityRef.current
        ? message
        : `${message}${ANNOUNCEMENT_NUDGE}`,
    );
  });

  // ---- Commit ---------------------------------------------------------------

  const commit = useEvent((nextKeys: Iterable<string>) => {
    const requested = new Set(nextKeys);
    const next = orderedIds.filter((id) => requested.has(id));
    const current = selectedKeysRef.current;

    if (next.length === current.size && next.every((id) => current.has(id))) {
      return;
    }

    // Keep the ref in step *before* the state lands, so a gesture that reads it
    // later in the same tick sees the new selection.
    selectedKeysRef.current = new Set(next);

    if (!isControlled) {
      setUncontrolledKeys(next);
    }

    announce(next, current.size > 0);
    onSelectionChangeEvent(next);
  });

  // ---- Pruning --------------------------------------------------------------

  // Uncontrolled state is the only copy of the selection, so a removed widget
  // has to be dropped from it and the change reported. In controlled mode the
  // consumer removed the widget and owns its own state — emitting here would
  // fight the controlled contract and can loop.
  useEffect(() => {
    if (isControlled || !isEnabled || uncontrolledKeys.length === 0) {
      return;
    }

    const live = new Set(orderedIds);
    const pruned = uncontrolledKeys.filter((key) => live.has(key));

    if (pruned.length !== uncontrolledKeys.length) {
      selectedKeysRef.current = new Set(pruned);
      setUncontrolledKeys(pruned);
      onSelectionChangeEvent(pruned);
    }
  }, [
    isControlled,
    isEnabled,
    uncontrolledKeys,
    orderedIds,
    onSelectionChangeEvent,
  ]);

  // ---- Gestures -------------------------------------------------------------

  const setSelection = useEvent((keys: Iterable<string>) => {
    if (!isEnabled) {
      return;
    }
    commit(selectionMode === 'single' ? firstOf(keys) : keys);
  });

  const select = useEvent((key: string, additive: boolean) => {
    if (!isEnabled) {
      return;
    }

    if (selectionMode === 'single') {
      // A modifier can still toggle the one selected widget off; a plain
      // gesture always lands on the widget the user aimed at.
      commit(additive && selectedKeysRef.current.has(key) ? [] : [key]);

      return;
    }

    if (!additive) {
      commit([key]);

      return;
    }

    const next = new Set(selectedKeysRef.current);
    if (!next.delete(key)) {
      next.add(key);
    }
    commit(next);
  });

  const clearSelection = useEvent(() => {
    if (!isEnabled) {
      return;
    }
    commit([]);
  });

  return {
    selectedKeySet,
    selectedKeysRef,
    setSelection,
    select,
    clearSelection,
    announcement,
  };
}

function firstOf(keys: Iterable<string>): string[] {
  for (const key of keys) {
    return [key];
  }

  return [];
}
