import { RefObject, useCallback, useContext, useEffect, useRef } from 'react';

import { EventBusContext, useEventBus } from './useEventBus';

export interface UsePopoverSyncOptions {
  /** Stable identifier for this popover instance (typically a generateRandomId() memo). */
  menuId: string;
  /** Current open state of this popover. */
  isOpen: boolean;
  /** Called when another popover opens while this one is open. */
  onClose: () => void;
  /**
   * When `false`, this popover does not participate in the sync (no listening,
   * no emitting). Useful for "dummy" triggers that proxy a real one (see
   * `MenuTrigger`'s `isDummy`). Defaults to `true`.
   */
  enabled?: boolean;
  /**
   * Ref to the popover's trigger element. When provided, the element is
   * included in the `popover:open` emit payload so peers can detect whether
   * the new opener is nested inside their own overlay (and skip closing in
   * that case). Optional — omitting it preserves the legacy "always close on
   * peer open" behaviour.
   */
  triggerRef?: RefObject<HTMLElement | null>;
  /**
   * Ref to the overlay/container element that hosts this popover's content.
   * When provided, the listener performs a DOM `contains()` check on incoming
   * peer triggers: peers whose trigger lives inside this container are
   * considered nested children and do NOT close us.
   */
  containerRef?: RefObject<HTMLElement | null>;
  /**
   * Whether this overlay closes when a Button/ItemButton inside its container
   * is pressed. Defaults to `true` (popover semantics — popovers are transient
   * surfaces and any action inside them should dismiss them). Set to `false`
   * for modals/trays/fullscreen dialogs — buttons inside a Dialog should not
   * auto-close it. Requires `containerRef` to be set; without it the listener
   * has no way to determine whether the dispatching button is "inside" this
   * overlay and is effectively a no-op.
   */
  dismissOnInnerButtonPress?: boolean;
  /**
   * Whether this overlay closes when a peer popover opens. Defaults to `true`
   * (popover semantics — only one popover open at a time). Set to `false` for
   * modals/trays/fullscreen dialogs so a peer popover opening cannot bypass
   * the dialog's own `isDismissable` / `onClose` handling and yank it shut.
   *
   * The host still EMITS `popover:open` regardless of this flag, so opening a
   * modal/tray correctly dismisses any peer popover that was open before.
   */
  closeOnPeerOpen?: boolean;
}

interface PopoverOpenPayload {
  menuId: string;
  triggerEl: Element | null;
}

interface PopoverDismissAncestorPayload {
  /** The DOM node of the button that requested the dismiss. */
  from: Element | null;
}

interface PopoverRegistryEntry {
  getContainerEl: () => Element | null;
  getTriggerEl: () => Element | null;
}

/**
 * Module-level registry of currently open popovers. Lets us resolve the
 * LOGICAL parent of an arbitrary element across portal boundaries.
 *
 * Popover content is portaled to a shared root (`document.body` by default —
 * see `Overlay.tsx`), so a grandchild popover's trigger lives inside a
 * sibling portal rather than physically inside its grandparent's container.
 * A naive `container.contains(triggerEl)` check therefore misses the
 * relationship and closes the grandparent — the bug that surfaces with 3+
 * levels of `SubMenuTrigger` nesting.
 *
 * The registry stores closures over the host's refs so reads always see the
 * latest `.current` value without forcing a re-register per render.
 */
const openPopovers = new Map<string, PopoverRegistryEntry>();

/**
 * Find the open popover whose container directly contains `target`. Returns
 * `null` for elements that live outside every registered popover (e.g. a
 * top-level trigger button rendered next to its overlay root).
 */
function findOwningPopover(
  target: Element | null,
): [string, PopoverRegistryEntry] | null {
  if (!target) return null;
  for (const entry of openPopovers) {
    if (entry[1].getContainerEl()?.contains(target)) {
      return entry;
    }
  }
  return null;
}

