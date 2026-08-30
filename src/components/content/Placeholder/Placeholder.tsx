import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

import { useI18n } from '../../../i18n';
import { extractStyles } from '../../../utils/styles';

const StyledPlaceholder = tasty({
  role: 'alert',
  'aria-live': 'polite',
  styles: {
    '@keyframes': {
      'placeholder-sweep': {
        '0%': {
          'background-position': '0 0',
        },
        '100%': {
          'background-position': '$placeholder-animation-size 0',
        },
      },
    },
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
    animationName: {
      '': 'none',
      animated: 'placeholder-sweep',
    },
    animationDuration: '$placeholder-animation-time',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
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

  let styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <StyledPlaceholder
      role="region"
      aria-label={t('placeholder.contentIsLoading', 'Content is loading')}
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      mods={{ animated: !isStatic, circle }}
      styles={{
        height: size,
        ...styles,
      }}
    />
  );
});
