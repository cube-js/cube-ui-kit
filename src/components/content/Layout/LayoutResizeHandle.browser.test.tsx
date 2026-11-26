import { page, userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { Block } from '../../Block';

import { Layout } from './index';

// vitest/browser's keyboard is not wrapped in act, and each key renders.
function press(keys: string) {
  return act(async () => {
    await userEvent.keyboard(keys);
  });
}

function part(handle: HTMLElement, name: 'Line' | 'Grip' | 'TouchArea') {
  return handle.querySelector<HTMLElement>(`[data-element="${name}"]`)!;
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

// The centre of a part along the handle's thickness.
function centre(element: HTMLElement) {
  const { left, width } = element.getBoundingClientRect();

  return left + width / 2;
}

function PanelLayout({
  side = 'left',
  size = 200,
  borderWidth,
}: {
  side?: 'left' | 'right';
  size?: number;
  /** Stands in for the .5px hairline that dense screens get. */
  borderWidth?: string;
}) {
  return (
    <div
      style={{
        width: 800,
        height: 400,
        display: 'flex',
        ...(borderWidth ? { '--border-width': borderWidth } : null),
      }}
    >
      <Layout>
        <Layout.Panel
          qa="panel"
          side={side}
          isResizable
          size={size}
          minSize={150}
          maxSize={300}
        >
          Panel
        </Layout.Panel>
        <Layout.Content>Content</Layout.Content>
      </Layout>
    </div>
  );
}

function PaneRow() {
  return (
    <div style={{ width: 800, height: 300, display: 'flex' }}>
      <Layout.Pane qa="pane" isResizable resizeEdge="right" size={200}>
        Pane
      </Layout.Pane>
      <Layout.Pane qa="beside" flexGrow={1}>
        Beside
      </Layout.Pane>
    </div>
  );
}

describe('Layout resize handle', () => {
  beforeEach(async () => {
    await page.viewport(1000, 700);
  });

  it("leaves the panel's own border as its edge at rest", () => {
    renderWithRoot(<PanelLayout />);

    const line = part(screen.getByRole('separator'), 'Line');

    expect(getComputedStyle(line).backgroundColor).toBe(TRANSPARENT);
  });

  it('turns the panel edge into a 2px line on hover, centred on its border', async () => {
    renderWithRoot(<PanelLayout />);

    const handle = screen.getByRole('separator');
    const line = part(handle, 'Line');
    const panel = screen.getByTestId('panel').getBoundingClientRect();

    // React Aria ignores a hover until a pointer move sets the modality.
    await act(async () => {
      await userEvent.hover(document.body);
      await userEvent.hover(handle);
    });

    await waitFor(() => {
      expect(line.getBoundingClientRect().width).toBe(2);
    });
    expect(getComputedStyle(line).backgroundColor).not.toBe(TRANSPARENT);
    // The panel's 1px border is its last pixel; the line widens to both sides.
    expect(centre(line)).toBe(panel.right - 0.5);
  });

  // Dense screens draw borders as a .5px hairline. The line in use widens to
  // 1.5px around it, and the grip and the touch target stay on its centre.
  it('keeps the line, the grip and the touch target on the centre of a hairline edge', async () => {
    renderWithRoot(<PanelLayout borderWidth=".5px" />);

    const handle = screen.getByRole('separator');
    const line = part(handle, 'Line');
    const grip = part(handle, 'Grip');
    const area = part(handle, 'TouchArea');

    grip.style.display = 'block';
    area.style.display = 'block';

    expect(line.getBoundingClientRect().width).toBe(0.5);

    const edge = centre(line);

    expect(centre(grip)).toBe(edge);
    expect(centre(area)).toBe(edge);

    await press('{Tab}');

    await waitFor(() => {
      expect(line.getBoundingClientRect().width).toBe(1.5);
    });
    expect(centre(line)).toBe(edge);
    expect(centre(grip)).toBe(edge);
  });

  it("draws the pane's edge at rest and thickens it into the pane on keyboard focus", async () => {
    renderWithRoot(<PaneRow />);

    const pane = screen.getByTestId('pane');
    const line = part(screen.getByRole('separator'), 'Line');
    const paneRight = pane.getBoundingClientRect().right;

    expect(getComputedStyle(line).backgroundColor).not.toBe(TRANSPARENT);
    expect(line.getBoundingClientRect().width).toBe(1);
    expect(line.getBoundingClientRect().right).toBe(paneRight);

    await press('{Tab}');

    await waitFor(() => {
      expect(line.getBoundingClientRect().width).toBe(2);
    });
    expect(line.getBoundingClientRect().right).toBe(paneRight);
    expect(pane).toHaveAttribute('data-focused');
  });

  // `hover: none` and `pointer: coarse` show these. Chromium emulates both only
  // through touch emulation, and `hover: none` outlives turning it off, which
  // would leak into the specs after this one. So the test shows them itself
  // and checks where they land.
  it("centres the touch grip and the 20px touch target on the panel's border", () => {
    renderWithRoot(<PanelLayout />);

    const handle = screen.getByRole('separator');
    // The middle of the panel's 1px border, its last pixel.
    const edge =
      screen.getByTestId('panel').getBoundingClientRect().right - 0.5;
    const gripElement = part(handle, 'Grip');
    const areaElement = part(handle, 'TouchArea');

    gripElement.style.display = 'block';
    areaElement.style.display = 'block';

    const grip = gripElement.getBoundingClientRect();
    const area = areaElement.getBoundingClientRect();
    const y = grip.top + grip.height / 2;

    expect(grip.width).toBe(4);
    expect(grip.height).toBe(24);
    expect(centre(gripElement)).toBe(edge);
    expect(area.width).toBe(20);
    expect(centre(areaElement)).toBe(edge);

    for (const x of [edge - 9, edge + 9]) {
      expect(
        document.elementFromPoint(x, y)?.closest('[role="separator"]'),
      ).toBe(handle);
    }
  });

  // The item after a pane paints over anything past the pane's edge, so the
  // grip and the touch target stay inside the pane, as its edge line does.
  it("keeps the pane's touch grip and 20px touch target inside the pane", () => {
    renderWithRoot(<PaneRow />);

    const handle = screen.getByRole('separator');
    const edge = screen.getByTestId('pane').getBoundingClientRect().right;
    const gripElement = part(handle, 'Grip');
    const areaElement = part(handle, 'TouchArea');

    gripElement.style.display = 'block';
    areaElement.style.display = 'block';

    const grip = gripElement.getBoundingClientRect();
    const area = areaElement.getBoundingClientRect();
    const y = grip.top + grip.height / 2;

    expect(grip.right).toBe(edge);
    expect(grip.width).toBe(4);
    expect(area.right).toBe(edge);
    expect(area.width).toBe(20);

    for (const x of [edge - 19, edge - 1]) {
      expect(
        document.elementFromPoint(x, y)?.closest('[role="separator"]'),
      ).toBe(handle);
    }
  });

  it("applies a pane's styles for its handle and the handle's parts", () => {
    renderWithRoot(
      <div style={{ width: 800, height: 300, display: 'flex' }}>
        <Layout.Pane
          isResizable
          size={200}
          styles={{
            ResizeHandler: { cursor: 'pointer' },
            Line: { fill: '#danger' },
            Grip: { fill: '#danger' },
            TouchArea: { fill: '#danger' },
          }}
        >
          Pane
        </Layout.Pane>
        <Block qa="reference" fill="#danger">
          Reference
        </Block>
      </div>,
    );

    const handle = screen.getByRole('separator');
    const danger = getComputedStyle(
      screen.getByTestId('reference'),
    ).backgroundColor;

    expect(getComputedStyle(handle).cursor).toBe('pointer');

    for (const name of ['Line', 'Grip', 'TouchArea'] as const) {
      expect(getComputedStyle(part(handle, name)).backgroundColor).toBe(danger);
    }
  });

  it('hides the grip and the wider target where a pointer can hover', () => {
    renderWithRoot(<PanelLayout />);

    const handle = screen.getByRole('separator');

    expect(getComputedStyle(part(handle, 'Grip')).display).toBe('none');
    expect(getComputedStyle(part(handle, 'TouchArea')).display).toBe('none');
  });

  it.each([
    ['left', 150, 'e-resize'],
    ['left', 300, 'w-resize'],
    ['left', 200, 'col-resize'],
    ['right', 150, 'w-resize'],
    ['right', 300, 'e-resize'],
  ] as const)(
    'shows which way a %s panel of %ipx can still move',
    (side, size, cursor) => {
      renderWithRoot(<PanelLayout side={side} size={size} />);

      expect(getComputedStyle(screen.getByRole('separator')).cursor).toBe(
        cursor,
      );
    },
  );

  it('shows a panel squeezed to its minimum as unable to move', async () => {
    renderWithRoot(
      <div style={{ width: 500, height: 300, display: 'flex' }}>
        <Layout>
          <Layout.Panel side="left" isResizable>
            Panel
          </Layout.Panel>
          <Layout.Content>Content</Layout.Content>
        </Layout>
      </div>,
    );

    const handle = screen.getByRole('separator');

    // The default 200px minimum is more than the room the content leaves,
    // once the Layout has measured itself.
    await waitFor(() => {
      expect(handle).toHaveAttribute('aria-valuemax', '200');
    });
    expect(handle).toHaveAttribute('aria-valuemin', '200');
    expect(handle).toHaveAttribute('aria-valuenow', '200');
    expect(getComputedStyle(handle).cursor).toBe('col-resize');
  });

  it("ends a pane's value range at its container's room when it has no maximum", async () => {
    renderWithRoot(
      <div style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
        <Layout.Pane isResizable resizeEdge="bottom" size={150} minSize={80}>
          Pane
        </Layout.Pane>
        <div style={{ flex: '1 0 0' }} />
      </div>,
    );

    const handle = screen.getByRole('separator');

    expect(handle).toHaveAttribute('aria-valuenow', '150');
    expect(handle).toHaveAttribute('aria-valuemin', '80');

    // Before any focus: a screen reader browsing the page reads it too.
    await waitFor(() => {
      expect(handle).toHaveAttribute('aria-valuemax', '400');
    });

    await act(async () => {
      (
        handle.closest('[data-qa="LayoutPane"]')!.parentElement as HTMLElement
      ).style.height = '500px';
    });

    await waitFor(() => {
      expect(handle).toHaveAttribute('aria-valuemax', '500');
    });
  });

  // A pane on its own can grow past its container, so the room bounds only
  // the range: the value follows the pane, and the cursor shows no limit.
  it('keeps the value and cursor of a pane larger than its container', async () => {
    renderWithRoot(
      <div style={{ width: 150, height: 300, display: 'flex' }}>
        <Layout.Pane isResizable size={200}>
          Pane
        </Layout.Pane>
      </div>,
    );

    const handle = screen.getByRole('separator');

    expect(handle).toHaveAttribute('aria-valuenow', '200');
    // Once the container is measured: 150px of room, below the pane.
    await waitFor(() => {
      expect(handle).toHaveAttribute('aria-valuemax', '200');
    });
    expect(getComputedStyle(handle).cursor).toBe('col-resize');
  });

  it('stops a pane at the room the pane beside it leaves on End', async () => {
    const onSizeChange = vi.fn();

    renderWithRoot(
      <div style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
        <Layout.Pane
          qa="pane"
          isResizable
          resizeEdge="bottom"
          defaultSize={150}
          minSize={80}
          maxSize={1000}
          flexShrink={1}
          onSizeChange={onSizeChange}
        >
          Pane
        </Layout.Pane>
        <Layout.Pane
          qa="beside"
          resizeEdge="bottom"
          defaultSize={150}
          minSize={80}
          flexShrink={1}
        >
          Beside
        </Layout.Pane>
        <div style={{ flex: '1 0 0' }} />
      </div>,
    );

    screen.getByRole('separator').focus();
    await press('{End}');

    await waitFor(() => {
      expect(screen.getByTestId('beside').getBoundingClientRect().height).toBe(
        80,
      );
    });
    expect(screen.getByTestId('pane').getBoundingClientRect().height).toBe(320);
    expect(onSizeChange).toHaveBeenLastCalledWith(320);
  });
});
