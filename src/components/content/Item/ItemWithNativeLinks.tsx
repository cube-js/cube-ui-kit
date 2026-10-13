import {
  Ref,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

import { subscribeScheme } from '../../../utils/react/useScheme';

import { ItemWithNativeLinksProps, ItemWithNativeSlots } from './Item';

interface NativeMenuItemProps extends ItemWithNativeLinksProps {
  ref?: Ref<HTMLElement>;
  nativeMenuItemShouldFocus?: boolean;
  nativeMenuItemName?: {
    label?: string;
    labelledBy?: string;
    descriptionFromContent: boolean;
  };
}

type NativeSlot = 'label' | 'description' | 'icon';

function isNativeSlotVisible(element: HTMLAnchorElement) {
  if (element.closest('[data-react-aria-prevent-focus]')) return false;
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ visibilityProperty: true });
  }
  const view = element.ownerDocument.defaultView;
  if (!view) return false;
  const visibility = view.getComputedStyle(element).visibility;
  if (visibility === 'hidden' || visibility === 'collapse') return false;
  let child: Element = element;
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (
      node.hasAttribute('hidden') ||
      view.getComputedStyle(node).display === 'none'
    )
      return false;
    if (
      node.localName === 'details' &&
      child.localName !== 'summary' &&
      !node.hasAttribute('open')
    )
      return false;
    child = node;
  }
  return true;
}

function useNativeMenuItemTarget(
  enabled: boolean,
  appearance: unknown,
  shouldFocus: boolean,
  onElement: NativeMenuItemProps['onNativeLinkElement'],
) {
  const nodes = useRef<Record<NativeSlot, HTMLAnchorElement | null>>({
    label: null,
    description: null,
    icon: null,
  });
  const active = useRef<HTMLAnchorElement>(null);
  const restoreFocus = useRef(false);
  const focusIntent = useRef(false);
  const repoint = useRef<(() => void) | null>(null);
  const nameId = useId();
  const [slot, setSlot] = useState<NativeSlot>('label');

  const refresh = useEffectEvent((synchronous = false) => {
    if (!enabled) return;
    const previous = active.current;
    const document =
      previous?.ownerDocument ?? nodes.current.label?.ownerDocument;
    const hadFocus =
      previous === document?.activeElement ||
      (focusIntent.current && document?.activeElement === document?.body);
    const nextSlot =
      (['label', 'description', 'icon'] as const).find((name) => {
        const element = nodes.current[name];
        return element && isNativeSlotVisible(element);
      }) ?? slot;
    if (slot === nextSlot) return;
    if (hadFocus || shouldFocus) restoreFocus.current = true;
    const apply = () => setSlot(nextSlot);
    if (synchronous) flushSync(apply);
    else apply();
  });

  useLayoutEffect(() => {
    if (!enabled) {
      restoreFocus.current = false;
      focusIntent.current = false;
      return;
    }
    refresh();
  }, [enabled, appearance, slot, shouldFocus]);

  useLayoutEffect(() => {
    repoint.current?.();
  });

  useEffect(() => {
    const element = active.current;
    if (!enabled || !element || !restoreFocus.current) return;
    const document = element.ownerDocument;
    const menu = element.closest('[role="menu"]');
    if (
      document.activeElement !== document.body &&
      !menu?.contains(document.activeElement)
    ) {
      restoreFocus.current = false;
      return;
    }
    if (!isNativeSlotVisible(element)) return;
    restoreFocus.current = false;
    if (element !== document.activeElement)
      element.focus({ preventScroll: true });
  });

  useEffect(() => {
    if (!enabled) return;
    const document =
      nodes.current.label?.ownerDocument ??
      nodes.current.description?.ownerDocument ??
      nodes.current.icon?.ownerDocument;
    const view = document?.defaultView;
    if (!document || !view) return;
    let alive = true;
    let queued = false;
    let watched: Element[] = [];
    let resizeTargets: Element[] = [];
    let row: Element | null = null;
    let rescueArmed = false;
    const queue = () => {
      if (queued || !alive) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (!alive) return;
        refresh(true);
        observeNodes();
      });
    };
    const onOutsidePointerDown = (event: globalThis.PointerEvent) => {
      if (!row?.contains(event.target as globalThis.Node)) {
        focusIntent.current = false;
        restoreFocus.current = false;
        setRescue(false);
      }
    };
    const onRescueKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Tab') {
        focusIntent.current = false;
        restoreFocus.current = false;
        setRescue(false);
      }
    };
    const setRescue = (armed: boolean) => {
      if (armed === rescueArmed) return;
      rescueArmed = armed;
      if (armed) {
        document.addEventListener('pointerdown', onOutsidePointerDown, true);
        document.addEventListener('keydown', onRescueKeyDown, true);
      } else {
        document.removeEventListener('pointerdown', onOutsidePointerDown, true);
        document.removeEventListener('keydown', onRescueKeyDown, true);
      }
    };
    const onFocusIn = (event: Event) => {
      focusIntent.current =
        event.target === active.current &&
        document.activeElement === active.current;
      setRescue(focusIntent.current);
      queue();
    };
    const onFocusOut = (event: Event) => {
      if (
        event.target === active.current &&
        (event as FocusEvent).relatedTarget
      ) {
        focusIntent.current = false;
        restoreFocus.current = false;
        setRescue(false);
      }
      queue();
    };
    const setRow = (next: Element | null) => {
      if (next === row) return;
      row?.removeEventListener('focusin', onFocusIn, true);
      row?.removeEventListener('focusout', onFocusOut, true);
      for (const event of [
        'pointerover',
        'pointerout',
        'transitionend',
        'animationend',
      ])
        row?.removeEventListener(event, queue, true);
      row = next;
      row?.addEventListener('focusin', onFocusIn, true);
      row?.addEventListener('focusout', onFocusOut, true);
      for (const event of [
        'pointerover',
        'pointerout',
        'transitionend',
        'animationend',
      ])
        row?.addEventListener(event, queue, true);
    };
    const resize =
      typeof view.ResizeObserver === 'function'
        ? new view.ResizeObserver(queue)
        : undefined;
    const mutation = new view.MutationObserver(queue);
    const observeNodes = () => {
      const slots = Object.values(nodes.current).filter(
        (node): node is HTMLAnchorElement => !!node,
      );
      const elements: Element[] = [...slots];
      let ancestor = slots[0]?.parentElement;
      while (ancestor) {
        elements.push(ancestor);
        ancestor = ancestor.parentElement;
      }
      const nextResizeTargets = elements.filter(
        (node) =>
          slots.includes(node as HTMLAnchorElement) ||
          view.getComputedStyle(node).containerType !== 'normal',
      );
      setRow(slots[0]?.closest('[data-menuitem]') ?? null);
      if (
        elements.length === watched.length &&
        elements.every((node, index) => node === watched[index]) &&
        nextResizeTargets.length === resizeTargets.length &&
        nextResizeTargets.every((node, index) => node === resizeTargets[index])
      )
        return;
      watched = elements;
      resizeTargets = nextResizeTargets;
      resize?.disconnect();
      mutation.disconnect();
      for (const node of elements) {
        if (resizeTargets.includes(node)) resize?.observe(node);
        mutation.observe(node, { attributes: true, childList: node === row });
      }
    };
    observeNodes();
    repoint.current = observeNodes;
    const stopScheme = subscribeScheme(queue);
    view.addEventListener('resize', queue);
    queue();
    return () => {
      alive = false;
      repoint.current = null;
      setRescue(false);
      setRow(null);
      stopScheme();
      resize?.disconnect();
      mutation.disconnect();
      view.removeEventListener('resize', queue);
    };
  }, [enabled]);

  const setNode = (name: NativeSlot, element: HTMLAnchorElement | null) => {
    nodes.current[name] = element;
    if (slot !== name) return;
    if (
      enabled &&
      !element &&
      active.current === active.current?.ownerDocument.activeElement
    )
      restoreFocus.current = true;
    if (!enabled) restoreFocus.current = false;
    active.current = element;
    onElement?.(element);
  };
  return {
    slot,
    nameId,
    refs: {
      label: (element: HTMLAnchorElement | null) => setNode('label', element),
      description: (element: HTMLAnchorElement | null) =>
        setNode('description', element),
      icon: (element: HTMLAnchorElement | null) => setNode('icon', element),
    },
  };
}

