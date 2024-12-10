import { ForwardedRef, forwardRef, useEffect, useState } from 'react';
import { useHover, useMove } from 'react-aria';

import { BasePropsWithoutChildren, Styles, tasty } from '../../tasty/index';
import { mergeProps, useCombinedRefs } from '../../utils/react/index';

import { Panel, CubePanelProps } from './Panel';

type Direction = 'top' | 'right' | 'bottom' | 'left';

export interface CubeResizablePanelProps extends CubePanelProps {
  handlerStyles?: Styles;
  direction: Direction;
  size?: number;
  onSizeChange?: (size: number) => void;
  minSize?: string | number;
  maxSize?: string | number;
  isDisabled?: boolean;
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
    cursor: {
      '': 'col-resize',
      disabled: 'not-allowed',
    },
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
        '(hovered | drag) & !disabled': '#purple-03',
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
        disabled: '#dark-04',
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
  const { direction = 'right', isDisabled } = props;
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
            disabled: isDisabled,
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
  props: CubeResizablePanelProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const isControllable = typeof props.size === 'number';
  const {
    isDisabled,
    direction = 'right',
    size: providedSize,
    onSizeChange,
    minSize = 200,
    maxSize = isControllable ? undefined : 400,
  } = props;

  const [isDragging, setIsDragging] = useState(false);
  const isHorizontal = direction === 'left' || direction === 'right';

  ref = useCombinedRefs(ref);

  function clamp(size: number) {
    if (typeof maxSize === 'number') {
      size = Math.min(maxSize, size);
    }

    if (typeof minSize === 'number' || !minSize) {
      size = Math.max((minSize as number) || 0, size);
    }

    return Math.max(size, 0);
  }

  let [size, setSize] = useState<number>(
    providedSize != null ? clamp(providedSize) : 200,
  );

  let { moveProps } = useMove({
    onMoveStart(e) {
      if (isDisabled) {
        return;
      }

      setIsDragging(true);

      const offsetProp = isHorizontal ? 'offsetWidth' : 'offsetHeight';

      if (ref.current && Math.abs(ref.current[offsetProp] - size) > 1) {
        setSize(ref.current[offsetProp]);
      }
    },
    onMove(e) {
      setSize((size) => {
        if (isDisabled) {
          return size;
        }

        if (e.pointerType === 'keyboard') {
          return size;
        }

        size += isHorizontal
          ? e.deltaX * (direction === 'right' ? 1 : -1)
          : e.deltaY * (direction === 'bottom' ? 1 : -1);

        return clamp(size);
      });
    },
    onMoveEnd(e) {
      setIsDragging(false);
      setSize((size) => Math.round(size));
    },
  });

  useEffect(() => {
    if (providedSize == null || Math.abs(providedSize - size) > 0.5) {
      onSizeChange?.(size);
    }
  }, [size]);

  useEffect(() => {
    if (providedSize && Math.abs(providedSize - size) > 0.5) {
      setSize(providedSize);
    }
  }, [providedSize]);

  return (
    <PanelElement
      ref={ref}
      data-direction={direction}
      extra={
        <Handler
          isDisabled={isDisabled}
          direction={direction}
          {...moveProps}
          mods={{
            drag: isDragging,
            horizontal: isHorizontal,
            disabled: isDisabled,
          }}
        />
      }
      {...mergeProps(props, {
        style: {
          '--size': `${size}px`,
          '--min-size': typeof minSize === 'number' ? `${minSize}px` : minSize,
          '--max-size': typeof maxSize === 'number' ? `${maxSize}px` : maxSize,
        },
        innerStyles: {
          margin: `5px ${direction}`,
        },
      })}
    />
  );
}

const _ResizablePanel = forwardRef(ResizablePanel);

_ResizablePanel.displayName = 'ResizablePanel';

export { _ResizablePanel as ResizablePanel };
