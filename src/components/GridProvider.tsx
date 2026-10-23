import { filterBaseProps, tasty } from '@tenphi/tasty';
import { forwardRef, ReactNode, useCallback, useEffect, useState } from 'react';

import { useCombinedRefs } from '../utils/react';

const GridElement = tasty({
  styles: {
    display: 'contents',
    '$column-width':
      '(($grid-width - ($column-gap * ($columns-amount - 1))) / $columns-amount)',
  },
});

export interface CubeGridProviderProps {
  children: ReactNode;
  columns?: number;
  /** Gap between columns, as a single Tasty value such as `'1x'` or `8`. */
  gap?: string | number;
  /** Forced container width, as a single Tasty value. */
  width?: string | number;
  /** Width before the resize observer measures the container. */
  initialWidth?: string | number;
}

export const GridProvider = forwardRef<HTMLDivElement, CubeGridProviderProps>(
  function GridProvider(props, outerRef) {
    let ref = useCombinedRefs(outerRef);

    let {
      children,
      columns = 2,
      gap = '0',
      width: forcedWidth,
      initialWidth,
    } = props;

    let [width, setWidth] = useState<string | number>(
      forcedWidth || initialWidth || '100vw',
    );

    const resizeCallback = useCallback(() => {
      const el = ref?.current?.parentElement;

      if (!el) return;

      const computedStyle = getComputedStyle(el);
      const containerWidth =
        el.clientWidth -
        parseFloat(computedStyle.paddingLeft) -
        parseFloat(computedStyle.paddingRight);

      setWidth(`${containerWidth}px`);
    }, [ref, columns, gap]);

    useEffect(() => {
      if (forcedWidth) return;

      const el = ref && ref.current && ref.current.parentNode;

      if (!el) return;

      let sensor;

      import('../utils/ResizeSensor')
        .then((module) => module.ResizeSensor)
        .then((ResizeSensor) => {
          sensor = new ResizeSensor(el, resizeCallback);
        });

      return () => {
        if (sensor) {
          sensor.detach();
        }
      };
    }, [resizeCallback]);

    useEffect(() => {
      if (forcedWidth) return;

      resizeCallback();
    }, [resizeCallback]);

    return (
      <GridElement
        {...filterBaseProps(props, { eventProps: true })}
        ref={ref}
        tokens={{
          '$grid-width': width,
          '$columns-amount': columns,
          '$column-gap': gap,
        }}
      >
        {children}
      </GridElement>
    );
  },
);
