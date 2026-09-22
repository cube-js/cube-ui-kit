import {
  Button,
  Checkbox,
  DialogForm,
  DialogTrigger,
  Form,
  Root,
  Select,
  TextInput,
} from '@cube-dev/ui-kit';
import { useState } from 'react';

import type { ModernFormProps } from '@cube-dev/ui-kit';

type Values = { profile: { name: string | null }; enabled: boolean };
type Submit = ModernFormProps<Values>['onSubmit'];

export function ModernConsumer({ onSubmit }: { onSubmit: Submit }) {
  const form = Form.useController<Values>({
    defaultValues: { profile: { name: null }, enabled: false },
  });
  return (
    <Root>
      <Form form={form} onSubmit={onSubmit}>
        <TextInput name={['profile', 'name']} label="Name" isRequired />
        <Checkbox name="enabled">Enabled</Checkbox>
        <Form.Subscribe
          form={form}
          selector={(state) => state.values.profile?.name}
        >
          {(name) => <output>{name || 'Empty'}</output>}
        </Form.Subscribe>
        <Form.Submit>Save</Form.Submit>
        <Form.Reset>Reset</Form.Reset>
        <Form.SubmitError />
      </Form>
    </Root>
  );
}

export function LegacyConsumer({
  onSubmit,
}: {
  onSubmit: (values: unknown) => void;
}) {
  'use no memo';
  // Mutable legacy reads in application code still need an opt-out.
  const [form] = Form.useForm();
  return (
    <Root>
      <Form form={form} defaultValues={{ name: 'Initial' }} onSubmit={onSubmit}>
        <TextInput name="name" label="Name" />
        <output>{form.getFieldValue('name')}</output>
        <Button onPress={() => form.setFieldValue('name', 'Programmatic')}>
          Set name
        </Button>
        <Form.Submit>Save</Form.Submit>
        <Form.Reset>Reset</Form.Reset>
      </Form>
    </Root>
  );
}

export function ImplicitConsumer({
  onSubmit,
  empty = false,
}: {
  onSubmit: (values: unknown) => void;
  empty?: boolean;
}) {
  return (
    <Root>
      <Form onSubmit={onSubmit}>
        {!empty && <TextInput name="name" label="Name" />}
        <Form.Submit>Save</Form.Submit>
      </Form>
    </Root>
  );
}

export function DialogConsumer({ onSubmit }: { onSubmit: Submit }) {
  const form = Form.useController<Values>({
    defaultValues: { profile: { name: 'Initial' }, enabled: false },
  });
  return (
    <Root>
      <DialogTrigger type="popover">
        <Button>Open</Button>
        <DialogForm
          form={form}
          title="Edit profile"
          submitProps={{ label: 'Save' }}
          onSubmit={onSubmit}
        >
          <TextInput name={['profile', 'name']} label="Name" />
          <Form.SubmitError />
        </DialogForm>
      </DialogTrigger>
    </Root>
  );
}

export function ControlledConsumer({ prefix }: { prefix: string }) {
  const [value, setValue] = useState<string | number | null>('a');
  return (
    <Root>
      <Select label="Choice" value={value} onChange={setValue}>
        <Select.Item key="a">Alpha</Select.Item>
        <Select.Item key="b">Beta</Select.Item>
      </Select>
      <output>
        {prefix}: {value}
      </output>
    </Root>
  );
}
