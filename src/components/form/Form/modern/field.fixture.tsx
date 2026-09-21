import { TextInput } from '../../../fields/TextInput/TextInput';
import { Form } from '../index';

import { useFormValue } from './react';

import type { FormController, ModernValidationRule } from './controller';

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

/** Tuple-name binding must also work when a consumer is compiled. */
export function TupleNameFixture({
  form,
  index = 0,
  preserve = true,
  validator,
}: {
  form: FormController<{ rows: { email: string | null }[] }>;
  index?: number;
  preserve?: boolean;
  validator?: ModernValidationRule['validator'];
}) {
  return (
    <Form form={form}>
      <TextInput
        name={['rows', index, 'email']}
        label="Email"
        isRequired
        preserve={preserve}
        deps={[validator]}
        rules={validator ? [{ validator }] : undefined}
      />
      <Form.Submit>Save</Form.Submit>
      <Form.Reset>Reset</Form.Reset>
    </Form>
  );
}
