import { useEffect, useRef } from 'react';
import { useTree } from 'react-aria';

import { mergeProps } from '../../../utils/react';

import type { Key } from '@react-types/shared';
import type {
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react';
import type { TableTreeNode } from './table-tree';
import type { TableViewProps } from './TableView';

/**
 * Hook boundary for the native table. Flat tables deliberately avoid this
 * component so their DOM and keyboard behaviour remain exactly as before.
 */
export function TreeGridTable<T>(props: {
  tree: NonNullable<TableViewProps<T>['tree']>;
  tableProps: Record<string, any>;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { tree, tableProps, style, children } = props;
  const ref = useRef<HTMLTableElement>(null);
  const pendingFocusKey = useRef<Key | null>(null);
  const { gridProps } = useTree(tree.ariaProps as any, tree.state, ref);

  // A virtualized destination may not exist until the focused key makes the
  // parent virtualizer scroll and render another window. Retry after each
  // render until that row mounts, then complete the keyboard focus move.
  useEffect(() => {
    const key = pendingFocusKey.current;
    if (key == null) return;

    // A real focus move wins over the delayed virtual-row focus. Losing the
    // old row to virtualization leaves focus on <body>, whereas tabbing or
    // clicking elsewhere leaves a concrete active element we must respect.
    const activeElement = document.activeElement;
    if (
      activeElement &&
      activeElement !== document.body &&
      !ref.current?.contains(activeElement)
    ) {
      pendingFocusKey.current = null;
      return;
    }

    const target = Array.from(
      ref.current?.querySelectorAll<HTMLTableRowElement>(
        'tbody tr[data-element="Row"][data-key]',
      ) ?? [],
    ).find((element) => element.dataset.key === String(key));

    if (target) {
      pendingFocusKey.current = null;
      target.focus();
    }
  });

  const handleBlurCapture = (event: ReactFocusEvent<HTMLTableElement>) => {
    const pendingKey = pendingFocusKey.current;
    const nextTarget = event.relatedTarget;

    if (pendingKey != null && nextTarget instanceof Element) {
      const nextRow = nextTarget.closest<HTMLTableRowElement>(
        'tbody tr[data-element="Row"][data-key]',
      );

      if (nextRow?.dataset.key !== String(pendingKey)) {
        pendingFocusKey.current = null;
      }
    }

    (gridProps as any).onBlurCapture?.(event);
  };

  const handleKeyDownCapture = (
    event: ReactKeyboardEvent<HTMLTableElement>,
  ) => {
    const row = (event.target as HTMLElement).closest<HTMLTableRowElement>(
      'tbody tr[data-element="Row"][data-key]',
    );

    // Inputs, links and menus embedded in a row retain their own shortcuts.
    if (!row || event.target !== row) {
      (gridProps as any).onKeyDownCapture?.(event);
      return;
    }

    // While a virtual destination is still mounting, subsequent key presses
    // continue from that logical key rather than repeatedly targeting the old
    // DOM row that still owns focus.
    const currentKey = pendingFocusKey.current ?? row.dataset.key;
    const index = tree.entries.findIndex(
      (entry) => String(entry.key) === String(currentKey),
    );
    const entry = tree.entries[index];
    if (!entry) return;

    const focusEntry = (next: TableTreeNode<T> | undefined) => {
      if (!next) return false;
      tree.state.selectionManager.setFocusedKey(next.key);
      const target = Array.from(
        ref.current?.querySelectorAll<HTMLTableRowElement>(
          'tbody tr[data-element="Row"][data-key]',
        ) ?? [],
      ).find((element) => element.dataset.key === String(next.key));
      if (target) {
        pendingFocusKey.current = null;
        target.focus();
      } else pendingFocusKey.current = next.key;
      return true;
    };

    const hasChildren = entry.children.length > 0;
    const isExpanded = tree.state.expandedKeys.has(entry.key);
    let handled = false;

    if (event.key === 'ArrowRight' && hasChildren) {
      if (isExpanded) handled = focusEntry(entry.children[0]);
      else {
        tree.state.toggleKey(entry.key);
        handled = true;
      }
    } else if (event.key === 'ArrowLeft') {
      if (hasChildren && isExpanded) {
        tree.state.toggleKey(entry.key);
        handled = true;
      } else if (entry.parentKey != null) {
        handled = focusEntry(
          tree.entries.find((candidate) => candidate.key === entry.parentKey),
        );
      }
    } else if (event.key === 'ArrowDown') {
      handled = focusEntry(tree.entries[index + 1]);
    } else if (event.key === 'ArrowUp') {
      handled = focusEntry(tree.entries[index - 1]);
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // React Aria still sees the DOM row that owned focus before the virtual
    // destination mounted. If a logical navigation key has no action there
    // (a boundary, leaf, or collapsed root), consuming it avoids falling
    // through and applying that key to the stale row instead.
    if (
      pendingFocusKey.current != null &&
      ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    (gridProps as any).onKeyDownCapture?.(event);
  };

  return (
    <table
      {...mergeProps(gridProps, tableProps)}
      ref={ref}
      role="treegrid"
      style={style}
      onBlurCapture={handleBlurCapture}
      onKeyDownCapture={handleKeyDownCapture}
    >
      {children}
    </table>
  );
}
