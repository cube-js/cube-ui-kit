import { tasty } from '../../../tasty';
import { Block } from '../../Block';

import { InternalSpinner } from './InternalSpinner';
import { CubeSpinProps } from './types';

const SpinContainer = tasty(Block, { styles: { lineHeight: '0' } });

export function Spin(props: CubeSpinProps) {
  const { size = 'default', spinning = true, children, styles } = props;

  if (!spinning) {
    return <>{children}</>;
  }

  return (
    <SpinContainer styles={styles}>
      <InternalSpinner size={size} />
    </SpinContainer>
  );
}
