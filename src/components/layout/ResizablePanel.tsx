import { ForwardedRef, forwardRef, useContext, useState } from 'react';
import { useHover, useMove } from 'react-aria';

import { useWarn } from '../../_internal/index';
import { BasePropsWithoutChildren, Styles, tasty } from '../../tasty/index';
import { mergeProps, useCombinedRefs } from '../../utils/react/index';

import { Panel, CubePanelProps, PanelContext } from './Panel';

type Direction = 'top' | 'right' | 'bottom' | 'left';

export interface ResizablePanelProps extends CubePanelProps {
  handlerStyles?: Styles;
  direction: Direction;
  minSize?: string | number;
  maxSize?: string | number;
}

const HandlerElement = tasty({
  styles: {
    // The real size is slightly bigger than the visual one.
    width: {
      '': 'auto',
      horizontal: '9px',
    },
    height: {
      '': '9px',
      horizontal: 'auto',
    },
    top: {
      '': 'initial',
      horizontal: 0,
      '[data-direction="top"]': -2,
    },
    bottom: {
      '': 'initial',
      horizontal: 0,
      '[data-direction="bottom"]': -2,
    },
    right: {
      '': 0,
      horizontal: 'initial',
      '[data-direction="right"]': -2,
    },
    left: {
      '': 0,
      horizontal: 'initial',
      '[data-direction="left"]': -2,
    },
    position: 'absolute',
    zIndex: 1,
    cursor: 'col-resize',
    fill: {
      '': '#clear',
      drag: '#purple-02',
    },
    padding: 0,
    boxSizing: 'border-box',
    transition: 'theme',

    Track: {
      width: {
        '': 'initial',
        horizontal: '5px',
      },
      height: {
        '': '5px',
        horizontal: 'initial',
      },
      position: 'absolute',
      inset: {
        '': '2px 0',
        horizontal: '0 2px',
      },
      fill: {
        '': '#border-opaque',
        'hovered | drag': '#purple-03',
      },
      transition: 'theme',
    },

    Drag: {
      width: {
        '': '3x',
        horizontal: '3px',
      },
      height: {
        '': '3px',
        horizontal: '3x',
      },
      radius: true,
      fill: {
        '': '#dark-03',
        'hovered | drag': '#dark-02',
      },
      inset: {
        '': '3px 50% auto auto',
        horizontal: '50% 3px auto auto',
      },
      position: 'absolute',
      transition: 'theme',
    },
  },
});

interface HandlerProps extends BasePropsWithoutChildren {
  direction: Direction;
}

const Handler = (props: HandlerProps) => {
  const { direction = 'right' } = props;
  const { hoverProps, isHovered } = useHover({});
  const isHorizontal = direction === 'left' || direction === 'right';

  return (
    <HandlerElement
      {...mergeProps(
        hoverProps,
        {
          mods: {
            hovered: isHovered,
            horizontal: isHorizontal,
          },
          'data-direction': direction,
        },
        props,
      )}
    >
      <div data-element="Track" />
      <div data-element="Drag" />
    </HandlerElement>
  );
};

const PanelElement = tasty(Panel, {
  styles: {
    flexGrow: 0,
    width: {
      '': '@min-size @size @max-size',
      '[data-direction="top"] | [data-direction="bottom"]': 'initial',
    },
    height: {
      '': '@min-size @size @max-size',
      '[data-direction="left"] | [data-direction="right"]': 'initial',
    },
    placeSelf: 'stretch',
    touchAction: 'none',
  },
});

function ResizablePanel(
  props: ResizablePanelProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const panelContext = useContext(PanelContext);

  useWarn(panelContext.layout !== 'flex', {
    once: true,
    key: 'resizable panel layout requirement',
    args: [
      'ResizablePanel can only be used inside a flex layout. Use Panel with `isFlex` property to create one.',
    ],
  });

  const { direction = 'right', minSize = '15%', maxSize = '35%' } = props;
  const [isDragging, setIsDragging] = useState(false);
  const isHorizontal = direction === 'left' || direction === 'right';

  ref = useCombinedRefs(ref);

  let [size, setSize] = useState<number>(200);

  let { moveProps } = useMove({
    onMoveStart(e) {
      setIsDragging(true);

      const offsetProp = isHorizontal ? 'offsetWidth' : 'offsetHeight';

      if (ref.current && Math.abs(ref.current[offsetProp] - size) > 1) {
        setSize(ref.current[offsetProp]);
      }
    },
    onMove(e) {
      setSize((size) => {
        if (e.pointerType === 'keyboard') {
          return size;
        }

        size += isHorizontal
          ? e.deltaX * (direction === 'right' ? 1 : -1)
          : e.deltaY * (direction === 'bottom' ? 1 : -1);

        return size;
      });
    },
    onMoveEnd(e) {
      setIsDragging(false);
    },
  });

  return (
    <PanelElement
      ref={ref}
      data-direction={direction}
      extra={
        <Handler
          direction={direction}
          {...moveProps}
          mods={{ drag: isDragging, horizontal: isHorizontal }}
        />
      }
      {...mergeProps(props, {
        style: {
          '--size': `${size}px`,
          '--min-size': typeof minSize === 'number' ? `${minSize}px` : minSize,
          '--max-size': typeof maxSize === 'number' ? `${maxSize}px` : maxSize,
        },
      })}
    />
  );
}

const _ResizablePanel = forwardRef(ResizablePanel);

_ResizablePanel.displayName = 'ResizablePanel';

export { _ResizablePanel as ResizablePanel };
