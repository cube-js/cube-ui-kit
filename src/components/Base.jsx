import React, { useContext, forwardRef } from 'react';
import styled from 'styled-components';
import { ResponsiveContext } from '../providers/Responsive';
import { pointsToZones } from '../utils/responsive';
import { STYLE_HANDLER_MAP } from '../styles';
import { renderStyles } from '../utils/render-styles';

const INLINE_MAP = {
  block: 'inline',
  grid: 'inline-grid',
  flex: 'inline-flex',
};

const BaseElement = styled.div(({ css }) => css);

export const Base = forwardRef(
  (
    { styles, responsive, block, inline, isHidden, qa, qaVal, css, ...props },
    ref,
  ) => {
    styles = {
      display: 'inline-block',
      ...styles,
    };

    if (block) {
      styles.display = 'block';
    }

    if (inline) {
      styles.display = INLINE_MAP[styles.display || 'block'];
    }

    const zonesContext = useContext(ResponsiveContext);
    const zones = responsive ? pointsToZones(responsive) : zonesContext;

    css = `${css || ''}${renderStyles(styles, zones, STYLE_HANDLER_MAP)}`;

    return (
      <BaseElement
        data-qa={qa}
        data-qaval={qaVal}
        {...props}
        ref={ref}
        hidden={!!isHidden}
        css={css}
      />
    );
  },
);
