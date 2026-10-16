import { ReactElement } from 'react';

import { act, renderWithRoot, screen, userEvent } from '../../../test/index';
import { Checkbox } from '../../fields/Checkbox/Checkbox';
import { Switch } from '../../fields/Switch/Switch';

import { Form, useForm } from './index';

vi.mock('../../../_internal/hooks/use-warn');

/**
 * A bound toggle maps the field's boolean to `isSelected`. The raw value used
 * to be merged over the props as well, so `value="yes"` rendered — and a
 * native submission or `FormData` read — `true`/`false` once the field had one.
 */
describe.each([
  [
    'Checkbox',
    'checkbox',
    <Checkbox name="terms" value="yes" aria-label="Terms" />,
  ],
  ['Switch', 'switch', <Switch name="terms" value="yes" aria-label="Terms" />],
] as [string, string, ReactElement][])('a form-bound %s', (_, role, toggle) => {
  function LegacyForm() {
    const [form] = useForm();

    return (
      <Form form={form} defaultValues={{ terms: false }}>
        {toggle}
      </Form>
    );
  }

  function ModernForm() {
    const form = Form.useController({ defaultValues: { terms: false } });

    return <Form form={form}>{toggle}</Form>;
  }

  it.each([
    ['legacy', LegacyForm],
    ['modern', ModernForm],
  ])('keeps its own value attribute in a %s form', async (_, Wrapper) => {
    renderWithRoot(<Wrapper />);

    const input = screen.getByRole(role) as HTMLInputElement;

    expect(input).toHaveAttribute('value', 'yes');

    await act(async () => {
      await userEvent.click(input);
    });

    expect(input).toBeChecked();
    expect(input).toHaveAttribute('value', 'yes');
    expect(new FormData(input.form!).get('terms')).toBe('yes');
  });
});
