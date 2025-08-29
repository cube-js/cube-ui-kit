import { forwardRef } from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  keyframes,
  Styles,
  tasty,
} from '../../../tasty';

// Create the placeholder animation using keyframes helper
const placeholderAnimation = keyframes({
  '0%': {
    'background-position': '0 0',
  },
  '100%': {
    'background-position': 'var(--placeholder-animation-size) 0',
  },
});

const StyledPlaceholder = tasty({
  role: 'alert',
  'aria-live': 'polite',
  'aria-label': 'Content is loading',
  styles: {
    display: 'block',
    fill: '#dark.10',
    height: '2x',
    opacity: '.35',

    // CSS custom properties for animation
    '$placeholder-animation-time': '1.4s',
    '$placeholder-animation-size': 'calc((180rem + 100vw) / 3)',

    // Base background styling
    backgroundRepeat: 'repeat',
    backgroundSize: '$placeholder-animation-size',
    backgroundColor: '#dark.15',

    // Animated state styling
    animation: {
      '': 'none',
      animated: `${placeholderAnimation} $placeholder-animation-time linear infinite`,
    },
    backgroundImage: {
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

  let styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <StyledPlaceholder
      role="region"
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      mods={{ animated: !isStatic }}
      styles={{
        height: size,
        width: circle ? size : false,
        radius: circle ? '9999rem' : '1r',
        ...styles,
      }}
    />
  );
});
