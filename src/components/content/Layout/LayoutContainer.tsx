import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useMemo,
} from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  mergeStyles,
  Styles,
  tasty,
} from '../../../tasty';
import { useCombinedRefs } from '../../../utils/react';

import { LayoutContextReset } from './LayoutContext';

const ContainerElement = tasty({
  as: 'div',
  qa: 'LayoutContainer',
  styles: {
    display: 'flex',
    flow: 'column',
    flexGrow: 1,
    flexShrink: 1,
    placeItems: 'center start',
    placeContent: 'stretch',
    overflow: 'auto',
    scrollbar: 'thin',
    padding: '$content-padding',
    placeSelf: 'stretch',
    width: '100%',
    border: {
      '': 0,
      '!:last-child': '($layout-border-size, 1bw) solid #border bottom',
    },

    Inner: {
      $: '>',
      placeSelf: 'center',
      display: 'flex',
      flow: 'column',
      width: '40x 100% 120x',
      boxSizing: 'border-box',

      '$layout-border-size': '0',
    },
  },
});

export interface CubeLayoutContainerProps
  extends BaseProps,
    ContainerStyleProps {
  children?: ReactNode;
  /** Custom styles for container and inner elements */
  styles?: Styles;
  /** Custom styles for the inner element */
  innerStyles?: Styles;
  /** Ref for the inner content element */
  innerRef?: ForwardedRef<HTMLDivElement>;
  /** Props to spread on the Inner sub-element */
  innerProps?: HTMLAttributes<HTMLDivElement>;
}

function LayoutContainer(
  props: CubeLayoutContainerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    styles,
    innerStyles: innerStylesProp,
    innerRef: innerRefProp,
    innerProps,
    ...otherProps
  } = props;
  const innerStyles = extractStyles(
    otherProps,
    CONTAINER_STYLES,
    innerStylesProp,
  );

  const hasInnerStyles = Object.keys(innerStyles).length > 0;

  const finalStyles = useMemo(() => {
    return mergeStyles(styles, hasInnerStyles ? { Inner: innerStyles } : null);
  }, [styles, hasInnerStyles, innerStyles]);

  const combinedInnerRef = useCombinedRefs(innerRefProp);

  return (
    <ContainerElement
      ref={ref}
      {...filterBaseProps(otherProps, { eventProps: true })}
      styles={finalStyles}
    >
      <div ref={combinedInnerRef} data-element="Inner" {...innerProps}>
        <LayoutContextReset>{children}</LayoutContextReset>
      </div>
    </ContainerElement>
  );
}

const _LayoutContainer = forwardRef(LayoutContainer);

_LayoutContainer.displayName = 'Layout.Container';

export { _LayoutContainer as LayoutContainer };
