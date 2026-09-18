import { TextInput } from '../../../fields/TextInput/TextInput';

import { useFormValue } from './react';

import type { FormController } from './controller';

/** Run this consumer through the same compiler gate as the submission fixture. */
export function FieldFixture({
  form,
  organization,
  validate,
}: {
  form: FormController<{ name: string }>;
  organization: string;
  validate: (
    value: string | undefined,
    organization: string,
  ) => string | undefined;
}) {
  const value = useFormValue(form, 'name');
  return (
    <>
      <TextInput
        field={form.field('name', {
          deps: [organization],
          validate: (value) => validate(value, organization),
        })}
        label="Name"
      />
      <output>{value}</output>
    </>
  );
}
