import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  tasty,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

import { brandTastyComponent } from '../../_internal/utils/brand-tasty-component';
import { extractStyles } from '../../utils/styles';

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
        vertical:
          direction === 'vertical' ||
          otherProps.flow === 'column' ||
          styles.flow === 'column',
        ...mods,
      }}
      styles={styles}
    />
  );
});

brandTastyComponent(Space);
