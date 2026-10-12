import {
  act,
  fireEvent,
  renderWithRoot,
  screen,
  userEvent,
} from '../../../test';

import { BoardDragActiveProvider } from './BoardDragActiveProvider';
import { Tab, Tabs } from './Tabs';

// The board lives outside this package (Cube Cloud owns it), so this provider
// is the only way `Tabs` learns a widget drag is in flight. Without it, tabs
// lose spring-loading and, more importantly, the panel mounting that keeps the
// tab a widget is dragged out of from unmounting mid-drag.
describe('BoardDragActiveProvider', () => {
  const tabs = (
    <Tabs defaultActiveKey="one">
      <Tab key="one" title="One">
        Panel one
      </Tab>
      <Tab key="two" title="Two">
        Panel two
      </Tab>
    </Tabs>
  );

  const renderTabs = (isActive: boolean) =>
    renderWithRoot(
      <BoardDragActiveProvider isActive={isActive}>
        {tabs}
      </BoardDragActiveProvider>,
    );

  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  // `keepMounted` keeps a panel alive once it has been *visited*, which is
  // what saves an in-flight drag: the widget was dragged out of a tab that
  // was open a moment ago, so switching away must not unmount it.
  it('keeps a visited tab panel mounted while it reports a drag', async () => {
    renderTabs(true);

    await userEvent.click(screen.getByTestId('Tab-two'));
    expect(screen.getByText('Panel two')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('Tab-one'));
    expect(screen.getByText('Panel two')).toBeInTheDocument();
  });

  it('lets a visited panel unmount when it reports no drag', async () => {
    renderTabs(false);

    await userEvent.click(screen.getByTestId('Tab-two'));
    expect(screen.getByText('Panel two')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('Tab-one'));
    expect(screen.queryByText('Panel two')).not.toBeInTheDocument();
  });

  describe('spring-loading', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('opens an inactive tab on hover while it reports a drag', () => {
      renderTabs(true);

      fireEvent.pointerEnter(screen.getByTestId('Tab-two'));
      advance(600);

      expect(screen.getByTestId('Tab-two')).toHaveAttribute(
        'aria-selected',
        'true',
      );
      // The source tab stays mounted for the drag's duration.
      expect(screen.getByText('Panel one')).toBeInTheDocument();
    });

    it('does not open a tab on hover when it reports no drag', () => {
      renderTabs(false);

      fireEvent.pointerEnter(screen.getByTestId('Tab-two'));
      advance(600);

      expect(screen.getByTestId('Tab-two')).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('cancels a pending spring-load when the pointer leaves before the delay', () => {
      renderTabs(true);

      const tabTwo = screen.getByTestId('Tab-two');

      fireEvent.pointerEnter(tabTwo);
      advance(200);
      fireEvent.pointerLeave(tabTwo);
      advance(600);

      expect(tabTwo).toHaveAttribute('aria-selected', 'false');
    });

    it('cancels a pending spring-load when the drag ends before the delay', () => {
      const { rerender } = renderTabs(true);

      fireEvent.pointerEnter(screen.getByTestId('Tab-two'));
      advance(200);
      rerender(
        <BoardDragActiveProvider isActive={false}>
          {tabs}
        </BoardDragActiveProvider>,
      );
      advance(600);

      expect(screen.getByTestId('Tab-two')).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });
  });
});
