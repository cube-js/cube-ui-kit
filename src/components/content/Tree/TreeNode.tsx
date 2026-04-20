import { memo, useMemo, useRef } from 'react';
import { useHover, useTreeItem } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { DirectionIcon, LoadingIcon } from '../../../icons';
import { mergeProps } from '../../../utils/react';
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
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import type { TreeState } from 'react-stately';
import type { CubeTreeNodeData } from './types';

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
  /** Whether the entire tree is `blockNode`. */
  isBlockNode: boolean;

  /** Toggle this row's checkbox (cascades). */
  onToggleChecked: (key: string) => void;

  /** Styles applied to the visible row (`TreeRowItem`). */
  rowStyles?: Styles;
}

const ROW_LEVEL_OFFSET = 0; // root nodes start at level 0

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
    isBlockNode,
    onToggleChecked,
    rowStyles,
  } = props;

  const rowRef = useRef<HTMLDivElement>(null);

  const { rowProps, gridCellProps, expandButtonProps, isPressed } = useTreeItem(
    { node },
    state,
    rowRef,
  );

  const isDisabled = state.disabledKeys.has(node.key);
  const isSelected = state.selectionManager.isSelected(node.key);

  /**
   * `useTreeItem` doesn't track hover. The `Item` variant we extend
   * (`default.item`) uses the `hovered` mod (compiled to
   * `[data-hovered]`), so we run `useHover` ourselves and wire its
   * `hoverProps` into the row.
   */
  const { hoverProps, isHovered } = useHover({ isDisabled });
  /**
   * React Aria uses a roving-tabindex "virtual focus" model for treegrid:
   * only the row matching `selectionManager.focusedKey` is tabbable, and
   * arrow-key navigation updates that key instead of moving DOM focus
   * between every row. No `data-focused` / `:focus-visible` lands on the
   * row, so we mirror the focused key as a `focused` mod on the item
   * to make it stylable.
   */
  const isFocused =
    state.selectionManager.isFocused &&
    state.selectionManager.focusedKey === node.key;
  /**
   * `useTreeItem` reports `aria-expanded` only on rows that *can* expand
   * (i.e. have child nodes in the collection). For lazy rows with no
   * children loaded yet but `isLeaf !== true`, we still want to render
   * a toggle so the consumer can fire `loadData`.
   */
  const isLeaf =
    data.isLeaf === true || (data.isLeaf !== false && !node.hasChildNodes);
  const isRowCheckable = isCheckable && data.isCheckable !== false;

  const handleCheckboxClick = useEvent(
    (e: ReactMouseEvent | ReactKeyboardEvent) => {
      e.stopPropagation();
    },
  );

  const handleCheckboxChange = useEvent(() => {
    onToggleChecked(String(node.key));
  });

  const rowMods = useMemo(
    () => ({
      checked: isChecked,
      indeterminate: isIndeterminate,
      expanded: isExpanded,
      disabled: isDisabled,
      loading: isLoading,
      leaf: isLeaf,
      'block-node': isBlockNode,
      'has-checkbox': isRowCheckable,
    }),
    [
      isChecked,
      isIndeterminate,
      isExpanded,
      isDisabled,
      isLoading,
      isLeaf,
      isBlockNode,
      isRowCheckable,
    ],
  );

  const itemMods = useMemo(
    () => ({
      checked: isChecked,
      indeterminate: isIndeterminate,
      expanded: isExpanded,
      loading: isLoading,
      leaf: isLeaf,
      focused: isFocused,
      hovered: isHovered,
      pressed: isPressed,
      'has-checkbox': isRowCheckable,
    }),
    [
      isChecked,
      isIndeterminate,
      isExpanded,
      isLoading,
      isLeaf,
      isFocused,
      isHovered,
      isPressed,
      isRowCheckable,
    ],
  );

  /**
   * Indent each row by its depth. `node.level` is 0-based at the root.
   * Pushed down via a CSS custom property so the styled element can
   * compute padding without re-extracting styles per row.
   */
  const levelStyle = useMemo<CSSProperties>(
    () => ({
      ['--tree-level' as keyof CSSProperties]: String(
        (node.level ?? ROW_LEVEL_OFFSET) - ROW_LEVEL_OFFSET,
      ),
    }),
    [node.level],
  );

  /**
   * `aria-checked` for treegrid rows that act as multi-state checkboxes.
   * Only set when the tree is checkable, so we don't pollute the row
   * with checkbox semantics in select-only mode.
   */
  const ariaChecked: ReactNode = isRowCheckable
    ? isIndeterminate
      ? 'mixed'
      : isChecked
        ? 'true'
        : 'false'
    : undefined;

  const finalRowProps = mergeProps(rowProps, hoverProps, {
    'aria-checked': ariaChecked as string | boolean | undefined,
  });

  /**
   * Always render a toggle slot — even for leaf rows — so siblings
   * at the same indent level visually align. Leaves get a
   * non-interactive placeholder (a plain div) so user clicks can't
   * trigger anything.
   */
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
      onClick={handleCheckboxClick}
      onKeyDown={handleCheckboxClick}
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

  return (
    <TreeNodeRow
      {...finalRowProps}
      ref={rowRef}
      mods={rowMods}
      style={levelStyle}
      data-element="Row"
      data-qa-key={String(node.key)}
    >
      <TreeRowItem
        {...gridCellProps}
        isSelected={isSelected}
        mods={itemMods}
        icon={toggleNode}
        prefix={checkboxNode}
        styles={rowStyles}
      >
        {data.title}
      </TreeRowItem>
    </TreeNodeRow>
  );
}

export const TreeNode = memo(TreeNodeInner);
