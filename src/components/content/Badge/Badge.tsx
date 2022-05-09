import { forwardRef } from 'react';
import THEMES from '../../../data/themes';
import { CONTAINER_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../types';
import { tasty } from '../../../tasty';

const RawBadge = tasty({
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
    <RawBadge
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
    </RawBadge>
  );
});
