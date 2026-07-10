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

type SubmitErrorContextProps = {
  submitError?: unknown;
};

function SubmitError(props: CubeAlertProps, ref: ForwardedRef<HTMLDivElement>) {
  let { submitError } = useContext(FormContext) as SubmitErrorContextProps;
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

/**
 * An alert that shows a form error message received from the onSubmit callback.
 */
const _SubmitError = forwardRef(SubmitError);

_SubmitError.displayName = 'SubmitError';

export { _SubmitError as SubmitError };
