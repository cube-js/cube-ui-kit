import { forwardRef } from 'react';
import styled from 'styled-components';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
} from '../../../tasty';

const PlaceholderElement = tasty({
  role: 'alert',
  'aria-live': 'polite',
  'aria-label': 'Content is loading',
  styles: {
    display: 'block',
    fill: '#dark.10',
    height: '2x',
    opacity: '.35',
  },
});

const StyledPlaceholder = styled(PlaceholderElement)`
  --placeholder-animation-time: 1.4s;
  --placeholder-animation-size: calc((180rem + 100vw) / 3);
  background-repeat: repeat;
  background-size: var(--placeholder-animation-size);

  && {
    background-color: rgb(var(--dark-color-rgb) / 0.15);
  }

  &[data-is-animated] {
    animation: placeholder-animation var(--placeholder-animation-time) linear
      infinite;
    background-image: linear-gradient(
      135deg,
      rgb(var(--dark-color-rgb) / 0.15) 0%,
      rgb(var(--dark-color-rgb) / 0.15) 5%,
      rgb(var(--dark-color-rgb) / 0) 35%,
      rgb(var(--dark-03-color-rgb) / 0.2) 50%,
      rgb(var(--dark-03-color-rgb) / 0) 65%,
      rgb(var(--dark-color-rgb) / 0.15) 95%,
      rgb(var(--dark-color-rgb) / 0.15) 100%
    );
  }

  @keyframes placeholder-animation {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: var(--placeholder-animation-size) 0;
    }
  }
`;

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
