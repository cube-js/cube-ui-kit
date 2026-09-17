import {
  ForwardedRef,
  forwardRef,
  isValidElement,
  ReactNode,
  useContext,
} from 'react';

import { useI18n } from '../../../i18n';
import { Alert, CubeAlertProps } from '../../content/Alert/index';

import { FormContext } from './Form';
import { ModernControllerContext } from './modern/context';
import { useFormSelector } from './modern/react';

import type { FormController } from './modern/controller';

type SubmitErrorContextProps = {
  submitError?: unknown;
};

function ErrorAlert(
  { submitError, ...props }: CubeAlertProps & SubmitErrorContextProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { t } = useI18n();

  if (!submitError) {
    return null;
  }

  if (
    !isValidElement(submitError as ReactNode) &&
    typeof submitError !== 'string'
  ) {
    submitError = t('form.internalError', 'Internal error');
  }

  return (
    <Alert ref={ref} theme="danger" {...props}>
      {submitError as ReactNode}
    </Alert>
  );
}

const ForwardedErrorAlert = forwardRef(ErrorAlert);

function ModernSubmitError({
  form,
  alertRef,
  ...props
}: CubeAlertProps & {
  form: FormController<any>;
  alertRef: ForwardedRef<HTMLDivElement>;
}) {
  const submitError = useFormSelector(form, (state) => state.submitError);
  return (
    <ForwardedErrorAlert {...props} ref={alertRef} submitError={submitError} />
  );
}

function SubmitError(props: CubeAlertProps, ref: ForwardedRef<HTMLDivElement>) {
  const modern = useContext(ModernControllerContext);
  const legacy = useContext(FormContext) as SubmitErrorContextProps;
  return modern ? (
    <ModernSubmitError {...props} form={modern} alertRef={ref} />
  ) : (
    <ForwardedErrorAlert
      {...props}
      ref={ref}
      submitError={legacy.submitError}
    />
  );
}

/**
 * An alert that shows a form error message received from the onSubmit callback.
 */
const _SubmitError = forwardRef(SubmitError);

_SubmitError.displayName = 'SubmitError';

export { _SubmitError as SubmitError };
