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
  { Item: Field, useForm, SubmitButton, ResetButton, SubmitError },
);

export {
  useFormProps,
  Form,
  Field,
  useForm,
  FormContext,
  SubmitError,
  SubmitButton,
  ResetButton,
};
export { useFieldProps } from './use-field/index';
export type { CubeFormProps } from './Form';
export type { CubeFormInstance } from './use-form';
export type { FieldTypes, Fields } from './types';
export type { UseFieldParams, UseFieldPropsParams } from './use-field/index';
export type { CubeAlertProps as CubeSubmitErrorProps };
export type { CubeResetButtonProps } from './ResetButton';
export type { CubeSubmitButtonProps } from './SubmitButton';
