import { forwardRef } from 'react';
import { Base } from '../../Base';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
} from '../../../tasty';

const DEFAULT_STYLES: Styles = {
  display: 'block',
  fill: '#dark.10',
  height: '2x',
  opacity: '.35',
};

const CSS = `
  --placeholder-animation-time: 1.4s;
  --placeholder-animation-size: calc((180rem + 100vw) / 3);
  background-image: linear-gradient(135deg, rgba(var(--dark-color-rgb), .15) 0%, rgba(var(--dark-color-rgb), .15) 5%, rgba(var(--dark-color-rgb), 0) 35%, rgba(var(--dark-03-color-rgb), .2) 50%, rgba(var(--dark-03-color-rgb), 0) 65%, rgba(var(--dark-color-rgb), .15) 95%, rgba(var(--dark-color-rgb), .15) 100%);
  background-repeat: repeat;
  background-size: var(--placeholder-animation-size);
  animation: placeholder-animation var(--placeholder-animation-time) linear infinite;

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
}

export const Placeholder = forwardRef((allProps: CubePlaceholderProps, ref) => {
  let { size = '2x', circle, ...props } = allProps;
  const styles = extractStyles(props, CONTAINER_STYLES, {
    ...DEFAULT_STYLES,
    height: size,
    width: circle ? size : false,
    radius: circle ? '9999rem' : '1r',
  });

  return (
    <Base
      role="region"
      css={CSS}
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    />
  );
});
