import { tasty } from '../../../tasty';
import { keyframes } from '../../../tasty/injector';
import { Styles } from '../../../tasty/styles/types';

// Create keyframes at module level (shared across all instances)
keyframes(
  {
    from: 'scale: 0 1',
    to: 'scale: 1 1',
  },
  'grow-progress',
);

const ScrollProgressElement = tasty({
  qa: 'PlaygroundScrollProgress',
});

export interface ScrollProgressProps {
  styles?: Styles;
}

export function ScrollProgress({ styles }: ScrollProgressProps) {
  return (
    <ScrollProgressElement styles={styles}>
      <div data-element="ProgressBar" />
      <div data-element="Content">
        <p style={{ margin: 0, opacity: 0.7 }}>
          Scroll down to see the progress bar animate
        </p>
        <p style={{ margin: '16px 0 0', opacity: 0.5, fontSize: '12px' }}>
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
          (Requires browser support for animation-timeline)
          <br />
        </p>
      </div>
    </ScrollProgressElement>
  );
}
