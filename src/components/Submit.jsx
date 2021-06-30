import React, { forwardRef } from 'react';
import { Button } from '../atoms/Button/Button';
import { useProviderProps } from '../provider';
import { useFormProps } from '../atoms/Form/Form';

function Submit(props) {
  props = useProviderProps(props);
  props = useFormProps(props);

  return <Button htmlType="submit" width="min-content" {...props} />;
}

const _Submit = forwardRef(Submit);
export { _Submit as Submit };
