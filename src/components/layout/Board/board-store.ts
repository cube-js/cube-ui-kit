import type { Styles } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type { LayoutConstraint, ResizeHandleAxis } from './grid-core';

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
  constraints?: LayoutConstraint[];
  qa?: string;
  styles?: Styles;
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
      prev.constraints !== reg.constraints ||
      prev.qa !== reg.qa ||
      prev.styles !== reg.styles;

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
