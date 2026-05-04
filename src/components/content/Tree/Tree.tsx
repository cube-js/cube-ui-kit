import { useVirtualizer } from '@tanstack/react-virtual';
import { OUTER_STYLES } from '@tenphi/tasty';
import { forwardRef, useLayoutEffect, useMemo, useRef } from 'react';
import { useTree } from 'react-aria';
import { Item, useTreeState } from 'react-stately';

import { useEvent } from '../../../_internal/hooks';
import { SIZE_NAME_TO_KEY, SIZES } from '../../../tokens/sizes';
import { mergeRefs } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import { TreeElement, TreeScrollContainer } from './styled';
import { buildTreeIndex } from './tree-index';
import { TreeNode } from './TreeNode';
import { useCheckboxTree } from './use-checkbox-tree';
import { useLoadData } from './use-load-data';

import type { Key, Node, Selection } from '@react-types/shared';
import type {
  CSSProperties,
  ForwardedRef,
  ReactElement,
  ReactNode,
} from 'react';
import type {
  CubeTreeNodeData,
  CubeTreeProps,
  TreeOnExpandInfo,
  TreeOnSelectInfo,
  TreeSelectionMode,
} from './types';

/**
 * Render an `<Item>` for React Stately's collection builder.
 *
 * The visible content is rendered by `TreeNode` via `nodesByKey`,
 * so `<Item>`'s body is only used by Stately for the collection
 * (`textValue` for keyboard nav, `childItems` for nested traversal).
 */
function renderItem(node: CubeTreeNodeData): ReactElement {
  const textValue =
    typeof node.title === 'string' ? node.title : String(node.key);
  return (
    <Item
      key={node.key}
      textValue={textValue}
      childItems={node.children as CubeTreeNodeData[] | undefined}
    >
      {node.title as ReactNode}
    </Item>
  );
}

function collectDisabledKeys(
  treeData: CubeTreeNodeData[],
  treeIsDisabled: boolean,
): string[] {
  const keys: string[] = [];
  const visit = (nodes: CubeTreeNodeData[]) => {
    for (const node of nodes) {
      if (treeIsDisabled || node.isDisabled) keys.push(node.key);
      if (node.children) visit(node.children);
    }
  };
  visit(treeData);
  return keys;
}

/** Expand the supplied keys with all of their ancestor keys. */
function expandWithParents(
  keys: string[] | undefined,
  parentOf: Map<string, string | null>,
): string[] | undefined {
  if (!keys || keys.length === 0) return keys;
  const set = new Set<string>(keys);
  for (const key of keys) {
    let parent = parentOf.get(key);
    while (parent) {
      set.add(parent);
      parent = parentOf.get(parent);
    }
  }
  return Array.from(set);
}

/**
 * Diff two key sets to find the single key that was added or removed.
 * Returns `null` when both sets are equal.
 */
function findToggledKey(
  previous: Set<Key>,
  next: Set<Key>,
): { key: Key; added: boolean } | null {
  for (const k of next) {
    if (!previous.has(k)) return { key: k, added: true };
  }
  for (const k of previous) {
    if (!next.has(k)) return { key: k, added: false };
  }
  return null;
}

function resolveSelectionMode(
  selectionMode: TreeSelectionMode | undefined,
  isSelectable: boolean | undefined,
): TreeSelectionMode {
  if (selectionMode != null) return selectionMode;
  if (isSelectable === false) return 'none';
  return 'single';
}

