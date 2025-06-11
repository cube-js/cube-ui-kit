import { useSyncRef } from '@react-aria/utils';
import { useDOMRef } from '@react-spectrum/utils';
import { DOMRef, ItemProps, Key } from '@react-types/shared';
import React, { cloneElement, ReactElement, ReactNode } from 'react';
import { AriaMenuProps, useMenu } from 'react-aria';
import {
  Item as BaseItem,
  Section as BaseSection,
  useTreeState,
} from 'react-stately';

import {
  BaseProps,
  BasePropsWithoutChildren,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { Divider as BaseDivider } from '../../content/Divider';

import { useMenuContext } from './context';
import { MenuButtonProps, MenuSelectionType } from './MenuButton';
import { MenuItem } from './MenuItem';
import { MenuSection } from './MenuSection';
import { StyledDivider, StyledMenu, StyledMenuHeader } from './styled';

export interface CubeMenuProps<T>
  extends BasePropsWithoutChildren,
    ContainerStyleProps,
    AriaMenuProps<T> {
  selectionIcon?: MenuSelectionType;
  // @deprecated
  header?: ReactNode;
  footer?: ReactNode;
  styles?: Styles;
  itemStyles?: Styles;
  sectionStyles?: Styles;
  sectionHeadingStyles?: Styles;
  qa?: BaseProps['qa'];
  /** Menu accepts <Menu.Item>, <Menu.Section>, and <Divider> as children */
  children?: React.ReactNode;
  /** Keys that should appear disabled */
  disabledKeys?: Iterable<Key>;
  /** Selection mode for the menu: 'single' | 'multiple' */
  selectionMode?: 'single' | 'multiple';
}

function Menu<T extends object>(
  props: CubeMenuProps<T>,
  ref: DOMRef<HTMLUListElement>,
) {
  const {
    header,
    footer,
    itemStyles,
    sectionStyles,
    sectionHeadingStyles,
    selectionIcon,
    qa,
    ...rest
  } = props;
  const domRef = useDOMRef(ref);
  const contextProps = useMenuContext();
  const completeProps = mergeProps(contextProps, rest);

  // Filter out Divider elements for collection creation.
  const filteredChildren = React.Children.toArray(
    completeProps.children,
  ).filter(
    (child) =>
      !(
        React.isValidElement(child) &&
        // @ts-ignore
        child.type === BaseDivider
      ),
  );

  // React may prefix keys with '.$' when accessing them via Children.toArray.
  // Strip that prefix so selection/disabled logic receives the original keys.
  const normalizedChildren = filteredChildren.map((child) => {
    if (
      React.isValidElement(child) &&
      child.key &&
      typeof child.key === 'string'
    ) {
      const cleanKey = child.key.replace(/^\.\$/, '');
      // Only clone if the key actually changed to avoid unnecessary work.
      return cleanKey !== child.key
        ? React.cloneElement(child, { key: cleanKey })
        : child;
    }
    return child;
  });

  // Props used for collection building (exclude dividers).
  const treeProps = {
    ...completeProps,
    children: normalizedChildren,
  } as typeof completeProps;

  const state = useTreeState(treeProps);
  const collectionItems = [...state.collection];
  const hasSections = collectionItems.some((item) => item.type === 'section');

  const { menuProps } = useMenu(treeProps, state, domRef);
  const styles = extractStyles(completeProps, CONTAINER_STYLES);

  const defaultProps = {
    qa,
    styles,
    mods: {
      sections: hasSections,
      footer: !!footer,
      header: !!header,
    },
  };

  useSyncRef(contextProps, domRef);

  return (
    <StyledMenu
      {...mergeProps(defaultProps, menuProps, filterBaseProps(completeProps))}
      ref={domRef}
    >
      {header && <StyledMenuHeader>{header}</StyledMenuHeader>}
      {(() => {
        // Render children in the same order as they were provided, but leverage
        // react-stately collection for interactive Menu items and sections.
        let itemIndex = 0;
        const children = React.Children.toArray(completeProps.children);

        return children.map((child, index) => {
          // Divider handling
          if (
            // Valid React element and its type equals to our Divider component
            React.isValidElement(child) &&
            // @ts-ignore – comparing component types is acceptable here
            child.type === BaseDivider
          ) {
            return (
              <StyledDivider
                // "li" is required inside <ul> to be valid HTML.
                key={`divider-${index}`}
                as="li"
                role="separator"
                aria-orientation="horizontal"
              />
            );
          }

          // Handle items/sections coming from react-stately collection
          const item = collectionItems[itemIndex++];

          if (!item) return null;

          if (item.type === 'section') {
            return (
              <MenuSection
                key={item.key}
                item={item}
                state={state}
                styles={sectionStyles}
                itemStyles={itemStyles}
                headingStyles={sectionHeadingStyles}
                selectionIcon={selectionIcon}
              />
            );
          }

          let menuItem = (
            <MenuItem
              key={item.key}
              item={item}
              state={state}
              styles={itemStyles}
              selectionIcon={selectionIcon}
              onAction={item.onAction}
            />
          );

          if (item.props.wrapper) {
            menuItem = item.props.wrapper(menuItem);
          }

          return cloneElement(menuItem, {
            key: item.key,
          });
        });
      })()}
    </StyledMenu>
  );
}

// forwardRef doesn't support generic parameters, so cast the result to the correct type
// https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
const _Menu = React.forwardRef(Menu) as <T>(
  props: CubeMenuProps<T> & { ref?: DOMRef<HTMLUListElement> },
) => ReactElement;

type PartialMenuButton = Partial<MenuButtonProps>;

type ItemComponent = <T>(
  props: ItemProps<T> &
    PartialMenuButton & {
      description?: ReactNode;
      wrapper?: (item: ReactElement) => ReactElement;
    },
) => ReactElement;

type SectionComponent = typeof BaseSection;

const Item = Object.assign(BaseItem, {
  displayName: 'Item',
}) as ItemComponent;

const Section = Object.assign(BaseSection, {
  displayName: 'Section',
}) as SectionComponent;

type __MenuComponent = typeof _Menu & {
  Item: typeof Item;
  Section: typeof Section;
};

const __Menu = Object.assign(_Menu as __MenuComponent, {
  Item: Item as unknown as (props: {
    description?: ReactNode;
    [key: string]: any;
  }) => ReactElement,
  Section,
  displayName: 'Menu',
});

__Menu.displayName = 'Menu';

export { __Menu as Menu };
