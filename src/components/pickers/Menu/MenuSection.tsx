import { useMenuSection } from 'react-aria';

import { Styles } from '../../../tasty';

import { MenuItem, MenuItemProps } from './MenuItem';
import { StyledMenu, StyledSection, StyledSectionHeading } from './styled';

export interface CubeMenuSectionProps<T> extends MenuItemProps<T> {
  itemStyles?: Styles;
  headingStyles?: Styles;
}

/** @private */
export function MenuSection<T>(props: CubeMenuSectionProps<T>) {
  const { item, state, styles, itemStyles, headingStyles } = props;
  const heading = item.rendered;
  const { itemProps, headingProps, groupProps } = useMenuSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <>
      <StyledSection {...itemProps} styles={styles}>
        {heading && (
          <StyledSectionHeading {...headingProps} styles={headingStyles}>
            {heading}
          </StyledSectionHeading>
        )}
        <StyledMenu {...groupProps} mods={{ section: true }}>
          {[...item.childNodes].map((node) => {
            let item = (
              <MenuItem
                key={node.key}
                item={node}
                styles={itemStyles}
                state={state}
                onAction={(node as unknown as MenuItemProps<T>).onAction}
              />
            );

            if (node.props.wrapper) {
              item = node.props.wrapper(item);
            }

            return item;
          })}
        </StyledMenu>
      </StyledSection>
    </>
  );
}
