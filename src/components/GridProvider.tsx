import { forwardRef, ReactNode, useCallback, useEffect, useState } from 'react';
import { filterBaseProps, Styles } from '../tasty';
import { useCombinedRefs } from '../utils/react';
import { tasty } from '../tasty';

const GridElement = tasty({
  styled: {
    display: 'contents',
  },
});

const COLUMN_WIDTH =
  '((@grid-width - (@column-gap * (@columns-amount - 1))) / @columns-amount)';

export interface CubeGridProviderProps {
  children: ReactNode;
  columns?: number;
  gap?: Styles['gap'];
  width?: Styles['width'];
  initialWidth?: Styles['width'];
}

export const GridProvider = forwardRef(
  (props: CubeGridProviderProps, outerRef) => {
    let ref = useCombinedRefs(outerRef);

    let {
      children,
      columns = 2,
      gap = '0',
      width: forcedWidth,
      initialWidth,
    } = props;

    let [width, setWidth] = useState<Styles['width']>(
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
        styles={{
          '--grid-width': width,
          '--columns-amount': columns,
          '--column-gap': gap,
          '--column-width': COLUMN_WIDTH,
        }}
        ref={ref}
      >
        {children}
      </GridElement>
    );
  },
);
