import React, { ReactNode, ReactElement } from 'react';
import { DOMRef, ItemProps, SectionProps } from '@react-types/shared';
import {
  Item as BaseItem,
  Section as BaseSection,
} from '@react-stately/collections';
import { AriaMenuProps } from '@react-types/menu';
import { useMenu } from '@react-aria/menu';
import { useTreeState } from '@react-stately/tree';
import { useDOMRef } from '@react-spectrum/utils';
import { mergeProps, useSyncRef } from '@react-aria/utils';
import { MenuSection } from './MenuSection';
import { MenuItem } from './MenuItem';
import { useMenuContext } from './context';
import { StyledMenu, StyledMenuHeader } from './styled';
import { extractStyles } from '../../../utils/styles';
import { useContextStyles } from '../../../providers/StylesProvider';

export type CubeMenuProps<T> = {
  header?: ReactNode;
  footer?: ReactNode;
} & AriaMenuProps<T>;

function Menu<T extends object>(
  props: CubeMenuProps<T>,
  ref: DOMRef<HTMLUListElement>,
) {
  const domRef = useDOMRef(ref);
  const contextProps = useMenuContext();
  const { header, footer } = props;
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
  const styleProps = extractStyles(completeProps);
  const menuStyles = useContextStyles('Menu', props) || {};

  useSyncRef(contextProps, domRef);

  return (
    <StyledMenu
      {...mergeProps(menuProps, menuStyles, completeProps, styleProps)}
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

type ItemComponent = <T>(
  props: ItemProps<T> & { prefix?: ReactNode; icon?: ReactNode },
) => JSX.Element;
type SectionComponent = <T>(props: SectionProps<T>) => JSX.Element;

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

export { __Menu as Menu };
