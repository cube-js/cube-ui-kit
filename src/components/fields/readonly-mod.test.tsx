import { parseDate, parseTime } from '@internationalized/date';

import {
  Checkbox,
  ColorInput,
  ComboBox,
  CommandTextArea,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateRangeSeparatedPicker,
  Form,
  NumberInput,
  PasswordInput,
  PeriodPicker,
  Radio,
  SearchComboBox,
  SearchInput,
  Switch,
  TagInput,
  TextArea,
  TextInput,
  TimeInput,
} from '../../index';
import { hoverWithPointer, renderWithRoot, screen } from '../../test';

import type { ReactElement } from 'react';

vi.mock('../../_internal/hooks/use-warn');

type Props = { isReadOnly?: boolean };

/**
 * Every field that draws the shared input box. `isReadOnly` has to reach the
 * box as the `readonly` mod, so its default look and a theme's `readonly` key
 * both apply.
 */
const BOXED_FIELDS: [string, (props: Props) => ReactElement][] = [
  ['TextInput', (p) => <TextInput label="Field" defaultValue="a" {...p} />],
  ['TextArea', (p) => <TextArea label="Field" defaultValue="a" {...p} />],
  [
    'PasswordInput',
    (p) => <PasswordInput label="Field" defaultValue="a" {...p} />,
  ],
  ['SearchInput', (p) => <SearchInput label="Field" defaultValue="a" {...p} />],
  ['NumberInput', (p) => <NumberInput label="Field" defaultValue={1} {...p} />],
  [
    'CommandTextArea',
    (p) => <CommandTextArea label="Field" defaultValue="a" {...p} />,
  ],
  ['ColorInput', (p) => <ColorInput label="Field" {...p} />],
  [
    'TagInput',
    (p) => (
      <TagInput label="Field" defaultValue={['a']} {...p}>
        <TagInput.Item key="a">A</TagInput.Item>
      </TagInput>
    ),
  ],
  [
    'ComboBox',
    (p) => (
      <ComboBox label="Field" {...p}>
        <ComboBox.Item key="a">A</ComboBox.Item>
      </ComboBox>
    ),
  ],
  [
    'SearchComboBox',
    (p) => (
      <SearchComboBox label="Field" {...p}>
        <SearchComboBox.Item key="a">A</SearchComboBox.Item>
      </SearchComboBox>
    ),
  ],
  [
    'DateInput',
    (p) => (
      <DateInput label="Field" defaultValue={parseDate('2026-01-01')} {...p} />
    ),
  ],
  [
    'TimeInput',
    (p) => <TimeInput label="Field" defaultValue={parseTime('10:00')} {...p} />,
  ],
  [
    'DatePicker',
    (p) => (
      <DatePicker label="Field" defaultValue={parseDate('2026-01-01')} {...p} />
    ),
  ],
  ['DateRangePicker', (p) => <DateRangePicker label="Field" {...p} />],
  [
    'DateRangeSeparatedPicker',
    (p) => <DateRangeSeparatedPicker label="Field" {...p} />,
  ],
  ['PeriodPicker', (p) => <PeriodPicker label="Field" {...p} />],
];

