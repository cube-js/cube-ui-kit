import { Field } from './Field';
import { useForm } from './useForm';
import { useFormProps, Form as _Form } from './Form';

const Form = Object.assign(
  _Form as typeof _Form & {
    Item: typeof Field;
    useForm: typeof useForm;
  },
  { Item: Field, useForm },
);

export { useFormProps, Form, Field, useForm };
export type { CubeFormProps } from './Form';
export type { CubeFormInstance } from './useForm';
export type { FieldTypes, Fields } from './types';
