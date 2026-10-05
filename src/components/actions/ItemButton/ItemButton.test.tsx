import { render, renderWithRoot, screen, userEvent } from '../../../test';
import { Disclosure } from '../../content/Disclosure/Disclosure';

import { ItemButton } from './ItemButton';

describe('<ItemButton /> aria-pressed', () => {
  /**
   * `isSelected` used to reach the DOM as `aria-selected`, which is not a
   * state of role `button`, so screen readers ignored it and a toggle built
   * from `ItemButton` read as a plain button. The docs promise `aria-pressed`.
   */
  it('derives aria-pressed from isSelected, without aria-selected', () => {
    render(
      <ItemButton isSelected qa="On">
        Hi
      </ItemButton>,
    );

    const button = screen.getByTestId('On');

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).not.toHaveAttribute('aria-selected');
  });

  it('reports an unpressed toggle rather than omitting the state', () => {
    render(
      <ItemButton isSelected={false} qa="Off">
        Hi
      </ItemButton>,
    );

    expect(screen.getByTestId('Off')).toHaveAttribute('aria-pressed', 'false');
  });

  it('adds nothing when isSelected is not used', () => {
    render(<ItemButton qa="Plain">Hi</ItemButton>);

    expect(screen.getByTestId('Plain')).not.toHaveAttribute('aria-pressed');
  });

  it('lets an explicit aria-pressed win', () => {
    render(
      <ItemButton isSelected aria-pressed={false} qa="Explicit">
        Hi
      </ItemButton>,
    );

    expect(screen.getByTestId('Explicit')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('keeps aria-selected for a call site that sets its own role', () => {
    render(
      <ItemButton isSelected role="tab" qa="Tab">
        Hi
      </ItemButton>,
    );

    const tab = screen.getByTestId('Tab');

    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).not.toHaveAttribute('aria-pressed');
  });

  it('adds no aria-pressed to a link', () => {
    render(
      <ItemButton isSelected to="/docs" qa="Link">
        Docs
      </ItemButton>,
    );

    expect(screen.getByTestId('Link')).not.toHaveAttribute('aria-pressed');
  });

  it('adds no aria-pressed to a trigger that reports aria-expanded', () => {
    renderWithRoot(
      <Disclosure defaultExpanded>
        <Disclosure.Trigger>Section</Disclosure.Trigger>
        <Disclosure.Content>Body</Disclosure.Content>
      </Disclosure>,
    );

    const trigger = screen.getByTestId('DisclosureTrigger');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).not.toHaveAttribute('aria-pressed');
  });
});

describe('<ItemButton /> props meant for useAction', () => {
  /**
   * `useAction` consumes `navigationOptions`, but `ItemButton` left it in the
   * props it spreads onto `Item`, so it also landed on the element as
   * `navigationOptions="[object Object]"` and React warned about an unknown
   * prop (CUB-5269).
   */
  it('keeps navigationOptions off the DOM element', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    renderWithRoot(
      <ItemButton
        to="/workbooks"
        navigationOptions={{ state: { from: 'sidebar' } }}
        qa="Link"
      >
        Workbooks
      </ItemButton>,
    );

    const link = screen.getByTestId('Link');

    expect(link).not.toHaveAttribute('navigationOptions');
    expect(link).not.toHaveAttribute('navigationoptions');
    expect(
      consoleError.mock.calls.some((args) =>
        String(args[0]).includes('navigationOptions'),
      ),
    ).toBe(false);

    consoleError.mockRestore();
  });

  it('keeps the deprecated label off the DOM element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithRoot(
      <ItemButton label="Workbooks" qa="Labelled">
        Workbooks
      </ItemButton>,
    );

    expect(screen.getByTestId('Labelled')).not.toHaveAttribute('label');

    warn.mockRestore();
  });
});

describe('<ItemButton /> disabled', () => {
  it('shows its focus ring while disabled with a tooltip', async () => {
    renderWithRoot(
      <ItemButton isDisabled tooltip="Not enough permissions" qa="Locked">
        Locked
      </ItemButton>,
    );

    // The tooltip keeps it a Tab stop, so the ring has to show where focus is.
    await userEvent.tab();

    const button = screen.getByTestId('Locked');

    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-focused');
  });

  it('does not click its container with Enter while disabled with a tooltip', async () => {
    const onClick = vi.fn();

    renderWithRoot(
      <div onClick={onClick}>
        <ItemButton isDisabled tooltip="Not enough permissions">
          Locked
        </ItemButton>
      </div>,
    );

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onClick).not.toHaveBeenCalled();
  });
});
