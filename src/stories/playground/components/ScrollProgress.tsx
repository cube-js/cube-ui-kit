import { tasty } from '../../../tasty';
import { Styles } from '../../../tasty/styles/types';

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
