import type { Key } from '@react-types/shared';
import type { TableBodySections } from '../TableBase/table-body-sections';
import type { CubeItemTableSection } from './types';

interface ItemTableSectionGroup extends CubeItemTableSection {
  start: number;
  end: number;
  index: number;
}

export interface ItemTableSections<T> {
  rows: T[];
  keys: Key[];
  groups: ItemTableSectionGroup[];
  rowIndices: number[];
}

/** Stable partition after sorting preserves each section's own sort order. */
export function buildItemTableSections<T>(
  data: readonly T[],
  sortedRows: readonly T[],
  sections: readonly CubeItemTableSection[],
  getSectionKey: (row: T) => Key,
  getRowKey: (row: T, index: number) => Key,
): ItemTableSections<T> | null {
  const buckets = new Map<Key, T[]>();
  for (const section of sections) {
    if (buckets.has(section.key)) return null;
    buckets.set(section.key, []);
  }
  for (const row of sortedRows) {
    const bucket = buckets.get(getSectionKey(row));
    if (!bucket) return null;
    bucket.push(row);
  }

  // Resolve identity against source positions, including index-based keys.
  // Repeated values retain source occurrence order through the stable sort.
  const sourceKeys = new Map<T, Key[]>();
  data.forEach((row, index) => {
    const keys = sourceKeys.get(row) ?? [];
    keys.push(getRowKey(row, index));
    sourceKeys.set(row, keys);
  });
  const occurrences = new Map<T, number>();
  const rows: T[] = [];
  const keys: Key[] = [];
  const groups: ItemTableSectionGroup[] = [];
  const rowIndices: number[] = [];
  for (const section of sections) {
    const bucket = buckets.get(section.key)!;
    if (!bucket.length) continue;
    const start = rows.length;
    const index = start + groups.length;
    groups.push({ ...section, start, end: start + bucket.length, index });
    for (const row of bucket) {
      const occurrence = occurrences.get(row) ?? 0;
      occurrences.set(row, occurrence + 1);
      keys.push(sourceKeys.get(row)![occurrence]);
      rowIndices.push(rows.length + groups.length);
      rows.push(row);
    }
  }
  return { rows, keys, groups, rowIndices };
}

export function sectionPageLayout<T>(
  model: ItemTableSections<T>,
  start: number,
  length: number,
): TableBodySections {
  const end = start + length;
  return {
    headers: model.groups
      .filter((group) => group.start < end && group.end > start)
      .map((group) => ({
        key: group.key,
        title: group.title,
        rowIndex: Math.max(group.start, start) - start,
        index: group.index,
      })),
    rowIndices: model.rowIndices.slice(start, end),
    rowCount: model.rows.length + model.groups.length,
  };
}
