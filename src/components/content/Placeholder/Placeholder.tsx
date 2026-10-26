import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  keyframes,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { createContext, forwardRef, useContext } from 'react';

import { useI18n } from '../../../i18n';
import { extractStyles, mergeStyleLayers } from '../../../utils/styles';

// Create the placeholder animation using keyframes helper
const placeholderAnimation = keyframes({
  '0%': {
    'background-position': '0 0',
  },
  '100%': {
    'background-position': '$placeholder-animation-size 0',
  },
});

const StyledPlaceholder = tasty({
  styles: {
    display: 'block',
    height: '2x',
    opacity: '.35',
    aspectRatio: {
      '': 'initial',
      circle: '1 / 1',
    },
    radius: {
      '': '1r',
      circle: 'round',
    },

    // CSS custom properties for animation
    '$placeholder-animation-time': '1.4s',
    '$placeholder-animation-size': 'calc((180rem + 100vw) / 3)',

    // Base background styling
    backgroundRepeat: 'repeat',
    backgroundSize: '$placeholder-animation-size',
    fill: '#dark.15',

    // Animated state styling
    animation: {
      '': 'none',
      animated: `${placeholderAnimation} $placeholder-animation-time linear infinite`,
    },
    image: {
      '': 'none',
      animated: `linear-gradient(
        135deg,
        #dark.15 0%,
        #dark.15 5%,
        #dark.0 35%,
        #dark-03.2 50%,
        #dark-03.0 65%,
        #dark.15 95%,
        #dark.15 100%
      )`,
    },
  },
});

/**
 * Set by a component that says once that a whole group of placeholders is
 * loading — `Skeleton` is one region around all of its bars, and a table's
 * loading row is `aria-busy`. The placeholders inside are then decoration, and
 * stay out of the accessibility tree rather than each being a landmark of its
 * own.
 */
export const PlaceholderGroupContext = createContext(false);

export interface CubePlaceholderProps extends BaseProps, ContainerStyleProps {
  size?: Styles['fontSize'];
  circle?: boolean;
  isStatic?: boolean;
}

export const Placeholder = forwardRef(function Placeholder(
  allProps: CubePlaceholderProps,
  ref,
) {
  let { size = '2x', isStatic, circle, ...props } = allProps;

  const { t } = useI18n();
  const isInGroup = useContext(PlaceholderGroupContext);

  let styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <StyledPlaceholder
      {...(isInGroup
        ? { 'aria-hidden': true }
        : {
            role: 'region',
            'aria-label': t(
              'placeholder.contentIsLoading',
              'Content is loading',
            ),
          })}
      {...filterBaseProps(props, { eventProps: true })}
      // The documented way to detect a loading placeholder. Fixed, so a
      // caller's `qa` or a translated `aria-label` doesn't change it.
      data-loading-placeholder=""
      ref={ref}
      mods={{ animated: !isStatic, circle }}
      // oxlint-disable-next-line tasty/no-runtime-styles-mutation -- forwards the consumer's `size` prop
      styles={mergeStyleLayers({ height: size }, styles)}
    />
  );
});
