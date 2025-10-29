import { forwardRef } from 'react';

import THEMES from '../../../data/themes';
import { tasty } from '../../../tasty';
import { CubeItemProps, Item } from '../Item';

const BadgeElement = tasty(Item, {
  qa: 'Badge',
  role: 'status',
  styles: {
    radius: 'round',
    color: '#white',
    fill: {
      '': '#purple',
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`[data-theme="${type}"]`] =
          type === 'special' ? THEMES[type].fill : THEMES[type].color;

        return map;
      }, {}),
    },

    '$inline-padding': {
      '': 'max($min-inline-padding, (($size - 1lh - 2bw) / 2 + $inline-compensation))',
      '[data-size="inline"]': '.5x',
    },

    Label: {
      textAlign: 'center',
      placeSelf: 'center',
    },
  },
});

export interface CubeBadgeProps extends CubeItemProps {
  /* @deprecated Use theme instead */
  type?: keyof typeof THEMES | string;
  theme?: keyof typeof THEMES | string;
}

function Badge(allProps: CubeBadgeProps, ref) {
  let {
    type,
    theme = 'special',
    children,
    size = 'inline',
    ...props
  } = allProps;

  const badgeTheme = theme ?? type;

  return (
    <BadgeElement ref={ref} size={size} data-theme={badgeTheme} {...props}>
      {children}
    </BadgeElement>
  );
}

const _Badge = forwardRef(Badge);

_Badge.displayName = 'Badge';

export { _Badge as Badge };
