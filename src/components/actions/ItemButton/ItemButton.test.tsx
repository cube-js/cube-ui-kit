import { render, renderWithRoot, screen } from '../../../test';
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
