import { forwardRef } from 'react';
import { Button } from './Button';
import { useProviderProps } from '../../../provider';
import { useFormProps } from '../../forms/Form/Form';

function Submit(props) {
  props = useProviderProps(props);
  props = useFormProps(props);

  const { form, ...otherProps } = props;
  const formData = form.getFieldsValue();
  const isValid = !Object.keys(formData).find((name) => {
    return form.isFieldInvalid(name);
  });

  return (
    <Button
      type="primary"
      htmlType="submit"
      width="min-content"
      isLoading={form.isSubmitting}
      {...otherProps}
      isDisabled={!isValid}
    />
  );
}

const _Submit = forwardRef(Submit);
export { _Submit as Submit };
