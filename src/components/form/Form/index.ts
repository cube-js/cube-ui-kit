import { CubeAlertProps } from '../../content/Alert/index';

import { Field } from './Field';
import {
  Form as _Form,
  FormContext,
  FormScopeMask,
  useFormProps,
} from './Form';
import { useFormControllerContext } from './modern/context';
import {
  FormSubscribe,
  useFormController,
  useFormSelector,
} from './modern/react';
import { ResetButton } from './ResetButton';
import { SubmitButton } from './SubmitButton';
import { SubmitError } from './SubmitError';
import { useForm } from './use-form';

const Form = Object.assign(
  _Form as typeof _Form & {
    Item: typeof Field;
    SubmitError: typeof SubmitError;
    Submit: typeof SubmitButton;
    Reset: typeof ResetButton;
    useForm: typeof useForm;
    useController: typeof useFormController;
    useSelector: typeof useFormSelector;
    Subscribe: typeof FormSubscribe;
    useControllerContext: typeof useFormControllerContext;
  },
  {
    Item: Field,
    useForm,
    useController: useFormController,
    useSelector: useFormSelector,
    Subscribe: FormSubscribe,
    useControllerContext: useFormControllerContext,
    Submit: SubmitButton,
    Reset: ResetButton,
    SubmitError,
  },
);

export * from './SubmitError';
export * from './SubmitButton';
export * from './ResetButton';
export * from './use-field';
export { useFormProps, Form, Field, useForm, FormContext, FormScopeMask };
export type { CubeFormProps } from './Form';
export type { ModernFormProps } from './ModernFormRoot';
export type {
  FormController,
  ModernFormState,
  UseFormControllerOptions,
  ModernValidationRule,
  ModernValidationResult,
  ModernFieldValidationResult,
  ModernSubmitResult,
} from './modern/controller';
export type { FormSelectorOptions, FormSubscribeProps } from './modern/react';
export type {
  FormChange,
  SetValueOptions,
  ModernSubmitContext,
} from './modern/types';
export type { ModernValidationContext } from './modern/validation';
export type { FormPath } from './modern/values';
export type { FormValueAtPath } from './modern/path-types';
export type { CubeFormInstance } from './use-form';
export type { FieldTypes, Fields } from './types';
export type { CubeAlertProps as CubeSubmitErrorProps };
