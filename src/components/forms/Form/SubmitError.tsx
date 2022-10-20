import { ReactNode, useContext, isValidElement } from 'react';

import { Alert, CubeAlertProps } from '../../content/Alert';

import { FormContext } from './Form';

type SubmitErrorProps = {
  submitError?: ReactNode;
};

/**
 * An alert that shows a form error message received from the onSubmit callback.
 */
export function SubmitError(props: CubeAlertProps) {
  let { submitError } = useContext(FormContext) as SubmitErrorProps;

  if (!submitError) {
    return null;
  }

  if (!isValidElement(submitError)) {
    submitError = 'Internal error';

    console.error(submitError);
  }

  return (
    <Alert theme="danger" {...props}>
      {submitError}
    </Alert>
  );
}
