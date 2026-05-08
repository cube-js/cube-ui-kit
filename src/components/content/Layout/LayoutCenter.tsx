import { tasty } from '@tenphi/tasty';
import { ForwardedRef, forwardRef } from 'react';

import { CubeLayoutContainerProps, LayoutContainer } from './LayoutContainer';

const CenterElement = tasty(LayoutContainer, {
  qa: 'LayoutCenter',
  styles: {
    placeItems: 'stretch',
    placeContent: 'stretch',

    Inner: {
      textAlign: 'center',
      placeItems: 'center',
      placeContent: 'center',
    },
  },
});

const GoldenRatioSpacerElement = tasty({
  'aria-hidden': 'true',
  qa: 'LayoutCenterGoldenRatioSpacer',
  styles: {
    flexGrow: {
      '': 0.382,
      'position=bottom': 0.618,
    },
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 0,
    pointerEvents: 'none',
  },
});

export interface CubeLayoutCenterProps extends CubeLayoutContainerProps {
  /**
   * Position content slightly above the visual center using the golden ratio
   * (~38.2% empty space above, ~61.8% below) for a more aesthetically pleasing
   * placement. Only takes effect while the content is smaller than the
   * container; once the content overflows, layout falls back to the default
   * centered behavior.
   * @default false
   */
  isGoldenRatio?: boolean;
}

function LayoutCenter(
  props: CubeLayoutCenterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { children, isGoldenRatio, ...otherProps } = props;

  return (
    <CenterElement {...otherProps} ref={ref}>
      {isGoldenRatio && <GoldenRatioSpacerElement mods={{ position: 'top' }} />}
      {children}
      {isGoldenRatio && (
        <GoldenRatioSpacerElement mods={{ position: 'bottom' }} />
      )}
    </CenterElement>
  );
}

const _LayoutCenter = forwardRef(LayoutCenter);

_LayoutCenter.displayName = 'Layout.Center';

export { _LayoutCenter as LayoutCenter };
