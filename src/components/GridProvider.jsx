import React, { forwardRef } from 'react';
import { filterBaseProps } from '../utils/filterBaseProps';
import { useCombinedRefs } from '../utils/react/useCombinedRefs';
import { CUSTOM_UNITS, parseStyle } from '../utils/styles';
import { Base } from './Base';

// Declare `sp` custom unit for styles
CUSTOM_UNITS.sp = function spanWidth(num) {
  return `((${num} * var(--column-width)) + (${num - 1} * var(--column-gap)))`;
};

const DEFAULT_STYLES = {
  display: 'contents',
};

const COLUMN_WIDTH =
  '((@grid-width - (@column-gap * (@columns-amount - 1))) / @columns-amount)';

export const GridProvider = forwardRef((props, ref) => {
  ref = useCombinedRefs(ref);

  let {
    children,
    columns = 2,
    gap = '0',
    width: forcedWidth,
    initialWidth,
  } = props;

  let [width, setWidth] = React.useState(
    forcedWidth || initialWidth || '100vw',
  );

  if (typeof gap === 'number') {
    gap = `${gap}px`;
  }

  gap = parseStyle(gap).values[0] || '0';

  const resizeCallback = React.useCallback(() => {
    const el = ref && ref.current && ref.current.parentNode;

    if (!el) return;

    const computedStyle = getComputedStyle(el);
    const containerWidth =
      el.clientWidth -
      parseFloat(computedStyle.paddingLeft) -
      parseFloat(computedStyle.paddingRight);

    setWidth(`${containerWidth}px`);
  }, [ref, columns, gap]);

  React.useEffect(() => {
    if (forcedWidth) return;

    const el = ref && ref.current && ref.current.parentNode;

    if (!el) return;

    let sensor;

    import('../utils/ResizeSensor')
      .then(module => module.ResizeSensor)
      .then(ResizeSensor => {
        sensor = new ResizeSensor(el, resizeCallback)
      });

    return () => {
      if (sensor) {
        sensor.detach();
      }
    };
  }, [resizeCallback]);

  React.useEffect(() => {
    if (forcedWidth) return;

    resizeCallback();
  }, [resizeCallback]);

  return (
    <Base
      {...filterBaseProps(props, { eventProps: true })}
      styles={{
        ...DEFAULT_STYLES,
        '--grid-width': width,
        '--columns-amount': columns,
        '--column-gap': gap,
        '--column-width': COLUMN_WIDTH,
      }}
      ref={ref}
    >
      {children}
    </Base>
  );
});
