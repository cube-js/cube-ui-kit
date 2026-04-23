import { memo, useMemo, useRef } from 'react';
import { useHover, useTreeItem } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { DirectionIcon, LoadingIcon } from '../../../icons';
import { mergeProps, mergeRefs } from '../../../utils/react';
import { Checkbox } from '../../fields/Checkbox/Checkbox';

import {
  TreeNodeCheckboxWrapper,
  TreeNodeRow,
  TreeNodeToggle,
  TreeNodeTogglePlaceholder,
  TreeRowItem,
} from './styled';

import type { Node } from '@react-types/shared';
import type { Styles } from '@tenphi/tasty';
import type { CSSProperties, KeyboardEvent, SyntheticEvent } from 'react';
import type { TreeState } from 'react-stately';
import type { CubeTreeNodeData, TreeItemProps, TreeNodeState } from './types';

const stopPropagation = (e: SyntheticEvent) => {
  e.stopPropagation();
};

export interface TreeNodeProps {
  node: Node<CubeTreeNodeData>;
  /** The original `CubeTreeNodeData` for this row, looked up by key. */
  data: CubeTreeNodeData;
  state: TreeState<CubeTreeNodeData>;

  /** Whether the tree as a whole renders checkboxes. */
  isCheckable: boolean;
  /** Whether this row is currently expanded. */
  isExpanded: boolean;
  /** Whether the row is in an indeterminate (half-checked) state. */
  isIndeterminate: boolean;
  /** Whether the row is fully checked. */
  isChecked: boolean;
  /** Whether `loadData` is currently fetching this row's children. */
  isLoading: boolean;

  /** Toggle this row's checkbox (cascades). */
  onToggleChecked: (key: string) => void;

  /** Row size passed to the underlying Item. */
  size?: string;

  /** Per-node Item customization (static object or callback). */
  itemProps?:
    | TreeItemProps
    | ((data: CubeTreeNodeData, state: TreeNodeState) => TreeItemProps);

  /** Styles applied to the visible row (`TreeRowItem`). */
  rowStyles?: Styles;

  /** Inline style for virtualizer absolute positioning. */
  virtualStyle?: CSSProperties;
  /** Ref callback from `@tanstack/react-virtual` to measure row height. */
  virtualRef?: (element: HTMLElement | null) => void;
  /** Virtual index for `data-index` attribute. */
  virtualIndex?: number;
}

