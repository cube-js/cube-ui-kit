import React, { ReactElement, useContext } from 'react';
import { DOMRef } from '@react-types/shared';
import { Item } from '@react-stately/collections';
import { AriaMenuProps } from '@react-types/menu';
import { useMenu } from '@react-aria/menu';
import { useTreeState } from '@react-stately/tree';
import { useDOMRef } from '@react-spectrum/utils';
import { mergeProps, useSyncRef } from '@react-aria/utils';
import { MenuSection } from './MenuSection';
import { MenuItem } from './MenuItem';
import { MenuContext } from './context';

import { StyledMenu } from './styled';

export type CubeMenuProps<T> = AriaMenuProps<T>;

function Menu<T extends object>(
  props: CubeMenuProps<T>,
  ref: DOMRef<HTMLUListElement>,
) {
  let contextProps = useContext(MenuContext);
  let completeProps = {
    ...mergeProps(contextProps, props),
  };

  let domRef = useDOMRef(ref);
  let state = useTreeState(completeProps);
  let { menuProps } = useMenu(completeProps, state, domRef);
  // let { styleProps } = useStyleProps(completeProps);
  useSyncRef(contextProps, domRef);

  return (
    <StyledMenu {...menuProps} ref={domRef}>
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

const __Menu = Object.assign(_Menu as typeof _Menu & { Item: typeof Item }, {
  Item,
});

export { __Menu as Menu };
