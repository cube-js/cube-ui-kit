import {
  hoverWithPointer,
  render,
  renderWithRoot,
  screen,
  userEvent,
} from '../../../test';
import { Footer } from '../../content/Footer';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';
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

/**
 * The split hands its `type`, `theme`, `size` and `isDisabled` to its Buttons
 * through context, and React context crosses portals. So every Button in a
 * popover, dialog or menu that a split's Button opened used to inherit them: a
 * confirm popover's Cancel turned primary and small, and was disabled whenever
 * the split was.
 */
describe('<ButtonSplit /> overlay content', () => {
  function ShipSplit(props: { isDisabled?: boolean }) {
    return (
      <ButtonSplit
        type="primary"
        theme="danger"
        size="small"
        isDisabled={props.isDisabled}
      >
        <DialogTrigger type="popover">
          <Button>Ship</Button>
          <Dialog aria-label="Ship changes">
            <Footer>
              <Button>Cancel</Button>
              <ButtonSplit type="clear">
                <Button>Copy</Button>
              </ButtonSplit>
            </Footer>
          </Dialog>
        </DialogTrigger>
      </ButtonSplit>
    );
  }

  it('does not style the Buttons in a dialog its Button opens', async () => {
    renderWithRoot(<ShipSplit />);

    const ship = screen.getByRole('button', { name: 'Ship' });

    expect(ship).toHaveAttribute('data-type', 'primary');
    expect(ship).toHaveAttribute('data-theme', 'danger');
    expect(ship).toHaveAttribute('data-size', 'small');

    await userEvent.click(ship);

    const cancel = await screen.findByRole('button', { name: 'Cancel' });

    expect(cancel).toHaveAttribute('data-type', 'outline');
    expect(cancel).toHaveAttribute('data-theme', 'default');
    expect(cancel).toHaveAttribute('data-size', 'medium');

    // A split inside the dialog still styles its own Buttons.
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute(
      'data-type',
      'clear',
    );
  });

  it('does not disable them when the split becomes disabled', async () => {
    const { rerender } = renderWithRoot(<ShipSplit />);

    const ship = screen.getByRole('button', { name: 'Ship' });

    await userEvent.click(ship);

    const cancel = await screen.findByRole('button', { name: 'Cancel' });

    rerender(<ShipSplit isDisabled />);

    expect(ship).toBeDisabled();
    expect(cancel).toBeInTheDocument();
    expect(cancel).toBeEnabled();
  });

  it('does not style the Buttons in the menu its trigger opens', async () => {
    renderWithRoot(
      <ButtonSplit
        actions={[{ key: 'deploy', label: 'Deploy' }]}
        type="primary"
        size="small"
        menuProps={{ footer: <Button>Manage targets</Button> }}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'More options' });

    expect(trigger).toHaveAttribute('data-type', 'primary');
    expect(trigger).toHaveAttribute('data-size', 'small');

    await userEvent.click(trigger);

    const manage = await screen.findByRole('button', {
      name: 'Manage targets',
    });

    expect(manage).toHaveAttribute('data-type', 'outline');
    expect(manage).toHaveAttribute('data-size', 'medium');
  });
});