function TreeBase(props: CubeTreeProps, ref: ForwardedRef<HTMLDivElement>) {
  const {
    treeData,
    isCheckable = false,
    isSelectable,
    selectionMode: selectionModeProp,
    size = 'medium',
    shape = 'default',
    containerPadding = 4,
    isDisabled = false,
    defaultExpandedKeys,
    expandedKeys,
    autoExpandParent = false,
    defaultCheckedKeys,
    checkedKeys,
    defaultSelectedKeys,
    selectedKeys,
    height,
    loadData,
    onExpand,
    onCheck,
    onSelect,
    itemProps,
    rowStyles,
    ariaLabel,
    qa,
    menu: treeMenu,
    contextMenu: treeContextMenu,
    onAction: treeOnAction,
    menuTriggerProps,
    menuProps,
    ...otherProps
  } = props;

  const baseStyles = extractStyles(otherProps, OUTER_STYLES);

  const treeRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const treeIndex = useMemo(() => buildTreeIndex(treeData), [treeData]);
  const nodesByKey = treeIndex.byKey;
  const parentOf = treeIndex.parentOf;

  const disabledKeys = useMemo(
    () => collectDisabledKeys(treeData, isDisabled),
    [treeData, isDisabled],
  );

  const selectionMode = resolveSelectionMode(selectionModeProp, isSelectable);

  const effectiveExpandedKeys = useMemo(
    () =>
      autoExpandParent
        ? expandWithParents(expandedKeys, parentOf)
        : expandedKeys,
    [autoExpandParent, expandedKeys, parentOf],
  );

  const effectiveDefaultExpandedKeys = useMemo(
    () =>
      autoExpandParent
        ? expandWithParents(defaultExpandedKeys, parentOf)
        : defaultExpandedKeys,
    [autoExpandParent, defaultExpandedKeys, parentOf],
  );

  const checkbox = useCheckboxTree({
    treeData,
    index: treeIndex,
    isCheckable,
    defaultCheckedKeys,
    checkedKeys,
    onCheck,
  });

  const loadDataController = useLoadData({
    nodesByKey,
    loadData,
    initialExpandedKeys: effectiveExpandedKeys ?? effectiveDefaultExpandedKeys,
  });

  /**
   * In controlled mode, `previous` is read from `effectiveExpandedKeys`;
   * in uncontrolled mode this ref is the only source. Initialized from
   * the *effective* (ancestor-expanded) keys so the first toggle diffs
   * correctly.
   */
  const previousExpandedRef = useRef<Set<Key>>(
    new Set<Key>(effectiveExpandedKeys ?? effectiveDefaultExpandedKeys ?? []),
  );

  const handleExpandedChange = useEvent((nextSet: Set<Key>) => {
    loadDataController.onExpandedChanged(nextSet);

    const previous =
      expandedKeys !== undefined
        ? new Set<Key>(effectiveExpandedKeys ?? [])
        : previousExpandedRef.current;
    previousExpandedRef.current = new Set<Key>(nextSet);

    if (!onExpand) return;

    const toggled = findToggledKey(previous, nextSet);
    if (!toggled) return;

    const node = nodesByKey.get(String(toggled.key));
    if (!node) return;

    const info: TreeOnExpandInfo = {
      expanded: toggled.added,
      node,
    };
    onExpand(Array.from(nextSet), info);
  });

  /**
   * Same pattern as `previousExpandedRef`: in controlled mode we read
   * from `selectedKeys`; in uncontrolled mode this ref tracks state.
   */
  const previousSelectionRef = useRef<Set<Key>>(
    new Set<Key>(selectedKeys ?? defaultSelectedKeys ?? []),
  );

  /**
   * `useEvent` captures the closure lazily, so `state` (declared below
   * `ariaProps` / `useTreeState`) is safely accessible at call time.
   */
  const handleSelectionChange = useEvent((selection: Selection) => {
    if (!onSelect) return;
    let arr: Key[];
    if (selection === 'all') {
      // `nodesByKey` contains the full tree; use the collection's visible
      // keys so we don't leak keys under collapsed parents.
      arr = [];
      for (const key of state.collection.getKeys()) {
        const node = state.collection.getItem(key);
        if (node && node.type === 'item') arr.push(key);
      }
    } else {
      arr = Array.from(selection);
    }

    const nextSet = new Set<Key>(arr);
    const previous =
      selectedKeys !== undefined
        ? new Set<Key>(selectedKeys ?? [])
        : previousSelectionRef.current;
    previousSelectionRef.current = nextSet;

    const toggled = findToggledKey(previous, nextSet);
    if (!toggled) return;

    const node = nodesByKey.get(String(toggled.key));
    if (!node) return;

    const selectedNodes = arr
      .map((k) => nodesByKey.get(String(k)))
      .filter((n): n is CubeTreeNodeData => !!n);

    const info: TreeOnSelectInfo = {
      selected: toggled.added,
      node,
      selectedNodes,
    };

    onSelect(arr, info);
  });

  const hasOnSelect = onSelect != null;

  const ariaProps = useMemo(
    () => ({
      selectionMode,
      selectedKeys,
      defaultSelectedKeys,
      onSelectionChange:
        hasOnSelect && selectionMode !== 'none'
          ? handleSelectionChange
          : undefined,
      expandedKeys: effectiveExpandedKeys,
      defaultExpandedKeys: effectiveDefaultExpandedKeys,
      onExpandedChange: handleExpandedChange,
      disabledKeys,
      disabledBehavior: 'all' as const,
      items: treeData,
      children: renderItem as any,
      'aria-label': ariaLabel ?? 'Tree',
    }),
    [
      selectionMode,
      selectedKeys,
      defaultSelectedKeys,
      hasOnSelect,
      handleSelectionChange,
      effectiveExpandedKeys,
      effectiveDefaultExpandedKeys,
      handleExpandedChange,
      disabledKeys,
      treeData,
      ariaLabel,
    ],
  );

  const baseState = useTreeState<CubeTreeNodeData>(ariaProps);

  // The legacy `TreeCollection` from `useTreeState` lacks `getChildren`,
  // but `useTree` calls it for nested rows. Derive a patched state.
  // TODO: Remove this patch when upgrading to a react-stately version
  // that ships `getChildren` on TreeCollection natively.
  const state = useMemo(() => {
    const collection = baseState.collection;
    if (typeof (collection as any).getChildren === 'function') {
      return baseState;
    }
    const patched = Object.create(collection);
    patched.getChildren = (key: Key): Iterable<Node<CubeTreeNodeData>> => {
      const node = collection.getItem(key);
      return node ? Array.from(node.childNodes) : [];
    };
    return { ...baseState, collection: patched };
  }, [baseState]);

  const { gridProps } = useTree(ariaProps, state, treeRef);

  const visibleNodes: Node<CubeTreeNodeData>[] = useMemo(() => {
    const out: Node<CubeTreeNodeData>[] = [];
    for (const key of state.collection.getKeys()) {
      const node = state.collection.getItem(key);
      if (node && node.type === 'item') out.push(node);
    }
    return out;
  }, [state.collection]);

  const visibleNodesRef = useRef(visibleNodes);
  visibleNodesRef.current = visibleNodes;

  // ----- Virtualization -----
  const rowVirtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index: number) => {
      const node = visibleNodesRef.current[index];
      return node?.key ?? index;
    },
    estimateSize: () => SIZES[SIZE_NAME_TO_KEY[size]],
    gap: 1,
    overscan: 10,
    paddingStart: containerPadding,
    paddingEnd: containerPadding,
  });

  const treeStyle = useMemo<CSSProperties | undefined>(() => {
    if (height == null) return undefined;
    return { ['--tree-height' as keyof CSSProperties]: `${height}px` };
  }, [height]);

  const sizerStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      width: '100%',
      height: `${rowVirtualizer.getTotalSize()}px`,
    }),
    [rowVirtualizer.getTotalSize()],
  );

  // Keep focused node visible during keyboard navigation.
  useLayoutEffect(() => {
    const focusedKey = state.selectionManager.focusedKey;
    if (focusedKey == null) return;

    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const row = scrollElement.querySelector(
      `[data-qa-key="${CSS.escape(String(focusedKey))}"]`,
    ) as HTMLElement | null;
    if (!row || typeof row.scrollIntoView !== 'function') return;

    row.scrollIntoView({ block: 'nearest' });
  }, [state.selectionManager.focusedKey]);

  const mods = useMemo(
    () => ({
      'has-height': height != null,
      shape,
    }),
    [height, shape],
  );

  // The forwarded ref points at the inner scroll container so
  // consumers can drive `scrollTop` directly. `treeRef` (used by
  // `useTree` for keyboard handling and as the role="treegrid"
  // anchor) stays internal on `TreeElement`.
  const mergedScrollRef = useMemo(
    () => mergeRefs(ref, scrollRef),
    [ref, scrollRef],
  );

  return (
    <TreeElement
      {...gridProps}
      ref={treeRef}
      qa={qa ?? 'Tree'}
      mods={mods}
      styles={baseStyles}
      style={treeStyle}
    >
      <TreeScrollContainer ref={mergedScrollRef}>
        <div role="presentation" style={sizerStyle}>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const node = visibleNodes[virtualItem.index];
            if (!node) return null;
            const keyStr = String(node.key);
            const data = nodesByKey.get(keyStr);
            if (!data) return null;
            return (
              <TreeNode
                key={node.key}
                node={node}
                data={data}
                state={state}
                isCheckable={isCheckable}
                isExpanded={state.expandedKeys.has(node.key)}
                isChecked={checkbox.checkedSet.has(keyStr)}
                isIndeterminate={checkbox.halfCheckedSet.has(keyStr)}
                isLoading={loadDataController.loadingKeys.has(keyStr)}
                size={size}
                itemProps={itemProps}
                rowStyles={rowStyles}
                virtualStyle={{
                  position: 'absolute',
                  top: 0,
                  left: containerPadding,
                  right: containerPadding,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                virtualRef={rowVirtualizer.measureElement}
                virtualIndex={virtualItem.index}
                menu={treeMenu}
                contextMenu={treeContextMenu}
                menuTriggerProps={menuTriggerProps}
                menuProps={menuProps}
                onToggleChecked={checkbox.toggle}
                onAction={treeOnAction}
              />
            );
          })}
        </div>
      </TreeScrollContainer>
    </TreeElement>
  );
}

const _Tree = forwardRef(TreeBase);
_Tree.displayName = 'Tree';

/**
 * Hierarchical data display with optional checkboxes, single/multi
 * selection, async lazy loading, and keyboard navigation.
 *
 * Built on `useTree` / `useTreeState` (React Aria + React Stately) and
 * styled with Tasty.
 *
 * @example
 * ```tsx
 * <Tree
 *   treeData={data}
 *   isCheckable
 *   selectionMode="none"
 *   defaultExpandedKeys={['root']}
 *   onCheck={(keys) => console.log(keys)}
 * />
 * ```
 */
export const Tree = _Tree;
