import { forwardRef } from 'react';
import { useSlotProps } from '../../../utils/react';
import { CubeSpaceProps, Space } from '../../layout/Space';
import { useContextStyles } from '../../../providers/StyleProvider';

export const ButtonGroup = forwardRef((props: CubeSpaceProps, ref) => {
  let { styles, ...otherProps } = useSlotProps(props, 'buttonGroup');

  const contextStyles = useContextStyles('ButtonGroup', otherProps);

  styles = styles
    ? {
        ...contextStyles,
        ...styles,
      }
    : contextStyles;

  return <Space gridArea="buttonGroup" styles={styles} ref={ref} {...props} />;
});
