import { createRef } from 'react';

import {
  hoverWithPointer,
  render,
  renderWithRoot,
  screen,
  userEvent,
} from '../../../test';
import { warnAboutLegacyTooltip } from '../../form/legacy-tooltip';

import { Switch } from './Switch';

import type { FocusableRefValue } from '@react-types/shared';

vi.mock('../../form/legacy-tooltip', { spy: true });

vi.mock('../../../_internal/hooks/use-warn');

describe('<Switch /> name', () => {
  it('joins a field label and the inline text', () => {
    render(<Switch label="Notifications">Send me texts</Switch>);

    expect(
      screen.getByRole('switch', { name: 'Notifications Send me texts' }),
    ).toBeInTheDocument();
  });

  // React Aria warns about a switch without children or `aria-label`, though
  // the field `<label for>` names it.
  it('is named by a field label alone without warning about it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      render(<Switch label="Wifi" />);

      expect(screen.getByRole('switch', { name: 'Wifi' })).toBeInTheDocument();
      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('must specify an aria-label'),
      );
    } finally {
      warn.mockRestore();
    }
  });
});

describe('<Switch /> null value', () => {
  it('clears when a controlled isSelected is set to null', () => {
    const { rerender } = render(
      <Switch isSelected onChange={() => {}}>
        Notify
      </Switch>,
    );

    expect(screen.getByRole('switch')).toBeChecked();

    rerender(
      <Switch isSelected={null} onChange={() => {}}>
        Notify
      </Switch>,
    );

    expect(screen.getByRole('switch')).not.toBeChecked();
  });
});

describe('<Switch /> tooltip', () => {
  function wrapperOf(text: string) {
    return screen.getByText(text).closest('label') as HTMLElement;
  }

  it.each([
    ['an enabled', false],
    ['a disabled', true],
  ])('shows %s switch tooltip on hover', async (_, isDisabled) => {
    renderWithRoot(
      <Switch isDisabled={isDisabled} tooltip="Runs nightly">
        Schedule
      </Switch>,
    );

    await hoverWithPointer(wrapperOf('Schedule'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Runs nightly',
    );
  });

  it.each([
    ['an enabled', false],
    ['a disabled', true],
  ])(
    'opens %s switch tooltip on keyboard focus and describes the input',
    async (_, isDisabled) => {
      renderWithRoot(
        <Switch isDisabled={isDisabled} tooltip="Runs nightly">
          Schedule
        </Switch>,
      );

      await userEvent.tab();

      const input = screen.getByRole('switch');

      expect(input).toHaveFocus();

      const tooltip = await screen.findByRole('tooltip');

      expect(tooltip).toHaveTextContent('Runs nightly');
      expect(input).toHaveAttribute('aria-describedby', tooltip.id);
    },
  );

  // The tooltip of a disabled switch is usually the reason it is disabled, so
  // the switch keeps its focus, `aria-disabled` instead of natively disabled.
  it('keeps a disabled switch inert', async () => {
    const onChange = vi.fn();

    renderWithRoot(
      <Switch isDisabled tooltip="Runs nightly" onChange={onChange}>
        Schedule
      </Switch>,
    );

    const input = screen.getByRole('switch');

    expect(input).not.toHaveAttribute('disabled');
    expect(input).toHaveAttribute('aria-disabled', 'true');
    // Its disabled styles, the cursor among them, key off this.
    expect(input).toHaveAttribute('data-disabled');

    await userEvent.tab();
    await userEvent.keyboard(' ');
    await userEvent.click(input);
    await userEvent.click(screen.getByText('Schedule'));

    expect(onChange).not.toHaveBeenCalled();
    // The track, not the input: jsdom undoes a cancelled click on a checkbox
    // input by toggling it once more, after React has already put it back. A
    // browser restores the state it saved (`Switch.browser.test.tsx`).
    expect(
      input.parentElement!.querySelector('[data-element="Input"]'),
    ).not.toHaveAttribute('data-checked');
  });

  it('stays natively disabled without a tooltip', async () => {
    renderWithRoot(
      <>
        <Switch isDisabled>Schedule</Switch>
        <button type="button">After</button>
      </>,
    );

    expect(screen.getByRole('switch')).toBeDisabled();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('keeps a disabled switch out of the Tab order with excludeFromTabOrder', async () => {
    renderWithRoot(
      <>
        <Switch isDisabled excludeFromTabOrder tooltip="Add a schedule first">
          Schedule
        </Switch>
        <button type="button">After</button>
      </>,
    );

    expect(screen.getByRole('switch')).toHaveAttribute('tabindex', '-1');

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('keeps it apart from the field label badge', async () => {
    renderWithRoot(
      <Switch
        label="Refresh"
        labelTooltip="About refreshes"
        tooltip={{ title: 'Runs nightly' }}
      >
        Schedule
      </Switch>,
    );

    // `tooltip` is a switch prop, not the legacy spelling of `labelTooltip`.
    expect(warnAboutLegacyTooltip).not.toHaveBeenCalledWith(
      expect.objectContaining({ tooltip: expect.anything() }),
    );
    expect(screen.getByTestId('InfoBadge')).toBeInTheDocument();

    await hoverWithPointer(wrapperOf('Schedule'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Runs nightly',
    );
  });

  it('keeps the field ref on the wrapper', () => {
    const ref = createRef<FocusableRefValue<HTMLInputElement, HTMLElement>>();

    renderWithRoot(
      <Switch ref={ref} tooltip="Runs nightly">
        Schedule
      </Switch>,
    );

    expect(ref.current?.UNSAFE_getDOMNode()).toBe(
      screen.getByTestId('SwitchWrapper'),
    );
  });
});
