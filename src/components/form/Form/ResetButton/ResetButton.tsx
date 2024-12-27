import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';

import { useEvent } from '../../../../_internal/index';
import { useProviderProps } from '../../../../provider';
import { mergeProps } from '../../../../utils/react/index';
import { Button, CubeButtonProps } from '../../../actions/index';
import { useFormProps } from '../Form';
import { FieldTypes } from '../types';
import { CubeFormInstance } from '../use-form';

export interface CubeResetButtonProps<T extends FieldTypes = FieldTypes>
  extends CubeButtonProps {
  form?: CubeFormInstance<T>;
}

function ResetButton(
  props: CubeResetButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  const providerProps = useProviderProps({} as CubeButtonProps);

  props = useFormProps(props);

  const { isDisabled: isContextDisabled } = providerProps;
  const { form, isDisabled, ...otherProps } = props;

  const onPress = useEvent(() => {
    // Use setTimeout to avoid conflict with onBlur handlers
    setTimeout(() => {
      form?.resetFields();
    });
  });

  const isSomethingDisabled = isDisabled || isContextDisabled;

  return (
    <Button
      ref={ref}
      type="primary"
      htmlType="reset"
      isDisabled={form?.isSubmitting || !form?.isTouched}
      {...mergeProps(
        {
          onPress,
          isDisabled: isSomethingDisabled
            ? true
            : form?.isSubmitting || !form?.isTouched,
        },
        otherProps,
      )}
    />
  );
}

const _ResetButton = forwardRef(ResetButton);
export { _ResetButton as ResetButton };
