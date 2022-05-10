import { forwardRef } from 'react';
import { Base } from '../Base';
import { CONTAINER_STYLES } from '../../tasty/styles/list';
import { extractStyles } from '../../tasty/utils/styles';
import { filterBaseProps } from '../../tasty/utils/filterBaseProps';
import {
  BaseProps,
  ContainerStyleProps,
  ShortGridStyles,
} from '../../tasty/types';

const DEFAULT_STYLES = {
  display: 'grid',
  flow: 'row',
  gap: '@(column-gap, 0)',
};

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

export const Grid = forwardRef((props: CubeGridProps, ref) => {
  const styles = extractStyles(
    props,
    CONTAINER_STYLES,
    DEFAULT_STYLES,
    PROP_MAP,
  );

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
