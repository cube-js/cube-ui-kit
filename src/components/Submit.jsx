import React, { forwardRef } from 'react';
import { Button } from '../atoms/Button/Button';
import { useProviderProps } from '../provider';

function Submit(props) {
  props = useProviderProps(props);

  return (
    <Button
      htmlType="submit"
      column={props.labelPosition === 'left' ? '2' : false}
      width={props.labelPosition === 'left' ? 'min-content' : undefined}
      {...props}
    />
  );
}

const _Submit = forwardRef(Submit);
export { _Submit as Submit };
