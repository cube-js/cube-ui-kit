import { Styles } from '@tenphi/tasty';
import { cloneElement } from 'react';
import { useMenuSection } from 'react-aria';

import { MenuItem, MenuItemProps } from './MenuItem';
import { StyledMenu, StyledSection, StyledSectionHeading } from './styled';

export interface CubeMenuSectionProps<T> extends MenuItemProps<T> {
  itemStyles?: Styles;
  headingStyles?: Styles;
  size?: 'small' | 'medium' | (string & {});
}

/** @private */
export function MenuSection<T>(props: CubeMenuSectionProps<T>) {
  const { item, state, styles, itemStyles, headingStyles, size } = props;
  const heading = item.rendered;
  const { itemProps, headingProps, groupProps } = useMenuSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <>
      <StyledSection {...itemProps} styles={styles}>
        {heading && (
          <StyledSectionHeading
            {...headingProps}
            size={size}
            styles={headingStyles}
          >
            {heading}
          </StyledSectionHeading>
        )}
        <StyledMenu {...groupProps} mods={{ section: true }}>
          {[...item.childNodes].map((node) => {
            let menuItem = (
              <MenuItem
                key={node.key}
                item={node}
                styles={itemStyles}
                state={state}
                size={size}
              />
            );

            // `MenuItem` renders the item's `tooltip` itself, as `Menu` does
            // for items outside a section. A `SubMenuTrigger` puts its
            // wrapper on the collection node rather than in the item's props.
            if (node.props?.wrapper) {
              menuItem = node.props.wrapper(menuItem);
            } else if ((node as any).wrapper) {
              menuItem = (node as any).wrapper(menuItem);
            }

            // The wrapper's element doesn't carry the item's key.
            return cloneElement(menuItem, { key: node.key });
          })}
        </StyledMenu>
      </StyledSection>
    </>
  );
}
