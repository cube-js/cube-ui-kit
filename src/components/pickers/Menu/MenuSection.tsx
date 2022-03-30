import React, { Fragment, Key } from 'react';
import { MenuItem } from './MenuItem';
import { Node } from '@react-types/shared';
import { TreeState } from '@react-stately/tree';
import { useMenuSection } from '@react-aria/menu';
import { useSeparator } from '@react-aria/separator';
import {
  StyledDivider,
  StyledMenu,
  StyledMenuItem,
  StyledMenuSectionHeading,
} from './styled';

export interface CubeMenuSectionProps<T> {
  item: Node<T>;
  state: TreeState<T>;
  onAction?: (key: Key) => void;
}

/** @private */
export function MenuSection<T>(props: CubeMenuSectionProps<T>) {
  let { item, state, onAction } = props;
  let { itemProps, headingProps, groupProps } = useMenuSection({
    heading: item.rendered,
    'aria-label': item['aria-label'],
  });

  let { separatorProps } = useSeparator({
    elementType: 'li',
  });

  const isFirstKey = item.key === state.collection.getFirstKey();

  return (
    <Fragment>
      {!isFirstKey && <StyledDivider {...separatorProps} />}
      <StyledMenuItem {...itemProps}>
        {item.rendered && (
          <StyledMenuSectionHeading
            {...headingProps}
            mods={{ first: isFirstKey }}
          >
            {item.rendered}
          </StyledMenuSectionHeading>
        )}
        <StyledMenu {...groupProps} mods={{ section: true }}>
          {[...item.childNodes].map((node) => {
            let item = (
              <MenuItem
                key={node.key}
                item={node}
                state={state}
                onAction={onAction}
              />
            );

            if (node.wrapper) {
              item = node.wrapper(item);
            }

            return item;
          })}
        </StyledMenu>
      </StyledMenuItem>
    </Fragment>
  );
}
