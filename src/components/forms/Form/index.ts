import { CubeAlertProps } from '../../content/Alert';

import { Submit } from './Submit';
import { Field } from './Field';
import { SubmitError } from './SubmitError';
import { useForm } from './useForm';
import { useFormProps, FormContext, Form as _Form } from './Form';

const Form = Object.assign(
  _Form as typeof _Form & {
    Item: typeof Field;
    SubmitError: typeof SubmitError;
    useForm: typeof useForm;
    Submit: typeof Submit;
  },
  { Item: Field, useForm, Submit, SubmitError },
);

export { useFormProps, Form, Field, useForm, FormContext, Submit, SubmitError };
export type { CubeFormProps } from './Form';
export type { CubeFormInstance } from './useForm';
export type { FieldTypes, Fields } from './types';
export * from './Field';
export type { CubeAlertProps as CubeSubmitErrorProps };
