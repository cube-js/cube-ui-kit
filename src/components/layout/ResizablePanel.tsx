import { useResizeObserver } from '@react-aria/utils';
import { ForwardedRef, forwardRef, useEffect, useMemo, useState } from 'react';
import { useHover, useMove } from 'react-aria';

import { useDebouncedValue, useEvent } from '../../_internal/hooks';
import { BasePropsWithoutChildren, Styles, tasty } from '../../tasty/index';
import { mergeProps, useCombinedRefs } from '../../utils/react';

import { CubePanelProps, Panel } from './Panel';

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
  qa: 'ResizeHandler',
  styles: {
    // The real size is slightly bigger than the visual one.
    width: {
      '': 'initial',
      horizontal: '9px',
      'disabled & horizontal': '1bw',
    },
    height: {
      '': '9px',
      horizontal: 'initial',
      'disabled & !horizontal': '1bw',
    },
    top: {
      '': 0,
      '[data-direction="top"]': 'initial',
    },
    bottom: {
      '': 0,
      '[data-direction="bottom"]': 'initial',
    },
    right: {
      '': 0,
      '[data-direction="right"]': 'initial',
    },
    left: {
      '': 0,
      '[data-direction="left"]': 'initial',
    },
    // Transform requires a separate visual size property to respect size boundaries
    transform: {
      '[data-direction="top"]':
        'translate(0, (@size-compensation - @visual-size))',
      '[data-direction="right"]':
        'translate((@visual-size - @size-compensation), 0)',
      '[data-direction="bottom"]':
        'translate(0, (@visual-size - @size-compensation))',
      '[data-direction="left"]':
        'translate((@size-compensation - @visual-size), 0)',
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
    '--size-compensation': {
      '': '7px',
      disabled: '1bw',
    },

    Track: {
      width: {
        '': 'initial',
        horizontal: '5px',
        'disabled & horizontal': '1px',
      },
      height: {
        '': '5px',
        horizontal: 'initial',
        'disabled & !horizontal': '1px',
      },
      position: 'absolute',
      inset: {
        '': '2px 0',
        horizontal: '0 2px',
        disabled: '0 0',
      },
      fill: {
        '': '#border-opaque',
        '(hovered | drag) & !disabled': '#purple-03',
      },
      transition: 'theme',
    },

    Drag: {
      display: 'grid',
      gap: '2bw',
      flow: {
        '': 'row',
        horizontal: 'column',
      },
      gridColumns: {
        '': '3px 3px 3px 3px 3px',
        horizontal: 'auto',
      },
      gridRows: {
        '': 'auto',
        horizontal: '3px 3px 3px 3px 3px',
      },
      width: {
        '': 'auto',
        horizontal: '3px',
      },
      height: {
        '': '3px',
        horizontal: 'auto',
      },
      inset: {
        '': '3px 50% auto auto',
        horizontal: '50% 3px auto auto',
      },
      transform: {
        '': 'translate(-50%, 0)',
        horizontal: 'translate(0, -50%)',
      },
      position: 'absolute',
      transition: 'theme',
    },

    DragPart: {
      radius: true,
      fill: {
        '': '#dark-03',
        'hovered | drag': '#dark-02',
        disabled: '#dark-04',
      },
    },
  },
});

interface HandlerProps extends BasePropsWithoutChildren {
  direction: Direction;
}

const Handler = (props: HandlerProps) => {
  const { direction = 'right', isDisabled, ...otherProps } = props;
  const { hoverProps, isHovered } = useHover({});
  const isHorizontal = direction === 'left' || direction === 'right';
  const localIsHovered = useDebouncedValue(isHovered, 150);

  return (
    <HandlerElement
      {...mergeProps(
        hoverProps,
        {
          mods: {
            hovered: localIsHovered,
            horizontal: isHorizontal,
            disabled: isDisabled,
          },
          'data-direction': direction,
        },
        otherProps,
      )}
    >
      <div data-element="Track" />
      {!isDisabled ? (
        <div data-element="Drag">
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
        </div>
      ) : null}
    </HandlerElement>
  );
};

const StyledPanel = tasty(Panel, {
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

    '--indent-compensation': {
      '': '5px',
      disabled: '1bw',
    },
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
    maxSize = isControllable ? undefined : 'min(50%, 400px)',
    ...restProps
  } = props;
  const [isDragging, setIsDragging] = useState(false);
  const isHorizontal = direction === 'left' || direction === 'right';

  ref = useCombinedRefs(ref);

  const onResize = useEvent(() => {
    if (ref?.current) {
      const offsetProp = isHorizontal ? 'offsetWidth' : 'offsetHeight';
      const containerSize = ref.current[offsetProp];

      if (Math.abs(containerSize - size) < 1 && !isDisabled) {
        setVisualSize(size);
      } else {
        setVisualSize(containerSize);
      }
    }
  });

  useResizeObserver({
    ref,
    onResize,
  });

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
  let [visualSize, setVisualSize] = useState<number | null>(null);

  let { moveProps } = useMove({
    onMoveStart(e) {
      if (isDisabled) {
        return;
      }

      setIsDragging(true);

      const offsetProp = isHorizontal ? 'offsetWidth' : 'offsetHeight';

      if (ref.current && Math.abs(ref.current[offsetProp] - size) >= 1) {
        setSize(Math.round(ref.current[offsetProp]));
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

        return size;
      });
    },
    onMoveEnd(e) {
      setIsDragging(false);
      setSize((size) => clamp(Math.round(size)));
    },
  });

  // Since we sync provided size and the local one in two ways
  // we need a way to prevent infinite loop in some cases.
  // We will run this in setTimeout and make sure it will get the most recent state.
  const notifyChange = useEvent(() => {
    setSize((size) => {
      if (providedSize && Math.abs(providedSize - size) > 0.5) {
        return providedSize;
      }

      return size;
    });
  });

  useEffect(() => {
    onResize();
  }, [size, isDisabled]);

  useEffect(() => {
    if (
      !isDragging &&
      visualSize != null &&
      (providedSize == null || Math.abs(providedSize - visualSize) > 0.5)
    ) {
      onSizeChange?.(Math.round(visualSize));
    }
  }, [visualSize, isDragging]);

  useEffect(() => {
    setTimeout(notifyChange);
  }, [providedSize]);

  const mods = useMemo(() => {
    return {
      drag: isDragging,
      horizontal: isHorizontal,
      disabled: isDisabled,
    };
  }, [isDragging, isHorizontal, isDisabled]);

  return (
    <StyledPanel
      ref={ref}
      data-direction={direction}
      mods={mods}
      extra={
        <Handler
          isDisabled={isDisabled || visualSize == null}
          direction={direction}
          {...moveProps}
          mods={mods}
        />
      }
      {...mergeProps(restProps, {
        style: {
          // We set a current size further via width/min-width/max-width styles to respect size boundaries
          '--size': `${size}px`,
          // We use a separate visual size to paint the handler for smoother experience
          '--visual-size': `${visualSize}px`,
          '--min-size': typeof minSize === 'number' ? `${minSize}px` : minSize,
          '--max-size': typeof maxSize === 'number' ? `${maxSize}px` : maxSize,
        },
        innerStyles: {
          // The panel inner space compensation for the handler
          margin: `@indent-compensation ${direction}`,
        },
      })}
    />
  );
}

const _ResizablePanel = forwardRef(ResizablePanel);

_ResizablePanel.displayName = 'ResizablePanel';

export { _ResizablePanel as ResizablePanel };
