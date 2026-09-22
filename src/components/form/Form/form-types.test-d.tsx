import { createRef } from 'react';

import { TextInput } from '../../fields/TextInput/TextInput';
import { DialogForm } from '../../overlays/Dialog/DialogForm';

import { FormController } from './backend';
import { CubeFormProps } from './Form';
import { CubeFormInstance } from './use-form';

import { Form } from './index';

/**
 * Type fixtures for the dual-backend shell (plan Phase 3, item 11). Compiled
 * by `pnpm test:types` (`tsconfig.typecheck.json`, a CI step; not part of
 * `pnpm test` or the pre-push hook); nothing here runs. Covered: direct
 * `<Form>` usage, a pass-through wrapper, `DialogForm`, an explicit external
 * instance, and the rejection of a modern controller everywhere a legacy
 * instance is expected.
 *
 * The in-repo check resolves react-aria's `Aria*Props` to `any`
 * (`preserveSymlinks`, see `tsconfig.json`), so `ExternalInstance` alone does
 * not prove that a consumer may pass an instance to a kit input; the
 * consumer-facing fixture in `typecheck/consumer/` (compiled against `dist/`
 * by `pnpm test:types:consumer`) does.
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

declare const modern: FormController;

export function ModernUsesSeparateAPIs() {
  const root = <Form form={modern} />;

  const dialog = (
    <DialogForm form={modern} title="Settings" onSubmit={() => {}}>
      <TextInput name="name" label="Name" />
    </DialogForm>
  );

  // @ts-expect-error the legacy creator cannot adopt a modern controller
  Form.useForm(modern);

  return [root, dialog];
}

test('the modern brand is rejected where a legacy instance is expected', () => {
  expectTypeOf<FormController>().not.toMatchTypeOf<CubeFormInstance<Values>>();
  expectTypeOf(Form.useForm<Values>)
    .returns.items(0)
    .toEqualTypeOf<CubeFormInstance<Values>>();
});
