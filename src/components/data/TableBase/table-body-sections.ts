import type { Key } from '@react-types/shared';
import type { ReactNode } from 'react';

/** Presentation metadata; section captions never enter the record collection. */
export interface TableBodySection {
  key: Key;
  title: ReactNode;
  /** First record on this page belonging to the section. */
  rowIndex: number;
  /** Zero-based caption position in the complete body, before paging. */
  index: number;
}

export interface TableBodySections {
  headers: readonly TableBodySection[];
  /** Document-absolute body positions, parallel to the page's records. */
  rowIndices: readonly number[];
  rowCount: number;
  /** Existing scroller measurement, used to bound the horizontal caption. */
  viewportWidth?: number | null;
}

export type TableBodyItem =
  | { kind: 'record'; rowIndex: number }
  | { kind: 'section'; section: TableBodySection };

export function buildTableBodyItems(
  rowCount: number,
  sections: TableBodySections,
) {
  const items: TableBodyItem[] = [];
  const recordIndices: number[] = [];
  let headerIndex = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const section = sections.headers[headerIndex];
    if (section?.rowIndex === rowIndex) {
      items.push({ kind: 'section', section });
      headerIndex++;
    }
    recordIndices.push(items.length);
    items.push({ kind: 'record', rowIndex });
  }
  return { items, recordIndices };
}
