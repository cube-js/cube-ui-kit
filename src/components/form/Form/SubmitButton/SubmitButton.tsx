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

  const { isDisabled: isContextDisabled } = providerProps;

  props = useFormProps(props);

  const { form, isDisabled, ...otherProps } = props;
  const isSomethingDisabled = isDisabled || isContextDisabled;

  return (
    <Button
      ref={ref}
      type="primary"
      htmlType="submit"
      isLoading={form?.isSubmitting}
      isDisabled={isSomethingDisabled ? true : form?.isInvalid}
      {...otherProps}
    />
  );
}

const _SubmitButton = forwardRef(SubmitButton);

_SubmitButton.displayName = 'SubmitButton';

export { _SubmitButton as SubmitButton };
