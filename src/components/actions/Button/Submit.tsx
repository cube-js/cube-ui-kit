import { forwardRef } from 'react';

import { useProviderProps } from '../../../provider';
import { useFormProps } from '../../forms/Form/Form';

import { Button } from './Button';

function Submit(props, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

  const { form, ...otherProps } = props;
  const formData = form.getFieldsValue();
  const isValid = !Object.keys(formData).find((name) => {
    return form.isFieldInvalid(name);
  });

  return (
    <Button
      ref={ref}
      type="primary"
      htmlType="submit"
      isLoading={form.isSubmitting}
      isDisabled={!isValid}
      {...otherProps}
    />
  );
}

const _Submit = forwardRef(Submit);
export { _Submit as Submit };
