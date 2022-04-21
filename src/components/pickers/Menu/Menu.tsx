import React, { ReactNode, ReactElement } from 'react';
import { DOMRef, ItemProps } from '@react-types/shared';
import {
  Item as BaseItem,
  Section as BaseSection,
} from '@react-stately/collections';
import { useMenu } from '@react-aria/menu';
import { mergeProps, useSyncRef } from '@react-aria/utils';
import { useDOMRef } from '@react-spectrum/utils';
import { useTreeState } from '@react-stately/tree';
import type { AriaMenuProps } from '@react-types/menu';

import { ContainerStyleProps } from '../../types';
import { useContextStyles } from '../../../providers/StylesProvider';
import { Styles } from '../../../styles/types';
import { CONTAINER_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { StyledMenu, StyledMenuHeader } from './styled';
import { MenuItem } from './MenuItem';
import { MenuSection } from './MenuSection';
import { MenuButtonProps } from './MenuButton';
import { useMenuContext } from './context';

export interface CubeMenuProps<T>
  extends ContainerStyleProps,
    AriaMenuProps<T> {
  header?: ReactNode;
  footer?: ReactNode;
  styles?: Styles;
}

function Menu<T extends object>(
  props: CubeMenuProps<T>,
  ref: DOMRef<HTMLUListElement>,
) {
  const domRef = useDOMRef(ref);
  const contextProps = useMenuContext();
  const { header, footer, styles } = props;
  const completeProps = {
    ...mergeProps(contextProps, props, {
      mods: {
        footer: !!footer,
        header: !!header,
      },
    }),
  };
  const state = useTreeState(completeProps);
  const { menuProps } = useMenu(completeProps, state, domRef);
  const containerStyles = extractStyles(completeProps, CONTAINER_STYLES);
  const menuStyles = useContextStyles('Menu', props) || {};

  const completeStyles = {
    ...menuStyles,
    ...containerStyles,
    ...styles,
  };

  useSyncRef(contextProps, domRef);

  return (
    <StyledMenu
      {...mergeProps(menuProps, completeProps)}
      styles={completeStyles}
      ref={domRef}
    >
      {header && <StyledMenuHeader>{header}</StyledMenuHeader>}
      {[...state.collection].map((item) => {
        if (item.type === 'section') {
          return (
            <MenuSection
              key={item.key}
              item={item}
              state={state}
              onAction={completeProps.onAction}
            />
          );
        }

        let menuItem = (
          <MenuItem
            key={item.key}
            item={item}
            state={state}
            onAction={completeProps.onAction}
          />
        );

        if (item.wrapper) {
          menuItem = item.wrapper(menuItem);
        }

        return menuItem;
      })}
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
    PartialMenuButton & { wrapper?: (item: ReactElement) => ReactElement },
) => JSX.Element;

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
  Item,
  Section,
  displayName: 'Menu',
});

__Menu.displayName = 'Menu';

export { __Menu as Menu };
