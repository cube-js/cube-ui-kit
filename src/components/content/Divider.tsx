import { forwardRef } from 'react';
import { Base } from '../Base';
import { OUTER_STYLES, BASE_STYLES, COLOR_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { useSlotProps } from '../../utils/react';
import { BaseProps, OuterStyleProps } from '../types';

const STYLE_LIST = [...OUTER_STYLES, ...BASE_STYLES, ...COLOR_STYLES];

const DEFAULT_STYLES = {
  gridArea: 'divider',
  display: 'block',
  height: '1bw 1bw',
  fill: '#border',
  border: '0',
  margin: '0',
};

export interface CubeDividerProps extends BaseProps, OuterStyleProps {}

export const Divider = forwardRef((props: CubeDividerProps, ref) => {
  props = useSlotProps(props, 'divider');

  const styles = extractStyles(props, STYLE_LIST, DEFAULT_STYLES);

  return (
    <Base
      as="hr"
      data-id="Divider"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
