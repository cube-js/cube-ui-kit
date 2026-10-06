import { useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import {
  freezeColumnWidths,
  useTableColumns,
} from '../TableBase/use-table-columns';

import type { UseTableColumnsOptions } from '../TableBase/use-table-columns';
import type { useTableStorage } from '../TableBase/use-table-storage';
import type { CubeItemTableProps } from './types';

/** Stable identity, so the uncontrolled default does not change every render. */
const EMPTY_WIDTHS: Record<string, number> = {};

export interface UseItemTableColumnWidthsOptions<T>
  extends Omit<UseTableColumnsOptions<T>, 'columnWidths'>,
    Pick<
      CubeItemTableProps<T>,
      'columnWidths' | 'defaultColumnWidths' | 'onColumnResize'
    > {
  storage: ReturnType<typeof useTableStorage>;
}

/**
 * The column layout, with the widths a user resized: controlled or owned (and
 * then persisted), plus the draft a resize gesture paints until it ends.
 */
export function useItemTableColumnWidths<T>({
  columns,
  containerWidth,
  leadingColumns,
  trailingColumns,
  columnWidths: columnWidthsProp,
  defaultColumnWidths,
  onColumnResize,
  storage,
}: UseItemTableColumnWidthsOptions<T>) {
  /**
   * Column widths, in three layers.
   *
   * The draft exists because a resize has to be visible *while* it happens, and
   * a controlled `columnWidths` cannot be: the consumer only learns the new
   * width from `onColumnResize`, which fires when the gesture ends. Without a
   * draft a controlled table simply would not move under the pointer.
   */
  const [ownColumnWidths, setOwnColumnWidths] = useState<
    Record<string, number>
  >(
    () =>
      (columnWidthsProp === undefined && storage.has('columnWidths')
        ? storage.initial.columnWidths ?? defaultColumnWidths
        : defaultColumnWidths) ?? EMPTY_WIDTHS,
  );
  const [draftColumnWidths, setDraftColumnWidths] = useState<Record<
    string,
    number
  > | null>(null);

  /**
   * The same draft, in a ref.
   *
   * A keyboard resize runs `useMove`'s whole start → move → end cycle inside
   * one key press, so the end handler would read the state from before the
   * move. The ref is what it actually settles on; the state exists only to
   * trigger the render.
   */
  const draftColumnWidthsRef = useRef<Record<string, number> | null>(null);

  const baseColumnWidths = columnWidthsProp ?? ownColumnWidths;
  const columnWidths = draftColumnWidths ?? baseColumnWidths;

  const layout = useTableColumns<T>({
    columns,
    containerWidth,
    columnWidths,
    leadingColumns,
    trailingColumns,
  });

  const handleColumnResize = useEvent((key: string, width: number) => {
    // First move of a drag freezes every column, so this changes exactly one
    // width instead of re-splitting the flex pool. See `freezeColumnWidths`.
    const base =
      draftColumnWidthsRef.current ??
      freezeColumnWidths(layout, baseColumnWidths);

    draftColumnWidthsRef.current = { ...base, [key]: Math.round(width) };
    setDraftColumnWidths(draftColumnWidthsRef.current);
  });

  // Once at the end: a callback per pixel would be unusable, and persisting
  // every frame would hammer `localStorage`.
  const handleColumnResizeEnd = useEvent((key: string) => {
    const next = draftColumnWidthsRef.current ?? baseColumnWidths;

    if (columnWidthsProp === undefined) {
      setOwnColumnWidths(next);
      storage.write({ columnWidths: next });
    }

    onColumnResize?.(key, next[key], next);

    // The prop (or `ownColumnWidths`) is the source of truth again. A
    // controlled consumer that ignores the callback reverts, which is what
    // being controlled means.
    draftColumnWidthsRef.current = null;
    setDraftColumnWidths(null);
  });

  return { layout, handleColumnResize, handleColumnResizeEnd };
}
