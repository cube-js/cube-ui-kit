import { IconCloud } from '@tabler/icons-react';

import {
  hoverWithPointer,
  render,
  renderWithRoot,
  screen,
} from '../../../test';

import { ItemBadge } from './ItemBadge';

describe('<ItemBadge />', () => {
  /**
   * A non-interactive badge put its `aria-label` on a `div` with no role, and
   * screen readers ignore a name on a generic element.
   */
  it('exposes the name of an icon-only badge as an image', () => {
    render(<ItemBadge icon={<IconCloud />} tooltip="Remote branch" />);

    expect(screen.getByRole('img', { name: 'Remote branch' })).toHaveAttribute(
      'data-qa',
      'ItemBadge',
    );
  });

  it('keeps a role the caller set', () => {
    render(
      <ItemBadge icon={<IconCloud />} role="status" aria-label="Synced" />,
    );

    expect(screen.getByRole('status', { name: 'Synced' })).toBeInTheDocument();
  });

  it('adds no role to a badge with a visible label', () => {
    render(<ItemBadge>Beta</ItemBadge>);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  /**
   * The badge cannot take focus, so its tooltip opens only on hover. When the
   * name is not the tooltip text, the text has to reach keyboard and screen
   * reader users some other way.
   */
  it('describes the badge by its tooltip when the name is different', () => {
    render(
      <ItemBadge
        icon={<IconCloud />}
        aria-label="3 warnings"
        tooltip="Two checks failed"
      />,
    );

    expect(
      screen.getByRole('img', { name: '3 warnings' }),
    ).toHaveAccessibleDescription('Two checks failed');
  });

  it('does not repeat a tooltip that already names the badge', () => {
    render(<ItemBadge icon={<IconCloud />} tooltip="Remote branch" />);

    expect(
      screen.getByRole('img', { name: 'Remote branch' }),
    ).not.toHaveAttribute('aria-description');
  });

  it('keeps its own description while the tooltip is open', async () => {
    renderWithRoot(
      <>
        <p id="hint">Pushed an hour ago</p>
        <ItemBadge
          icon={<IconCloud />}
          aria-describedby="hint"
          tooltip="Remote branch"
        />
      </>,
    );

    await hoverWithPointer(screen.getByTestId('ItemBadge'));

    const tooltip = await screen.findByRole('tooltip');

    expect(screen.getByTestId('ItemBadge')).toHaveAttribute(
      'aria-describedby',
      `hint ${tooltip.id}`,
    );
  });
});
