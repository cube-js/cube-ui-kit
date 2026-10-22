import { isFocusable, useObjectRef, useSyncRef } from '@react-aria/utils';
import {
  CollectionChildren,
  FocusStrategy,
  ItemProps,
  Key,
} from '@react-types/shared';
import {
  BasePropsWithoutChildren,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  Styles,
} from '@tenphi/tasty';
import React, { KeyboardEvent, ReactElement, ReactNode, Ref } from 'react';
import { AriaMenuProps, useMenu } from 'react-aria';
import { Section as BaseSection, useTreeState } from 'react-stately';

import { mergeProps } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import { useMenuContext } from './context';
import { getMenuItemReactKey, MenuCollectionItem } from './MenuCollectionItem';
import { MenuItem } from './MenuItem';
import { MenuSection } from './MenuSection';
import { MenuTrigger } from './MenuTrigger';
import {
  StyledDivider,
  StyledFooter,
  StyledHeader,
  StyledMenu,
  StyledMenuWrapper,
} from './styled';
import { SubMenuTrigger } from './SubMenuTrigger';

export interface CubeMenuProps<T>
  extends
    BasePropsWithoutChildren,
    ContainerStyleProps,
    Omit<
      AriaMenuProps<T>,
      | 'children'
      | 'onAction'
      | 'selectedKeys'
      | 'defaultSelectedKeys'
      | 'onSelectionChange'
    > {
  children?: ReactNode | CollectionChildren<T>;
  onAction?: (key: Key) => void;
  // @deprecated
  header?: ReactNode;
  footer?: ReactNode;
  menuStyles?: Styles;
  headerStyles?: Styles;
  footerStyles?: Styles;
  styles?: Styles;
  itemStyles?: Styles;
  sectionStyles?: Styles;
  sectionHeadingStyles?: Styles;
  /**
   * Whether keyboard navigation should wrap around when reaching the start/end of the collection.
   * This directly maps to the `shouldFocusWrap` option supported by React-Aria's `useMenu` hook.
   */
  shouldFocusWrap?: boolean;

  /**
   * Whether the menu should automatically receive focus when it mounts.
   * This directly maps to the `autoFocus` option supported by React-Aria's `useMenu` hook.
   */
  autoFocus?: boolean | FocusStrategy;
  shouldUseVirtualFocus?: boolean;

  /** Size of the menu items */
  size?: 'medium' | 'large' | (string & {});

  /** Currently selected keys (controlled) */
  selectedKeys?: string[];
  /** Initially selected keys (uncontrolled) */
  defaultSelectedKeys?: string[];
  /** Handler for selection changes */
  onSelectionChange?: (keys: string[]) => void;
}

