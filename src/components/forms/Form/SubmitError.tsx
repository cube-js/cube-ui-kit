import { ReactNode, useContext } from 'react';

import { Alert, CubeAlertProps } from '../../content/Alert';

import { FormContext } from './Form';

type SubmitErrorProps = {
  submitError?: ReactNode;
};

/**
 * An alert that shows a form error message received from the onSubmit callback.
 */
export function SubmitError(props: CubeAlertProps) {
  const { submitError } = useContext(FormContext) as SubmitErrorProps;

  if (!submitError) {
    return null;
  }

  return (
    <Alert theme="danger" {...props}>
      {submitError}
    </Alert>
  );
}
