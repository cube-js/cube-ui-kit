import { useMenuSection } from 'react-aria';

import { Styles } from '../../../tasty';

import { MenuItem, MenuItemProps } from './MenuItem';
import {
  StyledMenu,
  StyledMenuSection,
  StyledMenuSectionHeading,
} from './styled';

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
      <StyledMenuSection {...itemProps} styles={styles}>
        {heading && (
          <StyledMenuSectionHeading {...headingProps} styles={headingStyles}>
            {heading}
          </StyledMenuSectionHeading>
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
      </StyledMenuSection>
    </>
  );
}
