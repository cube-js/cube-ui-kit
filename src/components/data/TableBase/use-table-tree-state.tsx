import { useControlledState } from '@react-stately/utils';
import { useMemo } from 'react';
import { Item, useTreeState } from 'react-stately';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';

import type { Key, Node } from '@react-types/shared';
import type { ReactElement } from 'react';
import type { TreeState } from 'react-stately';
import type { TableTreeNode } from './table-tree';
import type { CubeTableRowExpandInfo } from './types';

export interface UseTableTreeStateOptions<T> {
  roots: TableTreeNode<T>[];
  allNodesByKey: Map<Key, TableTreeNode<T>>;
  expandedKeys?: Key[];
  defaultExpandedKeys?: Key[];
  forcedExpandedKeys?: ReadonlySet<Key>;
  disabledKeys?: Key[];
  getTextValue: (node: TableTreeNode<T>) => string;
  onExpand?: (keys: Key[], info: CubeTableRowExpandInfo<T>) => void;
  ariaLabel?: string;
}

export interface TableTreeStateResult<T> {
  state: TreeState<TableTreeNode<T>>;
  /** Props consumed by `useTree` on the actual `<table>`. */
  ariaProps: Record<string, any>;
  visibleNodes: Node<TableTreeNode<T>>[];
  visibleEntries: TableTreeNode<T>[];
  expandedKeys: Set<Key>;
}

export function useTableTreeState<T>(
  options: UseTableTreeStateOptions<T>,
): TableTreeStateResult<T> {
  const {
    roots,
    allNodesByKey,
    expandedKeys: controlledExpandedKeys,
    defaultExpandedKeys,
    forcedExpandedKeys,
    disabledKeys,
    getTextValue,
    onExpand,
    ariaLabel,
  } = options;
  const { t } = useI18n();

  const controlledSet = useMemo(
    () =>
      controlledExpandedKeys === undefined
        ? undefined
        : new Set<Key>(controlledExpandedKeys),
    [controlledExpandedKeys],
  );
  const defaultSet = useMemo(
    () => new Set<Key>(defaultExpandedKeys ?? []),
    [defaultExpandedKeys],
  );
  const [baseExpandedKeys, setBaseExpandedKeys] = useControlledState<Set<Key>>(
    controlledSet as Set<Key>,
    defaultSet,
  );

  const effectiveExpandedKeys = useMemo(() => {
    const keys = new Set(baseExpandedKeys);
    forcedExpandedKeys?.forEach((key) => keys.add(key));
    return keys;
  }, [baseExpandedKeys, forcedExpandedKeys]);

  const handleExpandedChange = useEvent((next: Set<Key>) => {
    let toggledKey: Key | null = null;
    let expanded = false;

    for (const key of next) {
      if (!effectiveExpandedKeys.has(key)) {
        toggledKey = key;
        expanded = true;
        break;
      }
    }

    if (toggledKey == null) {
      for (const key of effectiveExpandedKeys) {
        if (!next.has(key)) {
          toggledKey = key;
          expanded = false;
          break;
        }
      }
    }

    if (toggledKey == null) return;

    // Search-owned expansions are derived and cannot be collapsed until the
    // search clears. Crucially, they never leak into the consumer's state.
    if (!expanded && forcedExpandedKeys?.has(toggledKey)) return;

    const nextBase = new Set(baseExpandedKeys);
    if (expanded) nextBase.add(toggledKey);
    else nextBase.delete(toggledKey);
    setBaseExpandedKeys(nextBase);

    const node = allNodesByKey.get(toggledKey);
    if (!node) return;

    onExpand?.([...nextBase], {
      row: node.row,
      rowKey: node.key,
      level: node.level,
      parentKey: node.parentKey,
      expanded,
    });
  });

  const renderItem = useEvent(
    (node: TableTreeNode<T>): ReactElement => (
      <Item
        key={node.key}
        textValue={getTextValue(node)}
        childItems={node.children}
      >
        {getTextValue(node)}
      </Item>
    ),
  );

  const ariaProps = useMemo(
    () => ({
      items: roots,
      children: renderItem as any,
      selectionMode: 'none' as const,
      expandedKeys: effectiveExpandedKeys,
      onExpandedChange: handleExpandedChange,
      disabledKeys,
      disabledBehavior: 'all' as const,
      // Prevent `useTreeItem` from treating a row press as an implicit toggle.
      // Tables keep row activation and expansion as separate interactions.
      onAction: () => {},
      'aria-label': ariaLabel ?? t('itemTable.table', 'Table'),
    }),
    [
      roots,
      renderItem,
      effectiveExpandedKeys,
      handleExpandedChange,
      disabledKeys,
      ariaLabel,
      t,
    ],
  );

  const baseState = useTreeState<TableTreeNode<T>>(ariaProps);

  // Current React Stately's legacy TreeCollection omits `getChildren`, while
  // `useTreeItem` needs it for level/set-size/expanded metadata.
  const state = useMemo(() => {
    const collection = baseState.collection;
    if (typeof (collection as any).getChildren === 'function') return baseState;

    const patched = Object.create(collection);
    patched.getChildren = (key: Key) => {
      const node = collection.getItem(key);
      return node ? Array.from(node.childNodes) : [];
    };

    return { ...baseState, collection: patched } as typeof baseState;
  }, [baseState]);

  const visibleNodes = useMemo(() => {
    const output: Node<TableTreeNode<T>>[] = [];
    for (const key of state.collection.getKeys()) {
      const node = state.collection.getItem(key);
      if (node?.type === 'item') output.push(node);
    }
    return output;
  }, [state.collection]);

  const visibleEntries = useMemo(
    () =>
      visibleNodes
        .map((node) => node.value)
        .filter((node): node is TableTreeNode<T> => node != null),
    [visibleNodes],
  );

  return {
    state,
    ariaProps,
    visibleNodes,
    visibleEntries,
    expandedKeys: effectiveExpandedKeys,
  };
}
