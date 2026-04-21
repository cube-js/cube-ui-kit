import { useRef, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import type { Key } from '@react-types/shared';
import type { CubeTreeNodeData, TreeLoadDataNode } from './types';

export interface UseLoadDataOptions {
  /**
   * Map of `key -> node` built from the consumer's `treeData`. Used to
   * find the node being expanded when `loadData` fires.
   */
  nodesByKey: Map<string, CubeTreeNodeData>;
  loadData?: (node: TreeLoadDataNode) => Promise<void>;
  /**
   * Keys that are expanded at mount time (controlled or default).
   * Seeds `previousExpandedRef` so the first `onExpandedChanged` call
   * doesn't misidentify them as user-triggered expansions.
   */
  initialExpandedKeys?: Iterable<string>;
}

export interface LoadDataController {
  /** Set of keys that are currently waiting on `loadData`. */
  loadingKeys: Set<string>;
  /**
   * Called by `Tree.tsx` whenever the underlying React Stately state's
   * `expandedKeys` change. We diff against the previous set, and for
   * each newly-expanded key we trigger `loadData` if appropriate.
   */
  onExpandedChanged: (expandedKeys: Iterable<Key>) => void;
}

/**
 * Tracks which rows are currently fetching their children via `loadData`
 * and exposes a setter for the Tree to call after every expand change.
 *
 * `loadData` is fired exactly once per key per "first expand" event:
 *
 * - Skipped if there is no `loadData` callback.
 * - Skipped for leaf nodes (`isLeaf === true`).
 * - Skipped if the node already has `children` (already loaded).
 * - Skipped if a previous fetch for the same key is still in flight.
 *
 * The promise's resolution is awaited only to clear the `loading` mod;
 * the consumer is expected to commit the new children to the controlled
 * `treeData` themselves (matching AntD's pattern).
 */
export function useLoadData(opts: UseLoadDataOptions): LoadDataController {
  const { nodesByKey, loadData, initialExpandedKeys } = opts;
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(() => new Set());
  const previousExpandedRef = useRef<Set<string>>(new Set(initialExpandedKeys));
  const inFlightRef = useRef<Set<string>>(new Set());

  const onExpandedChanged = useEvent((expandedKeys: Iterable<Key>) => {
    const next = new Set<string>();
    for (const k of expandedKeys) next.add(String(k));

    const prev = previousExpandedRef.current;
    const newlyExpanded: string[] = [];
    for (const k of next) {
      if (!prev.has(k)) newlyExpanded.push(k);
    }
    previousExpandedRef.current = next;

    if (!loadData || newlyExpanded.length === 0) return;

    const toLoad: string[] = [];
    for (const key of newlyExpanded) {
      const node = nodesByKey.get(key);
      if (!node) continue;
      if (node.isLeaf) continue;
      if (node.children && node.children.length > 0) continue;
      if (inFlightRef.current.has(key)) continue;
      inFlightRef.current.add(key);
      toLoad.push(key);
    }

    if (toLoad.length === 0) return;

    setLoadingKeys((current) => {
      const updated = new Set(current);
      for (const k of toLoad) updated.add(k);
      return updated;
    });

    for (const key of toLoad) {
      const loadNode = nodesByKey.get(key);
      Promise.resolve(loadData({ key, children: loadNode?.children }))
        .catch((err) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error(`[Tree] loadData failed for key "${key}":`, err);
          }
        })
        .finally(() => {
          inFlightRef.current.delete(key);
          setLoadingKeys((current) => {
            if (!current.has(key)) return current;
            const updated = new Set(current);
            updated.delete(key);
            return updated;
          });
        });
    }
  });

  return { loadingKeys, onExpandedChanged };
}
