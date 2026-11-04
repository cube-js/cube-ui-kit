import { renderWithRoot, screen, waitFor } from '../../test';
import { Select } from '../fields/Select/Select';

/**
 * The run's width is measured, not laid out: the run is a SIBLING of the row's
 * `<button>`, so the row can only reserve space for it through the
 * `--actions-width` the wrapper publishes. A row that mounts inside a hidden
 * container (a closed panel or tray) measures a run with no box. These specs
 * hold the wrapper to re-measuring once that container is shown, which only a
 * real browser can observe: jsdom reports every width as 0.
 */

/**
 * The container is shown and hidden through the DOM, not a render: the bug is a
 * row whose own props do not change when its container opens. A render of the
 * row would hand the wrapper a new `actions` element and re-measure it anyway,
 * which is not what a closed panel elsewhere in the tree does.
 */
function renderPanel({ isShown = false } = {}) {
  renderWithRoot(
    <div data-qa="Panel" hidden={!isShown}>
      <Select aria-label="Agent" defaultSelectedKey="one" width="200px">
        <Select.Item key="one">A rather long agent name</Select.Item>
        <Select.Item key="two">Another agent</Select.Item>
      </Select>
    </div>,
  );

  const panel = screen.getByTestId('Panel');

  return {
    setShown(shown: boolean) {
      panel.hidden = !shown;
    },
  };
}

/** Two frames: the observers' notifications, then whatever they caused. */
async function settle() {
  for (let i = 0; i < 2; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

function getParts() {
  const trigger = screen.getByRole('button', { name: /Agent/, hidden: true });
  const wrapper = trigger.parentElement!;
  // Scoped to a DIRECT child: `Item` keeps its own placeholder column under the
  // same element name inside the button.
  const run = wrapper.querySelector<HTMLElement>(
    ':scope > [data-element="Actions"]',
  )!;

  return { trigger, wrapper, run };
}

function publishedWidth(wrapper: HTMLElement) {
  return wrapper.style.getPropertyValue('--actions-width');
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

  it('reserves it before the first frame the row is painted in', async () => {
    const panel = renderPanel();
    const { wrapper, run } = getParts();
    const seen: string[] = [];

    // Observers are notified in the order they were created, and all of them
    // before the frame is painted. This one is created after the wrapper's, so
    // what it reads is what that frame shows.
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) seen.push(publishedWidth(wrapper));
    });

    observer.observe(run);

    try {
      panel.setShown(true);

      await waitFor(() => expect(seen.length).toBeGreaterThan(0));

      expect(seen[0]).toBe(`${run.offsetWidth}px`);
    } finally {
      observer.disconnect();
    }
  });

  it('keeps the measured width while the container is hidden again', async () => {
    const panel = renderPanel({ isShown: true });
    const { wrapper, run } = getParts();
    const width = `${run.offsetWidth}px`;

    expect(run.offsetWidth).toBeGreaterThan(0);
    expect(publishedWidth(wrapper)).toBe(width);

    panel.setShown(false);

    // A hidden run reads 0 wide. Publishing that would re-render every row in
    // the container each time it closes, and again each time it opens.
    await settle();

    expect(run.getClientRects()).toHaveLength(0);
    expect(publishedWidth(wrapper)).toBe(width);
  });
});
