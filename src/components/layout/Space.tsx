import { forwardRef } from 'react';
import {
  BaseProps,
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
    alignItems: {
      '': 'center',
      vertical: 'stretch',
    },
  },
});

export interface CubeSpaceProps extends BaseProps, ContainerStyleProps {
  direction?: 'vertical' | 'horizontal';
}

export const Space = forwardRef(function Space(props: CubeSpaceProps, ref) {
  const { mods, direction, ...otherProps } = props;
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <SpaceElement
      {...filterBaseProps(otherProps, { eventProps: true })}
      mods={{
        vertical: direction === 'vertical' || otherProps.flow === 'column',
        ...mods,
      }}
      styles={styles}
      ref={ref}
    />
  );
});
