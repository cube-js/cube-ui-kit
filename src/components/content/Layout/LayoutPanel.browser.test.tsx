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
  layoutPointerEvents,
  ancestorPointerEvents,
  panelPointerEvents,
  layoutStyle,
  layoutClipMargin,
}: {
  side: Side;
  initiallyOpen?: boolean;
  openOverride?: boolean;
  hasTransition?: boolean;
  mode?: LayoutPanelMode;
  transition?: string;
  onSizeChange?: (size: number) => void;
  layoutPointerEvents?: 'none' | 'auto';
  ancestorPointerEvents?: 'none' | 'auto';
  panelPointerEvents?: 'none' | 'auto';
  layoutStyle?: CSSProperties;
  layoutClipMargin?: string;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle panel</button>
      <div
        style={{
          width: 400,
          height: 240,
          margin: 80,
          display: 'grid',
          pointerEvents: ancestorPointerEvents,
        }}
      >
        <Layout
          qa="bounded-layout"
          hasTransition={hasTransition}
          minContentSize={100}
          style={layoutStyle}
          styles={{
            $transition: '1s',
            pointerEvents: layoutPointerEvents,
            overflowClipMargin: layoutClipMargin,
          }}
        >
          <button>Main content</button>
          <button
            data-qa="content-overflow"
            style={{
              position: 'absolute',
              // Keep the marker outside on an axis the content inset cannot move.
              ...(side === 'top'
                ? { top: 130, right: '100%' }
                : { top: -30, left: 130 }),
            }}
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
            styles={{
              overflow: 'visible',
              transition,
              pointerEvents: panelPointerEvents,
            }}
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

async function expectSynchronizedSlide(side: Side) {
  const panel = await screen.findByTestId('sliding-panel');
  await waitFor(() => {
    expect(
      panel
        .getAnimations()
        .some(
          (animation) =>
            animation instanceof CSSTransition &&
            animation.transitionProperty === 'transform' &&
            animation.startTime !== null,
        ),
    ).toBe(true);
  });
  const inner = screen
    .getByTestId('bounded-layout')
    .querySelector<HTMLElement>('[data-element="Inner"]')!;
  const handler = screen.getByTestId('PanelResizeHandler');
  const transition = (element: HTMLElement, property: string) =>
    element
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition &&
          animation.transitionProperty === property,
      )!;
  const panelStart = transition(panel, 'transform').startTime as number;
  expect(
    Math.abs((transition(inner, side).startTime as number) - panelStart),
  ).toBeLessThan(1);
  expect(
    Math.abs(
      (transition(handler, 'transform').startTime as number) - panelStart,
    ),
  ).toBeLessThan(1);
  return [panel, handler, inner].flatMap((element) => element.getAnimations());
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

const DIALOG_SIZE_KEY = 'layout-panel-dialog-size';

function SizedPanelLayout({
  width,
  height = 640,
  mode = 'default',
  isDialogOpen = false,
  size,
  maxSize = 800,
  onSizeChange,
}: {
  width: number;
  height?: number;
  mode?: LayoutPanelMode;
  isDialogOpen?: boolean;
  size?: number;
  maxSize?: number | string;
  onSizeChange: (size: number) => void;
}) {
  return (
    <div style={{ width, height, display: 'grid' }}>
      <Layout qa="sized-layout">
        <button>Page action</button>
        <Layout.Panel
          qa="sized-panel"
          side="right"
          mode={mode}
          size={size}
          defaultSize={400}
          minSize={300}
          maxSize={maxSize}
          isResizable
          sizeStorageKey={DIALOG_SIZE_KEY}
          onSizeChange={onSizeChange}
          isDialogOpen={isDialogOpen}
          dialogProps={{ type: 'fullscreenTakeover' }}
        >
          <button>Panel action</button>
        </Layout.Panel>
      </Layout>
    </div>
  );
}

async function settleLayout(width: number) {
  await waitFor(() =>
    expect(screen.getByTestId('sized-layout').offsetWidth).toBe(width),
  );
  // Let the real ResizeObserver and the effects responding to it settle.
  await act(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

// Stored sizing depends on actual host measurements, which jsdom cannot supply.
describe('Layout.Panel dialog size preservation', () => {
  beforeEach(() => localStorage.removeItem(DIALOG_SIZE_KEY));
  afterEach(() => localStorage.removeItem(DIALOG_SIZE_KEY));

  it.each([
    [null, false],
    [null, true],
    [400, false],
    [400, true],
    [560, false],
    [560, true],
  ] as const)(
    'preserves initial stored size %s through a mobile dialog with open=%s',
    async (storedSize, isDialogOpen) => {
      await page.viewport(1440, 900);
      if (storedSize !== null) {
        localStorage.setItem(DIALOG_SIZE_KEY, String(storedSize));
      }
      const onSizeChange = vi.fn();
      const view = renderWithRoot(
        <SizedPanelLayout
          width={390}
          mode="dialog"
          isDialogOpen={isDialogOpen}
          onSizeChange={onSizeChange}
        />,
      );
      await settleLayout(390);
      expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBe(
        storedSize === null ? null : String(storedSize),
      );
      expect(onSizeChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('separator')).toBeNull();
      expect(
        screen
          .getByTestId('sized-layout')
          .style.getPropertyValue('--inset-right'),
      ).toBe('0px');

      for (const [width, height] of [
        [375, 450],
        [768, 640],
        [919, 640],
      ]) {
        view.rerender(
          <SizedPanelLayout
            width={width}
            height={height}
            mode="dialog"
            isDialogOpen={isDialogOpen}
            onSizeChange={onSizeChange}
          />,
        );
        await settleLayout(width);
      }

      view.rerender(
        <SizedPanelLayout width={1440} onSizeChange={onSizeChange} />,
      );
      await settleLayout(1440);
      expect(screen.getByTestId('sized-panel').offsetWidth).toBe(
        storedSize ?? 400,
      );
      expect(onSizeChange).not.toHaveBeenCalled();
      expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBe(
        storedSize === null ? null : String(storedSize),
      );
    },
  );

  it('retains a resized width through simultaneous mode and host changes', async () => {
    await page.viewport(1440, 900);
    const onSizeChange = vi.fn();
    const view = renderWithRoot(
      <SizedPanelLayout width={920} onSizeChange={onSizeChange} />,
    );
    await settleLayout(920);
    const separator = screen.getByRole('separator');
    await act(async () => separator.focus());
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(screen.getByTestId('sized-panel').offsetWidth).toBe(410),
    );
    expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBe('410');
    onSizeChange.mockClear();

    for (const [width, mode] of [
      [390, 'dialog'],
      [920, 'default'],
      [919, 'dialog'],
      [920, 'default'],
    ] as const) {
      view.rerender(
        <SizedPanelLayout
          width={width}
          mode={mode}
          onSizeChange={onSizeChange}
        />,
      );
      await settleLayout(width);
      expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBe('410');
      expect(onSizeChange).not.toHaveBeenCalled();
      if (mode === 'default') {
        expect(screen.getByTestId('sized-panel').offsetWidth).toBe(410);
      }
    }
  });

  it.each([
    [550, 800, 550],
    [900, 800, 800],
    [100, 800, 300],
    [550, '50%', 550],
  ] as const)(
    'applies controlled dialog size %s within maximum %s',
    async (size, maxSize, expected) => {
      await page.viewport(1440, 900);
      const onSizeChange = vi.fn();
      const view = renderWithRoot(
        <SizedPanelLayout
          width={390}
          mode="dialog"
          size={400}
          maxSize={maxSize}
          onSizeChange={onSizeChange}
        />,
      );
      await settleLayout(390);
      view.rerender(
        <SizedPanelLayout
          width={390}
          mode="dialog"
          size={size}
          maxSize={maxSize}
          onSizeChange={onSizeChange}
        />,
      );
      await settleLayout(390);
      view.rerender(
        <SizedPanelLayout
          width={1440}
          size={size}
          maxSize={maxSize}
          onSizeChange={onSizeChange}
        />,
      );
      await settleLayout(1440);
      expect(screen.getByTestId('sized-panel').offsetWidth).toBe(expected);
      expect(onSizeChange).not.toHaveBeenCalled();
      expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBeNull();
    },
  );

  it('ends an inline drag at its last visible size when switching to dialog', async () => {
    await page.viewport(1440, 900);
    const onSizeChange = vi.fn();
    const view = renderWithRoot(
      <SizedPanelLayout width={1440} onSizeChange={onSizeChange} />,
    );
    await settleLayout(1440);
    const rect = screen.getByRole('separator').getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    await act(async () => {
      screen.getByRole('separator').dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          clientX: x,
          clientY: y,
          button: 0,
          buttons: 1,
          pointerId: 4,
          pointerType: 'mouse',
        }),
      );
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: x - 10,
          clientY: y,
          buttons: 1,
          pointerId: 4,
          pointerType: 'mouse',
        }),
      );
    });
    await waitFor(() =>
      expect(screen.getByTestId('sized-panel').offsetWidth).toBe(410),
    );
    view.rerender(
      <SizedPanelLayout
        width={390}
        mode="dialog"
        onSizeChange={onSizeChange}
      />,
    );
    await settleLayout(390);
    expect(screen.queryByRole('separator')).toBeNull();
    await act(async () => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: x - 50,
          clientY: y,
          buttons: 1,
          pointerId: 4,
          pointerType: 'mouse',
        }),
      );
    });
    await act(async () => {
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          clientX: x - 50,
          clientY: y,
          button: 0,
          buttons: 0,
          pointerId: 4,
          pointerType: 'mouse',
        }),
      );
    });
    view.rerender(
      <SizedPanelLayout width={1440} onSizeChange={onSizeChange} />,
    );
    await settleLayout(1440);
    expect(screen.getByTestId('sized-panel').offsetWidth).toBe(410);
    expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBe('410');
    expect(onSizeChange).toHaveBeenCalledExactlyOnceWith(410);
  });

  it('applies a new controlled size when returning from a narrow dialog host', async () => {
    await page.viewport(1440, 900);
    const onSizeChange = vi.fn();
    const view = renderWithRoot(
      <SizedPanelLayout
        width={390}
        mode="dialog"
        size={400}
        onSizeChange={onSizeChange}
      />,
    );
    await settleLayout(390);
    view.rerender(
      <SizedPanelLayout width={1440} size={550} onSizeChange={onSizeChange} />,
    );
    await settleLayout(1440);
    expect(screen.getByTestId('sized-panel').offsetWidth).toBe(550);
    expect(onSizeChange).not.toHaveBeenCalled();
    expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBeNull();
  });

  it('retains size with percentage bounds in dialog and clamps to real inline bounds on return', async () => {
    await page.viewport(1440, 900);
    localStorage.setItem(DIALOG_SIZE_KEY, '560');
    const onSizeChange = vi.fn();
    const view = renderWithRoot(
      <SizedPanelLayout
        width={390}
        mode="dialog"
        maxSize="50%"
        onSizeChange={onSizeChange}
      />,
    );
    await settleLayout(390);
    expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBe('560');
    expect(onSizeChange).not.toHaveBeenCalled();

    view.rerender(
      <SizedPanelLayout
        width={1440}
        maxSize="50%"
        onSizeChange={onSizeChange}
      />,
    );
    await settleLayout(1440);
    expect(screen.getByTestId('sized-panel').offsetWidth).toBe(560);
    view.rerender(
      <SizedPanelLayout
        width={700}
        maxSize="50%"
        onSizeChange={onSizeChange}
      />,
    );
    await settleLayout(700);
    expect(screen.getByTestId('sized-panel').offsetWidth).toBe(350);
    expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBe('350');
    expect(onSizeChange).toHaveBeenLastCalledWith(350);
    view.rerender(
      <SizedPanelLayout width={1440} onSizeChange={onSizeChange} />,
    );
    await settleLayout(1440);
    expect(screen.getByTestId('sized-panel').offsetWidth).toBe(350);
    await userEvent.dblClick(screen.getByRole('separator'));
    await waitFor(() =>
      expect(screen.getByTestId('sized-panel').offsetWidth).toBe(400),
    );
    expect(localStorage.getItem(DIALOG_SIZE_KEY)).toBe('400');
    expect(onSizeChange).toHaveBeenLastCalledWith(400);
  });
});

