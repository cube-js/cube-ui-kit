import React, { forwardRef } from 'react';
import { CONTAINER_STYLES, TEXT_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { Base } from './Base';
import { useSlotProps } from '../utils/react/index';

const DEFAULT_STYLES = {
  area: 'content',
  size: 'text',
  color: '#dark.75',
  display: 'block',
  flow: 'column',
  gap: '2x',
};

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES];

export const Content = forwardRef((props, ref) => {
  props = useSlotProps(props, 'content');

  const styles = extractStyles(props, STYLE_LIST, DEFAULT_STYLES);

  return (
    <Base
      as="section"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
