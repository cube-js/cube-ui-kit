import { forwardRef, useContext } from 'react';
import styled from 'styled-components';
import { ResponsiveContext } from '../providers/Responsive';
import { pointsToZones } from '../utils/responsive';
import { STYLE_HANDLER_MAP } from '../styles';
import { renderStyles } from '../utils/render-styles';
import { modAttrs } from '../utils/react';
import { AllBaseProps } from './types';
import { NuStyles } from '../styles/types';

const INLINE_MAP = {
  block: 'inline',
  grid: 'inline-grid',
  flex: 'inline-flex',
} as const;

const DEFAULT_STYLES: NuStyles = {
  display: 'inline-block',
} as const;

const BaseElement = styled.div(({ css }) => css);

export const Base = forwardRef((allProps: AllBaseProps, ref) => {
  let {
    as,
    styles: originalStyles,
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
  } = allProps;

  const styles: NuStyles = { ...DEFAULT_STYLES, ...originalStyles };

  if (block) {
    styles.display = 'block';
  }

  if (inline) {
    styles.display =
      typeof styles.display === 'string'
        ? INLINE_MAP[styles.display || 'block']
        : 'block';
  }

  const contextBreakpoints = useContext(ResponsiveContext);
  const zones = pointsToZones(breakpoints || contextBreakpoints);

  css = `${css || ''}${renderStyles(styles, zones, STYLE_HANDLER_MAP)}`;

  if (props.hidden == null && isHidden) {
    props.hidden = isHidden;
  }

  if (props.disabled == null && isDisabled) {
    props.disabled = isDisabled;
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
});
