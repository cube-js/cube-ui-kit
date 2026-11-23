import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { centerOf, tapAt, useTouchEmulation } from '../../../test/touch';
import { Button } from '../../actions/Button/Button';
import { TextInput } from '../../fields/TextInput/TextInput';

describe('<InfoBadge /> on a touch screen', () => {
  useTouchEmulation();

  /**
   * A tooltip a tap opened stays open until it is dismissed, and the natural
   * way to dismiss it is to tap it. The tooltip ignored pointer events, so
   * that tap pressed whatever it covered: a field label's tooltip sits over
   * the field or button above.
   */
  it('closes on a tap on the tooltip without pressing what it covers', async () => {
    const onPress = vi.fn();

    renderWithRoot(
      <div style={{ padding: 80, width: 320 }}>
        <Button width="100%" height="6x" onPress={onPress}>
          Covered
        </Button>
        <TextInput label="Scopes" labelTooltip="Space-separated scopes." />
      </div>,
    );

    await tapAt(centerOf(screen.getByTestId('InfoBadge')));

    const tooltip = await screen.findByRole('tooltip');

    await waitFor(() =>
      expect(tooltip).toHaveAttribute('data-phase', 'entered'),
    );

    const point = centerOf(tooltip);
    const button = screen.getByRole('button').getBoundingClientRect();

    // The tooltip covers the button, so a tap that passed through would press it.
    expect(point.x).toBeGreaterThan(button.left);
    expect(point.x).toBeLessThan(button.right);
    expect(point.y).toBeGreaterThan(button.top);
    expect(point.y).toBeLessThan(button.bottom);

    await tapAt(point);

    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
    expect(onPress).not.toHaveBeenCalled();
  });
});
