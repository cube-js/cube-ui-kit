import { forwardRef, useContext } from 'react';
import styled from 'styled-components';

import {
  AllBaseProps,
  BreakpointsContext,
  modAttrs,
  pointsToZones,
  renderStyles,
  Styles,
} from '../tasty';

const BLOCK_MAP = {
  inline: 'block',
  'inline-grid': 'grid',
  'inline-flex': 'flex',
} as const;

const INLINE_MAP = {
  block: 'inline-block',
  grid: 'inline-grid',
  flex: 'inline-flex',
} as const;

const BaseElement = styled.div(({ css }) => css);

/**
 * @deprecated consider using tasty() instead
 */
function Base<K extends keyof HTMLElementTagNameMap>(
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
    element,
    ...props
  } = allProps;

  const styles: Styles = { ...originalStyles };

  if (block) {
    styles.display =
      typeof styles.display === 'string'
        ? BLOCK_MAP[styles.display || 'inline']
        : 'block';
  }

  if (inline) {
    styles.display =
      typeof styles.display === 'string'
        ? INLINE_MAP[styles.display || 'block']
        : 'inline-block';
  }

  const contextBreakpoints = useContext(BreakpointsContext);
  const zones = pointsToZones(breakpoints || contextBreakpoints);

  css = `${css ?? ''}${renderStyles(styles, zones)}`;

  if (mods) {
    Object.assign(props, modAttrs(mods));
  }

  return (
    <BaseElement
      as={as}
      data-element={element}
      data-qa={qa}
      data-qaval={qaVal}
      {...props}
      ref={ref}
      hidden={isHidden}
      disabled={isDisabled}
      css={css}
    />
  );
}

/**
 * @deprecated consider using tasty() instead
 */
const _Base = forwardRef(Base);
export { _Base as Base };
