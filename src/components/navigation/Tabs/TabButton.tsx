import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useDraggableItem,
  useFocus,
  useFocusVisible,
  useHover,
  useTab,
} from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { CloseIcon, MoreIcon } from '../../../icons';
import { mergeProps } from '../../../utils/react';
import { CubeItemActionProps, ItemAction } from '../../actions/ItemAction';
import { ItemActionProvider } from '../../actions/ItemActionContext';
import { CubeMenuProps, Menu, MenuTrigger } from '../../actions/Menu';
import { useContextMenu } from '../../actions/use-context-menu';

import { EditableTitle } from './EditableTitle';
import { TabContainer, TabElement } from './styled';
import { TabDropIndicator } from './TabDropIndicator';
import { useTabsContext } from './TabsContext';
import { ParsedTab, RADIO_SIZE_MAP } from './types';

import type { Key, Node } from '@react-types/shared';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import type { DraggableCollectionState } from 'react-stately';

// =============================================================================
// Event handlers for actions to prevent event propagation to tab button
// =============================================================================

const ACTIONS_EVENT_HANDLERS = {
  onClick: (e: MouseEvent) => e.stopPropagation(),
  onPointerDown: (e: PointerEvent) => e.stopPropagation(),
  onPointerUp: (e: PointerEvent) => e.stopPropagation(),
  onMouseDown: (e: MouseEvent) => e.stopPropagation(),
  onMouseUp: (e: MouseEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
    }
  },
};

// =============================================================================
// Menu Processing Utilities
// =============================================================================

interface MenuItemLikeProps {
  children?: ReactNode;
  isDisabled?: boolean;
  theme?: string;
}

/**
 * Extracts the raw key from a React element, stripping the ".$" prefix
 * that React adds via Children.map/toArray.
 */
function getRawKey(element: ReactElement): string | null {
  if (element.key == null) return null;
  const keyStr = String(element.key);
  return keyStr.startsWith('.$') ? keyStr.slice(2) : keyStr;
}

/**
 * Process menu items for predefined action keys (rename, delete).
 * Auto-adds labels and disables items when requirements aren't met.
 */
function processMenuItems(
  children: ReactNode,
  effectiveIsEditable: boolean,
  isDeletable: boolean,
): ReactNode {
  return Children.toArray(children).map((child) => {
    if (!isValidElement(child)) return child;

    const childKey = getRawKey(child);
    const childProps = child.props as MenuItemLikeProps;

    // Handle predefined action keys
    if (childKey === 'rename') {
      return cloneElement(child as ReactElement<MenuItemLikeProps>, {
        children: childProps.children ?? 'Rename',
        isDisabled: childProps.isDisabled ?? !effectiveIsEditable,
      });
    }
    if (childKey === 'delete') {
      return cloneElement(child as ReactElement<MenuItemLikeProps>, {
        children: childProps.children ?? 'Delete',
        theme: childProps.theme ?? 'danger',
        isDisabled: childProps.isDisabled ?? !isDeletable,
      });
    }

    // Recursively process Menu.Section children
    if (childProps.children && typeof childProps.children !== 'string') {
      return cloneElement(child as ReactElement<MenuItemLikeProps>, {
        children: processMenuItems(
          childProps.children,
          effectiveIsEditable,
          isDeletable,
        ),
      });
    }

    return child;
  });
}

/**
 * Check if menu children is empty (null, undefined, or empty fragment)
 */
function isMenuEmpty(menu: ReactNode): boolean {
  if (menu === null || menu === undefined) return true;
  const children = Children.toArray(menu);
  return children.length === 0;
}

// =============================================================================
// TabButton Props
// =============================================================================

export interface TabButtonProps {
  /** React Aria collection item */
  item: Node<object>;
  /** Parsed tab data */
  tabData: ParsedTab;
  /** Whether this is the last tab (for drop indicator) */
  isLastTab?: boolean;
}

// =============================================================================
// TabButton Component
// =============================================================================

/**
 * Individual tab button component.
 *
 * Uses TabsContext to access shared props, dramatically reducing prop drilling.
 * Handles:
 * - Tab selection and keyboard navigation
 * - Inline title editing
 * - Menu and context menu
 * - Drag-and-drop reordering
 * - Focus and hover states
 */
