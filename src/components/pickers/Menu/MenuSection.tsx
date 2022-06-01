import React from 'react';
import { MenuItem, MenuItemProps } from './MenuItem';
import { useMenuSection } from '@react-aria/menu';
import {
  StyledMenu,
  StyledMenuSection,
  StyledMenuSectionHeading,
} from './styled';

export interface CubeMenuSectionProps<T> extends MenuItemProps<T> {
  isFirst?: boolean;
}

/** @private */
export function MenuSection<T>(props: CubeMenuSectionProps<T>) {
  let { isFirst, item, state, onAction } = props;
  let { itemProps, headingProps, groupProps } = useMenuSection({
    heading: item.rendered,
    'aria-label': item['aria-label'],
  });

  return (
    <>
      <StyledMenuSection {...itemProps}>
        {item.rendered && (
          <StyledMenuSectionHeading {...headingProps} mods={{ first: isFirst }}>
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
      </StyledMenuSection>
    </>
  );
}
