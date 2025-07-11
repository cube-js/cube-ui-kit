import { useMenuSection } from 'react-aria';

import { Styles } from '../../../tasty';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';

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
          <StyledSectionHeading {...headingProps} styles={headingStyles}>
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

            // Apply tooltip wrapper if tooltip property is provided
            if (node.props.tooltip) {
              const tooltipProps =
                typeof node.props.tooltip === 'string'
                  ? { title: node.props.tooltip }
                  : node.props.tooltip;

              menuItem = (
                <TooltipProvider
                  key={node.key}
                  activeWrap
                  placement="right"
                  {...tooltipProps}
                >
                  {menuItem}
                </TooltipProvider>
              );
            }

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
