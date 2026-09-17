import {
  Form,
  Switch,
  TextInput,
  useFieldProps,
  wrapWithField,
} from '@cube-dev/ui-kit';
import { useEffect, useRef } from 'react';

import type { FieldBaseProps } from '@cube-dev/ui-kit';

interface Profile {
  name: string;
  advanced: boolean;
  note: string;
}

// A selector in the creator is supported, but subscribes the whole component.
export function ColocatedSelection() {
  const form = Form.useController<Profile>();
  const dirty = Form.useSelector(form, (state) => state.isDirty);
  return (
    <Form form={form}>
      <TextInput name="name" label="Name" />
      <span>{dirty ? 'Unsaved' : 'Saved'}</span>
    </Form>
  );
}

// Put subscriptions in leaves when the creator should not render on edits.
function DirtyStatus() {
  const form = Form.useControllerContext<Profile>();
  const dirty = Form.useSelector(form, (state) => state.isDirty);
  return <span>{dirty ? 'Unsaved' : 'Saved'}</span>;
}

export function ConditionalProfile() {
  const form = Form.useController<Profile>({
    defaultValues: { name: '', advanced: false, note: 'Retained draft' },
  });
  return (
    <Form
      form={form}
      onSubmit={async (active) => {
        console.log(active);
      }}
    >
      <TextInput name="name" label="Name" />
      <Switch name="advanced" label="Advanced" />
      <Form.Subscribe form={form} selector={(state) => state.values.advanced}>
        {(advanced) =>
          advanced ? <TextInput name="note" label="Note" /> : null
        }
      </Form.Subscribe>
      <DirtyStatus />
      <Form.Subscribe form={form} selector={(state) => state.activeValues}>
        {(active) => <output>{JSON.stringify(active)}</output>}
      </Form.Subscribe>
      <Form.Submit>Save active fields</Form.Submit>
      <Form.Reset>Reset</Form.Reset>
    </Form>
  );
}

export function AsyncDefaults({
  load,
}: {
  load: (signal: AbortSignal) => Promise<Profile>;
}) {
  const form = Form.useController<Profile>();
  useEffect(() => {
    const request = new AbortController();
    void load(request.signal)
      .then((profile) => {
        if (!request.signal.aborted)
          form.adoptDefaultValues(profile, { when: 'untouched' });
      })
      .catch((error: unknown) => {
        if (!request.signal.aborted) form.setSubmitError(error);
      });
    return () => request.abort();
  }, [form, load]);
  return (
    <Form form={form}>
      <TextInput name="name" label="Name" />
      <Form.SubmitError />
    </Form>
  );
}

// Keep the control's event/value API explicit; never spread controller props
// onto the DOM. The wrapper supplies the label, description, and error UI.
export function CustomControl(
  input: FieldBaseProps & {
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
  },
) {
  const props = useFieldProps(input, {
    valuePropsMapper: ({ value, onChange }) => ({
      value: value ?? '',
      onChange,
    }),
  });
  const ref = useRef<HTMLInputElement>(null);
  return wrapWithField(
    <input
      ref={ref}
      id={props.id}
      value={props.value ?? ''}
      onChange={(event) => props.onChange?.(event.target.value)}
      onBlur={props.onBlur}
      aria-invalid={props.isInvalid}
      disabled={props.isDisabled}
      readOnly={props.isReadOnly}
    />,
    ref,
    props,
  );
}

export function RemoteValidation({
  organizationId,
  check,
}: {
  organizationId: string;
  check: (
    organizationId: string,
    name: string,
    signal: AbortSignal,
  ) => Promise<boolean>;
}) {
  const form = Form.useController<{ name: string }>();
  return (
    <Form form={form}>
      <CustomControl
        name="name"
        label="Name"
        validateTrigger="onChange"
        validationDelay={200}
        rulesKey={organizationId}
        rules={[
          {
            validator: async (_rule, value, { signal }) => {
              const available = await check(
                organizationId,
                String(value ?? ''),
                signal,
              );
              return available ? undefined : 'Name is already in use';
            },
          },
        ]}
      />
      <Form.Submit>Save</Form.Submit>
    </Form>
  );
}