// jsdom cannot observe transformed painting or browser hit testing.
describe('Layout.Panel animation bounds', () => {
  // Native animation timelines expose a frame mismatch that jsdom cannot observe.
  it.each(['left', 'right', 'top', 'bottom'] as const)(
    'starts the %s panel, handler and content motion together on opening and closing',
    async (side) => {
      await page.viewport(800, 600);
      renderWithRoot(<ToggleLayout side={side} />);
      const toggle = screen.getByRole('button', { name: 'Toggle panel' });
      await userEvent.click(toggle);
      const entering = await expectSynchronizedSlide(side);
      await act(async () =>
        entering.forEach((animation) => animation.finish()),
      );
      await expectIdleOverflow();
      await userEvent.click(toggle);
      const exiting = await expectSynchronizedSlide(side);
      await act(async () => exiting.forEach((animation) => animation.finish()));
      await waitFor(() =>
        expect(screen.queryByTestId('sliding-panel')).toBeNull(),
      );
      expect(
        screen
          .getByTestId('bounded-layout')
          .style.getPropertyValue(`--inset-${side}`),
      ).toBe('0px');
    },
  );

  it.each(['disabled', 'dialog'] as const)(
    'initializes visual visibility when enabling an animated panel from %s mode',
    async (previousMode) => {
      await page.viewport(800, 600);
      const view = renderWithRoot(
        <ToggleLayout
          side="left"
          openOverride={false}
          hasTransition={previousMode !== 'disabled'}
          mode={previousMode === 'dialog' ? 'dialog' : 'default'}
        />,
      );
      view.rerender(<ToggleLayout side="left" openOverride />);
      await expectIdleOverflow();
      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId('sliding-panel'))
            .transitionProperty,
        ).toBe('transform'),
      );
      expect(
        screen
          .getByTestId('bounded-layout')
          .style.getPropertyValue('--inset-left'),
      ).toBe('102px');
      view.rerender(<ToggleLayout side="left" openOverride={false} />);
      const animations = await expectSynchronizedSlide('left');
      await act(async () =>
        animations.forEach((animation) => animation.finish()),
      );
      await waitFor(() =>
        expect(screen.queryByTestId('sliding-panel')).toBeNull(),
      );
      expect(
        screen
          .getByTestId('bounded-layout')
          .style.getPropertyValue('--inset-left'),
      ).toBe('0px');
    },
  );

  it.each(['close', 'sticky'] as const)(
    'clears content insets after changing side and %s during transition reconfiguration',
    async (change) => {
      await page.viewport(800, 600);
      const view = renderWithRoot(<ToggleLayout side="left" initiallyOpen />);
      await expectIdleOverflow();
      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId('sliding-panel'))
            .transitionProperty,
        ).toBe('transform'),
      );
      view.rerender(
        <ToggleLayout
          side="right"
          openOverride={change !== 'close'}
          mode={change === 'sticky' ? 'sticky' : 'default'}
        />,
      );
      if (change === 'close') {
        const { animations } = await freezeSlide();
        await act(async () =>
          animations.forEach((animation) => animation.finish()),
        );
        await waitFor(() =>
          expect(screen.queryByTestId('sliding-panel')).toBeNull(),
        );
      } else {
        await expectIdleOverflow();
      }
      const layout = screen.getByTestId('bounded-layout');
      expect(layout.style.getPropertyValue('--inset-left')).toBe('0px');
      expect(layout.style.getPropertyValue('--inset-right')).toBe('0px');
    },
  );

  it.each(['inline', 'stylesheet'] as const)(
    'contains motion with a configured %s clip margin and restores its latest value',
    async (source) => {
      await page.viewport(800, 600);
      const props = (margin: string) =>
        source === 'inline'
          ? { layoutStyle: { overflowClipMargin: margin } }
          : { layoutClipMargin: margin };
      const view = renderWithRoot(
        <ToggleLayout side="left" {...props('20px')} />,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Toggle panel' }),
      );
      const { panel, animations } = await freezeSlide();
      await act(async () => new Promise(requestAnimationFrame));
      const layout = screen.getByTestId('bounded-layout');
      const [x, y] = outsidePoint('left', layout.getBoundingClientRect());
      expect(panel.contains(document.elementFromPoint(x, y))).toBe(false);
      expect(getComputedStyle(layout).overflowClipMargin).toBe('0px');
      view.rerender(<ToggleLayout side="left" {...props('40px')} />);
      expect(getComputedStyle(layout).overflowClipMargin).toBe('0px');
      await act(async () =>
        animations.forEach((animation) => animation.finish()),
      );
      await expectIdleOverflow();
      expect(getComputedStyle(layout).overflowClipMargin).toBe('40px');
    },
  );

  it.each([
    ['left', 'overflowInline'],
    ['bottom', 'overflowBlock'],
  ] as const)(
    'contains motion when %s logical overflow changes during the slide',
    async (side, property) => {
      await page.viewport(800, 600);
      const view = renderWithRoot(
        <ToggleLayout
          side={side}
          layoutStyle={{ overflow: 'visible', [property]: 'hidden' }}
        />,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Toggle panel' }),
      );
      const { panel, animations } = await freezeSlide();
      view.rerender(
        <ToggleLayout
          side={side}
          layoutStyle={{ overflow: 'visible', [property]: 'visible' }}
        />,
      );
      const layout = screen.getByTestId('bounded-layout');
      expect(getComputedStyle(layout).overflowX).toBe('clip');
      expect(getComputedStyle(layout).overflowY).toBe('clip');
      const [x, y] = outsidePoint(side, layout.getBoundingClientRect());
      expect(panel.contains(document.elementFromPoint(x, y))).toBe(false);
      await act(async () =>
        animations.forEach((animation) => animation.finish()),
      );
      await expectIdleOverflow();
      expect(getComputedStyle(layout).overflowX).toBe('visible');
      expect(getComputedStyle(layout).overflowY).toBe('visible');
    },
  );

  it.each([
    { overflow: 'visible' },
    { overflow: 'visible', overflowX: 'auto', overflowY: 'visible' },
    { overflow: 'hidden scroll' },
  ] as CSSProperties[])(
    'temporarily contains motion and restores the latest inline overflow %o',
    async (layoutStyle) => {
      await page.viewport(800, 600);
      const view = renderWithRoot(
        <ToggleLayout side="left" layoutStyle={layoutStyle} />,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Toggle panel' }),
      );
      const { animations } = await freezeSlide();
      const layout = screen.getByTestId('bounded-layout');
      expect(getComputedStyle(layout).overflowX).toBe('clip');
      expect(getComputedStyle(layout).overflowY).toBe('clip');

      // Styles updated during motion must win when the temporary clip is released.
      view.rerender(
        <ToggleLayout
          side="left"
          layoutStyle={{ overflow: 'auto', overflowX: 'hidden' }}
        />,
      );
      expect(getComputedStyle(layout).overflowX).toBe('clip');
      await act(async () =>
        animations.forEach((animation) => animation.finish()),
      );
      await waitFor(() => {
        expect(getComputedStyle(layout).overflowX).toBe('hidden');
        expect(getComputedStyle(layout).overflowY).toBe('auto');
      });
    },
  );

  it.each([
    ['auto', 'none'],
    ['none', 'auto'],
  ] as const)(
    'preserves an explicit panel pointer policy of %s',
    async (panelPointerEvents, layoutPointerEvents) => {
      await page.viewport(800, 600);
      renderWithRoot(
        <ToggleLayout
          side="left"
          initiallyOpen
          panelPointerEvents={panelPointerEvents}
          layoutPointerEvents={layoutPointerEvents}
        />,
      );
      const button = await screen.findByRole('button', {
        name: 'Panel content',
      });
      expect(getComputedStyle(button).pointerEvents).toBe(panelPointerEvents);
      expect(hit(button)).toBe(panelPointerEvents === 'auto');
      expect(hit(screen.getByRole('separator'))).toBe(
        layoutPointerEvents === 'auto',
      );
    },
  );

  it.each([
    ['Layout', true],
    ['Layout', false],
    ['ancestor', true],
    ['ancestor', false],
  ] as const)(
    'inherits disabled pointer input from %s with transitions %s',
    async (source, hasTransition) => {
      await page.viewport(800, 600);
      const pointerProps =
        source === 'Layout'
          ? { layoutPointerEvents: 'none' as const }
          : { ancestorPointerEvents: 'none' as const };
      const view = renderWithRoot(
        <ToggleLayout
          side="left"
          hasTransition={hasTransition}
          {...pointerProps}
        />,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Toggle panel' }),
      );
      const animations = hasTransition ? (await freezeSlide()).animations : [];
      const button = await screen.findByRole('button', {
        name: 'Panel content',
      });
      const handler = screen.getByRole('separator');
      expect(getComputedStyle(button).pointerEvents).toBe('none');
      expect(getComputedStyle(handler).pointerEvents).toBe('none');
      expect(hit(button)).toBe(false);
      expect(hit(handler)).toBe(false);

      // Inherited policy can change while the slide is still in progress.
      view.rerender(<ToggleLayout side="left" hasTransition={hasTransition} />);
      await waitFor(() => {
        expect(getComputedStyle(button).pointerEvents).toBe('auto');
        expect(hit(handler)).toBe(true);
      });
      await act(async () =>
        animations.forEach((animation) => animation.finish()),
      );
      await expectIdleOverflow();
      view.rerender(
        <ToggleLayout
          side="left"
          hasTransition={hasTransition}
          {...pointerProps}
        />,
      );
      expect(getComputedStyle(button).pointerEvents).toBe('none');
      expect(hit(handler)).toBe(false);
    },
  );

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
        if (side === 'top') {
          // Content can settle while the panel is paused; overflow stays outside.
          await act(async () => {
            screen
              .getByTestId('bounded-layout')
              .querySelector('[data-element="Inner"]')!
              .getAnimations()
              .forEach((animation) => animation.finish());
          });
        }
        const layout = screen
          .getByTestId('bounded-layout')
          .getBoundingClientRect();
        const [x, y] = outsidePoint(side, layout);
        expect(panel.contains(document.elementFromPoint(x, y))).toBe(false);
        expect(hit(screen.getByTestId('content-overflow'))).toBe(false);
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
        expect(hit(screen.getByTestId('content-overflow'))).toBe(true);
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

  it('keeps clipping until all simultaneous panels settle and cleans up on unmount', async () => {
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
    const right = screen.getByTestId('right-panel');
    await waitFor(() => expect(right.getAnimations().length).toBe(0));
    expect(hit(screen.getByTestId('right-overflow'))).toBe(false);
    expect(hit(screen.getByTestId('left-overflow'))).toBe(false);
    view.rerender(<Pair open removeLeft />);
    expect(screen.queryByTestId('left-panel')).toBeNull();
    await waitFor(() =>
      expect(hit(screen.getByTestId('right-overflow'))).toBe(true),
    );
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
});
