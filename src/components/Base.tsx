import { forwardRef, useContext } from 'react';
import styled from 'styled-components';
import { ResponsiveContext } from '../providers/Responsive';
import { pointsToZones } from '../utils/responsive';
import { STYLE_HANDLER_MAP } from '../styles';
import { renderStyles } from '../utils/renderStyles';
import { modAttrs } from '../utils/react';
import { AllBaseProps } from './types';
import { Styles } from '../styles/types';

const INLINE_MAP = {
  block: 'inline',
  grid: 'inline-grid',
  flex: 'inline-flex',
} as const;

const DEFAULT_STYLES: Styles = {
  display: 'inline-block',
} as const;

const BaseElement = styled.div(({ css }) => css);

const Base = function Base<K extends keyof HTMLElementTagNameMap>(
  allProps: AllBaseProps<K>,
  ref,
) {
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

  const styles: Styles = { ...DEFAULT_STYLES, ...originalStyles };

  if (block) {
    styles.display = 'block';
  }

  if (inline) {
    styles.display
      = typeof styles.display === 'string'
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
};

const _Base = forwardRef(Base);
export { _Base as Base };
