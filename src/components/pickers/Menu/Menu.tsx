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

import { useMenuContext } from './context';
import { MenuButtonProps, MenuSelectionType } from './MenuButton';
import { MenuItem } from './MenuItem';
import { MenuSection } from './MenuSection';
import { StyledDivider, StyledHeader, StyledMenu } from './styled';

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

  // Props used for collection building.
  const treeProps = completeProps as typeof completeProps;

  const state = useTreeState(treeProps as typeof completeProps);
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
      {header && <StyledHeader>{header}</StyledHeader>}
      {(() => {
        // Build the list of menu elements, automatically inserting dividers between sections.
        const renderedItems: React.ReactNode[] = [];
        let isFirstSection = true;

        collectionItems.forEach((item) => {
          if (item.type === 'section') {
            // Insert a visual separator before every section except the first one.
            if (!isFirstSection) {
              renderedItems.push(
                <StyledDivider
                  key={`divider-${String(item.key)}`}
                  as="li"
                  role="separator"
                  aria-orientation="horizontal"
                />,
              );
            }

            renderedItems.push(
              <MenuSection
                key={item.key}
                item={item}
                state={state}
                styles={sectionStyles}
                itemStyles={itemStyles}
                headingStyles={sectionHeadingStyles}
                selectionIcon={selectionIcon}
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
              selectionIcon={selectionIcon}
              onAction={item.onAction}
            />
          );

          if (item.props.wrapper) {
            menuItem = item.props.wrapper(menuItem);
          }

          renderedItems.push(
            cloneElement(menuItem, {
              key: item.key,
            }),
          );
        });

        return renderedItems;
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
