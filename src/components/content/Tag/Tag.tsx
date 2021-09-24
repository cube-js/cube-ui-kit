import { forwardRef } from 'react';
import THEMES from '../../../data/themes';
import { Base } from '../../Base';
import { CONTAINER_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../types';
import { Styles } from '../../../styles/types';

const DEFAULT_STYLES: Styles = {
  display: 'inline-flex',
  placeContent: 'center',
  placeItems: 'center',
  radius: '1r',
  size: 'sm',
  width: 'min 16px',
  height: '16px',
  textAlign: 'center',
  fontWeight: 500,
  color: '#dark.65',
  border: '#border',
  fill: '#dark.04',
  padding: '1bw (1x - 1bw)',
} as const;

export interface CubeTagProps extends BaseProps, ContainerStyleProps {
  type?: keyof typeof THEMES;
}

const Tag = (allProps: CubeTagProps, ref) => {
  let { type, children, ...props } = allProps;

  const styles = extractStyles(props, CONTAINER_STYLES, {
    ...DEFAULT_STYLES,
    ...(type && (type in THEMES) ? {
      fill: type && THEMES[type] ? THEMES[type].fill : '#white',
      color: type && THEMES[type] ? THEMES[type].color : '#purple',
      border: type && THEMES[type] ? THEMES[type].border : '#purple',
    } : {}),
  });

  return (
    <Base
      role="region"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    >
      {children}
    </Base>
  );
};

const _Tag = forwardRef(Tag);
export { _Tag as Tag };
