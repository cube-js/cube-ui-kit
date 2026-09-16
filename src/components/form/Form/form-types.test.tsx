import { createRef } from 'react';

import { TextInput } from '../../fields/TextInput/TextInput';
import { DialogForm } from '../../overlays/Dialog/DialogForm';

import { FormController } from './backend';
import { CubeFormProps } from './Form';
import { CubeFormInstance } from './use-form';

import { Form } from './index';

/**
 * Type fixtures for the dual-backend shell (plan Phase 3, item 11). They are
 * compiled by `tsc`, not executed: direct `<Form>` usage, a pass-through
 * wrapper, `DialogForm`, an explicit external instance, and the rejection of
 * a modern controller everywhere a legacy instance is expected today.
 */

interface Values {
  name: string;
  port: number;
}

export function DirectUsage() {
  const [form] = Form.useForm<Values>();
  const ref = createRef<HTMLFormElement>();

  expectTypeOf(form).toEqualTypeOf<CubeFormInstance<Values>>();

  return (
    <Form<Values>
      ref={ref}
      form={form}
      defaultValues={{ name: 'x' }}
      onSubmit={(values) => {
        expectTypeOf(values).toEqualTypeOf<Values>();
      }}
      onValuesChange={(values) => {
        expectTypeOf(values.port).toEqualTypeOf<number>();
      }}
    >
      <TextInput name="name" label="Name" />
    </Form>
  );
}

export function PassThroughWrapper(props: CubeFormProps<Values>) {
  return <Form {...props} />;
}

export function DialogUsage() {
  const [form] = Form.useForm<Values>();

  return (
    <DialogForm<Values> form={form} title="Settings" onSubmit={() => {}}>
      <TextInput name="name" label="Name" />
    </DialogForm>
  );
}

export function ExternalInstance({ form }: { form: CubeFormInstance<Values> }) {
  return <TextInput name="name" label="Name" form={form} />;
}

declare const modern: FormController<Values>;

export function ModernIsRejectedToday() {
  // @ts-expect-error a modern controller is not a legacy instance
  const root = <Form form={modern} />;

  // @ts-expect-error DialogForm is legacy-only until it gets a backend-aware implementation
  const dialog = <DialogForm form={modern} title="t" />;

  // @ts-expect-error the legacy creator cannot adopt a modern controller
  Form.useForm(modern);

  return [root, dialog];
}

it('the dual-backend type fixtures compile', () => {
  expect(typeof DirectUsage).toBe('function');
  expect(typeof PassThroughWrapper).toBe('function');
  expect(typeof DialogUsage).toBe('function');
  expect(typeof ExternalInstance).toBe('function');
  expect(typeof ModernIsRejectedToday).toBe('function');
});