function Menu<T extends object>(
  props: CubeMenuProps<T>,
  ref: Ref<HTMLUListElement>,
) {
  const {
    header,
    footer,
    menuStyles,
    headerStyles,
    footerStyles,
    itemStyles,
    sectionStyles,
    sectionHeadingStyles,
    size = 'medium',
    qa,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    onAction,
    ...rest
  } = props;
  const domRef = useObjectRef(ref);
  const contextProps = useMenuContext();

  // Convert string[] to Set<Key> for React Aria compatibility
  const ariaSelectedKeys = selectedKeys ? new Set(selectedKeys) : undefined;
  const ariaDefaultSelectedKeys = defaultSelectedKeys
    ? new Set(defaultSelectedKeys)
    : undefined;

  const handleSelectionChange = onSelectionChange
    ? (keys: any) => {
        if (keys === 'all') {
          // Handle 'all' selection case - collect all available keys
          const allKeys = Array.from(state.collection.getKeys()).map(
            (key: any) => String(key),
          );
          onSelectionChange(allKeys);
        } else if (keys instanceof Set) {
          onSelectionChange(Array.from(keys).map((key) => String(key)));
        } else {
          onSelectionChange([]);
        }
      }
    : undefined;

  const completeProps = mergeProps(contextProps, rest, {
    onAction: onAction ? (key: Key) => onAction(key) : undefined,
    selectedKeys: ariaSelectedKeys,
    defaultSelectedKeys: ariaDefaultSelectedKeys,
    onSelectionChange: handleSelectionChange,
  });

  // Props used for collection building.
  const state = useTreeState({
    ...completeProps,
    children: completeProps.children as CollectionChildren<T>,
  });
  const collectionItems = [...state.collection];
  const hasSections = collectionItems.some((item) => item.type === 'section');

  const { menuProps } = useMenu(
    { ...completeProps, onKeyDown: undefined },
    state,
    domRef,
  );
  const handleInlineNavigation = (event: KeyboardEvent<HTMLUListElement>) => {
    const menu = event.currentTarget;
    const item = (event.target as HTMLElement).closest<HTMLElement>(
      '[role^="menuitem"]',
    );
    if (
      event.defaultPrevented ||
      !item ||
      item.closest('[role="menu"]') !== menu ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.nativeEvent.isComposing ||
      !menu.querySelector('[data-element="Actions"] [role^="menuitem"]')
    )
      return;
    const row = item.closest<HTMLElement>('[data-menuitem]');
    // Search and page navigation remain owned by the Aria collection of rows.
    if (
      item.closest('[data-element="Actions"]') &&
      (event.key === 'PageUp' ||
        event.key === 'PageDown' ||
        (event.key.length === 1 && event.key !== ' '))
    ) {
      row?.querySelector<HTMLElement>('[data-menu-native-primary]')?.focus();
      return;
    }
    if (event.shiftKey) return;
    const items = Array.from(
      menu.querySelectorAll<HTMLElement>('[role^="menuitem"]'),
    ).filter(
      (element) =>
        element.closest('[role="menu"]') === menu &&
        !element.hasAttribute('disabled') &&
        element.getAttribute('aria-disabled') !== 'true' &&
        isFocusable(element),
    );
    const index = items.indexOf(item);
    if (index < 0) return;
    let next: HTMLElement | undefined;
    if (event.key === 'ArrowDown')
      next =
        items[index + 1] ??
        (completeProps.shouldFocusWrap !== false ? items[0] : undefined);
    else if (event.key === 'ArrowUp')
      next =
        items[index - 1] ??
        (completeProps.shouldFocusWrap !== false ? items.at(-1) : undefined);
    else if (event.key === 'Home') next = items[0];
    else if (event.key === 'End') next = items.at(-1);
    else if (
      (event.key === 'ArrowRight' || event.key === 'ArrowLeft') &&
      row &&
      !item.hasAttribute('aria-haspopup')
    ) {
      const rowItems = items.filter(
        (element) => element.closest('[data-menuitem]') === row,
      );
      const forward =
        event.key ===
        (getComputedStyle(row).direction === 'rtl'
          ? 'ArrowLeft'
          : 'ArrowRight');
      next = rowItems[rowItems.indexOf(item) + (forward ? 1 : -1)];
    }
    if (next) {
      event.preventDefault();
      event.stopPropagation();
      next.focus();
      return true;
    }
  };
  const styles = extractStyles(completeProps, CONTAINER_STYLES);

  // `useMenu` already put the id and the name on the `menu` list. Repeated on
  // the wrapper, the id is a duplicate — a trigger's `aria-controls` finds the
  // wrapper first — and the name labels a plain `div`.
  const {
    id: _id,
    'aria-label': _ariaLabel,
    'aria-labelledby': _ariaLabelledBy,
    'aria-describedby': _ariaDescribedBy,
    'aria-details': _ariaDetails,
    ...wrapperProps
  } = filterBaseProps(completeProps) as Record<string, unknown>;

  const wrapperMods = {
    popover: completeProps.mods?.popover,
    footer: !!footer,
    header: !!header,
  };

  const menuMods = {
    sections: hasSections,
  };

  // Sync the ref stored in the context object with the menu's DOM ref.
  // `useSyncRef` from @react-aria/utils expects the context object as the
  // first argument to keep it up-to-date, and a ref object as the second.
  useSyncRef(contextProps, domRef);

  const renderedItems: React.ReactNode[] = [];
  let isFirstSection = true;

  collectionItems.forEach((item) => {
    const reactKey = getMenuItemReactKey(item.key);
    if (item.type === 'section') {
      if (!isFirstSection) {
        renderedItems.push(
          <StyledDivider
            key={`divider-${reactKey}`}
            role="separator"
            aria-orientation="horizontal"
          />,
        );
      }

      renderedItems.push(
        <MenuSection
          key={reactKey}
          item={item}
          state={state}
          styles={sectionStyles}
          itemStyles={itemStyles}
          headingStyles={sectionHeadingStyles}
          size={size}
        />,
      );

      isFirstSection = false;
      return;
    }

    let menuItem = (
      <MenuItem
        key={reactKey}
        item={item}
        state={state}
        styles={itemStyles}
        size={size}
      />
    );

    // `MenuItem` renders the item's `tooltip` itself — wrapping it in a
    // second provider makes the two tooltips close each other.

    // Apply custom wrapper if provided
    if (item.props?.wrapper) {
      menuItem = item.props.wrapper(menuItem);
    } else if ((item as any).wrapper) {
      // Handle wrapper from collection nodes (e.g., SubMenuTrigger)
      menuItem = (item as any).wrapper(menuItem);
    }

    // Ensure every child has a stable key, even if the wrapper component didn't set one.
    renderedItems.push(React.cloneElement(menuItem, { key: reactKey }));
  });

  return (
    <StyledMenuWrapper
      qa={qa}
      styles={styles}
      mods={wrapperMods}
      {...wrapperProps}
    >
      {header ? (
        <StyledHeader data-size={size} styles={headerStyles}>
          {header}
        </StyledHeader>
      ) : (
        <div role="presentation" />
      )}
      <StyledMenu
        {...mergeProps(
          {
            styles: menuStyles,
            'data-size': size,
            mods: menuMods,
          },
          menuProps,
        )}
        ref={domRef}
        onKeyDown={(event) => {
          completeProps.onKeyDown?.(event);
          if (!event.defaultPrevented && !handleInlineNavigation(event))
            menuProps.onKeyDown?.(event);
        }}
        role={menuProps.role ?? 'menu'}
      >
        {renderedItems}
      </StyledMenu>
      {footer ? (
        <StyledFooter data-size={size} styles={footerStyles}>
          {footer}
        </StyledFooter>
      ) : (
        <div role="presentation" />
      )}
    </StyledMenuWrapper>
  );
}

// forwardRef doesn't support generic parameters, so cast the result to the correct type
// https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
const _Menu = React.forwardRef(Menu) as <T>(
  props: CubeMenuProps<T> & React.RefAttributes<HTMLUListElement>,
) => ReactElement;

type SectionComponent = typeof BaseSection;

const Section = Object.assign(BaseSection, {
  displayName: 'Section',
}) as SectionComponent;

type __MenuComponent = typeof _Menu & {
  Item: typeof MenuCollectionItem;
  Section: typeof Section;
  SubMenuTrigger: typeof SubMenuTrigger;
  Trigger: typeof MenuTrigger;
};

const __Menu = Object.assign(_Menu as __MenuComponent, {
  Item: MenuCollectionItem,
  Section,
  SubMenuTrigger,
  Trigger: MenuTrigger,
  displayName: 'Menu',
});

__Menu.displayName = 'Menu';

export { __Menu as Menu };
