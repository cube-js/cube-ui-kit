import { Styles } from '@tenphi/tasty';
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
                onAction={(node as unknown as MenuItemProps<T>).onAction}
              />
            );

            // `MenuItem` renders the item's `tooltip` itself, as `Menu` does
            // for items outside a section.
            if (node.props.wrapper) {
              menuItem = node.props.wrapper(menuItem);
            }

            return menuItem;
          })}
        </StyledMenu>
      </StyledSection>
    </>
  );
}
