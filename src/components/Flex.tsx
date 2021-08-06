import { forwardRef } from 'react';
import { Base } from './Base';
import { CONTAINER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps, ShortItemsStyles } from './types';

const DEFAULT_STYLES = {
  display: 'flex',
  flow: 'row',
  gap: '@(column-gap, 0)',
};

export interface CubeFlexProps
  extends BaseProps,
    ContainerStyleProps,
    ShortItemsStyles {}

const PROP_MAP = {
  align: 'alignItems',
  justify: 'justifyItems',
} as const;

export const Flex = forwardRef((props: CubeFlexProps, ref) => {
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
