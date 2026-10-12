import { openLink } from '@react-aria/utils';
import { FocusableElement, Key, Node } from '@react-types/shared';
import { Styles } from '@tenphi/tasty';
import { AnchorHTMLAttributes, KeyboardEvent, useContext, useRef } from 'react';
import { FocusRing, RouterProvider, useMenuItem } from 'react-aria';
import { TreeState } from 'react-stately';

import { RightIcon } from '../../../icons/RightIcon';
import { useNavigation } from '../../../providers/use-navigation';
import { mergeProps } from '../../../utils/react';
import { filterCollectionItemProps } from '../../CollectionItem';
import { Item } from '../../content/Item/Item';
import { ItemActionsWrapper } from '../ItemActionsWrapper';
import { parseTo } from '../use-action';

import { useMenuContext } from './context';
import { StyledLinkItem } from './styled';
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
  const { to, href, navigationOptions } = props.item.props;
  const { cleanTo, isExternal, nativeRoute } = parseTo(to ?? href);
  const { navigate, resolvedHref } = useNavigation(
    isExternal ? '.' : cleanTo ?? '.',
    { relative: navigationOptions?.relative },
  );
  const linkHref = isExternal ? String(cleanTo) : resolvedHref;

  return (
    <RouterProvider
      useHref={() => linkHref}
      navigate={() => {
        if (nativeRoute) window.location.assign(linkHref);
        else if (cleanTo !== undefined) navigate(cleanTo, navigationOptions);
      }}
    >
      <MenuItemContent {...props} />
    </RouterProvider>
  );
}

function MenuItemContent<T>(props: MenuItemProps<T>) {
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
      key,
      onClose: submenuContext ? undefined : onClose, // Don't close menu for submenu triggers
      closeOnSelect: submenuContext ? false : closeOnSelect, // Don't close on submenu trigger selection
      isVirtualized,
      onAction: submenuContext?.onAction || onAction,
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
    href: renderedHref,
    ...itemOwnProps
  } = menuItemProps as typeof menuItemProps &
    Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;
  const isLink = !!itemProps.href && !submenuContext;
  const onKeyDown = (e: KeyboardEvent<FocusableElement>) => {
    // Aria 3.52.1 clicks menu links on Space down, then opens them again on up.
    // Use its existing click path once without registering the second press.
    if (isLink && !isDisabled && e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      openLink(e.currentTarget as HTMLAnchorElement, e, false);
      return;
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

  const renderItem = (
    showActions = false,
    skipActionsWidthTransition = false,
  ) => (
    <FocusRing>
      <Item
        {...mergeProps({ ...itemOwnProps, onKeyDown }, filteredItemProps, {
          'data-popover-trigger': true,
          qa: itemQa ? itemQa : `MenuItem-${key}`,
          mods,
          styles,
          'data-size': size,
          as: isLink ? 'a' : 'li',
          href: isLink && !isDisabled ? renderedHref : undefined,
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
        ref={elementRef}
        insideWrapper={isLink}
        actions={
          isLink
            ? filteredItemProps.actions
              ? true
              : undefined
            : filteredItemProps.actions
        }
        showActions={showActions}
        skipActionsWidthTransition={skipActionsWidthTransition}
        disableActionsFocus={true}
        rightIcon={submenuContext ? <RightIcon /> : filteredItemProps.rightIcon}
        defaultTooltipPlacement="right"
        isSelected={isSelectable ? isSelected : undefined}
        isDisabled={isDisabled}
        size={size === 'small' ? 'small' : 'medium'}
      >
        {rendered}
      </Item>
    </FocusRing>
  );

  if (!isLink) return renderItem();

  return (
    <StyledLinkItem role="none">
      <ItemActionsWrapper
        actions={filteredItemProps.actions}
        type={filteredItemProps.type}
        theme={filteredItemProps.theme}
        size={size === 'small' ? 'small' : 'medium'}
        isDisabled={isDisabled}
        disableActionsFocus
        autoHideActions={
          filteredItemProps.autoHideActions && !(isFocused || isVirtualFocused)
        }
        preserveActionsSpace={filteredItemProps.preserveActionsSpace}
      >
        {({ showActions, skipActionsWidthTransition }) =>
          renderItem(showActions, skipActionsWidthTransition)
        }
      </ItemActionsWrapper>
    </StyledLinkItem>
  );
}
