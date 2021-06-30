import React, { forwardRef } from 'react';
import { Base } from '../../components/Base';
import { CONTAINER_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles.js';
import { filterBaseProps } from '../../utils/filterBaseProps';

const DEFAULT_STYLES = {
  display: 'grid',
  gap: '1x',
  flow: 'row',
  fill: '#purple',
  color: '#white',
  radius: 'round',
  content: 'center',
  width: '@avatar-size @avatar-size @avatar-size',
  height: '@avatar-size @avatar-size @avatar-size',
  fontSize: 'calc(@avatar-size / 2)',
  lineHeight: 'calc(@avatar-size / 2)',
  fontWeight: 500,
};

export const Avatar = forwardRef(
  ({ size = '4x', icon, children, ...props }, ref) => {
    const styles = extractStyles(props, CONTAINER_STYLES, DEFAULT_STYLES);

    styles['--avatar-size'] = size;

    return (
      <Base
        {...filterBaseProps(props, { eventProps: true })}
        styles={styles}
        ref={ref}
      >
        {icon}
        {children}
      </Base>
    );
  },
);
