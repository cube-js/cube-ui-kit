import { openLink } from '@react-aria/utils';
import { FocusableElement, Key, Node } from '@react-types/shared';
import {
  CONTAINER_STYLES,
  mergeStyles,
  POSITION_STYLES,
  renderStyles,
  Styles,
  useRawCSS,
} from '@tenphi/tasty';
import {
  AnchorHTMLAttributes,
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  useContext,
  useId,
  useRef,
} from 'react';
import { FocusRing, RouterProvider, useMenuItem } from 'react-aria';
import { TreeState } from 'react-stately';

import { RightIcon } from '../../../icons/RightIcon';
import { isExternalUrl } from '../../../providers/navigation-url';
import { useNavigation } from '../../../providers/use-navigation';
import { mergeProps } from '../../../utils/react';
import { extractStyles, mergeStyleLayers } from '../../../utils/styles';
import { filterCollectionItemProps } from '../../CollectionItem';
import { Item } from '../../content/Item/Item';
import {
  DEFAULT_ACTIONS_STYLES,
  ItemActionsWrapper,
} from '../ItemActionsWrapper';
import { parseTo } from '../use-action';

import { useMenuContext } from './context';
import { CURRENT_DOCUMENT_LINK, MENU_LINK_CLICK } from './MenuCollectionItem';
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
  const submenuContext = useContext(SubmenuTriggerContext);
  return props.item.props.href != null && !submenuContext ? (
    <MenuLinkItem {...props} />
  ) : (
    <MenuItemContent {...props} />
  );
}

const DEFAULT_OWNER_STYLES: Styles = {
  display: 'grid',
  margin: 0,
  flexShrink: 0,
};
const OWNER_STYLE_PROPS = [
  'hide',
  'opacity',
  'visibility',
  ...POSITION_STYLES,
  'width',
  'inlineSize',
  'flex',
  'flexBasis',
  'flexGrow',
  'flexShrink',
];
const OWNER_CSS_KEYS = [
  'opacity',
  'visibility',
  'order',
  'position',
  'inset',
  'top',
  'right',
  'bottom',
  'left',
  'insetBlock',
  'insetBlockStart',
  'insetBlockEnd',
  'insetInline',
  'insetInlineStart',
  'insetInlineEnd',
  'width',
  'minWidth',
  'maxWidth',
  'inlineSize',
  'minInlineSize',
  'maxInlineSize',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'gridArea',
  'gridRow',
  'gridRowStart',
  'gridRowEnd',
  'gridColumn',
  'gridColumnStart',
  'gridColumnEnd',
  'alignSelf',
  'justifySelf',
  'placeSelf',
  'zIndex',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginBlockStart',
  'marginBlockEnd',
  'marginInline',
  'marginInlineStart',
  'marginInlineEnd',
  'scrollMargin',
  'scrollMarginTop',
  'scrollMarginRight',
  'scrollMarginBottom',
  'scrollMarginLeft',
  'scrollMarginBlock',
  'scrollMarginBlockStart',
  'scrollMarginBlockEnd',
  'scrollMarginInline',
  'scrollMarginInlineStart',
  'scrollMarginInlineEnd',
  'transform',
  'transformOrigin',
  'translate',
  'rotate',
  'scale',
];
const isSharedCSS = (key: string) =>
  key === 'display' || key === 'transition' || key.startsWith('--');
const filterInlineStyles = (
  style: CSSProperties | undefined,
  owner: boolean,
): CSSProperties | undefined =>
  style &&
  Object.fromEntries(
    Object.entries(style).filter(([key]) =>
      owner
        ? OWNER_CSS_KEYS.includes(key) || isSharedCSS(key)
        : !OWNER_CSS_KEYS.includes(key),
    ),
  );
