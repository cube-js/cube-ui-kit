import { Activity, Profiler, useState } from 'react';
import { userEvent as browserUserEvent } from 'vitest/browser';

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
 * is painted. This one is created after the one that watches runs, so what it
 * reads is what that frame shows. Reading the column's width resolves any
 * transition at its current point, so a column sliding open reads near 0 here.
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
    // An earlier spec's click leaves the pointer where this row reappears, so
    // the reopened row can come back hovered. That is the pointer's state, not
    // a change the wrapper made.
    expect(
      changes.filter(({ attributeName }) => attributeName !== 'data-hovered'),
    ).toEqual([]);
  });

  it('publishes a whole panel of rows in one commit when it opens', async () => {
    let wrappers: HTMLElement[] = [];
    let widths: string[] = [];
    // How many rows each commit published a new width for, kept only for the
    // commits that published any. The rest — the transition reset, or a hover
    // or focus change from whatever else the page is running — publish none,
    // so they cannot make this flaky.
    const publishes: number[] = [];

    function recordPublishes() {
      const next = wrappers.map(publishedWidth);
      const changed = next.filter((width, i) => width !== widths[i]).length;

      widths = next;

      if (changed) publishes.push(changed);
    }

    renderWithRoot(
      <div data-qa="Panel" hidden>
        <Profiler id="Rows" onRender={recordPublishes}>
          {Array.from({ length: 10 }, (_, i) => (
            <ItemButton
              key={i}
              actions={<ItemButton.Action aria-label="Pin" />}
            >
              {`Row ${i}`}
            </ItemButton>
          ))}
        </Profiler>
      </div>,
    );
    await settle();

    const rows = screen
      .getAllByRole('button', { name: /^Row/, hidden: true })
      .map((trigger) => getParts(new RegExp(`^${trigger.textContent}$`)));

    wrappers = rows.map(({ wrapper }) => wrapper);
    widths = wrappers.map(publishedWidth);
    screen.getByTestId('Panel').hidden = false;

    await waitFor(() => {
      for (const { wrapper, run } of rows) {
        expect(run.offsetWidth).toBeGreaterThan(0);
        expect(publishedWidth(wrapper)).toBe(`${run.offsetWidth}px`);
      }
    });
    await settle();

    // Every row resized at once, so one commit publishes them all, not one
    // commit per row.
    expect(publishes).toEqual([rows.length]);
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

    // Unlike the other cases, the observer that watches runs is created again
    // AFTER this recorder, on reveal: no run was observed while the row was
    // hidden. The reveal measures in the wrapper's layout effect, before any
    // observer is notified, so the first frame is still what this records.
    const watch = watchFirstFrame(parts);

    rerender(renderRow('visible', 2));

    const frame = await watch.first();

    expect(parts.run.offsetWidth).toBeGreaterThan(width);
    expect(frame.published).toBe(`${parts.run.offsetWidth}px`);
    expect(frame.column).toBe(parts.run.offsetWidth);
  });
});

/**
 * An `ItemButton` whose actions show only on hover. At rest the run is hidden,
 * so the row must lay out as if it had none, unless it was asked to keep the
 * run's space.
 */
describe('ItemButton with auto-hidden actions', () => {
  function renderRow(props: { preserveActionsSpace?: boolean } = {}) {
    renderWithRoot(
      <div>
        <div data-qa="Away">away</div>
        <ItemButton
          qa="Row"
          suffix={<span>2h</span>}
          actions={<ItemButton.Action aria-label="More" />}
          autoHideActions
          {...props}
        >
          Title
        </ItemButton>
      </div>,
    );

    const row = screen.getByTestId('Row');

    return {
      row,
      wrapper: row.parentElement!,
      label: row.querySelector<HTMLElement>('[data-element="Label"]')!,
      suffix: row.querySelector<HTMLElement>('[data-element="Suffix"]')!,
    };
  }

  /**
   * The browser's real pointer stays wherever the last spec in this page left
   * it, and a row rendered under it starts hovered, with its actions shown.
   * Parking it beside the row is what puts the row at rest.
   */
  async function parkPointer(wrapper: HTMLElement) {
    await browserUserEvent.hover(screen.getByTestId('Away'));
    await waitFor(
      () => expect(wrapper).not.toHaveAttribute('data-actions-shown'),
      { timeout: 2000 },
    );
  }

  it('keeps the suffix’s end padding while the actions are hidden', async () => {
    const { row, wrapper, label, suffix } = renderRow();
    const endPadding = () => getComputedStyle(suffix).paddingRight;

    await parkPointer(wrapper);

    // `$inline-padding`, which the label also keeps at its start. Awaited: a
    // row that started under the pointer animates its padding back.
    await waitFor(() =>
      expect(endPadding()).toBe(getComputedStyle(label).paddingLeft),
    );
    expect(parseFloat(endPadding())).toBeGreaterThan(0);

    // Shown, the run carries its own side padding.
    await browserUserEvent.hover(row);
    await waitFor(() => expect(endPadding()).toBe('0px'));
  });

  it('keeps the actions’ space with `preserveActionsSpace`, so the suffix stays put', async () => {
    const { row, wrapper, suffix } = renderRow({ preserveActionsSpace: true });

    await parkPointer(wrapper);
    await waitFor(
      () => expect(parseFloat(publishedWidth(wrapper))).toBeGreaterThan(0),
      { timeout: 2000 },
    );
    await settle();

    const end = suffix.getBoundingClientRect().right;

    expect(row.getBoundingClientRect().right - end).toBeGreaterThanOrEqual(
      parseFloat(publishedWidth(wrapper)),
    );

    await browserUserEvent.hover(row);
    await waitFor(() => expect(wrapper).toHaveAttribute('data-actions-shown'));
    // Past the run's fade, so a shift that comes with it has happened.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(suffix.getBoundingClientRect().right).toBe(end);
  });
});
