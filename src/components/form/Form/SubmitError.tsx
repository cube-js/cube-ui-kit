import { ReactNode, useContext, isValidElement } from 'react';

import { Alert, CubeAlertProps } from '../../content/Alert/index';

import { FormContext } from './Form';

type SubmitErrorContextProps = {
  submitError?: unknown;
};

/**
 * An alert that shows a form error message received from the onSubmit callback.
 */
export const SubmitError = function SubmitError(props: CubeAlertProps) {
  let { submitError } = useContext(FormContext) as SubmitErrorContextProps;

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
};
