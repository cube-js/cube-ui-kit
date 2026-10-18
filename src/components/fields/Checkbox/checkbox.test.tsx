import userEvent from '@testing-library/user-event';

import {
  act,
  hoverWithPointer,
  render,
  renderWithForm,
  renderWithRoot,
  screen,
} from '../../../test';
import { Field } from '../../form';
import { warnAboutLegacyTooltip } from '../../form/legacy-tooltip';

import { Checkbox } from './Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

vi.mock('../../form/legacy-tooltip', { spy: true });

vi.mock('../../../_internal/hooks/use-warn');

describe('<Checkbox />', () => {
  it.each([
    ['checked', { isSelected: true }],
    ['indeterminate', { isIndeterminate: true }],
  ])('hides the %s mark from screen readers', (_, props) => {
    const { container } = render(<Checkbox label="Accept" {...props} />);
    const marks = container.querySelectorAll('svg');

    // The input's own state is what a screen reader says; an exposed `<svg>`
    // is read out as an unnamed graphic.
    expect(marks.length).toBeGreaterThan(0);
    for (const svg of Array.from(marks)) {
      expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('should work without form', async () => {
    const { getByRole } = render(<Checkbox>Test</Checkbox>);
    const checkboxElement = getByRole('checkbox');

    await act(async () => await userEvent.click(checkboxElement));

    expect(checkboxElement).toBeChecked();
  });

  it('should interop with <Form />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Checkbox name="test">Test</Checkbox>,
    );

    const checkboxElement = getByRole('checkbox');

    await act(async () => await userEvent.click(checkboxElement));

    expect(checkboxElement).toBeChecked();
    expect(formInstance.getFieldValue('test')).toBe(true);
  });

  it('should interop with legacy <Field />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test">
        <Checkbox>Test</Checkbox>
      </Field>,
    );

    const checkboxElement = getByRole('checkbox');

    await act(async () => await userEvent.click(checkboxElement));

    expect(checkboxElement).toBeChecked();
    expect(formInstance.getFieldValue('test')).toBe(true);
  });
});

describe('<Checkbox /> wrapper', () => {
  function renderChecked(isGrouped: boolean) {
    return renderWithRoot(
      isGrouped ? (
        <CheckboxGroup aria-label="Notifications" defaultValue={['email']}>
          <Checkbox value="email">Email</Checkbox>
        </CheckboxGroup>
      ) : (
        <Checkbox defaultSelected>Email</Checkbox>
      ),
    );
  }

  // `styles` and `inputStyles` keyed on a state only work where the state is.
  it.each([
    ['standalone', false],
    ['grouped', true],
  ])(
    'carries the state mods of a %s checkbox, hover included',
    async (_, isGrouped) => {
      renderChecked(isGrouped);

      const wrapper = screen.getByTestId('CheckboxWrapper');
      const box = wrapper.querySelector('[data-element="Input"]');

      expect(wrapper).toHaveAttribute('data-checked');
      expect(wrapper).not.toHaveAttribute('data-hovered');

      await hoverWithPointer(wrapper);

      expect(wrapper).toHaveAttribute('data-hovered');
      expect(box).toHaveAttribute('data-hovered');
    },
  );

  it.each([
    ['standalone', false],
    ['grouped', true],
  ])('takes the base props of a %s checkbox', (_, isGrouped) => {
    const checkbox = (
      <Checkbox
        value="email"
        className="channel"
        style={{ marginTop: 7 }}
        qaVal="email"
        mods={{ pinned: true }}
      >
        Email
      </Checkbox>
    );

    render(
      isGrouped ? (
        <CheckboxGroup aria-label="Notifications">{checkbox}</CheckboxGroup>
      ) : (
        checkbox
      ),
    );

    const wrapper = screen.getByTestId('CheckboxWrapper');

    expect(wrapper).toHaveClass('channel');
    expect(wrapper).toHaveStyle({ marginTop: '7px' });
    expect(wrapper).toHaveAttribute('data-qaval', 'email');
    expect(wrapper).toHaveAttribute('data-pinned');
  });

  it('leaves the id and ARIA props of a grouped checkbox on its input', () => {
    render(
      <CheckboxGroup aria-label="Notifications">
        <Checkbox
          value="email"
          id="email"
          aria-label="Email updates"
          aria-describedby="email-note"
          data-kind="channel"
        >
          Email
        </Checkbox>
      </CheckboxGroup>,
    );

    const input = screen.getByRole('checkbox', { name: 'Email updates' });

    const carriers = (selector: string) =>
      Array.from(document.querySelectorAll(selector));

    expect(document.getElementById('email')).toBe(input);
    expect(carriers('[aria-label="Email updates"]')).toEqual([input]);
    expect(carriers('[aria-describedby]')).toEqual([input]);
    expect(carriers('[data-kind]')).toEqual([input]);
  });
});

