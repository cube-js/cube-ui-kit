import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';

import { useEvent } from '../../../../_internal/index';
import { useProviderProps } from '../../../../provider';
import { mergeProps } from '../../../../utils/react/index';
import { Button, CubeButtonProps } from '../../../actions/Button/Button';
import { isModernFormController } from '../backend';
import { useFormProps } from '../Form';
import { ModernResetButton } from '../modern/actions';
import { FieldTypes } from '../types';
import { CubeFormInstance } from '../use-form';

import type { FormController } from '../modern/controller';

export interface CubeResetButtonProps<T extends FieldTypes = FieldTypes>
  extends CubeButtonProps {
  form?: CubeFormInstance<T> | FormController<T>;
}

function LegacyResetButton(
  props: Omit<CubeResetButtonProps, 'form'> & {
    form?: CubeFormInstance<FieldTypes>;
  },
  ref: FocusableRef<HTMLElement>,
) {
  'use no memo';
  // Legacy form state is mutable; preserve its render-time reads until migration.

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

function ResetButton(
  props: CubeResetButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  const resolved = useFormProps(props);
  if (isModernFormController(resolved.form)) {
    return (
      <ModernResetButton
        {...resolved}
        form={resolved.form as FormController}
        buttonRef={ref}
      />
    );
  }
  return (
    <LegacyResetButtonWithRef
      {...(props as Omit<CubeResetButtonProps, 'form'> & {
        form?: CubeFormInstance<FieldTypes>;
      })}
      ref={ref}
    />
  );
}

const LegacyResetButtonWithRef = forwardRef(LegacyResetButton);
const _ResetButton = forwardRef(ResetButton);

_ResetButton.displayName = 'ResetButton';

export { _ResetButton as ResetButton };
