import { createRef } from 'react';

import { DialogForm } from '../../../overlays/Dialog/DialogForm';
import { Form } from '../index';

import type { FormController, ModernFormState } from './controller';

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
  form.setValue('dynamic.name', 'value');
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
  const root = <Form form={form} ref={createRef<HTMLFormElement>()} />;
  // @ts-expect-error defaults belong on the creator
  const defaults = <Form form={form} defaultValues={{ amount: 2 }} />;
  // @ts-expect-error submission integration is phase 7
  const submit = <Form form={form} onSubmit={() => {}} />;
  // @ts-expect-error existing wrappers remain legacy-only
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
  return [root, defaults, submit, dialog, subscriber, context];
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