describe('<Checkbox /> name', () => {
  it('joins a field label and the inline text', () => {
    render(<Checkbox label="Notifications">Send me emails</Checkbox>);

    expect(
      screen.getByRole('checkbox', { name: 'Notifications Send me emails' }),
    ).toBeInTheDocument();
  });

  it('keeps the caller’s aria-label over a field label', () => {
    render(
      <Checkbox label="Notifications" aria-label="Email notifications">
        Send me emails
      </Checkbox>,
    );

    expect(
      screen.getByRole('checkbox', { name: 'Email notifications' }),
    ).toBeInTheDocument();
  });

  // Without the inline text, the field `<label for>` is the only name, so it
  // must point at the input whoever owns the id.
  it.each([
    ['its generated id', <Checkbox label="Accept terms" />],
    ['the caller’s id', <Checkbox id="terms" label="Accept terms" />],
  ])('is named by a field label through %s', (_, checkbox) => {
    render(checkbox);

    expect(
      screen.getByRole('checkbox', { name: 'Accept terms' }),
    ).toBeInTheDocument();
  });

  it('is named by a legacy Field label', () => {
    renderWithForm(
      <Field name="terms" label="Accept terms">
        <Checkbox />
      </Field>,
    );

    expect(
      screen.getByRole('checkbox', { name: 'Accept terms' }),
    ).toBeInTheDocument();
  });

  // A string label used to be copied into `aria-label`; a node one never was,
  // so it made React Aria warn.
  it('is named by a field label alone without warning about it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      render(<Checkbox label={<b>Wifi</b>} />);

      expect(
        screen.getByRole('checkbox', { name: 'Wifi' }),
      ).toBeInTheDocument();
      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('must specify an aria-label'),
      );
    } finally {
      warn.mockRestore();
    }
  });
});

describe('<Checkbox /> tooltip', () => {
  function wrapperOf(text: string) {
    return screen.getByText(text).closest('label') as HTMLElement;
  }

  it.each([
    ['standalone', false],
    ['disabled', true],
  ])('shows a %s checkbox tooltip', async (_, isDisabled) => {
    renderWithRoot(
      <Checkbox isDisabled={isDisabled} tooltip="Sent weekly">
        Subscribe
      </Checkbox>,
    );

    await hoverWithPointer(wrapperOf('Subscribe'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Sent weekly');
  });

  it.each([
    ['grouped', false],
    ['grouped, disabled', true],
  ])('shows a %s checkbox tooltip', async (_, isDisabled) => {
    renderWithRoot(
      <CheckboxGroup aria-label="Notifications">
        <Checkbox value="email" isDisabled={isDisabled} tooltip="Sent weekly">
          Email
        </Checkbox>
      </CheckboxGroup>,
    );

    await hoverWithPointer(wrapperOf('Email'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Sent weekly');
  });

  it.each([
    ['standalone', false],
    ['grouped', true],
  ])(
    'opens a %s checkbox tooltip on keyboard focus and describes the input',
    async (_, isGrouped) => {
      const checkbox = (
        <Checkbox value="email" tooltip="Sent weekly">
          Email
        </Checkbox>
      );

      renderWithRoot(
        isGrouped ? (
          <CheckboxGroup aria-label="Notifications">{checkbox}</CheckboxGroup>
        ) : (
          checkbox
        ),
      );

      await userEvent.tab();

      const input = screen.getByRole('checkbox');

      expect(input).toHaveFocus();

      const tooltip = await screen.findByRole('tooltip');

      expect(tooltip).toHaveTextContent('Sent weekly');
      expect(input).toHaveAttribute('aria-describedby', tooltip.id);
    },
  );

  it('keeps it apart from the field label badge', async () => {
    renderWithRoot(
      <Checkbox
        label="Newsletter"
        labelTooltip="About the newsletter"
        tooltip={{ title: 'Sent weekly' }}
      >
        Subscribe
      </Checkbox>,
    );

    // `tooltip` is a checkbox prop, not the legacy spelling of `labelTooltip`.
    expect(warnAboutLegacyTooltip).not.toHaveBeenCalledWith(
      expect.objectContaining({ tooltip: expect.anything() }),
    );
    expect(screen.getByTestId('InfoBadge')).toBeInTheDocument();

    await hoverWithPointer(wrapperOf('Subscribe'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Sent weekly');
  });
});

describe('<Checkbox /> null value', () => {
  it('clears when a controlled isSelected is set to null', () => {
    const { rerender } = render(
      <Checkbox isSelected onChange={() => {}}>
        Accept
      </Checkbox>,
    );

    expect(screen.getByRole('checkbox')).toBeChecked();

    rerender(
      <Checkbox isSelected={null} onChange={() => {}}>
        Accept
      </Checkbox>,
    );

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
