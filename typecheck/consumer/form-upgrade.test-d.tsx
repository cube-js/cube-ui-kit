import { Form, TextInput } from '@cube-dev/ui-kit';

import type { ValidationRule } from '@cube-dev/ui-kit';

// Existing Cloud forms pass inline one-argument callbacks without annotations.
export function LegacyUpgrade() {
  const [form] = Form.useForm<{ email: string }>();
  const legacyRules = [
    {
      validator: (_rule: ValidationRule, value: string) =>
        Promise.resolve(value),
    },
  ];
  const legacyNestedRules = [
    [
      {
        validator: (_rule: ValidationRule, value: string) =>
          Promise.resolve({ query: value }),
      },
    ],
  ];
  return (
    <>
      <Form
        onSubmit={(values) => {
          console.log(values);
        }}
        onSubmitFailed={(error) => {
          console.log(error);
        }}
      />
      <Form
        form={form}
        onSubmit={(values) => {
          const email: string = values.email;
          // @ts-expect-error legacy callback inference must not degrade to any
          const wrong: number = values.email;
          console.log(email, wrong);
        }}
        onSubmitFailed={(error) => {
          console.log(error);
        }}
      >
        <TextInput name="email" rules={legacyRules} />
        <TextInput name="query" rules={legacyNestedRules} />
      </Form>
    </>
  );
}

export function ModernCallbacks() {
  const form = Form.useController<{ email: string }>();
  return (
    <Form
      form={form}
      onSubmit={(values, context) => {
        const email: string | undefined = values.email;
        const signal: AbortSignal = context.signal;
        // @ts-expect-error modern callback values remain typed
        const wrong: number = values.email;
        console.log(email, signal, wrong);
      }}
    >
      <TextInput
        name="email"
        rules={[
          {
            validator: (_rule, value, context) => {
              const signal: AbortSignal = context.signal;
              // @ts-expect-error inline input rules keep typed validation context
              const wrong: string = context.signal;
              return signal.aborted || value ? undefined : wrong;
            },
          },
        ]}
      />
    </Form>
  );
}