describe('readonly mod', () => {
  describe.each(BOXED_FIELDS)('<%s />', (_, render) => {
    it('marks its box read-only', () => {
      const { container } = renderWithRoot(render({ isReadOnly: true }));

      const boxes = container.querySelectorAll('[data-readonly]');

      expect(boxes.length).toBeGreaterThan(0);
    });

    it('leaves an editable box unmarked', () => {
      const { container } = renderWithRoot(render({}));

      expect(container.querySelector('[data-readonly]')).toBeNull();
    });
  });

  // Only `TextInputBase` tracks hover in mods; the other boxes hover in CSS.
  it.each([
    ['editable', false],
    ['read-only', true],
  ])('a %s text field shows hover only when it can change', async (_, ro) => {
    renderWithRoot(<TextInput label="Field" isReadOnly={ro} />);

    const input = screen.getByRole('textbox');
    const box = screen.getByTestId('InputWrapper');

    await hoverWithPointer(input);

    expect(box.hasAttribute('data-hovered')).toBe(!ro);
    expect(input.hasAttribute('data-hovered')).toBe(!ro);
  });

  describe.each([
    [
      'standalone',
      (p: Props) => (
        <Checkbox {...p} defaultSelected>
          Email
        </Checkbox>
      ),
    ],
    [
      'grouped',
      (p: Props) => (
        <Checkbox.Group label="Contact" defaultValue={['email']} {...p}>
          <Checkbox value="email">Email</Checkbox>
        </Checkbox.Group>
      ),
    ],
  ])('<Checkbox /> %s', (_, render) => {
    it('marks the wrapper and the box read-only, without hover', async () => {
      renderWithRoot(render({ isReadOnly: true }));

      const wrapper = screen.getByTestId('CheckboxWrapper');
      const box = wrapper.querySelector('[data-element="Input"]');

      expect(wrapper).toHaveAttribute('data-readonly');
      expect(box).toHaveAttribute('data-readonly');

      await hoverWithPointer(wrapper);

      expect(wrapper).not.toHaveAttribute('data-hovered');
      expect(box).not.toHaveAttribute('data-hovered');
    });

    it('leaves an editable checkbox unmarked', () => {
      renderWithRoot(render({}));

      expect(screen.getByTestId('CheckboxWrapper')).not.toHaveAttribute(
        'data-readonly',
      );
    });
  });

  it.each([
    ['editable', false],
    ['read-only', true],
  ])('a %s switch carries the mod and hover to match', async (_, ro) => {
    renderWithRoot(<Switch isReadOnly={ro}>Wifi</Switch>);

    const wrapper = screen.getByTestId('SwitchWrapper');
    const track = wrapper.querySelector('[data-element="Input"]');

    expect(track!.hasAttribute('data-readonly')).toBe(ro);

    await hoverWithPointer(wrapper);

    expect(track!.hasAttribute('data-hovered')).toBe(!ro);
  });

  describe.each([
    ['radio', 'RadioWrapper'],
    ['button', 'RadioButton'],
  ] as const)('<Radio type="%s" />', (type, wrapperQa) => {
    function renderGroup(props: Props) {
      return renderWithRoot(
        <Radio.Group label="Plan" type={type} defaultValue="a" {...props}>
          <Radio value="a">A</Radio>
          <Radio value="b">B</Radio>
        </Radio.Group>,
      );
    }

    it('takes read-only from its group, without hover', async () => {
      renderGroup({ isReadOnly: true });

      const [, other] = screen.getAllByTestId(wrapperQa);

      for (const radio of screen.getAllByRole('radio')) {
        expect(radio).toHaveAttribute('data-readonly');
      }

      expect(other).toHaveAttribute('data-readonly');

      await hoverWithPointer(other);

      expect(other).not.toHaveAttribute('data-hovered');
    });

    it('leaves an editable radio unmarked', () => {
      renderGroup({});

      for (const wrapper of screen.getAllByTestId(wrapperQa)) {
        expect(wrapper).not.toHaveAttribute('data-readonly');
      }
    });
  });

  it('follows a read-only Form into every field', () => {
    renderWithRoot(
      <Form isReadOnly>
        <TextInput label="Name" name="name" />
        <Checkbox name="agree">Agree</Checkbox>
        <Switch name="wifi">Wifi</Switch>
        <Radio.Group label="Plan" name="plan">
          <Radio value="a">A</Radio>
        </Radio.Group>
      </Form>,
    );

    expect(screen.getByTestId('InputWrapper')).toHaveAttribute('data-readonly');
    expect(screen.getByTestId('CheckboxWrapper')).toHaveAttribute(
      'data-readonly',
    );
    expect(screen.getByTestId('SwitchWrapper')).toHaveAttribute(
      'data-readonly',
    );
    expect(screen.getByTestId('RadioWrapper')).toHaveAttribute('data-readonly');
  });
});
