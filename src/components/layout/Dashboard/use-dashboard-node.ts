import { useContext, useState } from 'react';
import { useFocusWithin, useHover, useMove } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { mergeProps, useLayoutEffect } from '../../../utils/react';

import {
  DashboardEditingContext,
  DashboardSelectionContext,
  DashboardTreeContext,
} from './context';

import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';
import type { DashboardNodeInteractionOptions } from './types';

export const INTERACTIVE_SELECTOR =
  'button,input,textarea,select,a,[role="button"],[role="menuitem"],' +
  '[role="checkbox"],[role="switch"],[role="tab"],[contenteditable="true"],' +
  '[data-dashboard-no-select],[data-dashboard-no-move]';

export function useDashboardNodeInteraction({
  id,
  isContainer,
  isSelectable = true,
}: DashboardNodeInteractionOptions) {
  const tree = useContext(DashboardTreeContext);
  const selection = useContext(DashboardSelectionContext);
  const editing = useContext(DashboardEditingContext);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { hoverProps, isHovered } = useHover({});
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  });

  const containerDepth = isContainer
    ? tree.containerDepth + 1
    : tree.containerDepth;
  const canSelect = isSelectable && selection.selectionMode !== 'none';
  const isSelected = selection.selectedKeys.has(id);

  // Deps matter here: without them every render tears the registration down and
  // rebuilds it, for every node in the tree, on every preview frame of a drag.
  useLayoutEffect(
    () =>
      selection.register(id, {
        parentId: tree.parentId,
        ancestorIds: tree.ancestorIds,
      }),
    [id, selection.register, tree.parentId, tree.ancestorIds],
  );

  const selectSelf = useEvent((additive = false) => {
    if (canSelect) selection.select(id, additive);
  });

  const onClick = useEvent((event: ReactMouseEvent<HTMLElement>) => {
    if (!canSelect) return;
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    event.stopPropagation();
    selectSelf(event.shiftKey || event.metaKey || event.ctrlKey);
  });

  const onKeyDown = useEvent((event: ReactKeyboardEvent<HTMLElement>) => {
    if (!canSelect || event.target !== event.currentTarget) return;
    if (event.key !== ' ' && event.key !== 'Spacebar') return;
    event.preventDefault();
    event.stopPropagation();
    selectSelf(selection.selectionMode === 'multiple');
  });

  const interactionProps = mergeProps(hoverProps, focusWithinProps, {
    onClick,
    onKeyDown,
  });

  return {
    tree,
    editing,
    containerDepth,
    canSelect,
    isSelected,
    isHovered,
    isFocusWithin,
    interactionProps,
    selectSelf,
  };
}

export function isDashboardActionTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;

  return !!element?.closest?.(INTERACTIVE_SELECTOR);
}

export function getSurfaceMoveProps(
  moveProps: ReturnType<typeof useMove>['moveProps'],
  canMove: boolean,
  focusRef: { current: HTMLElement | null },
  onPointerStart: (clientX: number, clientY: number) => void,
) {
  if (!canMove) return {};

  return {
    ...moveProps,
    ...(moveProps.onPointerDown && {
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        if (isDashboardActionTarget(event.target)) return;
        onPointerStart(event.clientX, event.clientY);
        focusRef.current?.focus({ preventScroll: true });
        moveProps.onPointerDown?.(event);
      },
    }),
    ...(moveProps.onMouseDown && {
      onMouseDown(event: ReactMouseEvent<HTMLElement>) {
        if (isDashboardActionTarget(event.target)) return;
        onPointerStart(event.clientX, event.clientY);
        focusRef.current?.focus({ preventScroll: true });
        moveProps.onMouseDown?.(event);
      },
    }),
    ...(moveProps.onTouchStart && {
      onTouchStart(event: ReactTouchEvent<HTMLElement>) {
        if (isDashboardActionTarget(event.target)) return;
        const touch = event.touches[0];
        if (touch) onPointerStart(touch.clientX, touch.clientY);
        moveProps.onTouchStart?.(event);
      },
    }),
    ...(moveProps.onKeyDown && {
      onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
        if (event.target !== event.currentTarget) return;
        moveProps.onKeyDown?.(event);
      },
    }),
  };
}
