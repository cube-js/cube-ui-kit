import { Form, NumberInput, Switch, TextInput } from '@cube-dev/ui-kit';

import type { FormController } from '@cube-dev/ui-kit';
import type { ReactNode } from 'react';

interface Profile {
  email: string;
  profile: { name: string };
  enabled: boolean;
  amount: number;
}

export function ModernFieldTypes({ form }: { form: FormController<Profile> }) {
  // @ts-expect-error misspelled literal keys must not silently become dynamic writes
  form.setValue('emali', 123);
  // @ts-expect-error validate the supplied nested path
  form.setValue(['profile', 'naem'], 123);
  // @ts-expect-error immutable snapshots reject nested writes
  form.getValues().profile!.name = 'Grace';
  // @ts-expect-error imperative reads share the same immutable contract
  form.getValue('profile')!.name = 'Grace';

  const field = form.field('email', {
    validate: (value, context) => {
      const text: string | undefined = value;
      const amount: number | undefined = context.getValue('amount');
      // @ts-expect-error validator values are inferred from the model
      const number: number = value;
      // @ts-expect-error validation context checks literal paths
      context.getValue('emali');
      void number;
      void amount;
      return text?.includes('@') ? undefined : 'Invalid email';
    },
  });
  const name: string | undefined = Form.useValue(form, ['profile', 'name']);
  const dirty: boolean | undefined = Form.useFieldState(form, 'email')?.dirty;
  // @ts-expect-error descriptors reject invalid literal paths
  form.field('emali');
  // @ts-expect-error declared validation dependencies check literal paths
  form.field('email', { dependsOn: ['emali'] });
  form.field('email', { dependsOn: [['profile', 'name'], 'enabled'] });
  // @ts-expect-error a text input cannot write a boolean field
  const invalid = <TextInput field={form.field('enabled')} />;
  // @ts-expect-error a numeric input cannot write a string field
  const wrongNumber = <NumberInput field={field} />;
  // @ts-expect-error a toggle cannot write a string field
  const wrongToggle = <Switch field={field} />;

  return (
    <Form
      form={form}
      submitValues="all"
      onSubmitFailed={(failure) => {
        if (failure.status === 'invalid') {
          const message: ReactNode = failure.errors.email?.[0];
          console.log(message);
        } else console.log(failure.error);
      }}
    >
      <TextInput field={field} />
      <TextInput field={form.field(['profile', 'name'])} />
      <NumberInput field={form.field('amount')} />
      <Switch field={form.field('enabled')} />
      <output>
        {name}
        {String(dirty)}
      </output>
      {invalid}
      {wrongNumber}
      {wrongToggle}
    </Form>
  );
}

export function DynamicFields({
  form,
  key,
}: {
  form: FormController<Record<string, string>>;
  key: string;
}) {
  form.setValue(key, 'value');
  return <TextInput field={form.field(key)} />;
}