/**
 * Returns `true` when `target` is nested inside the overlay identified by
 * `ancestorMenuId` — either as a direct DOM descendant of `ancestorContainer`
 * or as a descendant of a chain of popovers whose triggers eventually land
 * inside it. Used by `popover:open` peers to avoid closing themselves when a
 * grand-child overlay opens through a portal.
 */
function isLogicalDescendantOf(
  target: Element | null,
  ancestorMenuId: string,
  ancestorContainer: Element | null,
): boolean {
  if (ancestorContainer && target && ancestorContainer.contains(target)) {
    return true;
  }
  let cur: Element | null = target;
  const visited = new Set<string>();
  while (cur) {
    const owner = findOwningPopover(cur);
    if (!owner) return false;
    const [id, entry] = owner;
    if (visited.has(id)) return false;
    visited.add(id);
    if (id === ancestorMenuId) return true;
    cur = entry.getTriggerEl();
  }
  return false;
}

/**
 * Coordinates the "only one popover open at a time" invariant via the EventBus.
 *
 * - When `isOpen` flips `false -> true`, emits `popover:open` once.
 * - While open, listens for peers' `popover:open` events and calls `onClose`.
 *
 * Implementation notes (ALL of these matter — losing any one re-introduces a
 * race that surfaces only under rapid trigger switching, which is hard to
 * reproduce in tests):
 *
 * 1. `isOpen` and `onClose` are read through refs inside the listener, so the
 *    subscription effect's dep array does NOT include `isOpen`/`onClose`. This
 *    keeps the listener identity stable across open/close transitions and
 *    avoids the unsubscribe-emit-resubscribe window where an emit can be
 *    delivered to a stale listener (or no listener).
 * 2. The emit fires only on the `false -> true` transition, gated by
 *    `wasOpenRef`. A re-render where `isOpen` is still `true` must NOT
 *    re-emit, otherwise it could re-trigger listeners on peers that just
 *    opened in the same render flush.
 * 3. The `enabled` flag short-circuits both effects symmetrically. When it
 *    flips off, `wasOpenRef` is reset so re-enabling later still emits if
 *    `isOpen` is true at that moment.
 */
