import { forwardRef } from 'react';
import THEMES from '../../../data/themes';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../../tasty';

const BadgeElement = tasty({
  qa: 'Badge',
  role: 'region',
  styles: {
    display: 'inline-flex',
    placeContent: 'center',
    placeItems: 'center',
    padding: {
      '': '0',
      single: '0 1px',
      multiple: '0 2px',
    },
    radius: 'round',
    preset: 'tag',
    width: 'min 16px',
    height: '16px',
    textAlign: 'center',
    fontWeight: 600,
    color: '#white',
    fill: {
      '': '#purple',
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`[data-type="${type}"]`] = THEMES[type].color;

        return map;
      }, {}),
    },
  },
});

export interface CubeBadgeProps extends BaseProps, ContainerStyleProps {
  type?: keyof typeof THEMES | string;
}

export const Badge = forwardRef((allProps: CubeBadgeProps, ref) => {
  let { type, children, ...props } = allProps;

  const styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <BadgeElement
      {...filterBaseProps(props, { eventProps: true })}
      data-type={type}
      mods={{
        single: typeof children === 'string' && children.length === 1,
        multiple: typeof children === 'string' && children.length === 2,
      }}
      styles={styles}
      ref={ref}
    >
      {children}
    </BadgeElement>
  );
});
