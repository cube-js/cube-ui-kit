import { Children, memo, useMemo, useRef, useState } from 'react';
import { useHover, useTreeItem } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { DirectionIcon, LoadingIcon, MoreIcon } from '../../../icons';
import { mergeProps, mergeRefs } from '../../../utils/react';
import { CubeItemActionProps, ItemAction } from '../../actions/ItemAction';
import { CubeMenuProps, Menu, MenuTrigger } from '../../actions/Menu';
import { useContextMenu } from '../../actions/use-context-menu';
import { Checkbox } from '../../fields/Checkbox/Checkbox';

import {
  TreeNodeCheckboxWrapper,
  TreeNodeRow,
  TreeNodeToggle,
  TreeNodeTogglePlaceholder,
  TreeRowItem,
} from './styled';

import type { Key, Node } from '@react-types/shared';
import type { Styles } from '@tenphi/tasty';
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  Ref,
  SyntheticEvent,
} from 'react';
import type { TreeState } from 'react-stately';
import type {
  CubeTreeNodeData,
  TreeContextMenu,
  TreeItemProps,
  TreeNodeState,
} from './types';

const stopPropagation = (e: SyntheticEvent) => {
  e.stopPropagation();
};

/** Check whether a `menu` ReactNode actually contains anything. */
function isMenuEmpty(menu: ReactNode): boolean {
  if (menu === null || menu === undefined || menu === false) return true;
  return Children.toArray(menu).length === 0;
}

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

  /** Tree-wide menu default (resolved against `data.menu`). */
  menu?:
    | ReactNode
    | ((data: CubeTreeNodeData, state: TreeNodeState) => ReactNode | null);
  /** Tree-wide `contextMenu` default. */
  contextMenu?: TreeContextMenu;
  /** Tree-wide `onAction` callback. */
  onAction?: (action: string, key: Key) => void;
  /** Forwarded to every per-row `MenuTrigger`. */
  menuTriggerProps?: Partial<CubeItemActionProps>;
  /** Forwarded to every per-row `Menu`. */
  menuProps?: Partial<CubeMenuProps<object>>;

  /**
   * When true, pressing a non-leaf row toggles its expansion instead
   * of triggering selection.
   */
  expandOnFolderClick?: boolean;
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
    menu: treeMenu,
    contextMenu: treeContextMenu,
    onAction: treeOnAction,
    menuTriggerProps,
    menuProps,
    expandOnFolderClick,
  } = props;

  const rowRef = useRef<HTMLDivElement>(null);

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

  const nodeState: TreeNodeState = {
    isExpanded,
    isSelected,
    isChecked,
    isIndeterminate,
    isLeaf,
  };

  // ---- Menu resolution (per-node override > tree-level) --------------------

  const effectiveMenuChildren: ReactNode =
    data.menu === null
      ? null
      : data.menu !== undefined
        ? data.menu
        : typeof treeMenu === 'function'
          ? treeMenu(data, nodeState)
          : treeMenu ?? null;
  const hasMenu = !isMenuEmpty(effectiveMenuChildren);

  const effectiveContextMenu: TreeContextMenu =
    data.contextMenu ?? treeContextMenu ?? false;
  // The menu is exposed only when the consumer opts in via
  // `contextMenu`. When `contextMenu` is `false` (default) we render
  // nothing, even if `menu` is provided — this matches the plan and
  // keeps default rows visually clean.
  const menuExposed =
    hasMenu &&
    (effectiveContextMenu === true || effectiveContextMenu === 'context-only');
  const contextMenuOnly = effectiveContextMenu === 'context-only';

  // Controlled state for menu trigger (enables keyboard opening with Shift+F10)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuAction = useEvent((action: Key) => {
    // Strip the ".$" prefix that React adds via Children.toArray/map.
    const actionStr = String(action);
    const normalizedAction = actionStr.startsWith('.$')
      ? actionStr.slice(2)
      : actionStr;
    data.onAction?.(normalizedAction);
    treeOnAction?.(normalizedAction, node.key);
    // Forward to the consumer-supplied `menuProps.onAction` so users
    // who pass extra `Menu` props through `menuProps` still receive
    // the action stream alongside the tree-level callback.
    menuProps?.onAction?.(normalizedAction);
  });

  const rowContextMenu = useContextMenu<HTMLDivElement, CubeMenuProps<object>>(
    Menu,
    { placement: 'bottom start' },
    {
      ...menuProps,
      onAction: handleMenuAction,
      children: effectiveMenuChildren,
    },
  );

  // ---- Checkbox ------------------------------------------------------------

  const handleCheckboxChange = useEvent(() => {
    onToggleChecked(String(node.key));
  });

  // ---- Folder-click interception ------------------------------------------

  const shouldExpandOnRowClick =
    !!expandOnFolderClick && !isLeaf && !isDisabled;

  const handleFolderRowClick = useEvent((e: ReactMouseEvent) => {
    // Only intercept primary-button clicks; let right-click reach
    // `useContextMenu` (it listens for the `contextmenu` event).
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    state.toggleKey(node.key);
    state.selectionManager.setFocused(true);
    state.selectionManager.setFocusedKey(node.key);
  });

  // Typed against the broader `MouseEvent` because both pointer and
  // mouse handlers route here. React's `PointerEvent<T>` extends
  // `MouseEvent<T>`, so via parameter contravariance this single
  // function is assignable to both `PointerEventHandler<T>` and
  // `MouseEventHandler<T>` slots without any casts.
  const handleFolderRowPointerEvent = useEvent(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      // Stop usePress from latching its `isPressed` state — the row is
      // not a press target anymore in this mode.
      e.stopPropagation();
    },
  );

  // ---- Keyboard ------------------------------------------------------------

  // Composed keydown handler. Runs BEFORE `rowProps.onKeyDown` from
  // `useTreeItem` so we can short-circuit the default react-aria
  // behavior (which would otherwise trigger selection on Enter/Space).
  // Returns `true` when the event was handled and react-aria's keydown
  // must NOT run.
  const handleKeyDown = useEvent((e: KeyboardEvent) => {
    // Space toggles the checkbox first when checkable.
    if (
      e.key === ' ' &&
      isRowCheckable &&
      !isDisabled &&
      !data.isCheckboxDisabled
    ) {
      e.preventDefault();
      e.stopPropagation();
      onToggleChecked(String(node.key));
      return true;
    }

    // Shift+F10 opens the row menu (standard accessibility shortcut).
    if (e.key === 'F10' && e.shiftKey && menuExposed) {
      e.preventDefault();
      e.stopPropagation();
      if (contextMenuOnly) {
        rowContextMenu.open();
      } else {
        setIsMenuOpen(true);
      }
      return true;
    }

    // Folder activation via keyboard in expandOnFolderClick mode.
    // Must run BEFORE `useTreeItem`'s onKeyDown so react-aria doesn't
    // also fire selection on the same keypress.
    //   - Enter always expands (matches the row-click behavior, even
    //     when the row is also checkable — Enter is not a checkbox key).
    //   - Space only expands when the row is NOT checkable; in
    //     checkable trees Space is reserved for the checkbox toggle
    //     (handled by the earlier branch).
    if (
      shouldExpandOnRowClick &&
      (e.key === 'Enter' || (e.key === ' ' && !isRowCheckable))
    ) {
      e.preventDefault();
      e.stopPropagation();
      state.toggleKey(node.key);
      state.selectionManager.setFocused(true);
      state.selectionManager.setFocusedKey(node.key);
      return true;
    }

    return false;
  });

  // Wrapper that delegates to react-aria's default keydown only when
  // our handler did not claim the event. Replaces (rather than
  // chains with) `rowProps.onKeyDown` so the order of handlers is
  // strictly: our shortcuts → react-aria default.
  const composedKeyDown = useEvent((e: KeyboardEvent<HTMLDivElement>) => {
    if (handleKeyDown(e)) return;
    rowProps.onKeyDown?.(e as unknown as globalThis.KeyboardEvent);
  });

  // ---- Mods ----------------------------------------------------------------

  const sharedMods = useMemo(
    () => ({
      checked: isChecked,
      indeterminate: isIndeterminate,
      expanded: isExpanded,
      loading: isLoading,
      leaf: isLeaf,
      'has-checkbox': isRowCheckable,
      'has-menu': menuExposed,
    }),
    [
      isChecked,
      isIndeterminate,
      isExpanded,
      isLoading,
      isLeaf,
      isRowCheckable,
      menuExposed,
    ],
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

  // ---- Compose row props ---------------------------------------------------

  // Merge react-aria + hover props but EXCLUDE `onKeyDown` from the
  // chain — `composedKeyDown` already wraps `rowProps.onKeyDown` and
  // must run first to short-circuit Enter/Space selection in
  // `expandOnFolderClick` mode.
  const baseRowProps = {
    ...mergeProps(rowProps, hoverProps),
    'aria-checked': ariaChecked,
    onKeyDown: composedKeyDown,
  };

  // When `expandOnFolderClick` applies, replace the click + pointer
  // handlers so usePress (from `useSelectableItem`) doesn't trigger
  // selection. We still want focus/keyboard nav, so we manually call
  // `setFocusedKey` + `setFocused`.
  const finalRowProps = shouldExpandOnRowClick
    ? {
        ...baseRowProps,
        onClick: handleFolderRowClick,
        onPointerDown: handleFolderRowPointerEvent,
        onPointerUp: handleFolderRowPointerEvent,
        onMouseDown: handleFolderRowPointerEvent,
        onMouseUp: handleFolderRowPointerEvent,
      }
    : baseRowProps;

  // ---- Toggle (chevron) and checkbox slots --------------------------------

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

  // ---- Resolve user-supplied per-node Item props --------------------------

  const resolvedItemProps =
    typeof itemProps === 'function' ? itemProps(data, nodeState) : itemProps;
  const {
    prefix: userPrefix,
    actions: userActions,
    ...restUserProps
  } = resolvedItemProps ?? {};

  const composedPrefix =
    checkboxNode || userPrefix ? (
      <>
        {checkboxNode}
        {userPrefix}
      </>
    ) : null;

  // ---- Built-in overflow `⋮` action ---------------------------------------

  const menuAction =
    menuExposed && !contextMenuOnly ? (
      <MenuTrigger isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <ItemAction
          tabIndex={-1}
          icon={<MoreIcon />}
          aria-label="Actions"
          {...menuTriggerProps}
        />
        <Menu {...menuProps} onAction={handleMenuAction}>
          {effectiveMenuChildren}
        </Menu>
      </MenuTrigger>
    ) : null;

  // Compose with user-supplied actions (user actions render first).
  const composedActions =
    userActions || menuAction ? (
      <>
        {userActions}
        {menuAction}
      </>
    ) : undefined;

  // ---- Refs / context-menu wiring -----------------------------------------

  // When the context menu is enabled for this row, attach the hook's
  // `targetRef` to the row so right-clicks land on the correct anchor.
  const refs = useMemo(() => {
    const list: Ref<HTMLDivElement>[] = [rowRef];
    if (virtualRef) list.push(virtualRef);
    if (menuExposed) list.push(rowContextMenu.targetRef);
    return mergeRefs(...list);
  }, [virtualRef, menuExposed, rowContextMenu.targetRef]);

  return (
    <TreeNodeRow
      {...finalRowProps}
      ref={refs}
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
        actions={composedActions}
        styles={rowStyles}
      >
        {data.title}
      </TreeRowItem>
      {menuExposed && rowContextMenu.rendered}
    </TreeNodeRow>
  );
}

export const TreeNode = memo(TreeNodeInner);
