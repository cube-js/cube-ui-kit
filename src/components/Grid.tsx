import { forwardRef } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import {
  BaseProps,
  ContainerStyleProps,
  ShortGridStyles,
  ShortItemsStyles,
} from './types';

const DEFAULT_STYLES = {
  display: 'grid',
  flow: 'row',
  gap: '@(column-gap, 0)',
};

export interface GridProps
  extends BaseProps,
    ContainerStyleProps,
    ShortItemsStyles,
    ShortGridStyles {}

const PROP_MAP = {
  align: 'alignItems',
  justify: 'justifyItems',
  template: 'gridTemplate',
  columns: 'gridColumns',
  rows: 'gridRows',
  areas: 'gridAreas',
} as const;

export const Grid = forwardRef((props: GridProps, ref) => {
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
