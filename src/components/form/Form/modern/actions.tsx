import { useEvent } from '../../../../_internal/hooks/use-event';
import { useProviderProps } from '../../../../provider';
import { Button } from '../../../actions/Button/Button';

import { getControllerInternals } from './controller';
import { useFormSelector } from './react';

import type { FocusableRef } from '@react-types/shared';
import type { MouseEvent } from 'react';
import type { CubeButtonProps } from '../../../actions/Button/Button';
import type { FormController } from './controller';

export function ModernSubmitButton({
  form,
  buttonRef,
  onClick,
  disableOnInvalid = true,
  ...props
}: CubeButtonProps & {
  form: FormController<any>;
  buttonRef: FocusableRef<HTMLElement>;
  disableOnInvalid?: boolean;
}) {
  const { isDisabled: contextDisabled } = useProviderProps(
    {} as CubeButtonProps,
  );
  const submitting = useFormSelector(form, (state) => state.isSubmitting);
  const invalid = useFormSelector(form, (state) => state.isInvalid);
  const click = useEvent((event: MouseEvent<HTMLElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const root = getControllerInternals(form, '<Form.Submit>').getRootElement();
    const button = event.currentTarget as HTMLButtonElement;
    if (root && button.form === root && button.type === 'submit') return;
    event.preventDefault();
    if (root?.isConnected) root.requestSubmit();
    else void form.submit();
  });
  return (
    <Button
      ref={buttonRef}
      type="primary"
      htmlType="submit"
      isLoading={submitting}
      {...props}
      onClick={click}
      isDisabled={
        contextDisabled ||
        props.isDisabled ||
        submitting ||
        (disableOnInvalid && invalid)
      }
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
  const { isDisabled: contextDisabled } = useProviderProps(
    {} as CubeButtonProps,
  );
  const disabled = useFormSelector(
    form,
    (state) =>
      state.isSubmitting ||
      !(
        state.isDirty ||
        state.isTouched ||
        state.submitError != null ||
        Object.values(state.fields).some(
          (field) => field.errors.length || field.status !== 'unvalidated',
        )
      ),
  );
  const reset = useEvent((event) => {
    const root = getControllerInternals(form, '<Form.Reset>').getRootElement();
    if (root?.isConnected) root.reset();
    else form.reset();
    onPress?.(event);
  });
  return (
    <Button
      ref={buttonRef}
      type="primary"
      htmlType="button"
      {...props}
      onPress={reset}
      isDisabled={contextDisabled || props.isDisabled || disabled}
    />
  );
}
