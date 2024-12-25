import { CubeAlertProps } from '../../content/Alert/index';

import { Field } from './Field';
import { ResetButton } from './ResetButton';
import { SubmitButton } from './SubmitButton';
import { SubmitError } from './SubmitError';
import { useForm } from './use-form';
import { useFormProps, FormContext, Form as _Form } from './Form';

const Form = Object.assign(
  _Form as typeof _Form & {
    Item: typeof Field;
    SubmitError: typeof SubmitError;
    Submit: typeof SubmitButton;
    Reset: typeof ResetButton;
    useForm: typeof useForm;
  },
  {
    Item: Field,
    useForm,
    Submit: SubmitButton,
    Reset: ResetButton,
    SubmitError,
  },
);

export * from './SubmitError';
export * from './SubmitButton';
export * from './ResetButton';
export * from './use-field';
export { useFormProps, Form, Field, useForm, FormContext };
export type { CubeFormProps } from './Form';
export type { CubeFormInstance } from './use-form';
export type { FieldTypes, Fields } from './types';
export type { CubeAlertProps as CubeSubmitErrorProps };
