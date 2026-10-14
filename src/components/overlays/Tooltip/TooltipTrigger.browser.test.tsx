import { createRef, StrictMode } from 'react';
import { page } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';

import { Tooltip } from './Tooltip';
import { TooltipTrigger } from './TooltipTrigger';

describe('tooltip positioning', () => {
  afterEach(async () => page.viewport(1000, 800));
  it('positions on first open, follows overlay size, and uses current options after exit/reopen', async () => {
    await page.viewport(1000, 700);
    const first = createRef<HTMLButtonElement>();
    const second = createRef<HTMLButtonElement>();
    const content = (isOpen: boolean, changed = false, long = false) => (
      <StrictMode>
        <div style={{ padding: 150, display: 'flex', gap: 160 }}>
          <button ref={first} type="button">
            First target
          </button>
          <button ref={second} type="button">
            Second target
          </button>
          <TooltipTrigger
            isOpen={isOpen}
            targetRef={(changed ? second : first) as never}
            placement={changed ? 'right' : 'bottom'}
            offset={changed ? 21 : 17}
            crossOffset={changed ? 0 : 9}
          >
            {() => <span>Trigger</span>}
            <Tooltip qa="PositionedTooltip">
              {changed
                ? 'New content'
                : long
                  ? 'A substantially wider tooltip content'
                  : 'Tip'}
            </Tooltip>
          </TooltipTrigger>
        </div>
      </StrictMode>
    );
    const { rerender, unmount } = renderWithRoot(content(false));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    rerender(content(true));

    const expectBelow = () => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('data-phase', 'entered');
      const box = tooltip.getBoundingClientRect();
      const target = first.current!.getBoundingClientRect();
      expect(Math.abs(box.top - target.bottom - 17)).toBeLessThan(1);
      expect(
        Math.abs(box.left + box.width / 2 - target.left - target.width / 2 - 9),
      ).toBeLessThan(1);
    };
    await waitFor(expectBelow);
    const beforeWidth = screen
      .getByRole('tooltip')
      .getBoundingClientRect().width;
    rerender(content(true, false, true));
    await waitFor(() => {
      expect(
        screen.getByRole('tooltip').getBoundingClientRect().width,
      ).toBeGreaterThan(beforeWidth + 50);
      expectBelow();
    });

    const overlay = screen.getByRole('tooltip');
    const position = { top: overlay.style.top, left: overlay.style.left };
    rerender(content(false, true));
    // Exit keeps the shown content; live positioning configuration must see
    // the closed state even though DisplayTransition retains its render prop.
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'A substantially wider tooltip content',
    );
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await new Promise(requestAnimationFrame);
    });
    expect({ top: overlay.style.top, left: overlay.style.left }).toEqual(
      position,
    );

    rerender(content(true, true));
    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent('New content');
      expect(tooltip).toHaveAttribute('data-phase', 'entered');
      expect(tooltip).toHaveAttribute('data-placement', 'right');
      expect(
        Math.abs(
          tooltip.getBoundingClientRect().left -
            second.current!.getBoundingClientRect().right -
            21,
        ),
      ).toBeLessThan(1);
    });
    rerender(content(false, true));
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
    unmount();
  });
});
