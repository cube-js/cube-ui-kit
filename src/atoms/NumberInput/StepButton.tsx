import { forwardRef } from 'react';
import { Button } from '../Button/Button';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { modAttrs } from '../../utils/react/modAttrs';

const STEP_BUTTON_STYLES = {
  padding: '0 .5x',
  radius: {
    '': '0 (1r - 1bw) 0 0',
    down: '0 0 (1r - 1bw) 0',
  },
  size: 'sm',
  lineHeight: '1em',
};

function StepButton(props) {
  return (
    <Button
      variant="item"
      styles={STEP_BUTTON_STYLES}
      preventDefault
      icon={
        props.direction === 'up' ? <CaretUpOutlined /> : <CaretDownOutlined />
      }
      {...modAttrs({
        up: props.direction === 'up',
        down: props.direction === 'down',
      })}
      {...props}
    />
  );
}

const _StepButton = forwardRef(StepButton);
export { _StepButton as StepButton };
