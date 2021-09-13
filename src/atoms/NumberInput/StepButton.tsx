import { forwardRef } from 'react';
import { Button } from '../Button/Button';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { NuStyles } from '../../styles/types';

const STEP_BUTTON_STYLES: NuStyles = {
  padding: '0 .5x',
  radius: {
    '': '0 (1r - 1bw) 0 0',
    down: '0 0 (1r - 1bw) 0',
  },
  size: 'sm',
  lineHeight: '1em',
  height: 'auto',
};

function StepButton(props) {
  return (
    <Button
      type="item"
      styles={STEP_BUTTON_STYLES}
      preventDefault
      icon={
        props.direction === 'up' ? <CaretUpOutlined /> : <CaretDownOutlined />
      }
      mods={{
        up: props.direction === 'up',
        down: props.direction === 'down',
      }}
      {...props}
    />
  );
}

/**
 * Buttons for NumberField.
 */
const _StepButton = forwardRef(StepButton);
export { _StepButton as StepButton };
