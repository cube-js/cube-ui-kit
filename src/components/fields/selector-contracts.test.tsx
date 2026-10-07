import { renderWithRoot, screen } from '../../test';

import { Checkbox } from './Checkbox/Checkbox';
import { FilterPicker } from './FilterPicker/FilterPicker';
import { Picker } from './Picker/Picker';
import { Switch } from './Switch/Switch';

describe('field selectors identify the interactive control', () => {
  describe.each([
    ['Checkbox', Checkbox, 'checkbox'],
    ['Switch', Switch, 'switch'],
  ] as const)('%s', (name, Component, role) => {
    it.each([undefined, 'custom-control'])(
      'keeps qa=%s only on the input',
      (qa) => {
        const { container } = renderWithRoot(
          <Component aria-label="Enable notifications" qa={qa} />,
        );
        const input = screen.getByRole(role, { name: 'Enable notifications' });

        expect(screen.getAllByTestId(qa ?? name)).toEqual([input]);
        expect(
          container.querySelector('[data-element="Input"]'),
        ).not.toHaveAttribute('data-qa');
      },
    );
  });

  it.each([
    ['Picker', Picker],
    ['FilterPicker', FilterPicker],
  ] as const)('%s names only its trigger with aria-label', (_, Component) => {
    const { container } = renderWithRoot(
      <Component aria-label="Choose fruit" className="picker-wrapper">
        <Component.Item key="apple">Apple</Component.Item>
      </Component>,
    );
    const trigger = screen.getByRole('button', { name: 'Choose fruit' });

    expect(
      container.querySelectorAll('[aria-label="Choose fruit"]'),
    ).toHaveLength(1);
    expect(trigger).toHaveAttribute('aria-label', 'Choose fruit');
    expect(container.querySelector('.picker-wrapper')).not.toHaveAttribute(
      'aria-label',
    );
  });
});
