import { OUTER_STYLES, tasty } from '@tenphi/tasty';
import {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  Ref,
  useRef,
  useState,
} from 'react';
import { useFocusVisible } from 'react-aria';

import { useWarn } from '../../../_internal/hooks/use-warn';
import { pickBaseCustomizationProps } from '../../../utils/react/pickBaseCustomizationProps';
import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';
import { useMergeStyles } from '../../../utils/react/useMergeStyles';
import { extractStyles } from '../../../utils/styles';
import { ItemButton } from '../../actions/ItemButton/ItemButton';
import { useTinyScrollbar } from '../../content/Layout/hooks/useTinyScrollbar';
import {
  followTabInStrip,
  scrollTabIntoStrip,
} from '../Tabs/scroll-tab-into-strip';
import {
  TAB_ELEMENT_STYLES,
  TabContainer,
  TabIndicatorElement,
  TabsElement,
} from '../Tabs/styled';
import { findTabItem, useTabIndicator } from '../Tabs/use-tab-indicator';

import type { OuterStyleProps, Styles } from '@tenphi/tasty';
import type { To } from '../../../providers/navigation.types';
import type { ComponentBaseProps } from '../../../utils/react/componentBaseProps';
import type { CubeItemProps } from '../../content/Item/Item';
import type { TabPlacement } from '../Tabs/types';

export interface CubeNavTabsProps extends ComponentBaseProps, OuterStyleProps {
  /** Accessible name of the navigation landmark, such as the area it moves between. */
  label: string;
  /**
   * Key of the item for the current page. A sub-page passes its section's key,
   * so the section stays current.
   */
  activeKey?: string;
  /**
   * Where the strip sits, as on `Tabs`: `'top'` / `'bottom'` keep it
   * horizontal, `'left'` / `'right'` make it vertical.
   * @default 'top'
   */
  placement?: TabPlacement;
  /**
   * Inline padding for the item list, as on `Tabs` (e.g. `"2x"` → `0 2x`).
   */
  tabListPadding?: string;
  /** Custom tasty styles for the root element. */
  styles?: Styles;
  /** Custom tasty styles for the strip (Bar sub-element). */
  barStyles?: Styles;
  /** Custom tasty styles for the item list (TabList sub-element). */
  tabListStyles?: Styles;
  /** `NavTabs.Item` elements, each with a React `key`. */
  children?: ReactNode;
  /** The `nav` element. */
  ref?: Ref<HTMLElement>;
}

export interface CubeNavTabsItemProps extends Pick<
  CubeItemProps,
  'icon' | 'tooltip' | 'qa'
> {
  /** Where the item leads: a path or a `{ pathname, search, hash }` object. */
  to: To;
  /** The item's label. Optional for an icon-only item with an `aria-label`. */
  children?: ReactNode;
  /** A disabled item leads nowhere: it has no `href` and can't be activated. */
  isDisabled?: boolean;
  /** The accessible name of an icon-only item. */
  'aria-label'?: string;
}

interface ParsedItem extends CubeNavTabsItemProps {
  key: string;
}

/** Configuration only: `NavTabs` renders each item from its props. */
function NavTabsItem(_props: CubeNavTabsItemProps): ReactElement | null {
  return null;
}

NavTabsItem.displayName = 'CubeNavTabsItem';

/** The `NavTabs.Item` children, keyed by the React `key` that `activeKey` names. */
function parseItems(children: ReactNode) {
  const items: ParsedItem[] = [];
  let hasUnkeyedItem = false;

  Children.forEach(children, (child) => {
    if (!isValidElement<CubeNavTabsItemProps>(child)) return;
    if (child.type !== NavTabsItem) return;

    if (child.key == null) hasUnkeyedItem = true;
    else items.push({ ...child.props, key: String(child.key) });
  });

  return { items, hasUnkeyedItem };
}

// A link wearing the tab look; `ItemButton` makes it one through `to`.
const NavTabElement = tasty(ItemButton, { styles: TAB_ELEMENT_STYLES });

// The item list: a list without markers or the default indent. `TabList`'s
// own padding reads `$tablist-padding`, so the list takes that token itself.
const NavTabsList = tasty({
  as: 'ul',
  styles: { margin: 0, listStyle: 'none' },
});

function NavTab({
  item,
  isActive,
  placement,
}: {
  item: ParsedItem;
  isActive: boolean;
  placement: TabPlacement;
}) {
  const { isFocusVisible } = useFocusVisible();
  const { key, to, children, isDisabled, qa, ...itemProps } = item;
  const mods = { type: 'default', placement };

  return (
    <TabContainer as="li" mods={mods}>
      <NavTabElement
        {...itemProps}
        // A disabled item is no destination, so nothing can open it.
        to={isDisabled ? undefined : to}
        isDisabled={isDisabled}
        type="clear"
        data-key={key}
        aria-current={isActive ? 'page' : undefined}
        qa={qa ?? `NavTab-${key}`}
        // The current item looks selected; a link has no selected state.
        mods={{ ...mods, selected: isActive, 'focus-visible': isFocusVisible }}
      >
        {children}
      </NavTabElement>
    </TabContainer>
  );
}

