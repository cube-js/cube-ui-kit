import { ReactNode, useContext, isValidElement, memo } from 'react';

import { Alert, CubeAlertProps } from '../../content/Alert';

import { FormContext } from './Form';

type SubmitErrorProps = {
  submitError?: unknown;
};

/**
 * An alert that shows a form error message received from the onSubmit callback.
 */
export const SubmitError = memo(function SubmitError(props: CubeAlertProps) {
  let { submitError } = useContext(FormContext) as SubmitErrorProps;

  if (!submitError) {
    return null;
  }

  if (
    !isValidElement(submitError as ReactNode) &&
    typeof submitError !== 'string'
  ) {
    submitError = 'Internal error';
  }

  return (
    <Alert theme="danger" {...props}>
      {submitError as ReactNode}
    </Alert>
  );
});
