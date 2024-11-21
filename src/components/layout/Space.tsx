import { forwardRef } from 'react';

import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../tasty';

const SpaceElement = tasty({
  styles: {
    display: 'flex',
    gap: true,
    flow: {
      '': 'row',
      vertical: 'column',
    },
    placeItems: {
      '': 'center stretch',
      vertical: 'stretch',
    },
  },
});

export interface CubeSpaceProps extends AllBaseProps, ContainerStyleProps {
  direction?: 'vertical' | 'horizontal';
}

export const Space = forwardRef(function Space(props: CubeSpaceProps, ref) {
  const { mods, direction, ...otherProps } = props;
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <SpaceElement
      {...filterBaseProps(otherProps, { eventProps: true })}
      ref={ref}
      mods={{
        vertical: direction === 'vertical' || otherProps.flow === 'column',
        ...mods,
      }}
      styles={styles}
    />
  );
});
