import { forwardRef } from 'react';
import {
  BASE_STYLES,
  BaseProps,
  COLOR_STYLES,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  tasty,
} from '../../tasty';
import { useSlotProps } from '../../utils/react';

const DividerElement = tasty({
  styles: {
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
  },
  styleProps: [...OUTER_STYLES, ...BASE_STYLES, ...COLOR_STYLES],
});

export interface CubeDividerProps extends BaseProps, OuterStyleProps {}

export const Divider = forwardRef(function Divider(
  props: CubeDividerProps,
  ref,
) {
  const { mods, children, styles, ...otherProps } = useSlotProps(
    props,
    'divider',
  );

  return (
    <DividerElement
      as={children ? 'div' : 'hr'}
      role={children ? 'separator' : undefined}
      mods={{
        text: !!children,
        ...mods,
      }}
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
    </DividerElement>
  );
});
