import { forwardRef } from 'react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  ShortGridStyles,
  tasty,
} from '../../tasty';

const GridElement = tasty({
  styles: {
    display: 'grid',
    flow: 'row',
  },
});

export interface CubeGridProps
  extends BaseProps,
    ContainerStyleProps,
    ShortGridStyles {}

const PROP_MAP = {
  template: 'gridTemplate',
  columns: 'gridColumns',
  rows: 'gridRows',
  areas: 'gridAreas',
} as const;

export const Grid = forwardRef(function Grid(props: CubeGridProps, ref) {
  const styles = extractStyles(props, CONTAINER_STYLES, undefined, PROP_MAP);

  return (
    <GridElement
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
