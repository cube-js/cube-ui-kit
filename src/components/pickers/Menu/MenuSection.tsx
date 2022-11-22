import { useMenuSection } from '@react-aria/menu';

import { MenuItem, MenuItemProps } from './MenuItem';
import {
  StyledMenu,
  StyledMenuSection,
  StyledMenuSectionHeading,
} from './styled';

export type CubeMenuSectionProps<T> = MenuItemProps<T>;

/** @private */
export function MenuSection<T>(props: CubeMenuSectionProps<T>) {
  const { item, state, onAction } = props;
  const heading = item.rendered;
  const { itemProps, headingProps, groupProps } = useMenuSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <>
      <StyledMenuSection {...itemProps}>
        {heading && (
          <StyledMenuSectionHeading {...headingProps}>
            {heading}
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
