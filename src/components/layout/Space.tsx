import { forwardRef } from 'react';
import { Base } from '../Base';
import { CONTAINER_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps, ShortItemsStyles } from '../types';

const DEFAULT_STYLES = {
  display: 'flex',
  gap: true,
};

export interface CubeSpaceProps
  extends BaseProps,
    ContainerStyleProps,
    ShortItemsStyles {
  direction?: 'vertical' | 'horizontal';
}

const PROP_MAP = {
  align: 'alignItems',
  justify: 'justifyItems',
} as const;

export const Space = forwardRef(function Space(props: CubeSpaceProps, ref) {
  const flow = props.direction
    ? props.direction === 'vertical'
      ? 'column'
      : 'row'
    : props.flow || 'row';
  const styles = extractStyles(
    props,
    CONTAINER_STYLES,
    {
      ...DEFAULT_STYLES,
      flow,
      alignItems: flow === 'row' ? 'center' : 'stretch',
    },
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
