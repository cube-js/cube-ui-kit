import { useSyncRef } from '@react-aria/utils';
import { useDOMRef } from '@react-spectrum/utils';
import { DOMRef, FocusStrategy, ItemProps } from '@react-types/shared';
import React, { ReactElement, ReactNode, useMemo } from 'react';
import { AriaMenuProps, useMenu } from 'react-aria';
import { Section as BaseSection, useTreeState } from 'react-stately';

import {
  BasePropsWithoutChildren,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { CollectionItem } from '../../CollectionItem';

import { useMenuContext } from './context';
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
  extends BasePropsWithoutChildren,
    ContainerStyleProps,
    Omit<
      AriaMenuProps<T>,
      'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'
    > {
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
  ref: DOMRef<HTMLUListElement>,
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
    focusOnHover = false,
    qa,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    ...rest
  } = props;
  const domRef = useDOMRef(ref);
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
    focusOnHover,
    selectedKeys: ariaSelectedKeys,
    defaultSelectedKeys: ariaDefaultSelectedKeys,
    onSelectionChange: handleSelectionChange,
  });

  // Props used for collection building.
  const treeProps = completeProps as typeof completeProps;

  const state = useTreeState(treeProps as typeof completeProps);
  const collectionItems = [...state.collection];
  const hasSections = collectionItems.some((item) => item.type === 'section');

  const { menuProps } = useMenu(completeProps, state, domRef);
  const styles = useMemo(
    () => extractStyles(completeProps, CONTAINER_STYLES),
    [completeProps],
  );

  const wrapperMods = useMemo(() => {
    return {
      popover: completeProps.mods?.popover,
      footer: !!footer,
      header: !!header,
    };
  }, [completeProps.mods?.popover, footer, header]);

  const menuMods = useMemo(() => {
    return {
      sections: hasSections,
    };
  }, [hasSections]);

  // Sync the ref stored in the context object with the DOM ref returned by useDOMRef.
  // The helper from @react-aria/utils expects the context object as the first argument
  // to keep it up-to-date, and a ref object as the second.
  useSyncRef(contextProps, domRef);

  const renderedItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    let isFirstSection = true;

    collectionItems.forEach((item) => {
      if (item.type === 'section') {
        if (!isFirstSection) {
          items.push(
            <StyledDivider
              key={`divider-${String(item.key)}`}
              role="separator"
              aria-orientation="horizontal"
            />,
          );
        }

        items.push(
          <MenuSection
            key={item.key}
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
          key={item.key}
          item={item}
          state={state}
          styles={itemStyles}
          size={size}
          onAction={item.onAction}
        />
      );

      // Apply tooltip wrapper if tooltip property is provided
      // if (item.props.tooltip) {
      //   const tooltipProps =
      //     typeof item.props.tooltip === 'string'
      //       ? { title: item.props.tooltip }
      //       : item.props.tooltip;

      //   menuItem = (
      //     <TooltipProvider key={item.key} placement="right" {...tooltipProps}>
      //       {menuItem}
      //     </TooltipProvider>
      //   );
      // }

      // Apply custom wrapper if provided
      if (item.props?.wrapper) {
        menuItem = item.props.wrapper(menuItem);
      } else if ((item as any).wrapper) {
        // Handle wrapper from collection nodes (e.g., SubMenuTrigger)
        menuItem = (item as any).wrapper(menuItem);
      }

      // Ensure every child has a stable key, even if the wrapper component didn't set one.
      items.push(React.cloneElement(menuItem, { key: item.key }));
    });

    return items;
  }, [collectionItems, state, sectionStyles, itemStyles, sectionHeadingStyles]);

  return (
    <StyledMenuWrapper
      qa={qa}
      styles={styles}
      mods={wrapperMods}
      {...filterBaseProps(completeProps)}
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
  Item: typeof CollectionItem;
  Section: typeof Section;
  SubMenuTrigger: typeof SubMenuTrigger;
  Trigger: typeof MenuTrigger;
};

const __Menu = Object.assign(_Menu as __MenuComponent, {
  Item: CollectionItem,
  Section,
  SubMenuTrigger,
  Trigger: MenuTrigger,
  displayName: 'Menu',
});

__Menu.displayName = 'Menu';

export { __Menu as Menu };
