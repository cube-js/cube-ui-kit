import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';

import { Button } from '../../actions';
import { Styles } from '../../../tasty';

const STEP_BUTTON_STYLES: Styles = {
  width: '4x',
  radius: {
    '': '0 (1r - 1bw) 0 0',
    down: '0 0 (1r - 1bw) 0',
  },
  preset: 't4',
  lineHeight: '1em',
  height: 'auto',
};

/**
 * Buttons for NumberField.
 */
export function StepButton(props) {
  return (
    <Button
      preventDefault
      type="neutral"
      styles={STEP_BUTTON_STYLES}
      icon={
        props.direction === 'up' ? <CaretUpOutlined /> : <CaretDownOutlined />
      }
      mods={{
        up: props.direction === 'up',
        down: props.direction === 'down',
      }}
      label={`Step ${props.direction}`}
      {...props}
    />
  );
}
