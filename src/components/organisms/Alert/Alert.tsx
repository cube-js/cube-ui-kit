import { forwardRef } from 'react';
import { Base } from '../../Base';
import THEMES from '../../../data/themes';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { Styles } from '../../../styles/types';
import { BaseProps, ContainerStyleProps, TextStyleProps } from '../../types';

const DEFAULT_STYLES: Styles = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  padding: '1.5x',
  preset: 't3',
};

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES] as const;

export interface CubeAlertProps
  extends BaseProps,
    ContainerStyleProps,
    TextStyleProps {
  type?: keyof typeof THEMES;
  label?: string;
}

export const Alert = forwardRef((allProps: CubeAlertProps, ref) => {
  let { type, label, ...props } = allProps;

  type = type || 'note';

  const styles = extractStyles(props, STYLE_LIST, {
    ...DEFAULT_STYLES,
    fill: THEMES[type] ? THEMES[type].fill : '#clear',
    border:
      THEMES[type] && THEMES[type].border ? THEMES[type].border : '#clear',
    color: '#dark',
  });

  return (
    <Base
      role="region"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
