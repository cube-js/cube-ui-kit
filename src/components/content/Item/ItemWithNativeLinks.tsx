import { Ref, useCallback, useId, useLayoutEffect, useRef } from 'react';

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

const NATIVE_ROW_TOKENS = [
  '--native-row-inset',
  '--native-row-width',
  '--native-row-height',
  '--native-row-clip',
] as const;

function writeNativeRowToken(
  element: HTMLElement,
  name: (typeof NATIVE_ROW_TOKENS)[number],
  value: string | null,
) {
  if (element.style.getPropertyValue(name) === (value ?? '')) return;
  if (value == null) element.style.removeProperty(name);
  else element.style.setProperty(name, value);
}

function clearNativeRowPlacement(element: HTMLElement) {
  for (const name of NATIVE_ROW_TOKENS)
    writeNativeRowToken(element, name, null);
}

function borderBoxSize(styles: CSSStyleDeclaration, axis: 'width' | 'height') {
  const size = parseFloat(styles[axis]);
  if (styles.boxSizing === 'border-box') return size;
  const sides = axis === 'width' ? ['Left', 'Right'] : ['Top', 'Bottom'];
  return sides.reduce(
    (total, side) =>
      total +
      parseFloat(
        styles[`padding${side}` as keyof CSSStyleDeclaration] as string,
      ) +
      parseFloat(
        styles[`border${side}Width` as keyof CSSStyleDeclaration] as string,
      ),
    size,
  );
}

function nativeRowClip(
  row: HTMLElement,
  containingBlock: Element | null,
  bounds: DOMRect,
  scaleX: number,
  scaleY: number,
) {
  let left = bounds.left;
  let right = bounds.right;
  let top = bounds.top;
  let bottom = bounds.bottom;
  const view = row.ownerDocument.defaultView!;
  // Outside containing blocks bypass intervening overflow clips. Restore only
  // those clips; the containing block and its ancestors still clip natively.
  for (
    let ancestor: HTMLElement | null = row;
    ancestor && ancestor !== containingBlock;
    ancestor = ancestor.parentElement
  ) {
    const styles = view.getComputedStyle(ancestor);
    if (styles.overflowX === 'visible' && styles.overflowY === 'visible')
      continue;
    const rect = ancestor.getBoundingClientRect();
    const x = rect.width / ancestor.offsetWidth || 1;
    const y = rect.height / ancestor.offsetHeight || 1;
    if (styles.overflowX !== 'visible') {
      const edge = rect.left + ancestor.clientLeft * x;
      left = Math.max(left, edge);
      right = Math.min(right, edge + ancestor.clientWidth * x);
    }
    if (styles.overflowY !== 'visible') {
      const edge = rect.top + ancestor.clientTop * y;
      top = Math.max(top, edge);
      bottom = Math.min(bottom, edge + ancestor.clientHeight * y);
    }
  }
  const inset = [
    Math.max(0, top - bounds.top) / scaleY,
    Math.max(0, bounds.right - right) / scaleX,
    Math.max(0, bounds.bottom - bottom) / scaleY,
    Math.max(0, left - bounds.left) / scaleX,
  ];
  return inset.some((value) => value > 0)
    ? `inset(${inset.map((value) => `${value}px`).join(' ')})`
    : null;
}

