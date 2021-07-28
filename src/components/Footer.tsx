import { forwardRef } from 'react';
import { CONTAINER_STYLES, TEXT_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { Base } from './Base';
import { useSlotProps } from '../utils/react/index';

const DEFAULT_STYLES = {
  area: 'footer',
  display: 'block',
  flow: 'column',
};

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

export const Footer = forwardRef((props, ref) => {
  props = useSlotProps(props, 'footer');

  const styles = extractStyles(props, STYLE_LIST, DEFAULT_STYLES);

  return (
    <Base
      data-id="Footer"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
