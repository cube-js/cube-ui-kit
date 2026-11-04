import { Activity, useState } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../test';
import { Select } from '../fields/Select/Select';

import { ItemButton } from './ItemButton/ItemButton';

/**
 * The run's width is measured, not laid out: the run is a SIBLING of the row's
 * `<button>`, so the row can only reserve space for it through the
 * `--actions-width` the wrapper publishes. A row that mounts inside a hidden
 * container (a closed panel or tray) measures a run with no box. These specs
 * hold the wrapper to re-measuring once that container is shown, which only a
 * real browser can observe: jsdom reports every width as 0.
 */

function AgentSelect() {
  return (
    <Select aria-label="Agent" defaultSelectedKey="one" width="25x">
      <Select.Item key="one">A rather long agent name</Select.Item>
      <Select.Item key="two">Another agent</Select.Item>
    </Select>
  );
}

/**
 * The container is shown and hidden through the DOM, not a render: a closed
 * panel elsewhere in the tree opens without the row's own props changing.
 */
function renderPanel({ isShown = false } = {}) {
  renderWithRoot(
    <div data-qa="Panel" hidden={!isShown}>
      <AgentSelect />
    </div>,
  );

  const panel = screen.getByTestId('Panel');

  return {
    setShown(shown: boolean) {
      panel.hidden = !shown;
    },
  };
}

/**
 * The other way a panel opens: a render that shows it and re-renders the row
 * with it. An `ItemButton` with inline actions, not the `Select`: compiled, the
 * `Select` keeps its caret element across the render, so the wrapper would see
 * no change and measure in its observer instead — the path the DOM show covers.
 */
function StatefulPanel() {
  const [isShown, setIsShown] = useState(false);

  return (
    <>
      <button type="button" data-qa="Show" onClick={() => setIsShown(true)}>
        show
      </button>
      <div hidden={!isShown}>
        <ItemButton actions={<ItemButton.Action aria-label="Pin" />}>
          Row
        </ItemButton>
      </div>
    </>
  );
}

function getParts(name: RegExp = /Agent/) {
  const trigger = screen.getByRole('button', { name, hidden: true });
  const wrapper = trigger.parentElement!;
  // Scoped to a DIRECT child: `Item` keeps its own placeholder column under the
  // same element name inside the button.
  const run = wrapper.querySelector<HTMLElement>(
    ':scope > [data-element="Actions"]',
  )!;
  const column = trigger.querySelector<HTMLElement>(
    '[data-element="Actions"]',
  )!;

  return { trigger, wrapper, run, column };
}

function publishedWidth(wrapper: HTMLElement) {
  return wrapper.style.getPropertyValue('--actions-width');
}

/**
 * What the first frame with a visible run shows: the published width and the
 * row's laid-out placeholder column.
 *
 * Observers are notified in the order they were created, all before the frame
 * is painted. This one is created after the wrapper's, so what it reads is what
 * that frame shows. Reading the column's width resolves any transition at its
 * current point, so a column sliding open reads near 0 here.
 */
function watchFirstFrame({
  wrapper,
  run,
  column,
}: ReturnType<typeof getParts>) {
  const frames: { published: string; column: number }[] = [];
  const observer = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width > 0) {
      frames.push({
        published: publishedWidth(wrapper),
        column: column.offsetWidth,
      });
    }
  });

  observer.observe(run);

  return {
    async first() {
      await waitFor(() => expect(frames.length).toBeGreaterThan(0));
      observer.disconnect();

      return frames[0];
    },
  };
}

