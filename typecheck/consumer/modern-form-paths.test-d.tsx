import { Form, TextInput } from '@cube-dev/ui-kit';

import type {
  FormController,
  FormValueAtPath,
  ModernValidationRule,
} from '@cube-dev/ui-kit';

interface Values {
  count: number;
  title: string;
  'user.email': string;
  user?: { email: string | null };
  rows: Array<{ email: string; enabled: boolean }>;
  byName: Record<string, { port: number }>;
  pair: readonly [string, number];
  variant: { value: string } | { value: number };
}

export function TypedCommands({ dynamicName }: { dynamicName: string }) {
  const form = Form.useController<Values>();
  const title: string | undefined = form.getValue('title');
  const nested: string | null | undefined = form.getValue(['user', 'email']);
  const row: string | undefined = form.getValue(['rows', 0, 'email']);
  const numeric: boolean | undefined = form.getValue(['rows', '0', 'enabled']);
  const port: number | undefined = form.getValue([
    'byName',
    dynamicName,
    'port',
  ]);
  const dynamic: unknown = form.getValue(dynamicName);
  const unknownPath: unknown = form.getValue(['unknown', 0]);
  const tuple: string | undefined = form.getValue(['pair', 0]);
  const union: string | number | undefined = form.getValue([
    'variant',
    'value',
  ]);
  form.setValue('count', 1);
  form.setValue('count', undefined);
  form.setValue('user.email', 'literal');
  form.setValue(['user', 'email'], null);
  form.setValue(['rows', 0, 'enabled'], true);
  form.setValue(['byName', dynamicName, 'port'], 5432);
  form.setValue(dynamicName, { dynamic: 'values stay supported' });
  const runtimePath: readonly (string | number)[] = ['rows', 0, 'email'];
  form.setValue(runtimePath, 'dynamic tuple');
  form.setValue(['pair', 1], 2);
  // @ts-expect-error fixed tuples preserve the type at each index
  form.setValue(['pair', 0], 2);
  // @ts-expect-error known static keys reject the wrong value type
  form.setValue('count', 'wrong');
  // @ts-expect-error literal dotted keys remain literal, not nested
  form.setValue('user.email', null);
  // @ts-expect-error array leaf values are checked
  form.setValue(['rows', 0, 'enabled'], 'wrong');
  // @ts-expect-error optional parents do not erase leaf types
  form.setValue(['user', 'email'], 123);
  // @ts-expect-error map values keep their property types
  form.setValue(['byName', dynamicName, 'port'], 'wrong');
  // @ts-expect-error known array leaves are not numbers
  const wrongRead: number = form.getValue(['rows', 0, 'email']);
  const rule: ModernValidationRule = {
    validator: (_rule, value, { signal }) =>
      signal.aborted ? undefined : value ? undefined : (
        <strong>Required</strong>
      ),
  };
  return (
    <Form form={form}>
      <TextInput name="title" rules={[rule]} />
      <Form.Submit form={form}>Save</Form.Submit>
      <Form.Reset form={form}>Reset</Form.Reset>
      {[
        title,
        nested,
        row,
        numeric,
        port,
        dynamic,
        unknownPath,
        wrongRead,
        tuple,
        union,
      ]
        .map(String)
        .join()}
    </Form>
  );
}

// The standalone controller annotation retains command types and literal paths.
export function AnnotatedController(form: FormController<Values>) {
  const value: FormValueAtPath<Values, readonly ['rows', 0, 'email']> = 'email';
  form.setValue(['rows', 0, 'email'], value);
}
