import { cdp } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { TextInput } from '../../fields/TextInput/TextInput';

/** Chromium's coordinates for a point in the test iframe, which Vitest can scale. */
function nativePosition(x: number, y: number) {
  const frame = window.frameElement as HTMLElement | null;
  const bounds = frame?.getBoundingClientRect();
  const scaleX = bounds && frame ? bounds.width / frame.offsetWidth : 1;
  const scaleY = bounds && frame ? bounds.height / frame.offsetHeight : 1;

  return {
    x: (bounds?.left ?? 0) + (x + (frame?.clientLeft ?? 0)) * scaleX,
    y: (bounds?.top ?? 0) + (y + (frame?.clientTop ?? 0)) * scaleY,
  };
}

function centreOf(element: Element) {
  const bounds = element.getBoundingClientRect();

  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  };
}

/** A trusted touch tap, which Chromium turns into pointer events and a click. */
async function tapAt({ x, y }: { x: number; y: number }) {
  await act(async () => {
    await cdp().send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [nativePosition(x, y)],
    });
    await cdp().send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  });
}

describe('<InfoBadge /> on a touch screen', () => {
  beforeEach(async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true });
  });

  afterEach(async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
  });

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

    await tapAt(centreOf(screen.getByTestId('InfoBadge')));

    const tooltip = await screen.findByRole('tooltip');

    await waitFor(() =>
      expect(tooltip).toHaveAttribute('data-phase', 'entered'),
    );

    const point = centreOf(tooltip);
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
