import React, { ReactNode, ReactElement, Children } from 'react';
import { useTabList, useTab, useTabPanel } from '@react-aria/tabs';
import { TabListState, useTabListState } from '@react-stately/tabs';
import {
  DOMRef,
  ItemProps,
  Node,
  Orientation,
  CollectionElement,
} from '@react-types/shared';
import { Item as BaseItem } from '@react-stately/collections';
import { useHover } from '@react-aria/interactions';
import { AriaTabListProps, TabListProps } from '@react-types/tabs';
import { useDOMRef } from '@react-spectrum/utils';
import { useButton } from '@react-aria/button';
import { AriaButtonProps } from '@react-types/button';

import { mergeProps } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';

import {
  StyledTabsContainer,
  StyledTabPanes,
  StyledTabItem,
  StyledTabBody,
  // ACTION_BUTTON,
} from './styled';

type CubeTabButtonProps = {
  icon?: ReactElement;
  isDisabled?: boolean;
  children?: ReactNode;
} & AriaButtonProps<'button'>;

function TabButton(props: CubeTabButtonProps) {
  const { isDisabled, icon } = props;
  const ref = React.useRef(null);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocused } = useFocus({ isDisabled }, true);

  const { buttonProps, isPressed } = useButton(props, ref);

  const mods = {
    hovered: isHovered,
    focused: isFocused,
    pressed: isPressed,
  };

  return (
    <StyledTabItem
      {...mergeProps(buttonProps, hoverProps, focusProps, props)}
      ref={ref}
      as="button"
      mods={mods}
    >
      {icon}
    </StyledTabItem>
  );
}

type CubeTabProps<T> = {
  item: Node<T>;
  state: TabListState<T>;
  orientation?: Orientation;
};

function Tab<T extends object>({ item, state, orientation }: CubeTabProps<T>) {
  const { key, rendered, props: itemProps } = item;
  const ref = React.useRef(null);
  const { tabProps, isSelected, isDisabled } = useTab({ key }, state, ref);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocused } = useFocus({ isDisabled }, true);

  const icon = itemProps.icon;

  const mods = {
    ...itemProps.mods,
    selected: isSelected,
    disabled: isDisabled,
    hovered: isHovered,
    focused: isFocused,
    horizontal: orientation === 'horizontal',
    vertical: orientation === 'vertical',
  };

  return (
    <StyledTabItem
      {...mergeProps(tabProps, hoverProps, focusProps, itemProps)}
      ref={ref}
      mods={mods}
    >
      {icon}
      {rendered}
    </StyledTabItem>
  );
}

type CubeTabPanelProps<T> = {
  state: TabListState<T>;
};

function TabPanel<T>({ state, ...props }: CubeTabPanelProps<T>) {
  const ref = React.useRef<Element>(null);
  const { tabPanelProps } = useTabPanel(props, state, ref);
  return (
    <StyledTabBody {...tabPanelProps} ref={ref}>
      {state.selectedItem?.props.children}
    </StyledTabBody>
  );
}

export type CubeTabsProps<T> = TabListProps<T> & AriaTabListProps<T>;

function Tabs<T extends object>(
  props: CubeTabsProps<T>,
  ref: DOMRef<HTMLDivElement>,
) {
  const domRef = useDOMRef(ref);
  const children = Children.toArray(props.children).filter(
    (el) => (el as ReactElement)?.props?.children,
  );
  const tabButtons = Children.toArray(props.children).filter(
    (el) => !(el as ReactElement)?.props?.children,
  ) as ReactElement[];
  const state = useTabListState({
    ...props,
    children: children as CollectionElement<T>[],
  });
  const { tabListProps } = useTabList(
    {
      ...props,
      children: children as CollectionElement<T>[],
    },
    state,
    domRef,
  );

  return (
    <StyledTabsContainer>
      <StyledTabPanes {...tabListProps} ref={domRef}>
        {[...state.collection].map((item) => (
          <Tab
            key={item.key}
            item={item}
            state={state}
            orientation={props.orientation}
          />
        ))}
        {tabButtons.map((el) => (
          <TabButton {...el.props} key={el.key}></TabButton>
        ))}
      </StyledTabPanes>
      <TabPanel key={state.selectedItem?.key} state={state} />
    </StyledTabsContainer>
  );
}

// forwardRef doesn't support generic parameters, so cast the result to the correct type
// https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
const _Tabs = React.forwardRef(Tabs) as <T extends object>(
  props: CubeTabsProps<T> & { ref?: DOMRef<HTMLDivElement> },
) => ReactElement;

type ItemComponent = <T>(
  props: Omit<ItemProps<T>, 'children'> & CubeTabButtonProps,
) => JSX.Element;

const Item = Object.assign(BaseItem, {
  displayName: 'Item',
}) as ItemComponent;

type __TabsComponent = typeof _Tabs & {
  Item: typeof Item;
};

const __Tabs = Object.assign(_Tabs as __TabsComponent, {
  Item,
  displayName: 'Tabs',
});

__Tabs.displayName = 'Tabs';

export { __Tabs as Tabs };
