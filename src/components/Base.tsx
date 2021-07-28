import React, { forwardRef, PropsWithChildren, useContext } from 'react';
import styled from 'styled-components';
import { ResponsiveContext } from '../providers/Responsive';
import { pointsToZones } from '../utils/responsive';
import { STYLE_HANDLER_MAP } from '../styles';
import { renderStyles } from '../utils/render-styles';
import { modAttrs } from '../utils/react';
import { BaseProps } from './types';

const INLINE_MAP = {
  block: 'inline',
  grid: 'inline-grid',
  flex: 'inline-flex',
};

const BaseElement = styled.div(({ css }) => css);

export const Base = forwardRef(
  (
    {
      as,
      styles,
      breakpoints,
      block,
      mods,
      inline,
      isHidden,
      isDisabled,
      qa,
      qaVal,
      css,
      ...props
    }: PropsWithChildren<BaseProps>,
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
      styles.display = typeof styles.display === 'string' ?
        INLINE_MAP[styles.display || 'block'] :
        'block';
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

    if (mods) {
      Object.assign(props, modAttrs(mods));
    }

    return (
      <BaseElement
        as={as}
        data-qa={qa}
        data-qaval={qaVal}
        {...props}
        ref={ref}
        css={css}
      />
    );
  },
);
