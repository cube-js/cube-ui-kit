import { forwardRef } from 'react';
import { Button } from './Button';
import { useProviderProps } from '../../provider';
import { useFormProps } from '../Form/Form';

function Submit(props) {
  props = useProviderProps(props);
  props = useFormProps(props);

  return <Button htmlType="submit" width="min-content" {...props} />;
}

const _Submit = forwardRef(Submit);
export { _Submit as Submit };