export function TabButton({ item, tabData, isLastTab }: TabButtonProps) {
  // Get shared context
  const {
    state,
    type,
    size,
    autoHideActions: parentShowActionsOnHover,
    isEditable: parentIsEditable,
    menu: parentMenu,
    menuTriggerProps: parentMenuTriggerProps,
    menuProps: parentMenuProps,
    contextMenu: parentContextMenu,
    onAction: parentOnAction,
    onDelete,
    dragState,
    dropState,
    editingKey,
    editValue,
    setEditValue,
    startEditing,
    submitEditing,
    cancelEditing,
  } = useTabsContext();

  const ref = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { tabProps } = useTab({ key: item.key }, state, ref);

  // Measure actions width for proper space allocation in Item
  const [actionsWidth, setActionsWidth] = useState(0);

  // Drag-and-drop support - only enable when both states are provided
  const isDraggable = !!dragState && !!dropState;

  // useDraggableItem must be called unconditionally (Rules of Hooks)
  // When dragState is undefined, we pass a minimal mock state to satisfy the hook
  const mockDragState = useMemo(
    () =>
      ({
        collection: state.collection,
        selectionManager: state.selectionManager,
        isDragging: () => false,
        getKeysForDrag: () => new Set<Key>(),
        isDisabled: false,
        startDrag: () => {},
        endDrag: () => {},
      }) as DraggableCollectionState,
    [state.collection, state.selectionManager],
  );

  const dragResult = useDraggableItem(
    { key: item.key },
    dragState ?? mockDragState,
  );
  const effectiveDragProps = isDraggable ? dragResult.dragProps : {};
  const isDragging = isDraggable && dragResult.isDragging;

  // Controlled state for menu trigger (enables keyboard opening with Shift+F10)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hover, focus, and focus-visible state handling
  const { hoverProps, isHovered } = useHover({});
  const [isFocused, setIsFocused] = useState(false);
  const { focusProps } = useFocus({ onFocusChange: setIsFocused });
  const { isFocusVisible } = useFocusVisible();

  // Suppress focus-visible when restoring focus after editing
  const [suppressFocusVisible, setSuppressFocusVisible] = useState(false);
  const effectiveFocusVisible = isFocusVisible && !suppressFocusVisible;

  const isActive = state.selectedKey === item.key;
  const isDisabled = state.disabledKeys.has(item.key);
  const isDeletable = !!onDelete;
  const isEditing = editingKey === item.key;

  // Compute effective values - Tab-level overrides Tabs-level
  const effectiveIsEditable = tabData.isEditable ?? parentIsEditable ?? false;
  const effectiveMenu =
    tabData.menu === null ? null : tabData.menu ?? parentMenu;
  const effectiveMenuTriggerProps: Partial<CubeItemActionProps> = {
    ...parentMenuTriggerProps,
    ...tabData.menuTriggerProps,
  };
  const effectiveMenuProps: Partial<CubeMenuProps<object>> = {
    ...parentMenuProps,
    ...tabData.menuProps,
  };
  const effectiveContextMenu =
    tabData.contextMenu ?? parentContextMenu ?? false;
  const effectiveType = tabData.type ?? type ?? 'default';

  // Delete button shown only if onDelete is set AND no menu
  const showDeleteButton = isDeletable && isMenuEmpty(effectiveMenu);

  // Process menu items for auto-labels and disabled states
  const processedMenu =
    effectiveMenu && !isMenuEmpty(effectiveMenu)
      ? processMenuItems(effectiveMenu, effectiveIsEditable, isDeletable)
      : null;

  const itemKeyStr = String(item.key);

  const handleDelete = useEvent(() => {
    onDelete?.(itemKeyStr);
  });

  const handleStartEditing = useEvent(() => {
    if (!effectiveIsEditable || isDisabled) return;

    const titleText =
      typeof tabData.title === 'string' ? tabData.title : itemKeyStr;

    startEditing(itemKeyStr, titleText);
  });

  const handleSubmitEditing = useEvent(() => {
    submitEditing(itemKeyStr, editValue, tabData.onTitleChange);
    // Suppress focus-visible and restore focus to the tab button after editing
    setSuppressFocusVisible(true);
    requestAnimationFrame(() => {
      ref.current?.focus();
    });
  });

  const handleCancelEditing = useEvent(() => {
    cancelEditing();
    // Suppress focus-visible and restore focus to the tab button after editing
    setSuppressFocusVisible(true);
    requestAnimationFrame(() => {
      ref.current?.focus();
    });
  });

  const handleEditValueChange = useEvent((value: string) => {
    setEditValue(value);
  });

  // Handle menu actions - predefined actions first, then callbacks
  const handleMenuAction = useEvent((action: Key) => {
    // Strip the ".$" prefix that React adds via Children.toArray/map
    const actionStr = String(action);
    const normalizedAction = actionStr.startsWith('.$')
      ? actionStr.slice(2)
      : actionStr;

    // Handle predefined actions first (only if requirements are met)
    if (normalizedAction === 'rename' && effectiveIsEditable) {
      handleStartEditing();
    }
    if (normalizedAction === 'delete' && isDeletable) {
      onDelete?.(itemKeyStr);
    }
    // Call Tab-level onAction first (with normalized action)
    tabData.onAction?.(normalizedAction);
    // Then call Tabs-level onAction with tab key (with normalized action)
    parentOnAction?.(normalizedAction, itemKeyStr);
  });

  // Keyboard handler for accessibility shortcuts (WAI-ARIA Tabs Pattern)
  const handleKeyDown = useEvent((e: KeyboardEvent) => {
    // Reset focus-visible suppression on any keyboard interaction
    if (suppressFocusVisible) {
      setSuppressFocusVisible(false);
    }

    // F2 to start editing (standard rename shortcut)
    if (e.key === 'F2' && effectiveIsEditable && !isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      handleStartEditing();
    }

    // Shift+F10 opens the menu (standard context menu shortcut)
    if (e.key === 'F10' && e.shiftKey && processedMenu) {
      e.preventDefault();
      e.stopPropagation();
      setIsMenuOpen(true);
    }

    // Delete key for direct tab deletion (ARIA Tabs pattern optional feature)
    // Skip when editing to allow normal text editing operations
    if (
      (e.key === 'Delete' || e.key === 'Backspace') &&
      isDeletable &&
      !isEditing
    ) {
      e.preventDefault();
      onDelete?.(itemKeyStr);
    }
  });

  const mods = useMemo(
    () => ({
      type: effectiveType,
      active: isActive,
      deletable: isDeletable,
      disabled: isDisabled,
      editing: isEditing,
      hovered: isHovered,
      focused: isFocused,
      'focus-visible': effectiveFocusVisible,
      draggable: isDraggable,
      dragging: isDragging,
    }),
    [
      effectiveType,
      isActive,
      isDeletable,
      isDisabled,
      isEditing,
      isHovered,
      isFocused,
      effectiveFocusVisible,
      isDraggable,
      isDragging,
    ],
  );

  // Scroll active tab into view
  useEffect(() => {
    if (ref.current && isActive) {
      ref.current.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }, [isActive]);

  // Build menu element
  const menuElement = processedMenu ? (
    <Menu {...effectiveMenuProps} onAction={handleMenuAction}>
      {processedMenu}
    </Menu>
  ) : null;

  // Use the useContextMenu hook for context menu handling
  const contextMenu = useContextMenu<HTMLDivElement, CubeMenuProps<object>>(
    Menu,
    { placement: 'bottom start' },
    {
      ...effectiveMenuProps,
      onAction: handleMenuAction,
      children: processedMenu,
    },
  );

  // Build menu trigger action with controlled state for keyboard accessibility
  const menuAction = menuElement ? (
    <MenuTrigger isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <ItemAction
        tabIndex={-1}
        icon={<MoreIcon />}
        {...effectiveMenuTriggerProps}
      />
      {menuElement}
    </MenuTrigger>
  ) : null;

  // Build delete button (only shown when no menu)
  const deleteAction = showDeleteButton ? (
    <ItemAction
      tabIndex={-1}
      icon={<CloseIcon />}
      tooltip="Delete tab"
      onPress={handleDelete}
    />
  ) : null;

  // Order: custom actions → menu trigger → delete button
  const actions =
    tabData.actions || menuAction || deleteAction ? (
      <>
        {tabData.actions}
        {menuAction}
        {deleteAction}
      </>
    ) : undefined;

  // Measure actions width to pass to Item for proper space allocation
  useLayoutEffect(() => {
    if (actions && actionsRef.current) {
      const width = Math.round(actionsRef.current.offsetWidth);

      if (width !== actionsWidth) {
        setActionsWidth(width);
      }
    }
  }, [actions, actionsWidth]);

  // Determine effective size
  const effectiveSize = tabData.size ?? size ?? 'medium';
  const itemSize =
    effectiveType === 'radio'
      ? RADIO_SIZE_MAP[effectiveSize === 'large' ? 'large' : 'medium']
      : effectiveSize;

  // Determine Item type prop
  const itemType =
    effectiveType === 'default' ? (isActive ? 'clear' : 'neutral') : 'neutral';

  // Determine shape - file type uses sharp edges
  const isFileType = effectiveType === 'file';
  const itemShape = isFileType ? 'sharp' : undefined;

  // Determine autoHideActions - tab-level overrides parent-level
  const effectiveShowActionsOnHover =
    tabData.autoHideActions ?? parentShowActionsOnHover;

  // Render title with editing support if editable
  const titleContent = effectiveIsEditable ? (
    <EditableTitle
      title={tabData.title}
      isEditing={isEditing}
      editValue={isEditing ? editValue : ''}
      onEditValueChange={handleEditValueChange}
      onStartEditing={handleStartEditing}
      onSubmit={handleSubmitEditing}
      onCancel={handleCancelEditing}
    />
  ) : (
    tabData.title
  );

  // Extract tab-specific props and pass through the rest (style props) to the Item
  const {
    title: _title,
    content: _content,
    key: _key,
    isDisabled: _isDisabled,
    prerender: _prerender,
    keepMounted: _keepMounted,
    size: _size,
    type: _type,
    actions: _actions,
    autoHideActions: _autoHideActions,
    isEditable: _isEditable,
    onTitleChange: _onTitleChange,
    menu: _menu,
    menuTriggerProps: _menuTriggerProps,
    menuProps: _menuProps,
    contextMenu: _contextMenu,
    onAction: _onAction,
    qa,
    qaVal,
    styles,
    ...itemStyleProps
  } = tabData;

  // Use the hook's targetRef when context menu is enabled
  const effectiveContainerRef =
    effectiveContextMenu && processedMenu
      ? contextMenu.targetRef
      : containerRef;

  // ARIA: indicate popup menu presence
  const ariaProps = processedMenu ? { 'aria-haspopup': 'menu' as const } : {};

  // Mods for TabContainer
  const containerMods = {
    ...mods,
    'show-actions-on-hover': effectiveShowActionsOnHover,
  };

  return (
    <TabContainer
      ref={effectiveContainerRef}
      data-size={itemSize}
      mods={containerMods}
      tokens={{ '$actions-width': `${actionsWidth}px` }}
      {...effectiveDragProps}
    >
      {/* Drop indicator before this tab */}
      {isDraggable && dropState && (
        <TabDropIndicator
          target={{ type: 'item', key: item.key, dropPosition: 'before' }}
          dropState={dropState}
          position="before"
        />
      )}
      <TabElement
        preserveActionsSpace
        autoHideActions={effectiveShowActionsOnHover}
        as="button"
        {...mergeProps(tabProps, hoverProps, focusProps, {
          onKeyDown: handleKeyDown,
        })}
        {...ariaProps}
        {...itemStyleProps}
        ref={ref}
        qa={qa ?? `Tab-${String(item.key)}`}
        qaVal={qaVal}
        styles={styles}
        mods={mods}
        isSelected={isActive}
        isDisabled={isDisabled}
        size={itemSize}
        type={itemType}
        shape={itemShape}
        actions={actions ? true : undefined}
      >
        {titleContent}
      </TabElement>
      {/* Actions rendered outside the button for accessibility */}
      {actions && (
        <div
          ref={actionsRef}
          data-element="Actions"
          {...ACTIONS_EVENT_HANDLERS}
        >
          <ItemActionProvider
            type={itemType}
            theme="default"
            isDisabled={isDisabled}
          >
            {actions}
          </ItemActionProvider>
        </div>
      )}
      {effectiveContextMenu && processedMenu && contextMenu.rendered}
      {/* Drop indicator after the last tab */}
      {isDraggable && dropState && isLastTab && (
        <TabDropIndicator
          target={{ type: 'item', key: item.key, dropPosition: 'after' }}
          dropState={dropState}
          position="after"
        />
      )}
    </TabContainer>
  );
}