function TreeNodeInner(props: TreeNodeProps) {
  const {
    node,
    data,
    state,
    isCheckable,
    isExpanded,
    isIndeterminate,
    isChecked,
    isLoading,
    onToggleChecked,
    size,
    itemProps,
    rowStyles,
    virtualStyle,
    virtualRef,
    virtualIndex,
  } = props;

  const rowRef = useRef<HTMLDivElement>(null);
  const combinedRef = useMemo(
    () => (virtualRef ? mergeRefs(rowRef, virtualRef) : rowRef),
    [virtualRef],
  );

  const { rowProps, gridCellProps, expandButtonProps, isPressed } = useTreeItem(
    { node },
    state,
    rowRef,
  );

  const isDisabled = state.disabledKeys.has(node.key);
  const isSelected = state.selectionManager.isSelected(node.key);

  // `useTreeItem` doesn't track hover; we need it for the `hovered` mod.
  const { hoverProps, isHovered } = useHover({ isDisabled });
  // React Aria's treegrid uses roving tabindex, so no `data-focused`
  // attribute lands on the row — mirror it as a mod manually.
  const isFocused =
    state.selectionManager.isFocused &&
    state.selectionManager.focusedKey === node.key;
  // For lazy rows with no children yet, still render a toggle unless
  // explicitly marked as leaf.
  const isLeaf =
    data.isLeaf === true || (data.isLeaf !== false && !node.hasChildNodes);
  const isRowCheckable = isCheckable && data.isCheckable !== false;

  const handleCheckboxChange = useEvent(() => {
    onToggleChecked(String(node.key));
  });

  const handleKeyDown = useEvent((e: KeyboardEvent) => {
    if (
      e.key === ' ' &&
      isRowCheckable &&
      !isDisabled &&
      !data.isCheckboxDisabled
    ) {
      e.preventDefault();
      onToggleChecked(String(node.key));
    }
  });

  const sharedMods = useMemo(
    () => ({
      checked: isChecked,
      indeterminate: isIndeterminate,
      expanded: isExpanded,
      loading: isLoading,
      leaf: isLeaf,
      'has-checkbox': isRowCheckable,
    }),
    [isChecked, isIndeterminate, isExpanded, isLoading, isLeaf, isRowCheckable],
  );

  const rowMods = useMemo(
    () => ({ ...sharedMods, disabled: isDisabled }),
    [sharedMods, isDisabled],
  );

  const itemMods = useMemo(
    () => ({
      ...sharedMods,
      focused: isFocused,
      hovered: isHovered,
      pressed: isPressed,
    }),
    [sharedMods, isFocused, isHovered, isPressed],
  );

  const rowStyle = useMemo<CSSProperties>(
    () => ({
      ['--tree-level' as keyof CSSProperties]: String(node.level ?? 0),
      ...virtualStyle,
    }),
    [node.level, virtualStyle],
  );

  // Only emit `aria-checked` when the tree is in checkable mode.
  const ariaChecked: 'mixed' | 'true' | 'false' | undefined = isRowCheckable
    ? isIndeterminate
      ? 'mixed'
      : isChecked
        ? 'true'
        : 'false'
    : undefined;

  const finalRowProps = mergeProps(rowProps, hoverProps, {
    'aria-checked': ariaChecked,
    onKeyDown: handleKeyDown,
  });

  // Leaf rows get a placeholder so sibling indents align.
  const toggleNode = isLeaf ? (
    <TreeNodeTogglePlaceholder aria-hidden data-element="Toggle" />
  ) : (
    <TreeNodeToggle {...expandButtonProps} tabIndex={-1} data-element="Toggle">
      {isLoading ? (
        <LoadingIcon />
      ) : (
        <DirectionIcon to={isExpanded ? 'bottom' : 'right'} />
      )}
    </TreeNodeToggle>
  );

  const checkboxNode = isRowCheckable ? (
    <TreeNodeCheckboxWrapper
      data-element="Checkbox"
      role="presentation"
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <Checkbox
        isSelected={isChecked}
        isIndeterminate={isIndeterminate}
        isDisabled={isDisabled || data.isCheckboxDisabled}
        aria-label={
          typeof data.title === 'string' ? data.title : String(node.key)
        }
        // @ts-expect-error AriaCheckboxProps loses `onChange` where InputDOMProps overlaps (react-types).
        onChange={handleCheckboxChange}
      />
    </TreeNodeCheckboxWrapper>
  ) : null;

  const nodeState: TreeNodeState = {
    isExpanded,
    isSelected,
    isChecked,
    isIndeterminate,
    isLeaf,
  };
  const resolvedItemProps =
    typeof itemProps === 'function' ? itemProps(data, nodeState) : itemProps;
  const { prefix: userPrefix, ...restUserProps } = resolvedItemProps ?? {};

  const composedPrefix =
    checkboxNode || userPrefix ? (
      <>
        {checkboxNode}
        {userPrefix}
      </>
    ) : null;

  return (
    <TreeNodeRow
      {...finalRowProps}
      ref={combinedRef}
      mods={rowMods}
      style={rowStyle}
      data-element="Row"
      data-qa-key={String(node.key)}
      data-index={virtualIndex}
    >
      <TreeRowItem
        {...gridCellProps}
        {...restUserProps}
        size={size}
        isSelected={isSelected}
        isDisabled={isDisabled}
        mods={itemMods}
        icon={toggleNode}
        prefix={composedPrefix}
        styles={rowStyles}
      >
        {data.title}
      </TreeRowItem>
    </TreeNodeRow>
  );
}

export const TreeNode = memo(TreeNodeInner);