/** Two frames: the observers' notifications, then whatever they caused. */
async function settle() {
  for (let i = 0; i < 2; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

describe('ItemActionsWrapper in a hidden container', () => {
  it('reserves the run once the container is shown', async () => {
    const panel = renderPanel();
    const { trigger, wrapper, run } = getParts();

    expect(publishedWidth(wrapper)).toBe('0px');

    panel.setShown(true);

    await waitFor(() => {
      expect(run.offsetWidth).toBeGreaterThan(0);
      expect(publishedWidth(wrapper)).toBe(`${run.offsetWidth}px`);
    });

    // What the user sees: the caret no longer draws over the selected name.
    const label = trigger.querySelector('[data-element="Label"]')!;
    const caret = run.querySelector('[data-element="ActionIcon"]')!;

    expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
      caret.getBoundingClientRect().left,
    );
  });

  it('starts at the full width in the first frame it is painted in', async () => {
    const panel = renderPanel();
    const parts = getParts();
    const watch = watchFirstFrame(parts);

    panel.setShown(true);

    const frame = await watch.first();

    expect(frame.published).toBe(`${parts.run.offsetWidth}px`);
    // Jumps, rather than sliding open over the label.
    expect(frame.column).toBe(parts.run.offsetWidth);
  });

  it('starts at the full width when a render shows the container', async () => {
    renderWithRoot(<StatefulPanel />);

    const parts = getParts(/Row/);
    const watch = watchFirstFrame(parts);

    // The row re-renders in the commit that shows it, so the wrapper measures
    // in its own effect rather than in the observer.
    await userEvent.click(screen.getByTestId('Show'));

    const frame = await watch.first();

    expect(frame.published).toBe(`${parts.run.offsetWidth}px`);
    expect(frame.column).toBe(parts.run.offsetWidth);
  });

  it('follows the run when a prop change replaces it while hidden', async () => {
    const renderRow = (autoHideActions: boolean) => (
      <div data-qa="Panel" hidden>
        <ItemButton
          autoHideActions={autoHideActions}
          actions={<ItemButton.Action aria-label="Pin" />}
        >
          Row
        </ItemButton>
      </div>
    );
    const { rerender } = renderWithRoot(renderRow(true));

    // Dropping `autoHideActions` swaps the transitioned run for a plain one,
    // whose width stays published.
    rerender(renderRow(false));

    const { wrapper, run } = getParts(/Row/);

    expect(publishedWidth(wrapper)).toBe('0px');

    screen.getByTestId('Panel').hidden = false;

    await waitFor(() => {
      expect(run.offsetWidth).toBeGreaterThan(0);
      expect(publishedWidth(wrapper)).toBe(`${run.offsetWidth}px`);
    });
  });

  it('leaves a measured row alone while its container closes and reopens', async () => {
    const panel = renderPanel({ isShown: true });
    const { trigger, wrapper, run } = getParts();
    const width = `${run.offsetWidth}px`;

    expect(run.offsetWidth).toBeGreaterThan(0);
    expect(publishedWidth(wrapper)).toBe(width);

    const changes: MutationRecord[] = [];
    const mutations = new MutationObserver((records) => {
      changes.push(...records);
    });

    mutations.observe(wrapper, { attributes: true });
    mutations.observe(trigger, { attributes: true });

    // A hidden run reads 0 wide, and a reopened one reads what it read before.
    // Neither is a change: acting on them would re-render every row in the
    // container each time it closes, and again each time it opens.
    panel.setShown(false);
    await settle();

    expect(run.getClientRects()).toHaveLength(0);
    expect(publishedWidth(wrapper)).toBe(width);

    panel.setShown(true);
    await settle();

    mutations.disconnect();

    expect(publishedWidth(wrapper)).toBe(width);
    expect(changes).toEqual([]);
  });

  it('starts at the full width when an Activity reveals a row it hid', async () => {
    const renderRow = (mode: 'visible' | 'hidden', count: number) => (
      <Activity mode={mode}>
        <ItemButton
          actions={Array.from({ length: count }, (_, i) => (
            <ItemButton.Action key={i} aria-label={`Action ${i}`} />
          ))}
        >
          Row
        </ItemButton>
      </Activity>
    );
    const { rerender } = renderWithRoot(renderRow('visible', 1));
    const parts = getParts(/Row/);
    const width = parts.run.offsetWidth;

    // React hides this row itself, and tears its effects down — the observer
    // with them — before the run loses its box. The run then grows unseen.
    rerender(renderRow('hidden', 1));
    rerender(renderRow('hidden', 2));
    await waitFor(() => expect(parts.run.childElementCount).toBe(2));

    const watch = watchFirstFrame(parts);

    rerender(renderRow('visible', 2));

    const frame = await watch.first();

    expect(parts.run.offsetWidth).toBeGreaterThan(width);
    expect(frame.published).toBe(`${parts.run.offsetWidth}px`);
    expect(frame.column).toBe(parts.run.offsetWidth);
  });
});