function placeNativeRow(element: HTMLAnchorElement) {
  const row = element.parentElement;
  if (!row) return false;
  const containingBlock = element.offsetParent;
  if (!element.getClientRects().length) {
    clearNativeRowPlacement(element);
    return false;
  }
  const view = element.ownerDocument.defaultView;
  if (!view) return false;
  const rowStyles = view.getComputedStyle(row);
  if (containingBlock === row) {
    // Absolute insets start inside the row's border. Include that border so
    // the native target follows the same outer bounds as the painted row.
    const inset = ['Top', 'Right', 'Bottom', 'Left'].map(
      (side) =>
        `${-parseFloat(rowStyles[`border${side}Width` as keyof CSSStyleDeclaration] as string)}px`,
    );
    writeNativeRowToken(element, '--native-row-inset', inset.join(' '));
    for (const name of NATIVE_ROW_TOKENS.slice(1))
      writeNativeRowToken(element, name, null);
    return false;
  }
  const helperStyles = view.getComputedStyle(element);
  const bounds = row.getBoundingClientRect();
  const current = element.getBoundingClientRect();
  const scaleX = current.width / borderBoxSize(helperStyles, 'width') || 1;
  const scaleY = current.height / borderBoxSize(helperStyles, 'height') || 1;
  // Start at the helper's actual containing-block origin. The visual delta
  // includes intervening scrolling and retains fractional layout coordinates.
  const left =
    (parseFloat(helperStyles.left) || 0) +
    (bounds.left - current.left) / scaleX;
  const top =
    (parseFloat(helperStyles.top) || 0) + (bounds.top - current.top) / scaleY;
  writeNativeRowToken(
    element,
    '--native-row-inset',
    `${top}px auto auto ${left}px`,
  );
  writeNativeRowToken(
    element,
    '--native-row-width',
    `${borderBoxSize(rowStyles, 'width')}px`,
  );
  writeNativeRowToken(
    element,
    '--native-row-height',
    `${borderBoxSize(rowStyles, 'height')}px`,
  );
  writeNativeRowToken(
    element,
    '--native-row-clip',
    nativeRowClip(row, containingBlock, bounds, scaleX, scaleY),
  );
  return true;
}

function useNativeRow(
  enabled: boolean,
  shouldFocus: boolean,
  onElement: NativeMenuItemProps['onNativeLinkElement'],
) {
  const element = useRef<HTMLAnchorElement | null>(null);
  const notify = useRef(onElement);
  const wasEnabled = useRef(enabled);
  const repoint = useRef<(() => void) | null>(null);
  // The host may remount inside Item's tooltip without rerendering this owner.
  // Retain the physical ref callback so every such commit reaches the menu.
  const nativeRowRef = useCallback((node: HTMLAnchorElement | null) => {
    element.current = node;
    if (node?.hasAttribute('data-menu-native-primary')) placeNativeRow(node);
    repoint.current?.();
    notify.current?.(node);
  }, []);

  useLayoutEffect(() => {
    notify.current = onElement;
    repoint.current?.();
    onElement?.(element.current);
    const node = element.current;
    const row = node?.parentElement;
    if (node && row && wasEnabled.current !== enabled && shouldFocus) {
      const previous = enabled ? row : node;
      const next = enabled ? node : row;
      if (node.ownerDocument.activeElement === previous)
        next.focus({ preventScroll: true });
    }
    wasEnabled.current = enabled;
  });

  useLayoutEffect(() => {
    if (!enabled) {
      if (element.current) clearNativeRowPlacement(element.current);
      return;
    }
    const document = element.current?.ownerDocument;
    const view = document?.defaultView;
    if (!document || !view) return;
    let alive = true;
    let queued = false;
    let scroll = false;
    let row: HTMLElement | null = null;
    let watched: Element[] = [];
    let resized: Element[] = [];
    const queue = () => {
      if (queued || !alive) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (alive) sync();
      });
    };
    const resize =
      typeof view.ResizeObserver === 'function'
        ? new view.ResizeObserver(queue)
        : undefined;
    const mutation = new view.MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            record.target !== element.current ||
            record.attributeName !== 'style',
        )
      )
        queue();
    });
    const setScroll = (outside: boolean) => {
      if (outside === scroll) return;
      scroll = outside;
      if (outside) document.addEventListener('scroll', queue, true);
      else document.removeEventListener('scroll', queue, true);
    };
    const setRow = (next: HTMLElement | null) => {
      if (next === row) return;
      for (const event of [
        'pointerover',
        'pointerout',
        'transitionend',
        'animationend',
      ])
        row?.removeEventListener(event, queue, true);
      row = next;
      for (const event of [
        'pointerover',
        'pointerout',
        'transitionend',
        'animationend',
      ])
        row?.addEventListener(event, queue, true);
    };
    const sync = () => {
      const node = element.current;
      const outside = !!node && placeNativeRow(node);
      setScroll(outside);
      setRow(node?.parentElement ?? null);
      const ancestors: Element[] = [];
      for (
        let ancestor: Element | null = row;
        ancestor;
        ancestor = ancestor.parentElement
      )
        ancestors.push(ancestor);
      const targets = outside ? [...ancestors] : row ? [row] : [];
      if (outside) {
        for (const ancestor of ancestors) {
          if (ancestor === document.documentElement) break;
          for (const sibling of Array.from(
            ancestor.parentElement?.children ?? [],
          ))
            if (sibling !== ancestor && !targets.includes(sibling))
              targets.push(sibling);
        }
      }
      if (
        ancestors.length === watched.length &&
        ancestors.every((node, index) => node === watched[index]) &&
        targets.length === resized.length &&
        targets.every((node, index) => node === resized[index])
      )
        return;
      watched = ancestors;
      resized = targets;
      resize?.disconnect();
      mutation.disconnect();
      for (const target of targets) resize?.observe(target);
      for (const ancestor of ancestors)
        mutation.observe(ancestor, {
          attributes: true,
          childList: ancestor === row || outside,
          subtree: outside && ancestor === row?.parentElement,
        });
    };
    repoint.current = sync;
    const stopScheme = subscribeScheme(queue);
    view.addEventListener('resize', queue);
    sync();
    return () => {
      alive = false;
      repoint.current = null;
      setScroll(false);
      setRow(null);
      stopScheme();
      resize?.disconnect();
      mutation.disconnect();
      view.removeEventListener('resize', queue);
    };
  }, [enabled]);

  return nativeRowRef;
}

