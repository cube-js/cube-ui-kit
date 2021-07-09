import React, { forwardRef } from 'react';
import {
  CONTAINER_STYLES,
  TEXT_STYLES,
} from '../styles/list';
import { extractStyles } from '../utils/styles.js';
import { filterBaseProps } from '../utils/filterBaseProps';
import { Base } from './Base';
import { useSlotProps } from '../utils/react';

const DEFAULT_STYLES = {
  area: 'header',
  display: 'block',
  flow: 'column',
};

const STYLE_LIST = [
  ...CONTAINER_STYLES,
  ...TEXT_STYLES,
];

export const Header = forwardRef((props, ref) => {
  props = useSlotProps(props, 'header');

  const styles = extractStyles(props, STYLE_LIST, DEFAULT_STYLES);

  return (
    <Base
      data-id="Header"
      as="header"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
