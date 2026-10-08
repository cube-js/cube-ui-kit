import { CSSProperties, useState } from 'react';
import { cdp, page, userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';

import { Side } from './LayoutContext';
import { LayoutPanelMode } from './LayoutPanel';

import { Layout } from './index';

import type {} from '@vitest/browser-playwright';

function ToggleLayout({
  side,
  initiallyOpen = false,
  openOverride,
  hasTransition = true,
  mode,
  transition,
  onSizeChange,
}: {
  side: Side;
  initiallyOpen?: boolean;
  openOverride?: boolean;
  hasTransition?: boolean;
  mode?: LayoutPanelMode;
  transition?: string;
  onSizeChange?: (size: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle panel</button>
      <div style={{ width: 400, height: 240, margin: 80, display: 'grid' }}>
        <Layout
          qa="bounded-layout"
          hasTransition={hasTransition}
          minContentSize={100}
          styles={{
            $transition: '1s',
          }}
        >
          <button>Main content</button>
          <button
            data-qa="content-overflow"
            style={{ position: 'absolute', top: -30, left: 130 }}
          >
            Content overflow
          </button>
          <Layout.Panel
            side={side}
            qa="sliding-panel"
            isOpen={openOverride ?? isOpen}
            onOpenChange={setIsOpen}
            mode={mode}
            minSize={50}
            defaultSize={100}
            isResizable
            onSizeChange={onSizeChange}
            styles={{ overflow: 'visible', transition }}
          >
            <button>Panel content</button>
            <button data-qa="panel-overflow" style={overflowPosition(side)}>
              Panel overflow
            </button>
          </Layout.Panel>
        </Layout>
      </div>
    </>
  );
}

function overflowPosition(side: Side): CSSProperties {
  const horizontal = side === 'left' || side === 'right';
  return {
    position: 'absolute',
    width: 24,
    height: 24,
    [side]: -24,
    ...(horizontal ? { top: '50%' } : { left: '50%' }),
  };
}

function hit(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return element.contains(
    document.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    ),
  );
}

async function expectIdleOverflow() {
  await waitFor(() =>
    expect(hit(screen.getByTestId('panel-overflow'))).toBe(true),
  );
}

async function freezeSlide() {
  const panel = await screen.findByTestId('sliding-panel');
  await waitFor(() => {
    expect(
      panel
        .getAnimations()
        .some((animation) => Number(animation.currentTime) > 0),
    ).toBe(true);
  });
  const elements = [panel, screen.getByTestId('PanelResizeHandler')];
  const animations = elements.flatMap((element) => element.getAnimations());
  animations.forEach((animation) => {
    animation.pause();
    animation.currentTime = Number(animation.effect!.getTiming().duration) / 2;
  });
  return { panel, animations };
}

function outsidePoint(side: Side, layout: DOMRect) {
  switch (side) {
    case 'left':
      return [layout.left - 2, layout.top + layout.height / 2];
    case 'right':
      return [layout.right + 2, layout.top + layout.height / 2];
    case 'top':
      return [layout.left + layout.width / 2, layout.top - 2];
    case 'bottom':
      return [layout.left + layout.width / 2, layout.bottom + 2];
  }
}

// jsdom cannot observe transformed painting or browser hit testing.
describe('Layout.Panel animation bounds', () => {
  it.each(['left', 'right', 'top', 'bottom'] as const)(
    'contains the %s panel and handle during opening and closing',
    async (side) => {
      await page.viewport(800, 600);
      renderWithRoot(<ToggleLayout side={side} />);
      await act(async () => {
        await new Promise(requestAnimationFrame);
      });

      for (const opening of [true, false]) {
        await userEvent.click(
          screen.getByRole('button', { name: 'Toggle panel' }),
        );
        const { panel, animations } = await freezeSlide();
        const layout = screen
          .getByTestId('bounded-layout')
          .getBoundingClientRect();
        const [x, y] = outsidePoint(side, layout);
        expect(panel.contains(document.elementFromPoint(x, y))).toBe(false);
        expect(hit(screen.getByTestId('content-overflow'))).toBe(true);
        const main = screen.getByRole('button', { name: 'Main content' });
        // A top panel can temporarily cover the button as the content inset moves.
        if (side !== 'top') expect(hit(main)).toBe(true);

        // At the offscreen end, the resize handle extends farther than the panel.
        animations.forEach((animation) => {
          animation.currentTime =
            Number(animation.effect!.getTiming().duration) *
            (opening ? 0.01 : 0.99);
        });
        expect(
          screen
            .getByTestId('PanelResizeHandler')
            .contains(document.elementFromPoint(x, y)),
        ).toBe(false);

        await act(async () => {
          animations.forEach((animation) => animation.finish());
        });
        await waitFor(() =>
          expect(
            opening
              ? screen.getByTestId('sliding-panel').getAnimations().length
              : screen.queryByTestId('sliding-panel'),
          ).toBe(opening ? 0 : null),
        );
        if (opening) await expectIdleOverflow();
      }
    },
  );

  it('keeps clipping when an opening is reversed during exit preparation, then restores idle overflow', async () => {
    await page.viewport(800, 600);
    const view = renderWithRoot(<ToggleLayout side="left" />);
    await userEvent.click(screen.getByRole('button', { name: 'Toggle panel' }));
    const { animations } = await freezeSlide();

    view.rerender(<ToggleLayout side="left" openOverride={false} />);
    view.rerender(<ToggleLayout side="left" openOverride />);
    expect(hit(screen.getByTestId('panel-overflow'))).toBe(false);
    await act(async () => {
      animations.forEach((animation) => animation.finish());
    });
    await expectIdleOverflow();
  });

  it.each(['default', 'sticky'] as const)(
    'preserves panel interaction and resize behavior in %s mode',
    async (mode) => {
      await page.viewport(800, 600);
      const onSizeChange = vi.fn();
      renderWithRoot(
        <ToggleLayout
          side="left"
          initiallyOpen
          mode={mode}
          onSizeChange={onSizeChange}
        />,
      );
      await expectIdleOverflow();
      await userEvent.click(
        screen.getByRole('button', { name: 'Panel content' }),
      );
      expect(
        screen.getByRole('button', { name: 'Panel content' }),
      ).toHaveFocus();
      const handler = screen.getByRole('separator');
      expect(hit(handler)).toBe(true);
      await act(async () => {
        handler.focus();
      });
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(onSizeChange).toHaveBeenCalledWith(110));
      await userEvent.dblClick(handler);
      await waitFor(() => expect(onSizeChange).toHaveBeenLastCalledWith(100));
      await userEvent.click(
        screen.getByRole('button', { name: 'Main content' }),
      );
      expect(
        screen.getByRole('button', { name: 'Main content' }),
      ).toHaveFocus();
    },
  );

  it('preserves overlay backdrop and Escape dismissal', async () => {
    await page.viewport(800, 600);
    renderWithRoot(<ToggleLayout side="left" initiallyOpen mode="overlay" />);
    await expectIdleOverflow();
    expect(hit(screen.getByRole('separator'))).toBe(true);
    await userEvent.click(screen.getByTestId('PanelOverlay'));
    await waitFor(() =>
      expect(screen.queryByTestId('sliding-panel')).toBeNull(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Toggle panel' }));
    await expectIdleOverflow();
    await act(async () => {
      const layout = screen.getByTestId('bounded-layout');
      layout.tabIndex = -1;
      layout.focus();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByTestId('sliding-panel')).toBeNull(),
    );
  });

  it.each(['disabled', 'none', 'reduced'] as const)(
    'does not leave clipping behind with %s motion',
    async (motion) => {
      await page.viewport(800, 600);
      const session = cdp();
      if (motion === 'reduced')
        await session.send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
      try {
        renderWithRoot(
          <ToggleLayout
            side="right"
            hasTransition={motion !== 'disabled'}
            transition={motion === 'none' ? 'none' : undefined}
          />,
        );
        await userEvent.click(
          screen.getByRole('button', { name: 'Toggle panel' }),
        );
        await expectIdleOverflow();
        await userEvent.click(
          screen.getByRole('button', { name: 'Toggle panel' }),
        );
        await waitFor(() =>
          expect(screen.queryByTestId('sliding-panel')).toBeNull(),
        );
        await userEvent.click(
          screen.getByRole('button', { name: 'Main content' }),
        );
        expect(
          screen.getByRole('button', { name: 'Main content' }),
        ).toHaveFocus();
      } finally {
        if (motion === 'reduced')
          await session.send('Emulation.setEmulatedMedia', { features: [] });
      }
    },
  );

  it('keeps simultaneous panel boundaries independent and cleans up on unmount', async () => {
    await page.viewport(800, 600);
    function Pair({
      open,
      removeLeft = false,
    }: {
      open: boolean;
      removeLeft?: boolean;
    }) {
      return (
        <div style={{ width: 500, height: 240, margin: 80, display: 'grid' }}>
          <Layout
            hasTransition
            minContentSize={100}
            styles={{ $transition: '1s' }}
          >
            {(['left', 'right'] as const)
              .filter((side) => side !== 'left' || !removeLeft)
              .map((side) => (
                <Layout.Panel
                  key={side}
                  side={side}
                  qa={`${side}-panel`}
                  isOpen={open}
                  defaultSize={100}
                  minSize={50}
                  styles={{ overflow: 'visible' }}
                >
                  <button
                    data-qa={`${side}-overflow`}
                    style={overflowPosition(side)}
                  >
                    Overflow
                  </button>
                </Layout.Panel>
              ))}
            <button>Main</button>
          </Layout>
        </div>
      );
    }
    const view = renderWithRoot(<Pair open={false} />);
    view.rerender(<Pair open />);
    const left = await screen.findByTestId('left-panel');
    await waitFor(() =>
      expect(left.getAnimations().some((a) => Number(a.currentTime) > 0)).toBe(
        true,
      ),
    );
    const animations = left.getAnimations();
    animations.forEach((a) => {
      a.pause();
      a.currentTime = 500;
    });
    await waitFor(() =>
      expect(hit(screen.getByTestId('right-overflow'))).toBe(true),
    );
    expect(hit(screen.getByTestId('left-overflow'))).toBe(false);
    view.rerender(<Pair open removeLeft />);
    expect(screen.queryByTestId('left-panel')).toBeNull();
    expect(hit(screen.getByTestId('right-overflow'))).toBe(true);
  });

  it('clips a nested panel at its own Layout bounds', async () => {
    await page.viewport(800, 600);
    function Nested({ open }: { open: boolean }) {
      return (
        <div style={{ width: 500, height: 300, margin: 80, display: 'grid' }}>
          <Layout>
            <div
              style={{ width: 250, height: 160, margin: 20, display: 'grid' }}
            >
              <Layout
                qa="nested-layout"
                hasTransition
                minContentSize={100}
                styles={{ $transition: '1s' }}
              >
                <Layout.Panel
                  side="right"
                  qa="nested-panel"
                  isOpen={open}
                  defaultSize={100}
                  minSize={50}
                >
                  Nested panel
                </Layout.Panel>
              </Layout>
            </div>
          </Layout>
        </div>
      );
    }
    const view = renderWithRoot(<Nested open={false} />);
    view.rerender(<Nested open />);
    const panel = await screen.findByTestId('nested-panel');
    await waitFor(() =>
      expect(panel.getAnimations().some((a) => Number(a.currentTime) > 0)).toBe(
        true,
      ),
    );
    panel.getAnimations().forEach((a) => {
      a.pause();
      a.currentTime = 500;
    });
    const rect = screen.getByTestId('nested-layout').getBoundingClientRect();
    expect(
      panel.contains(document.elementFromPoint(rect.right + 2, rect.top + 30)),
    ).toBe(false);
  });

  it('leaves dialog mode in its external portal', async () => {
    await page.viewport(800, 600);
    const view = renderWithRoot(
      <div style={{ width: 100, height: 100, display: 'grid' }}>
        <Layout>
          <Layout.Panel side="right" mode="dialog" isDialogOpen>
            Dialog content
          </Layout.Panel>
        </Layout>
      </div>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Dialog content');
    expect(screen.getByTestId('Layout').contains(dialog)).toBe(false);
    view.unmount();
  });
});
