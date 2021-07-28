import { forwardRef } from 'react';
import { Base } from './Base';
import { OUTER_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { useSlotProps } from '../utils/react/index';

const DEFAULT_STYLES = {
  area: 'divider',
  display: 'block',
  height: '1bw 1bw',
  fill: '#border',
  border: '0',
  margin: '0',
};

export const Divider = forwardRef((props, ref) => {
  props = useSlotProps(props, 'divider');

  const styles = extractStyles(props, OUTER_STYLES, DEFAULT_STYLES);

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
