import { createRef } from 'react';

import { DialogForm } from '../../../overlays/Dialog/DialogForm';
import { Form } from '../index';
import { useFieldProps } from '../use-field/use-field-props';

import type {
  FormController,
  ModernFormState,
  ModernSubmitResult,
  ModernValidationResult,
  ModernValidationRule,
} from './controller';

interface Values {
  amount: number;
  name: string;
}

export function ModernTypes() {
  const form = Form.useController<Values>({ defaultValues: { amount: 1 } });
  expectTypeOf(form).toEqualTypeOf<FormController<Values>>();
  expectTypeOf(
    Form.useSelector(form, (state) => state.values.amount),
  ).toEqualTypeOf<number | undefined>();
  expectTypeOf(Form.useControllerContext<Values>()).toEqualTypeOf<
    FormController<Values>
  >();
  expectTypeOf(form.getValue('amount')).toEqualTypeOf<number | undefined>();
  const rule: ModernValidationRule = {
    validator: (_rule, _value, context) => {
      expectTypeOf(context.signal).toEqualTypeOf<AbortSignal>();
      return <span>Invalid</span>;
    },
  };
  useFieldProps({
    form,
    name: 'name',
    rules: [rule],
    rulesKey: 'revision',
    errorPolicy: 'all',
  });
  expectTypeOf(form.validate()).toEqualTypeOf<
    Promise<ModernValidationResult>
  >();
  expectTypeOf(form.submit()).toEqualTypeOf<Promise<ModernSubmitResult>>();
  // @ts-expect-error unknown literal keys require an open model or a dynamic string
  form.setValue('dynamic.name', 'value');
  // @ts-expect-error unknown literal nested path
  form.setValue(['nested', 0], 'value');
  form.setFieldErrors('amount', [<span key="error">Error</span>]);
  // @ts-expect-error pipeline tokens are internal
  form.startValidation('amount');
  // @ts-expect-error field registration is internal
  form.register('amount');
  // @ts-expect-error no mutable state properties on the controller
  form.isDirty = true;
  // @ts-expect-error controller commands have stable readonly identities
  form.reset = () => {};
  useFieldProps({ form, name: 'name', preserve: false, isEqual: Object.is });
  // @ts-expect-error Form.Item remains legacy-only
  const item = <Form.Item form={form} name="name" />;
  const root = <Form form={form} ref={createRef<HTMLFormElement>()} />;
  // @ts-expect-error defaults belong on the creator
  const defaults = <Form form={form} defaultValues={{ amount: 2 }} />;
  const submit = (
    <Form
      form={form}
      onSubmit={(values) => {
        expectTypeOf(values.amount).toEqualTypeOf<number | undefined>();
      }}
    />
  );
  const dialog = <DialogForm form={form} title="Settings" />;
  const subscriber = (
    <Form.Subscribe form={form} selector={(state) => state.values.amount}>
      {(value) => {
        expectTypeOf(value).toEqualTypeOf<number | undefined>();
        return value;
      }}
    </Form.Subscribe>
  );
  const context = (
    <Form.Subscribe<Values, boolean> selector={(state) => state.isDirty}>
      {String}
    </Form.Subscribe>
  );
  return [root, defaults, submit, dialog, subscriber, context, item];
}

export function LegacyTypes() {
  const [legacy] = Form.useForm<Values>();
  // @ts-expect-error legacy state is not reactive
  Form.useSelector(legacy, (state: ModernFormState<Values>) => state.isDirty);
  return (
    // @ts-expect-error Subscribe does not accept legacy instances
    <Form.Subscribe form={legacy} selector={(state) => state.isDirty}>
      {String}
    </Form.Subscribe>
  );
}