export function ItemWithNativeLinks(props: NativeMenuItemProps) {
  const { nativeMenuItemName, nativeMenuItemShouldFocus, ref, ...itemProps } =
    props;
  const nameId = useId();
  const labelId = props.labelProps?.id ?? nameId;
  const descriptionId = props.descriptionProps?.id ?? `${nameId}-description`;
  const descriptionNamesRow =
    !props.children &&
    (!!props.description ||
      Object.keys(props.descriptionProps ?? {}).some((key) => key !== 'id'));
  const isHeading = props.type === 'header' || props.type === 'card';
  const nameReferenceId = descriptionNamesRow
    ? descriptionId
    : isHeading
      ? `${labelId}-content`
      : labelId;
  const nativeRowRef = useNativeRow(
    !!props.nativeMenuItemProps,
    !!nativeMenuItemShouldFocus,
    props.onNativeLinkElement,
  );
  let primaryProps = props.nativeMenuItemProps;
  if (
    primaryProps &&
    (nativeMenuItemName?.label != null ||
      nativeMenuItemName?.labelledBy != null)
  ) {
    primaryProps = {
      ...primaryProps,
      'aria-label': nativeMenuItemName.label ?? primaryProps['aria-label'],
      'aria-labelledby': nativeMenuItemName.labelledBy,
    };
  }
  if (
    primaryProps &&
    nativeMenuItemName?.labelledBy == null &&
    nativeMenuItemName?.label == null &&
    primaryProps['aria-label'] == null
  ) {
    const semanticId = primaryProps.id;
    primaryProps = {
      ...primaryProps,
      'aria-labelledby':
        primaryProps['aria-labelledby']
          ?.split(' ')
          .map((id) =>
            id === semanticId || id === props.labelProps?.id
              ? nameReferenceId
              : id,
          )
          .join(' ') ?? nameReferenceId,
    };
  }
  return (
    <ItemWithNativeSlots
      {...itemProps}
      ref={ref}
      nativeMenuItemProps={primaryProps}
      nativeLabelReferenceId={labelId}
      descriptionProps={{ ...props.descriptionProps, id: descriptionId }}
      nativeRowRef={nativeRowRef}
    />
  );
}
