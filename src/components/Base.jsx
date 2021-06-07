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
    {
      styles,
      breakpoints,
      block,
      inline,
      isHidden,
      isDisabled,
      qa,
      qaVal,
      css,
      ...props
    },
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

    const contextBreakpoints = useContext(ResponsiveContext);
    const zones = pointsToZones(breakpoints || contextBreakpoints);

    css = `${css || ''}${renderStyles(styles, zones, STYLE_HANDLER_MAP)}`;

    if (props.hidden == null && isHidden) {
      props.hidden = !!isHidden;
    }

    if (props.disabled == null && isDisabled) {
      props.disabled = !!isDisabled;
    }

    return (
      <BaseElement
        data-qa={qa}
        data-qaval={qaVal}
        {...props}
        ref={ref}
        css={css}
      />
    );
  },
);
