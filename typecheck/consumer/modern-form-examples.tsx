import {
  Form,
  Switch,
  TextInput,
  useFieldProps,
  wrapWithField,
} from '@cube-dev/ui-kit';
import { useEffect, useRef, useState } from 'react';

import type { FieldBaseProps, FormValues } from '@cube-dev/ui-kit';

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
      <TextInput field={form.field('name')} label="Name" />
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
      <TextInput field={form.field('name')} label="Name" />
      <Switch field={form.field('advanced')} label="Advanced" />
      <Form.Subscribe form={form} selector={(state) => state.values.advanced}>
        {(advanced) =>
          advanced ? (
            <TextInput field={form.field('note')} label="Note" />
          ) : null
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
  const [loadError, setLoadError] = useState<unknown>();
  useEffect(() => {
    const request = new AbortController();
    void load(request.signal)
      .then((profile) => {
        if (!request.signal.aborted) {
          setLoadError(undefined);
          form.adoptDefaultValues(profile, { when: 'untouched' });
        }
      })
      .catch((error: unknown) => {
        if (!request.signal.aborted) setLoadError(error);
      });
    return () => request.abort();
  }, [form, load]);
  return (
    <Form form={form}>
      <TextInput field={form.field('name')} label="Name" />
      {loadError != null && <span role="alert">Unable to load profile</span>}
    </Form>
  );
}

// Keep the control's event/value API explicit; never spread controller props
// onto the DOM. The wrapper supplies the label, description, and error UI.
export function CustomControl(
  input: FieldBaseProps<string | null | undefined> & {
    value?: string | null;
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
        field={form.field('name', {
          deps: [organizationId, check],
          validateTrigger: 'onChange',
          validationDelay: 200,
          validate: async (value, { signal }) => {
            if (!value) return;
            const available = await check(organizationId, value, signal);
            return available ? undefined : 'Name is already in use';
          },
        })}
        label="Name"
        isRequired
      />
      <Form.Submit>Save</Form.Submit>
    </Form>
  );
}

// Quickstart from docs/modern-form-guide.md.
interface NullableProfile {
  email: string | null;
  notifications: boolean | null;
}

export function NullableProfileForm({
  initialNullableProfile,
  save,
}: {
  initialNullableProfile: NullableProfile;
  save: (
    values: FormValues<NullableProfile>,
    signal: AbortSignal,
  ) => Promise<void>;
}) {
  const form = Form.useController<NullableProfile>({
    defaultValues: initialNullableProfile,
  });

  return (
    <Form form={form} onSubmit={(values, { signal }) => save(values, signal)}>
      <TextInput
        name="email"
        rules={[{ type: 'email', message: 'Enter a valid email' }]}
        label="Email"
        isRequired
      />
      <Switch name="notifications" label="Notifications" />
      <Form.SubmitError />
      <Form.Submit>Save</Form.Submit>
      <Form.Reset>Reset</Form.Reset>
    </Form>
  );
}

// Typed leaf reads, including nullable values and context without prop threading.
export function EmailPreview() {
  const form = Form.useControllerContext<NullableProfile>();
  const email = Form.useValue(form, 'email');
  return <output>{email ?? 'No email set'}</output>;
}

export function PasswordConfirmation() {
  const form = Form.useController<{
    password: string;
    confirmation: string;
  }>();
  return (
    <Form form={form}>
      <TextInput
        field={form.field('password')}
        type="password"
        label="Password"
        isRequired
      />
      <TextInput
        field={form.field('confirmation', {
          dependsOn: ['password'],
          validate: (value, { getValue }) => {
            if (!value) return;
            return value === getValue('password')
              ? undefined
              : 'Passwords must match';
          },
        })}
        label="Confirm password"
        type="password"
        isRequired
      />
    </Form>
  );
}
