import {
  hoverWithPointer,
  render,
  renderWithRoot,
  screen,
} from '../../../test';
import { Button } from '../Button/Button';

import { ButtonSplit } from './ButtonSplit';

/**
 * `ButtonSplit` used to forward exactly five things to its element and discard
 * the rest of `...rest`, so a caller could not label the group — the case the
 * component exists for, since custom mode's children are typically icon-only
 * buttons with no visible group label. Its sibling `ButtonGroup` forwards
 * everything, so the two were not interchangeable.
 */
describe('<ButtonSplit /> prop forwarding', () => {
  it('forwards ARIA and DOM props to the wrapper', () => {
    render(
      <ButtonSplit
        qa="Split"
        id="view-mode"
        aria-label="View mode"
        aria-describedby="hint"
      >
        <Button>A</Button>
        <Button>B</Button>
      </ButtonSplit>,
    );

    const wrapper = screen.getByTestId('Split');

    expect(wrapper).toHaveAttribute('aria-label', 'View mode');
    expect(wrapper).toHaveAttribute('aria-describedby', 'hint');
    expect(wrapper).toHaveAttribute('id', 'view-mode');
  });

  it('forwards a raw data-qa, not just the qa prop', () => {
    render(
      <ButtonSplit data-qa="Segmented">
        <Button>A</Button>
      </ButtonSplit>,
    );

    expect(screen.getByTestId('Segmented')).toBeInTheDocument();
  });

  it('gives custom mode a group role so a label has something to name', () => {
    render(
      <ButtonSplit qa="Custom" aria-label="View mode">
        <Button>A</Button>
      </ButtonSplit>,
    );

    expect(screen.getByTestId('Custom')).toHaveAttribute('role', 'group');
    expect(
      screen.getByRole('group', { name: 'View mode' }),
    ).toBeInTheDocument();
  });

  it('lets the call site override the role', () => {
    render(
      <ButtonSplit qa="Presentational" role="presentation">
        <Button>A</Button>
      </ButtonSplit>,
    );

    expect(screen.getByTestId('Presentational')).toHaveAttribute(
      'role',
      'presentation',
    );
  });

  it('does not leak container style props to the DOM', () => {
    render(
      <ButtonSplit qa="Styled" width="100%">
        <Button>A</Button>
      </ButtonSplit>,
    );

    expect(screen.getByTestId('Styled')).not.toHaveAttribute('width');
  });
});

/**
 * The action button shows the selected action's icon and label, but used to
 * drop its `tooltip`, which only appeared on the action's menu item.
 */
describe('<ButtonSplit /> action tooltip', () => {
  const actions = [
    { key: 'deploy', label: 'Deploy', tooltip: 'Deploy to production' },
    { key: 'stage', label: 'Stage' },
  ];

  it("shows the current action's tooltip on the action button", async () => {
    renderWithRoot(<ButtonSplit actions={actions} />);

    await hoverWithPointer(screen.getByRole('button', { name: 'Deploy' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Deploy to production',
    );
  });

  it('lets actionProps override it', async () => {
    renderWithRoot(
      <ButtonSplit actions={actions} actionProps={{ tooltip: 'Ship it' }} />,
    );

    await hoverWithPointer(screen.getByRole('button', { name: 'Deploy' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Ship it');
  });
});
