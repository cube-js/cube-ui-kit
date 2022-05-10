import { forwardRef } from 'react';
import { Base } from '../Base';
import {
  OUTER_STYLES,
  BASE_STYLES,
  COLOR_STYLES,
} from '../../tasty/styles/list';
import { extractStyles } from '../../tasty/utils/styles';
import { filterBaseProps } from '../../tasty/utils/filterBaseProps';
import { useSlotProps } from '../../utils/react';
import { BaseProps, OuterStyleProps } from '../../tasty/types';

const STYLE_LIST = [...OUTER_STYLES, ...BASE_STYLES, ...COLOR_STYLES];

const DEFAULT_STYLES = {
  gridArea: 'divider',
  display: {
    '': 'block',
    text: 'grid',
  },
  gridColumns: '1fr auto 1fr',
  placeItems: 'center stretch',
  gap: '1x',
  preset: 'c1',
  height: {
    '': '1bw 1bw',
    text: 'auto',
  },
  fill: {
    '': '#border',
    text: 'none',
  },
  border: '0',
  margin: '0',

  Line: {
    height: '1bw 1bw',
    fill: '#border',
  },
};

export interface CubeDividerProps extends BaseProps, OuterStyleProps {}

export const Divider = forwardRef((props: CubeDividerProps, ref) => {
  const { mods, children, ...otherProps } = useSlotProps(props, 'divider');
  const styles = extractStyles(otherProps, STYLE_LIST, DEFAULT_STYLES);

  return (
    <Base
      as={children ? 'div' : 'hr'}
      role={children ? 'separator' : undefined}
      mods={{
        text: !!children,
        ...mods,
      }}
      data-id="Divider"
      {...filterBaseProps(otherProps, { eventProps: true })}
      styles={styles}
      ref={ref}
    >
      {children && (
        <>
          <div data-element="Line"></div>
          <div>{children}</div>
          <div data-element="Line"></div>
        </>
      )}
    </Base>
  );
});
