import { renderWithRoot, screen } from '../../test';

import { FilterPicker } from './FilterPicker';
import { Picker } from './Picker';
import { Select } from './Select';

/**
 * `isClearable`'s built-in ✕ is an icon-only `ItemAction`, and `ItemAction`
 * derives its accessible name from exactly two sources: `aria-label`, or a
 * string `tooltip`. All three trigger fields passed neither, so the button
 * reached a screen reader unnamed — and unlike `Button`, `ItemAction` does not
 * even warn about it, which is why this went unnoticed long enough for a
 * consumer to re-implement the whole affordance just to put a name on it.
 */
describe.each([
  ['Select', Select, 'SelectClearButton'],
  ['Picker', Picker, 'PickerClearButton'],
  ['FilterPicker', FilterPicker, 'FilterPickerClearButton'],
] as const)('<%s /> clear button', (name, Component, qa) => {
  const Field = Component as any;

  it('has a localized default accessible name', () => {
    renderWithRoot(
      <Field aria-label={name} isClearable selectedKey="a">
        <Field.Item key="a">A</Field.Item>
      </Field>,
    );

    expect(screen.getByTestId(qa)).toHaveAttribute('aria-label', 'Clear value');
    expect(
      screen.getByRole('button', { name: 'Clear value' }),
    ).toBeInTheDocument();
  });

  it('lets the call site override the name with clearLabel', () => {
    renderWithRoot(
      <Field
        aria-label={name}
        isClearable
        clearLabel="Reset region"
        selectedKey="a"
      >
        <Field.Item key="a">A</Field.Item>
      </Field>,
    );

    expect(screen.getByTestId(qa)).toHaveAttribute(
      'aria-label',
      'Reset region',
    );
  });
});