export function usePopoverSync({
  menuId,
  isOpen,
  onClose,
  enabled = true,
  triggerRef,
  containerRef,
  dismissOnInnerButtonPress = true,
  closeOnPeerOpen = true,
}: UsePopoverSyncOptions): void {
  const { emit, on } = useEventBus();

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Track the latest containerRef via a stable ref-of-refs so the listener
  // never resubscribes when callers pass freshly-created ref wrappers across
  // renders. Same pattern as `onCloseRef` above — without this the listener's
  // effect would churn for any caller that doesn't memoize its refs.
  const containerRefRef = useRef(containerRef);
  useEffect(() => {
    containerRefRef.current = containerRef;
  }, [containerRef]);

  const triggerRefRef = useRef(triggerRef);
  useEffect(() => {
    triggerRefRef.current = triggerRef;
  }, [triggerRef]);

  useEffect(() => {
    if (!enabled) return;

    // `popover:open` listener — gated on `closeOnPeerOpen`. Modals/trays opt
    // out so a peer popover opening cannot bypass the dialog's
    // `isDismissable` / `onClose` handling and call `state.close()` directly.
    // Note: the EMIT side (lower in this hook) still fires regardless, so
    // opening a modal still correctly dismisses peer popovers.
    const offOpen = closeOnPeerOpen
      ? on('popover:open', (data: PopoverOpenPayload) => {
          if (data.menuId === menuId || !isOpenRef.current) return;
          const container = containerRefRef.current?.current ?? null;
          // Nested-popover guard: stay open when the opening peer's trigger is
          // a LOGICAL descendant of our overlay. Direct DOM containment only
          // covers the first level — for grand-child popovers the trigger lives
          // in a sibling portal, so we walk the registered popover chain back
          // up via each parent's trigger element. Without this, opening a
          // third-level `SubMenuTrigger` would close every ancestor menu.
          if (isLogicalDescendantOf(data.triggerEl, menuId, container)) return;
          onCloseRef.current();
        })
      : null;

    // `popover:dismiss-ancestor` is emitted by `Button` / `ItemButton` (and any
    // consumer using `useDismissParentPopover`) after their `onPress` runs.
    // Only popover-type overlays subscribe; modals/trays opt out via
    // `dismissOnInnerButtonPress: false` so a Button inside a Dialog content
    // does NOT auto-close the Dialog.
    const offDismiss = dismissOnInnerButtonPress
      ? on(
          'popover:dismiss-ancestor',
          (data: PopoverDismissAncestorPayload) => {
            if (!isOpenRef.current) return;
            const container = containerRefRef.current?.current;
            const from = data?.from;
            // Require both a container and an originating element so we can do
            // the contains-check. Hosts without `containerRef` (e.g.
            // `use-anchored-menu`, `use-context-menu`) are silently no-op.
            if (!container || !from) return;
            if (container.contains(from)) onCloseRef.current();
          },
        )
      : null;

    return () => {
      offOpen?.();
      offDismiss?.();
    };
  }, [on, menuId, enabled, dismissOnInnerButtonPress, closeOnPeerOpen]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (!enabled) {
      if (wasOpenRef.current) {
        openPopovers.delete(menuId);
      }
      wasOpenRef.current = false;
      return;
    }
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      // Register BEFORE emitting so peers' listeners (deferred via the
      // bus's `setTimeout(0)`) can already see us in the registry when
      // they walk the logical chain.
      openPopovers.set(menuId, {
        getContainerEl: () => containerRefRef.current?.current ?? null,
        getTriggerEl: () => triggerRefRef.current?.current ?? null,
      });
      emit<PopoverOpenPayload>('popover:open', {
        menuId,
        triggerEl: triggerRefRef.current?.current ?? null,
      });
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      openPopovers.delete(menuId);
    }
  }, [isOpen, emit, menuId, enabled]);

  // Final cleanup on unmount: covers the case where a host unmounts while
  // still flagged open (e.g. a parent unmount tears down a child popover
  // before its close transition runs).
  useEffect(() => {
    return () => {
      openPopovers.delete(menuId);
    };
  }, [menuId]);
}

/**
 * Hook that returns a dispatcher to close the popover that contains a given
 * DOM element. Used by `Button` / `ItemButton` to implement the default
 * "press inside a popover closes the popover" behaviour. Custom (non-Cube)
 * interactive controls can call this directly:
 *
 * ```tsx
 * const dismiss = useDismissParentPopover();
 * <MyCustomPressable onPress={(e) => { doThing(); dismiss(e.currentTarget); }} />
 * ```
 *
 * The actual dismiss is dispatched through the EventBus, which defers via
 * `setTimeout(0)` — so the user's synchronous handler (and any React state
 * updates it triggers) flushes BEFORE the popover closes. This is critical
 * for the "open a hoisted modal from a popover footer" case: the modal
 * mounts first, then the popover closes.
 *
 * Only popover-type containers (those that pass `dismissOnInnerButtonPress`
 * as `true`, the default) react to the event. Modal/tray/fullscreen Dialog
 * containers explicitly opt out so a Button inside their content does not
 * auto-close them.
 *
 * When called outside an `EventBusProvider` (e.g. in unit tests that render
 * a Button without wrapping in `<Root>`), the returned function is a no-op —
 * the dismiss flow gracefully degrades rather than throwing.
 */
export function useDismissParentPopover() {
  // Read context defensively: `Button` / `ItemButton` use this hook
  // unconditionally, but tests (and standalone usages outside `<Root>`) may
  // mount them without an `EventBusProvider`. A throw would crash every
  // Button render in those cases.
  const bus = useContext(EventBusContext);
  const emit = bus?.emit;
  return useCallback(
    (from: Element | null) => {
      if (!from || !emit) return;
      emit<PopoverDismissAncestorPayload>('popover:dismiss-ancestor', { from });
    },
    [emit],
  );
}
