import { ClearPressResponder } from '@react-aria/interactions';
import {
  openLink,
  shouldClientNavigate,
  useGlobalListeners,
} from '@react-aria/utils';
import { FocusableElement, Key, Node } from '@react-types/shared';
import { Styles } from '@tenphi/tasty';
import {
  AnchorHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  useContext,
  useRef,
} from 'react';
import { FocusRing, useMenuItem } from 'react-aria';
import { TreeState } from 'react-stately';

import { RightIcon } from '../../../icons/RightIcon';
import { isExternalUrl } from '../../../providers/navigation-url';
import { useNavigation } from '../../../providers/use-navigation';
import { mergeProps } from '../../../utils/react';
import { filterCollectionItemProps } from '../../CollectionItem';
import { ItemWithNativeLinks } from '../../content/Item/Item';
import { parseTo } from '../use-action';

import { useMenuContext } from './context';
import { CURRENT_DOCUMENT_LINK, MENU_LINK_CLICK } from './MenuCollectionItem';
import { SubmenuTriggerContext } from './SubmenuTriggerContext';

export type MenuSelectionType = 'checkbox' | 'radio' | 'checkmark';

export interface MenuItemProps<T> {
  item: Node<T>;
  /**
   * The item element's id. A menu whose focus stays elsewhere — `CommandMenu`
   * keeps it in its search input — points `aria-activedescendant` at it.
   */
  id?: string;
  state: TreeState<T>;
  styles?: Styles;
  isVirtualized?: boolean;
  isDisabled?: boolean;
  onAction?: (key: Key) => void;
  size?: 'small' | 'medium' | (string & {});
}

/** @private */
export function MenuItem<T>(props: MenuItemProps<T>) {
  const submenuContext = useContext(SubmenuTriggerContext);
  return !submenuContext ? (
    <MenuLinkItem {...props} />
  ) : (
    <MenuItemContent {...props} />
  );
}

function MenuLinkItem<T>(props: MenuItemProps<T>) {
  const activatedLink = useRef<HTMLAnchorElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const nativeElementRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef(false);
  const { to, href, navigationOptions } = props.item.props;
  const { cleanTo: parsedTo, nativeRoute } = parseTo(to);
  const isCurrentDocument = props.item.props[CURRENT_DOCUMENT_LINK];
  const cleanTo = to != null ? parsedTo : isCurrentDocument ? '' : href;
  const isExternal = typeof cleanTo === 'string' && isExternalUrl(cleanTo);
  const { navigate, resolvedHref, isDefault } = useNavigation(
    isExternal ? '.' : cleanTo || '.',
    { relative: navigationOptions?.relative },
  );
  const linkHref =
    isCurrentDocument || (nativeRoute && cleanTo === '')
      ? ''
      : isExternal
        ? String(cleanTo)
        : resolvedHref;
  const itemProps = props.item.props;
  const onNativeLinkElement = (element: HTMLAnchorElement | null) => {
    linkRef.current = element;
  };
  const onNativeElement = (element: HTMLElement | null) => {
    if (!element) {
      restoreFocusRef.current =
        nativeElementRef.current ===
        nativeElementRef.current?.ownerDocument.activeElement;
    }
    nativeElementRef.current = element;
    if (element && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      element.focus({ preventScroll: true });
    }
  };
  const onClick = (event: MouseEvent<FocusableElement>) => {
    const target = event.target as Element;
    activatedLink.current =
      target.closest?.<HTMLAnchorElement>('a[data-menu-native-link]') ??
      linkRef.current;
    itemProps[MENU_LINK_CLICK]?.(event);
  };
  const openNative = (event: MouseEvent<FocusableElement>) => {
    const anchor = activatedLink.current;
    if (!anchor) return;
    openLink(anchor.cloneNode(false) as HTMLAnchorElement, event, false);
  };
  return (
    <MenuItemContent
      {...props}
      nativeLinkHref={linkHref}
      onNativeLinkElement={onNativeLinkElement}
      onNativeElement={onNativeElement}
      onClick={onClick}
      onNavigate={(event) => {
        const anchor = activatedLink.current;
        if (
          !anchor?.hasAttribute('href') ||
          event.defaultPrevented ||
          event.button !== 0
        )
          return;
        if (
          shouldClientNavigate(anchor, event) &&
          !isDefault &&
          !isCurrentDocument &&
          !nativeRoute &&
          !isExternal
        ) {
          event.preventDefault();
          if (cleanTo !== undefined) navigate(cleanTo, navigationOptions);
        } else if (
          !(event.target instanceof Element) ||
          !anchor.contains(event.target)
        ) {
          openNative(event);
        }
      }}
    />
  );
}

