import { TextInput } from '../../../fields/TextInput/TextInput';
import { Form } from '../index';

import type { FormController } from './controller';
import type { FormCallbacks } from './types';

/** Shared by uncompiled and compiler-enabled runs; compiled config verifies output. */
export function SubmissionFixture({
  form,
  onSubmit,
  onValuesChange,
  required = false,
}: {
  form: FormController<{ value: string }>;
  onSubmit?: FormCallbacks<{ value: string }>['onSubmit'];
  onValuesChange?: FormCallbacks<{ value: string }>['onValuesChange'];
  required?: boolean;
}) {
  return (
    <Form form={form} onSubmit={onSubmit} onValuesChange={onValuesChange}>
      <TextInput name="value" label="Value" isRequired={required} />
      <Form.Submit>Save</Form.Submit>
      <Form.Reset>Reset</Form.Reset>
      <Form.SubmitError />
      <Form.Subscribe form={form} selector={(state) => state.values.value}>
        {(value) => <output data-qa="value">{value}</output>}
      </Form.Subscribe>
    </Form>
  );
}