export function ItemWithNativeLinks(props: NativeMenuItemProps) {
  const { nativeMenuItemName, nativeMenuItemShouldFocus, ref, ...itemProps } =
    props;
  const target = useNativeMenuItemTarget(
    !!props.nativeMenuItemProps,
    {
      styles: props.styles,
      mods: props.mods,
      tokens: props.tokens,
      tooltip: props.tooltip,
      children: props.children,
      description: props.description,
    },
    !!nativeMenuItemShouldFocus,
    props.onNativeLinkElement,
  );
  const isHeading = props.type === 'header' || props.type === 'card';
  const labelId =
    target.slot === 'label' && !isHeading
      ? props.nativeMenuItemProps?.id ?? props.labelProps?.id ?? target.nameId
      : props.labelProps?.id ?? target.nameId;
  const semanticId = props.nativeMenuItemProps?.id;
  let primaryProps = props.nativeMenuItemProps;
  if (primaryProps && target.slot !== 'label') {
    primaryProps = {
      ...primaryProps,
      'aria-labelledby':
        nativeMenuItemName?.labelledBy != null
          ? nativeMenuItemName.labelledBy
          : nativeMenuItemName?.label != null
            ? undefined
            : labelId,
      'aria-describedby':
        target.slot === 'description' &&
        nativeMenuItemName?.descriptionFromContent
          ? primaryProps['aria-describedby']
              ?.split(' ')
              .map((id) =>
                id === props.descriptionProps?.id && semanticId
                  ? semanticId
                  : id,
              )
              .join(' ')
          : primaryProps['aria-describedby'],
    };
  }
  return (
    <ItemWithNativeSlots
      {...itemProps}
      ref={ref}
      nativeMenuItemProps={primaryProps}
      nativePrimarySlot={target.slot}
      nativeLabelReferenceId={labelId}
      nativeSlotRefs={target.refs}
    />
  );
}
