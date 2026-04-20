import { OUTER_STYLES } from '@tenphi/tasty';
import { forwardRef, useMemo, useRef } from 'react';
import { useTree } from 'react-aria';
import { Item, useTreeState } from 'react-stately';

import { useEvent } from '../../../_internal/hooks';
import { mergeProps } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import { TreeElement } from './styled';
import { TreeNode } from './TreeNode';
import { useCheckboxTree } from './use-checkbox-tree';
import { useLoadData } from './use-load-data';

import type { Key, Node, Selection } from '@react-types/shared';
import type { CSSProperties, ForwardedRef, ReactElement } from 'react';
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
 * The visible row content is rendered by `TreeNode` via a
 * `nodesByKey` lookup, so the `<Item>`'s body is only used by
 * Stately to build the collection (`textValue` for keyboard nav,
 * `childItems` for nested traversal).
 *
 * For nested traversal to work, the `children` of the `<Tree>` must
 * be passed as a *function* together with the top-level `items`
 * array — see the `<Tree>` `useCollection` call below. Stately
 * propagates that renderer into `childItems` so nested arrays of
 * raw `CubeTreeNodeData` are turned back into `<Item>` elements.
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
      {node.title as any}
    </Item>
  );
}

/** Walk the treeData and build a flat `key -> node` index. */
function buildNodesByKey(
  treeData: CubeTreeNodeData[],
): Map<string, CubeTreeNodeData> {
  const map = new Map<string, CubeTreeNodeData>();
  const visit = (nodes: CubeTreeNodeData[]) => {
    for (const node of nodes) {
      map.set(node.key, node);
      if (node.children) visit(node.children);
    }
  };
  visit(treeData);
  return map;
}

/** Walk the treeData and collect all keys whose `isDisabled === true`. */
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

/**
 * Map `key -> parentKey` (used for `autoExpandParent`).
 */
function buildParentOf(
  treeData: CubeTreeNodeData[],
): Map<string, string | null> {
  const parentOf = new Map<string, string | null>();
  const visit = (nodes: CubeTreeNodeData[], parent: string | null) => {
    for (const node of nodes) {
      parentOf.set(node.key, parent);
      if (node.children) visit(node.children, node.key);
    }
  };
  visit(treeData, null);
  return parentOf;
}

