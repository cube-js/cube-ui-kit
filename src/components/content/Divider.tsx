import { forwardRef, useRef } from 'react';
import { useSeparator } from 'react-aria';

import {
  BASE_STYLES,
  BaseProps,
  COLOR_STYLES,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  tasty,
} from '../../tasty';
import { useCombinedRefs, useSlotProps } from '../../utils/react';

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
      '': '#light-border',
      text: 'none',
    },
    border: '0',
    margin: '0',

    Line: {
      height: '1bw 1bw',
      fill: '#light-border',
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

  // Determine element type based on whether divider has content.
  const elementType = children ? 'div' : 'hr';

  const internalRef = useRef(null);
  const combinedRef = useCombinedRefs(ref, internalRef);

  const { separatorProps } = useSeparator({ elementType });

  return (
    <DividerElement
      {...separatorProps}
      as={elementType as any}
      mods={{
        text: !!children,
        ...mods,
      }}
      {...filterBaseProps(otherProps, { eventProps: true })}
      ref={combinedRef}
      styles={styles}
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