function MenuItemContent<T>(
  props: MenuItemProps<T> & {
    nativeLinkHref?: string;
    onNativeLinkElement?: (element: HTMLAnchorElement | null) => void;
    onNativeElement?: (element: HTMLElement | null) => void;
    onNavigate?: (event: MouseEvent<FocusableElement>) => void;
    onClick?: (event: MouseEvent<FocusableElement>) => void;
  },
) {
  const { item, state, styles, isVirtualized, onAction, size, id } = props;
  const { onClose, closeOnSelect } = useMenuContext();
  const { rendered, key, props: itemProps } = item;

  // Check if this item is wrapped in a SubmenuTriggerContext
  const submenuContext = useContext(SubmenuTriggerContext);

  // Filter out service props (react-stately and parent-handled props)
  // All remaining props are safe to pass to Item component
  const {
    id: ownId,
    to: _to,
    navigationOptions: _navigationOptions,
    routerOptions: _routerOptions,
    href: _href,
    target: _target,
    rel: _rel,
    download: _download,
    ping: _ping,
    referrerPolicy: _referrerPolicy,
    ...filteredItemProps
  } = filterCollectionItemProps(itemProps);

  // Extract specific props that need special handling
  const { hotkeys, mods: itemMods, qa: itemQa } = filteredItemProps;

  const isSelectable = state.selectionManager.selectionMode !== 'none';
  const isDisabledKey =
    state.selectionManager.isDisabled(key) ||
    submenuContext?.isDisabled ||
    (filteredItemProps.isLoading && filteredItemProps.isDisabled !== false);

  const ref = useRef<HTMLElement>(null);
  // Use the triggerRef from submenu context if present
  const elementRef = (submenuContext?.triggerRef ?? ref) as any;

  const {
    menuItemProps,
    labelProps,
    descriptionProps,
    keyboardShortcutProps,
    isFocused,
    isSelected,
    isPressed,
    isDisabled,
  } = useMenuItem(
    {
      id: id ?? ownId,
      isSelected: state.selectionManager.isSelected(key),
      isDisabled: isDisabledKey,
      'aria-label': item['aria-label'],
      'aria-haspopup': submenuContext ? 'menu' : undefined,
      'aria-expanded': submenuContext
        ? submenuContext.isOpen
          ? 'true'
          : 'false'
        : undefined,
      key,
      onClose: submenuContext ? undefined : onClose, // Don't close menu for submenu triggers
      closeOnSelect: submenuContext ? false : closeOnSelect, // Don't close on submenu trigger selection
      isVirtualized,
      onAction,
      onClick: (event) => {
        (props.onClick ?? itemProps[MENU_LINK_CLICK])?.(event);
        submenuContext?.onAction?.();
      },
    },
    state,
    elementRef,
  );

  // Selection indicator will be handled by Item component
  const isVirtualFocused = state.selectionManager.focusedKey === key;

  // `mergeProps` chains handlers rather than replacing them, so a handler of
  // the item's own passed to it again runs twice. `onKeyDown` used to be: Enter
  // and Space each click the item, so every keyboard activation fired
  // `onAction` twice. It is taken out here and passed once.
  const {
    onKeyDown: itemOnKeyDown,
    onPointerDown: itemOnPointerDown,
    onPointerUp: itemOnPointerUp,
    href: _renderedHref,
    target: _renderedTarget,
    rel: _renderedRel,
    download: _renderedDownload,
    ping: _renderedPing,
    referrerPolicy: _renderedPolicy,
    ...itemOwnProps
  } = menuItemProps as typeof menuItemProps &
    AnchorHTMLAttributes<HTMLAnchorElement>;
  const isLink = itemProps.href != null && !submenuContext;
  const skippedPointerUp = useRef<globalThis.PointerEvent | null>(null);
  const { addGlobalListener, removeAllGlobalListeners } = useGlobalListeners();
  const onPointerDown = (event: PointerEvent<FocusableElement>) => {
    skippedPointerUp.current = null;
    removeAllGlobalListeners();
    // A modified native gesture must not start Aria's delayed-click fallback.
    if (
      isLink &&
      (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
    ) {
      const pointerId = event.pointerId;
      const ownerDocument = event.currentTarget.ownerDocument;
      const recordSkippedUp = (up: globalThis.PointerEvent) => {
        if (up.pointerId !== pointerId) return;
        skippedPointerUp.current = up;
        removeAllGlobalListeners();
      };
      const clearSkippedUp = (cancel: globalThis.PointerEvent) => {
        if (cancel.pointerId !== pointerId) return;
        skippedPointerUp.current = null;
        removeAllGlobalListeners();
      };
      addGlobalListener(ownerDocument, 'pointerup', recordSkippedUp, true);
      addGlobalListener(ownerDocument, 'pointercancel', clearSkippedUp, true);
      return;
    }
    itemOnPointerDown?.(event);
  };
  const onPointerUp = (event: PointerEvent<FocusableElement>) => {
    if (skippedPointerUp.current === event.nativeEvent) {
      skippedPointerUp.current = null;
      return;
    }
    if (
      isLink &&
      (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
    )
      return;
    itemOnPointerUp?.(event);
  };
  const onKeyDown = (e: KeyboardEvent<FocusableElement>) => {
    if (isLink && !isDisabled && (e.key === ' ' || e.key === 'Enter')) {
      if (e.nativeEvent.isComposing || (e.key === ' ' && e.repeat)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        itemOnKeyDown?.(e);
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            detail: 1,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
          }),
        );
        return;
      }
    }
    if (submenuContext?.onKeyDown) {
      // The submenu goes first; a key it handles is not the item's too.
      submenuContext.onKeyDown?.(e);
      if (!e.defaultPrevented) itemOnKeyDown?.(e);
    } else itemOnKeyDown?.(e);
  };

  const mods = {
    ...itemMods,
    focused: isFocused || isVirtualFocused,
    pressed: isPressed,
    selected: isSelected,
    disabled: isDisabled,
    submenu: !!submenuContext,
    menuitem: true,
  };

  const nativeLinkProps: AnchorHTMLAttributes<HTMLAnchorElement> | undefined =
    props.onNativeLinkElement
      ? {
          href: isLink && !isDisabled ? props.nativeLinkHref : undefined,
          target: itemProps.target,
          rel: itemProps.rel,
          download: itemProps.download,
          ping: itemProps.ping,
          referrerPolicy: itemProps.referrerPolicy,
          tabIndex: -1,
          'aria-hidden': isLink || undefined,
          role: 'none',
          onMouseDown: (event) => {
            if (!isDisabled && menuItemProps.tabIndex != null)
              elementRef.current?.focus({ preventScroll: true });
            event.preventDefault();
          },
        }
      : undefined;

  const content = (
    <FocusRing>
      <ItemWithNativeLinks
        {...mergeProps({ ...itemOwnProps, onKeyDown }, filteredItemProps, {
          'data-popover-trigger': true,
          qa: itemQa ? itemQa : `MenuItem-${key}`,
          mods,
          styles,
          style: filteredItemProps.style,
          'data-size': size,
          as: 'li',
          onClick: isDisabled ? undefined : props.onNavigate,
          labelProps,
          descriptionProps,
          keyboardShortcutProps,
          'aria-haspopup': submenuContext ? 'menu' : undefined,
          'aria-expanded': submenuContext?.isOpen,
          'data-has-submenu': submenuContext ? true : undefined,
          // Chained after the item's own hover handlers.
          onMouseEnter: submenuContext?.onMouseEnter,
          onMouseLeave: submenuContext?.onMouseLeave,
        })}
        {...{
          onPointerDown: (event: PointerEvent<FocusableElement>) => {
            onPointerDown(event);
            filteredItemProps.onPointerDown?.(event);
          },
          onPointerUp: (event: PointerEvent<FocusableElement>) => {
            onPointerUp(event);
            filteredItemProps.onPointerUp?.(event);
          },
        }}
        ref={elementRef}
        nativeLinkProps={nativeLinkProps}
        onNativeLinkElement={props.onNativeLinkElement}
        onNativeElement={props.onNativeElement}
        actions={
          props.onNativeLinkElement &&
          filteredItemProps.actions &&
          filteredItemProps.actions !== true ? (
            <ClearPressResponder>
              {filteredItemProps.actions}
            </ClearPressResponder>
          ) : (
            filteredItemProps.actions
          )
        }
        disableActionsFocus={true}
        rightIcon={submenuContext ? <RightIcon /> : filteredItemProps.rightIcon}
        defaultTooltipPlacement="right"
        isSelected={isSelectable ? isSelected : undefined}
        isDisabled={isDisabled}
        size={size === 'small' ? 'small' : 'medium'}
      >
        {rendered}
      </ItemWithNativeLinks>
    </FocusRing>
  );

  return content;
}
