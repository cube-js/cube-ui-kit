import { useEvent } from '../../../../_internal/hooks/use-event';
import { Button } from '../../../actions/Button/Button';

import { useFormSelector } from './react';

import type { FocusableRef } from '@react-types/shared';
import type { CubeButtonProps } from '../../../actions/Button/Button';
import type { FormController } from './controller';

export function ModernSubmitButton({
  form,
  buttonRef,
  ...props
}: CubeButtonProps & {
  form: FormController<any>;
  buttonRef: FocusableRef<HTMLElement>;
}) {
  const submitting = useFormSelector(form, (state) => state.isSubmitting);
  const invalid = useFormSelector(form, (state) => state.isInvalid);
  return (
    <Button
      ref={buttonRef}
      type="primary"
      htmlType="submit"
      isLoading={submitting}
      {...props}
      isDisabled={props.isDisabled || submitting || invalid}
    />
  );
}

export function ModernResetButton({
  form,
  buttonRef,
  onPress,
  ...props
}: CubeButtonProps & {
  form: FormController<any>;
  buttonRef: FocusableRef<HTMLElement>;
}) {
  const disabled = useFormSelector(
    form,
    (state) => state.isSubmitting || !state.isTouched,
  );
  const reset = useEvent((event) => {
    form.reset();
    onPress?.(event);
  });
  return (
    <Button
      ref={buttonRef}
      type="primary"
      htmlType="button"
      {...props}
      onPress={reset}
      isDisabled={props.isDisabled || disabled}
    />
  );
}
