import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';

import { useProviderProps } from '../../../../provider';
import { Button, CubeButtonProps } from '../../../actions/index';
import { useFormProps } from '../Form';
import { FieldTypes } from '../types';
import { CubeFormInstance } from '../use-form';

export interface CubeSubmitButtonProps<T extends FieldTypes = FieldTypes>
  extends CubeButtonProps {
  form?: CubeFormInstance<T>;
}

function SubmitButton(
  props: CubeSubmitButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  const providerProps = useProviderProps({} as CubeButtonProps);

  props = useFormProps(props);

  const { isDisabled } = providerProps;

  props = useFormProps(props);

  const { form, ...otherProps } = props;

  return (
    <Button
      ref={ref}
      type="primary"
      htmlType="submit"
      isLoading={form?.isSubmitting}
      isDisabled={isDisabled != null ? isDisabled : form?.isInvalid}
      {...otherProps}
    />
  );
}

const _SubmitButton = forwardRef(SubmitButton);
export { _SubmitButton as SubmitButton };
