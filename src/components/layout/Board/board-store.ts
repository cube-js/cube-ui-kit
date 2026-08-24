import type { Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type { LayoutConstraint, ResizeHandleAxis } from './grid-core';
import type { BoardResizeGripPlacement } from './Widget';

/**
 * Declarative registration for a single widget.
 *
 * Widget *content* is decoupled from widget *position*: content is registered
 * here by `Board.Widget` keyed by id, while positioning/ownership lives in a
 * board's layout state. This decoupling is what allows a widget to be hosted
 * (and transferred) between different boards under the same `BoardProvider`.
 */
export interface WidgetRegistration {
  id: string;
  content: ReactNode;
  isDraggable?: boolean;
  isResizable?: boolean;
  resizeHandles?: ResizeHandleAxis[];
  /** Where the corner resize grips sit (falls back to the board's default). */
  resizeGripPlacement?: BoardResizeGripPlacement;
  /**
   * Add a card border to this widget (widgets are always filled and rounded).
   * Falls back to the owning board's `widgetProps.isCard` when unset here.
   */
  isCard?: boolean;
  /**
   * Whether this widget shows the resting hover ring. Falls back to the owning
   * board's `widgetProps.hoverRing` when unset here.
   */
  hoverRing?: boolean;
  /** Minimum width in grid columns (fallback when the layout item omits `minW`). */
  minW?: number;
  /** Maximum width in grid columns (fallback when the layout item omits `maxW`). */
  maxW?: number;
  /** Minimum height in grid rows (fallback when the layout item omits `minH`). */
  minH?: number;
  /** Maximum height in grid rows (fallback when the layout item omits `maxH`). */
  maxH?: number;
  constraints?: LayoutConstraint[];
  qa?: string;
  styles?: Styles;
  /** Grow this widget's height to fit its content (only ever increases). */
  isAutoHeight?: boolean;
  /** Override the board's `dragCancel` selector for this widget. */
  dragCancel?: string;
  /** Override the board's `dragHandle` selector for this widget. */
  dragHandle?: string;
  /** Disable selection for this widget while the board's selection is on. */
  isSelectable?: boolean;
  /** Override the board's `selectionCancel` selector for this widget. */
  selectionCancel?: string;
  /** Accessible name; falls back to `qa`, then the layout item id. */
  'aria-label'?: string;
}

/**
 * A tiny external store mapping widget id -> registration.
 *
 * Boards read from it via `useSyncExternalStore`, so a change to any widget's
 * content or config re-renders the hosting board without prop drilling through
 * the (possibly cross-board) tree.
 */
export class BoardWidgetStore {
  private map = new Map<string, WidgetRegistration>();
  // Tracks which mounted `Board.Widget` instance currently owns each id. This
  // guards against a stale unregister from an unmounting instance clobbering a
  // freshly-mounted instance's registration - which happens when a widget's
  // subtree is relocated (e.g. dragging a container widget that hosts a nested
  // board moves it into the overlay portal, remounting the inner widgets).
  private owners = new Map<string, object>();
  private listeners = new Set<() => void>();
  private version = 0;

  register(reg: WidgetRegistration, owner: object): void {
    const prev = this.map.get(reg.id);
    this.map.set(reg.id, reg);
    this.owners.set(reg.id, owner);

    // Notify on any reference change. The hosting board reads registrations
    // during render, but `Board.Widget` registers in a layout effect (after
    // commit), so a content/config change lands one commit late and would never
    // be shown without an emit. Reference comparison is loop-safe: a board's own
    // re-render reuses the same `children` element references from its
    // (un-rerendered) parent, so `content` only differs on a genuine parent
    // update -> we emit once and then settle.
    const changed =
      !prev ||
      prev.content !== reg.content ||
      prev.isDraggable !== reg.isDraggable ||
      prev.isResizable !== reg.isResizable ||
      prev.resizeHandles !== reg.resizeHandles ||
      prev.resizeGripPlacement !== reg.resizeGripPlacement ||
      prev.isCard !== reg.isCard ||
      prev.hoverRing !== reg.hoverRing ||
      prev.minW !== reg.minW ||
      prev.maxW !== reg.maxW ||
      prev.minH !== reg.minH ||
      prev.maxH !== reg.maxH ||
      prev.constraints !== reg.constraints ||
      prev.qa !== reg.qa ||
      prev.styles !== reg.styles ||
      prev.isAutoHeight !== reg.isAutoHeight ||
      prev.dragCancel !== reg.dragCancel ||
      prev.dragHandle !== reg.dragHandle ||
      prev.isSelectable !== reg.isSelectable ||
      prev.selectionCancel !== reg.selectionCancel ||
      prev['aria-label'] !== reg['aria-label'];

    if (changed) {
      this.version++;
      this.emit();
    }
  }

  unregister(id: string, owner: object): void {
    // Ignore unregister calls from an instance that no longer owns the id (a
    // newer instance has already taken over).
    if (this.owners.get(id) !== owner) return;

    this.owners.delete(id);
    if (this.map.delete(id)) {
      this.version++;
      this.emit();
    }
  }

  get(id: string): WidgetRegistration | undefined {
    return this.map.get(id);
  }

  getVersion = (): number => this.version;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}