/**
 * Navigation between routes that looks like `Tabs`: a navigation landmark
 * holding a list of links, with the current one marked by `aria-current`.
 * Unlike `Tabs`, it has no panels and no selection of its own: each item is a
 * link, and `activeKey` names the current route's item.
 */
function NavTabsRoot(props: CubeNavTabsProps) {
  const {
    label,
    activeKey,
    placement = 'top',
    tabListPadding,
    barStyles,
    tabListStyles,
    children,
    qa = 'NavTabs',
    mods,
    tokens,
    ref,
  } = props;

  const { items, hasUnkeyedItem } = parseItems(children);

  useWarn(hasUnkeyedItem, {
    key: ['nav-tabs-item-without-key'],
    args: [
      'NavTabs:',
      'every `NavTabs.Item` needs a React `key`, which `activeKey` names. An item without one is not rendered.',
    ],
  });
  const orientation =
    placement === 'left' || placement === 'right' ? 'vertical' : 'horizontal';

  const scrollRef = useRef<HTMLDivElement>(null);
  // The indicator watches the list element itself.
  const [listElement, setListElement] = useState<HTMLUListElement | null>(null);

  // Changes when items come, go or move: both the indicator and the scroll
  // below find the current item again.
  const orderToken = items.map((item) => item.key).join(',');
  const indicator = useTabIndicator(
    listElement,
    activeKey ?? null,
    true,
    orientation,
    orderToken,
  );
  const {
    handleHTokens,
    handleVTokens,
    hasOverflowX,
    hasOverflowY,
    isScrolling,
    isAtStartX,
    isAtEndX,
    isAtStartY,
    isAtEndY,
  } = useTinyScrollbar(scrollRef, true);
  const isVertical = orientation === 'vertical';
  const hasOverflow = isVertical ? hasOverflowY : hasOverflowX;

  // Show the current item in a strip that overflows, and keep it there while it
  // settles, as Tabs does for its selected tab: an item that arrives late or a
  // strip shown after mount still ends up in view. Only the strip scrolls,
  // never the page.
  useLayoutEffect(() => {
    const item =
      listElement && activeKey != null
        ? findTabItem(listElement, activeKey)
        : null;

    if (!item) return;

    const keep = () => scrollTabIntoStrip(item, placement);

    keep();

    return followTabInStrip(item, keep);
  }, [listElement, activeKey, placement, orderToken]);

  const styles = useMergeStyles(extractStyles(props, OUTER_STYLES), {
    Bar: barStyles,
    TabList: tabListStyles,
  });

  return (
    <TabsElement
      {...pickBaseCustomizationProps(props)}
      ref={ref}
      as="nav"
      aria-label={label}
      qa={qa}
      mods={{
        type: 'default',
        placement,
        scrolling: isScrolling,
        'fade-start': !(isVertical ? isAtStartY : isAtStartX),
        'fade-end': !(isVertical ? isAtEndY : isAtEndX),
        ...mods,
      }}
      styles={styles}
      // The measured scrollbar handle wins over a caller's token of the same name.
      tokens={{ ...tokens, ...(isVertical ? handleVTokens : handleHTokens) }}
    >
      <div data-element="Bar">
        <div data-element="ScrollWrapper">
          <div ref={scrollRef} data-element="Scroll">
            <NavTabsList
              ref={setListElement}
              data-element="TabList"
              tokens={
                tabListPadding
                  ? { '$tablist-padding': tabListPadding }
                  : undefined
              }
            >
              {items.map((item) => (
                <NavTab
                  key={item.key}
                  item={item}
                  isActive={item.key === activeKey}
                  placement={placement}
                />
              ))}
              {indicator && (
                <TabIndicatorElement
                  as="li"
                  aria-hidden="true"
                  mods={{ placement }}
                  tokens={{
                    '$indicator-start': `${indicator.start}px`,
                    '$indicator-size': `${indicator.size}px`,
                  }}
                />
              )}
            </NavTabsList>
          </div>
          {hasOverflow && <div data-element="Scrollbar" />}
        </div>
      </div>
    </TabsElement>
  );
}

NavTabsRoot.displayName = 'CubeNavTabs';

/** `NavTabs` with its `Item`, named so a consumer's declarations can refer to it. */
export interface NavTabsComponent {
  (props: CubeNavTabsProps): ReactElement;
  /** One link in the strip. Configuration only: `NavTabs` renders it. */
  Item: (props: CubeNavTabsItemProps) => ReactElement | null;
  displayName?: string;
}

/**
 * Route navigation that looks like `Tabs`.
 *
 * @example
 * <NavTabs label="Tenant" activeKey={section}>
 *   <NavTabs.Item key="profile" to="/tenants/42/profile">Profile</NavTabs.Item>
 *   <NavTabs.Item key="users" to="/tenants/42/users">Users</NavTabs.Item>
 * </NavTabs>
 */
export const NavTabs: NavTabsComponent = Object.assign(NavTabsRoot, {
  Item: NavTabsItem,
});
