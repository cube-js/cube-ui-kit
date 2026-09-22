import { DialogForm, Form, TextInput } from '@cube-dev/ui-kit';

import type {
  CubeDialogFormProps,
  FormValues,
  ModernDialogFormProps,
} from '@cube-dev/ui-kit';

interface Profile {
  email: string | null;
  user: { name: string };
}

export function ModernDialogConsumer() {
  const form = Form.useController<Profile>({
    defaultValues: { email: null, user: { name: '' } },
  });
  const props: ModernDialogFormProps<Profile> = {
    form,
    title: 'Profile',
    submitValues: 'all',
    submitProps: { label: 'Save', disableOnInvalid: true },
    onSubmit(values, { signal }) {
      const email: string | null | undefined = values.email;
      const name: string | undefined = values.user?.name;
      const abort: AbortSignal = signal;
      // @ts-expect-error submissions remain readonly
      values.email = email;
      void [name, abort];
    },
    onSubmitFailed(failure) {
      if (failure.status === 'failed') {
        const error: unknown = failure.error;
        void error;
      } else {
        const errors = failure.errors;
        void errors;
      }
    },
  };
  const root = (
    <DialogForm
      form={form}
      onSubmit={(values, context) => {
        const value: FormValues<Profile> = values;
        const signal: AbortSignal = context.signal;
        // @ts-expect-error callback data is inferred, not any
        const invalid: number = values.email;
        void [value, signal, invalid];
      }}
      onValuesChange={(values, change) => {
        const email: string | null | undefined = values.email;
        const source: 'user' | 'program' = change.source;
        void [email, source];
      }}
      onReset={(event) => event.preventDefault()}
    />
  );
  // @ts-expect-error modern defaults belong on the creator
  const defaults = <DialogForm form={form} defaultValues={{ email: '' }} />;
  // @ts-expect-error legacy prop bags cannot accept a modern controller
  const legacyProps: CubeDialogFormProps<Profile> = { form };
  return (
    <>
      <DialogForm {...props} noActions>
        {(dismiss) => (
          <>
            <TextInput name={['user', 'name']} label="Name" />
            <TextInput field={form.field('email')} label="Email" />
            <Form.Submit>Save</Form.Submit>
            <button type="button" onClick={dismiss}>
              Cancel
            </button>
          </>
        )}
      </DialogForm>
      {root}
      {defaults}
      {String(legacyProps)}
    </>
  );
}

export function LegacyDialogConsumer() {
  const [form] = Form.useForm<{ email: string }>();
  return (
    <DialogForm
      form={form}
      defaultValues={{ email: '' }}
      onSubmit={(values) => {
        const email: string | undefined = values.email;
        // @ts-expect-error legacy inline inference is preserved
        const invalid: number = values.email;
        void [email, invalid];
      }}
    >
      <TextInput name="email" label="Email" rules={[{ required: true }]} />
    </DialogForm>
  );
}
