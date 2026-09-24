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
