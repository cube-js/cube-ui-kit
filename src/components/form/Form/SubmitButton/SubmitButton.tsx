import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';

import { useProviderProps } from '../../../../provider';
import { Button, CubeButtonProps } from '../../../actions/Button/Button';
import { isModernFormController } from '../backend';
import { useFormProps } from '../Form';
import { ModernSubmitButton } from '../modern/actions';
import { FieldTypes } from '../types';
import { CubeFormInstance } from '../use-form';

import type { FormController } from '../modern/controller';

export interface CubeSubmitButtonProps<T extends FieldTypes = FieldTypes>
  extends CubeButtonProps {
  form?: CubeFormInstance<T> | FormController<T>;
  /** Modern forms: disable after validation fails. Defaults to false so submit can show errors. */
  disableOnInvalid?: boolean;
}

function LegacySubmitButton(
  props: Omit<CubeSubmitButtonProps, 'form'> & {
    form?: CubeFormInstance<FieldTypes>;
  },
  ref: FocusableRef<HTMLElement>,
) {
  const providerProps = useProviderProps({} as CubeButtonProps);

  props = useFormProps(props);

  const { isDisabled: isContextDisabled } = providerProps;

  props = useFormProps(props);

  const {
    form,
    isDisabled,
    disableOnInvalid: _disableOnInvalid,
    ...otherProps
  } = props;
  const isSomethingDisabled = isDisabled || isContextDisabled;

  return (
    <Button
      ref={ref}
      type="primary"
      htmlType="submit"
      isLoading={form?.isSubmitting}
      isDisabled={
        isSomethingDisabled || form?.isSubmitting ? true : form?.isInvalid
      }
      {...otherProps}
    />
  );
}

function SubmitButton(
  props: CubeSubmitButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  const resolved = useFormProps(props);
  if (isModernFormController(resolved.form)) {
    return (
      <ModernSubmitButton
        {...resolved}
        form={resolved.form as FormController}
        buttonRef={ref}
      />
    );
  }
  return (
    <LegacySubmitButtonWithRef
      {...(props as Omit<CubeSubmitButtonProps, 'form'> & {
        form?: CubeFormInstance<FieldTypes>;
      })}
      ref={ref}
    />
  );
}

const LegacySubmitButtonWithRef = forwardRef(LegacySubmitButton);
const _SubmitButton = forwardRef(SubmitButton);

_SubmitButton.displayName = 'SubmitButton';

export { _SubmitButton as SubmitButton };