function projectOwnerStyles(styles: Styles, id: string) {
  return renderStyles(styles)
    .rules.map((rule) => {
      const selector = (rule.selector || '')
        .split('|||')
        .map((suffix) => {
          const owner = `[data-element="MenuLink"]:has(> * > [data-menu-link-anchor="${id}"])`;
          // CSS forbids nested :has(); structural predicates match the row owner.
          const subject = suffix.toLowerCase().includes(':has(')
            ? owner + suffix
            : `[data-element="MenuLink"]:has(> * > [data-menu-link-anchor="${id}"]${suffix})`;
          return (rule.rootPrefix ? rule.rootPrefix + ' ' : '') + subject;
        })
        .join(',');
      const css = selector + ' { ' + rule.declarations + ' }';
      return [
        ...(rule.atRules || []),
        ...(rule.startingStyle ? ['@starting-style'] : []),
      ].reduceRight((body, at) => at + ' { ' + body + ' }', css);
    })
    .join('\n');
}

function MenuLinkItem<T>(props: MenuItemProps<T>) {
  const activatedLink = useRef<HTMLAnchorElement>(null);
  const { to, href, navigationOptions } = props.item.props;
  const { cleanTo: parsedTo, nativeRoute } = parseTo(to);
  const isCurrentDocument = props.item.props[CURRENT_DOCUMENT_LINK];
  const cleanTo = to != null ? parsedTo : isCurrentDocument ? '' : href;
  const isExternal = typeof cleanTo === 'string' && isExternalUrl(cleanTo);
  const { navigate, resolvedHref } = useNavigation(
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
  const isDisabled =
    props.state.selectionManager.isDisabled(props.item.key) ||
    (itemProps.isLoading && itemProps.isDisabled !== false);
  const isVirtualFocused =
    props.state.selectionManager.focusedKey === props.item.key;
  const rawLinkId = useId();
  const linkMarker = Array.from(rawLinkId, (c) =>
    c.codePointAt(0)!.toString(16),
  ).join('-');
  const allRowStyles = mergeStyleLayers(itemProps.styles, props.styles);
  const { styles: _styles, ...directProps } = itemProps;
  const ownerInput = mergeStyleLayers(
    allRowStyles,
    extractStyles(
      directProps,
      OWNER_STYLE_PROPS.concat('display', 'transition'),
    ),
  );
  const ownerStyles = mergeStyleLayers(
    DEFAULT_OWNER_STYLES,
    Object.fromEntries(
      Object.entries(ownerInput).filter(
        ([key]) =>
          OWNER_STYLE_PROPS.includes(key) ||
          key === 'display' ||
          key === 'transition' ||
          (/^[#@$]/.test(key) && key !== '$'),
      ),
    ),
  );
  const ownerInlineStyle = filterInlineStyles(itemProps.style, true);
  const { Actions: rawActions, ...rowStyles } = Object.fromEntries(
    Object.entries(allRowStyles).filter(
      ([key]) => !OWNER_STYLE_PROPS.includes(key),
    ),
  ) as Styles;
  useRawCSS(projectOwnerStyles(ownerStyles, linkMarker), {
    id: 'menu-owner-' + linkMarker,
  });
  const actionStyles = rawActions as Styles | null | false | undefined;
  const actionTokens = Object.fromEntries(
    Object.entries(rowStyles).filter(
      ([key]) => /^[#$]/.test(key) && key !== '$',
    ),
  );
  const inheritedColor = mergeStyleLayers(
    { color: rowStyles.color },
    { color: itemProps.color },
  );
  const siblingActions =
    actionStyles === null || actionStyles === false
      ? actionStyles
      : mergeStyleLayers(
          DEFAULT_ACTIONS_STYLES,
          { '@block-description': '[data-description="block"]' },
          actionStyles,
        );
  // The run's complete style map is owned by the anchor, including its defaults.
  const wrapperStyles = {
    color:
      inheritedColor.color === null || inheritedColor.color === false
        ? inheritedColor.color
        : undefined,
    // eslint-disable-next-line tasty/valid-sub-element -- Remove the wrapper defaults; the row owns the merged Actions map below.
    Actions: null,
    ActionsChild: { $: '>ActionsContext>Actions>*' },
    ActionIcon: { $: '>ActionsContext>Actions>' },
    ActionsContext: { $: '>', display: 'contents' },
  };
  // Keep consumer predicates on the row, including CSS focus and hover states.
  const linkStyles = {
    // eslint-disable-next-line tasty/no-style-spread -- Forward the consumer's complete row styles before adding the sibling slot.
    ...rowStyles,
    // eslint-disable-next-line tasty/no-nested-selector -- Tasty's sub-element $ cannot leave the row; its sibling context supplies normal color inheritance.
    '& ~ [data-element="ActionsContext"]': mergeStyleLayers(
      actionTokens,
      inheritedColor,
    ),
    // eslint-disable-next-line tasty/no-nested-selector -- Apply the consumer's slot with the row's predicate context and its own inherited color.
    '& ~ [data-element="ActionsContext"] > [data-element="Actions"]':
      siblingActions,
  };
  return (
    <StyledLinkItem
      role="none"
      data-element="MenuLink"
      style={ownerInlineStyle}
      tokens={itemProps.tokens}
    >
      <ItemActionsWrapper
        actions={itemProps.actions}
        type={itemProps.type}
        theme={itemProps.theme}
        size={props.size === 'small' ? 'small' : 'medium'}
        isDisabled={isDisabled}
        disableActionsFocus
        autoHideActions={itemProps.autoHideActions && !isVirtualFocused}
        preserveActionsSpace={itemProps.preserveActionsSpace}
        styles={wrapperStyles}
        tokens={itemProps.tokens}
        actionsContext
      >
        {({ showActions, skipActionsWidthTransition }) => (
          <RouterProvider
            useHref={() => linkHref}
            navigate={() => {
              if (nativeRoute && cleanTo === '') window.location.reload();
              else if (isCurrentDocument || nativeRoute || isExternal) {
                // Aria intercepts same-origin URLs; retain the anchor's native attributes.
                const nativeLink = activatedLink.current?.cloneNode(false) as
                  | HTMLAnchorElement
                  | undefined;
                nativeLink?.click();
              } else if (cleanTo !== undefined)
                navigate(cleanTo, navigationOptions);
            }}
          >
            <MenuItemContent
              {...props}
              styles={linkStyles}
              linkMarker={linkMarker}
              showActions={showActions}
              skipActionsWidthTransition={skipActionsWidthTransition}
              onClick={(event) => {
                activatedLink.current =
                  event.currentTarget as HTMLAnchorElement;
                itemProps[MENU_LINK_CLICK]?.(event);
              }}
            />
          </RouterProvider>
        )}
      </ItemActionsWrapper>
    </StyledLinkItem>
  );
}

function MenuItemContent<T>(
  props: MenuItemProps<T> & {
    linkMarker?: string;
    showActions?: boolean;
    skipActionsWidthTransition?: boolean;
    onClick?: (event: MouseEvent<FocusableElement>) => void;
  },
) {
  const {
    item,
    state,
    styles,
    isVirtualized,
    onAction,
    size,
    id,
    showActions = false,
    skipActionsWidthTransition = false,
  } = props;
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
    styles: ownStyles,
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
      onClick: props.onClick ?? itemProps[MENU_LINK_CLICK],
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
  const isLink = itemProps.href != null && !submenuContext;
  const onKeyDown = (e: KeyboardEvent<FocusableElement>) => {
    // Aria 3.52.1 clicks menu links on Space down, then opens them again on up.
    // Use its existing click path once without registering the second press.
    if (isLink && !isDisabled && e.key === ' ') {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
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

  const content = (
    <FocusRing>
      <Item
        {...mergeProps(
          { ...itemOwnProps, onKeyDown },
          isLink
            ? Object.fromEntries(
                Object.entries(filteredItemProps).filter(
                  ([key]) => !OWNER_STYLE_PROPS.includes(key),
                ),
              )
            : filteredItemProps,
          {
            'data-popover-trigger': true,
            qa: itemQa ? itemQa : `MenuItem-${key}`,
            mods,
            styles: isLink ? styles : mergeStyles(ownStyles, styles),
            'data-menu-link-anchor': props.linkMarker,
            style: isLink
              ? filterInlineStyles(filteredItemProps.style, false)
              : filteredItemProps.style,
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
          },
        )}
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

  return content;
}