/**
 * Expand the supplied keys with all of their ancestors. Used when
 * `autoExpandParent` is `true` so that the consumer can pass deep keys
 * (e.g. search matches) without having to manually walk parents.
 */
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
 * Coerce the public `selectionMode` / `isSelectable` pair into a single
 * `selectionMode` value for `useTreeState`.
 *
 * - `selectionMode` wins when both are passed.
 * - `isSelectable === false` is sugar for `selectionMode='none'`.
 * - `selectionMode` defaults to `'single'` (matches AntD's default).
 */
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
    blockNode = false,
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
    rowStyles,
    qa,
    ...otherProps
  } = props;

  const baseStyles = extractStyles(otherProps, OUTER_STYLES);

  const treeRef = useRef<HTMLDivElement>(null);

  const nodesByKey = useMemo(() => buildNodesByKey(treeData), [treeData]);
  const parentOf = useMemo(() => buildParentOf(treeData), [treeData]);

  const disabledKeys = useMemo(
    () => collectDisabledKeys(treeData, isDisabled),
    [treeData, isDisabled],
  );

  const selectionMode = resolveSelectionMode(selectionModeProp, isSelectable);

  /**
   * Apply `autoExpandParent` to the controlled `expandedKeys`. This is
   * a one-shot thing — once the consumer responds to `onExpand` and
   * sets `autoExpandParent` to `false`, we stop force-expanding parents.
   */
  const effectiveExpandedKeys = useMemo(
    () =>
      autoExpandParent
        ? expandWithParents(expandedKeys, parentOf)
        : expandedKeys,
    [autoExpandParent, expandedKeys, parentOf],
  );

  const checkbox = useCheckboxTree({
    treeData,
    isCheckable,
    defaultCheckedKeys,
    checkedKeys,
    onCheck,
  });

  const loadDataController = useLoadData({ nodesByKey, loadData });

  /**
   * Tracks the previously-expanded set so we can diff against the next set
   * inside `handleExpandedChange`. In controlled mode the parent owns the
   * truth (read from `effectiveExpandedKeys`); in uncontrolled mode this
   * ref is the only source for the previous state — `effectiveExpandedKeys`
   * is `undefined` and would otherwise produce an empty `previous` set,
   * mis-identifying every toggle.
   */
  const previousExpandedRef = useRef<Set<Key>>(
    new Set<Key>(expandedKeys ?? defaultExpandedKeys ?? []),
  );

  /**
   * Translate Stately's `Set<Key>` callbacks into the public AntD-flavoured
   * `Key[]` shape and dispatch the per-key load.
   */
  const handleExpandedChange = useEvent((nextSet: Set<Key>) => {
    loadDataController.onExpandedChanged(nextSet);

    const previous =
      expandedKeys !== undefined
        ? new Set<Key>(effectiveExpandedKeys ?? [])
        : previousExpandedRef.current;
    previousExpandedRef.current = new Set<Key>(nextSet);

    if (!onExpand) return;
    const nextArr: Key[] = Array.from(nextSet);

    /**
     * Find the single key that toggled relative to the previous set.
     * Useful for `info.node` and `info.expanded` — matches AntD.
     */
    let toggledKey: Key | null = null;
    let toggledExpanded = false;
    for (const k of nextArr) {
      if (!previous.has(k)) {
        toggledKey = k;
        toggledExpanded = true;
        break;
      }
    }
    if (toggledKey == null) {
      for (const k of previous) {
        if (!nextSet.has(k)) {
          toggledKey = k;
          toggledExpanded = false;
          break;
        }
      }
    }

    const node =
      toggledKey != null ? nodesByKey.get(String(toggledKey)) : undefined;
    const info: TreeOnExpandInfo = {
      expanded: toggledExpanded,
      node: node ?? ({} as CubeTreeNodeData),
    };
    onExpand(nextArr, info);
  });

  const handleSelectionChange = useEvent((selection: Selection) => {
    if (!onSelect) return;
    const arr: Key[] =
      selection === 'all'
        ? Array.from(nodesByKey.keys())
        : Array.from(selection);
    /**
     * Stately's `onSelectionChange` hands us the *next* selection only —
     * we don't get a "toggled key" diff for free. For `single` mode we
     * can infer it cheaply (it's the only entry); for `multiple` we
     * report the most recent addition. Falls back to the first key.
     */
    let toggledKey: Key | null = null;
    let toggledSelected = false;
    if (selectionMode === 'single') {
      toggledKey = arr[0] ?? null;
      toggledSelected = arr.length > 0;
    } else if (selection !== 'all') {
      toggledKey = arr.length > 0 ? arr[arr.length - 1] : null;
      toggledSelected = arr.length > 0;
    } else {
      toggledKey = arr[0] ?? null;
      toggledSelected = true;
    }

    const node =
      toggledKey != null ? nodesByKey.get(String(toggledKey)) : undefined;
    const selectedNodes = arr
      .map((k) => nodesByKey.get(String(k)))
      .filter((n): n is CubeTreeNodeData => !!n);

    const info: TreeOnSelectInfo = {
      selected: toggledSelected,
      node: node ?? ({} as CubeTreeNodeData),
      selectedNodes,
    };

    onSelect(arr, info);
  });

  /**
   * Stately propagates the `children` function through `childItems`,
   * so a single render function recursively turns the entire
   * `treeData` array into `<Item>` elements.
   */
  const renderCollectionItem = useEvent((item: CubeTreeNodeData) =>
    renderItem(item),
  );

  const ariaProps = useMemo(
    () => ({
      selectionMode,
      selectedKeys,
      defaultSelectedKeys,
      onSelectionChange:
        onSelect && selectionMode !== 'none'
          ? handleSelectionChange
          : undefined,
      expandedKeys: effectiveExpandedKeys,
      defaultExpandedKeys,
      onExpandedChange: handleExpandedChange,
      disabledKeys,
      disabledBehavior: 'all' as const,
      items: treeData,
      children: renderCollectionItem as any,
      'aria-label': 'Tree',
    }),
    [
      selectionMode,
      selectedKeys,
      defaultSelectedKeys,
      onSelect,
      handleSelectionChange,
      effectiveExpandedKeys,
      defaultExpandedKeys,
      handleExpandedChange,
      disabledKeys,
      treeData,
      renderCollectionItem,
    ],
  );

  const baseState = useTreeState<CubeTreeNodeData>(ariaProps);

  /**
   * The legacy `TreeCollection` returned by `useTreeState` doesn't
   * implement `getChildren`, but `@react-aria/tree`'s `useTree`
   * (via `useGridListItem`) calls it unguarded for any nested row
   * (`node.level > 0`). Patch it once so `useTree` works on top of
   * the legacy state without forking.
   */
  const state = useMemo(() => {
    const collection = baseState.collection;
    if (typeof (collection as any).getChildren === 'function') {
      return baseState;
    }
    const getChildren = (key: Key): Iterable<Node<CubeTreeNodeData>> => {
      const result: Node<CubeTreeNodeData>[] = [];
      const node = collection.getItem(key);
      if (!node) return result;
      for (const child of node.childNodes) {
        result.push(child);
      }
      return result;
    };
    const patched = Object.assign(
      Object.create(Object.getPrototypeOf(collection)),
      collection,
      { getChildren },
    );
    return { ...baseState, collection: patched };
  }, [baseState]);

  const { gridProps } = useTree(ariaProps, state, treeRef);

  /**
   * Iterate the collection in DOM order. The TreeCollection only walks
   * into expanded subtrees, so `getKeys()` already gives us *only*
   * visible rows — no manual filtering required.
   */
  const visibleNodes: Node<CubeTreeNodeData>[] = useMemo(() => {
    const out: Node<CubeTreeNodeData>[] = [];
    for (const key of state.collection.getKeys()) {
      const node = state.collection.getItem(key);
      if (node && node.type === 'item') out.push(node);
    }
    return out;
  }, [state.collection, state.expandedKeys]);

  const heightStyle = useMemo<CSSProperties | undefined>(
    () =>
      height != null
        ? ({
            ['--tree-height' as keyof CSSProperties]: `${height}px`,
          } as CSSProperties)
        : undefined,
    [height],
  );

  const mods = useMemo(
    () => ({
      'has-height': height != null,
    }),
    [height],
  );

  const elementProps = mergeProps(gridProps, {
    ref: ref ?? treeRef,
  });

  return (
    <TreeElement
      {...elementProps}
      ref={ref ?? treeRef}
      qa={qa ?? 'Tree'}
      mods={mods}
      styles={baseStyles}
      style={heightStyle}
    >
      {visibleNodes.map((node) => {
        const data = nodesByKey.get(String(node.key));
        if (!data) return null;
        const isExpanded = state.expandedKeys.has(node.key);
        return (
          <TreeNode
            key={node.key}
            node={node}
            data={data}
            state={state}
            isCheckable={isCheckable}
            isExpanded={isExpanded}
            isChecked={checkbox.checkedSet.has(String(node.key))}
            isIndeterminate={checkbox.halfCheckedSet.has(String(node.key))}
            isLoading={loadDataController.loadingKeys.has(String(node.key))}
            isBlockNode={blockNode}
            rowStyles={rowStyles}
            onToggleChecked={checkbox.toggle}
          />
        );
      })}
    </TreeElement>
  );
}

const _Tree = forwardRef(TreeBase);

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
