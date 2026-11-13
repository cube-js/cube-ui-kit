import { act } from '@testing-library/react';
import { useState } from 'react';
import { userEvent as browserUserEvent } from 'vitest/browser';

import {
  fireEvent,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { Menu } from '../../actions/Menu';

import { Tab, Tabs } from './Tabs';

/**
 * Renaming a tab from its own menu, in a real browser.
 *
 * This is the flow that had two focus workarounds bolted onto it — a refocus
 * pass in `TabButton` polling on rAF and at 50/200/400ms, and `InlineInput`'s
 * blur-side grace period — because the closing `Menu` used to restore focus to
 * its trigger and commit the rename session out from under the user.
 *
 * jsdom cannot referee that. It resolves `focus()` unconditionally, its blur /
 * focusin ordering around an unmounting element is an approximation, and its
 * timers do not interleave with a real 350ms popover exit or a real
 * `requestAnimationFrame`. The jsdom specs this replaces had to *simulate* the
 * theft with an explicit `menuTrigger.focus()` — which asserts that the grace
 * period works, not that the flow does. Here the race runs for real, so the
 * assertions can be the user's: the caret is in the input, the text is
 * selected, and typing commits.
 */

const EDIT_LABEL = 'Edit tab title';

const renameInput = () =>
  screen.queryByRole('textbox', {
    name: EDIT_LABEL,
  }) as HTMLInputElement | null;

function EditableTabs({
  contextMenu,
  onTitleChange,
}: {
  contextMenu?: 'context-only';
  onTitleChange: (key: unknown, title: string) => void;
}) {
  const [title, setTitle] = useState('Tab 1');

  return (
    <Tabs
      isEditable
      defaultActiveKey="tab1"
      contextMenu={contextMenu}
      menu={<Menu.Item key="rename">Rename</Menu.Item>}
      onTitleChange={(key, next) => {
        setTitle(next as string);
        onTitleChange(key, next as string);
      }}
    >
      <Tab key="tab1" title={title}>
        Content 1
      </Tab>
    </Tabs>
  );
}

/** The selection indicator: the one child of the tab list that holds no tab. */
const tabIndicator = () =>
  [...screen.getByRole('tablist').children].find(
    (child) => !child.querySelector('[role="tab"]'),
  );

/** The ⋮ button that opens a tab's menu. */
const menuTriggerFor = (tabName: string) => {
  const tab = screen.getByRole('tab', { name: tabName });
  return tab.parentElement?.querySelector(
    'button[aria-haspopup="true"]',
  ) as HTMLButtonElement;
};

describe('Tabs rename from the tab menu', () => {
  it('lands the caret in the input with the title selected', async () => {
    const user = userEvent.setup();
    const onTitleChange = vi.fn();

    renderWithRoot(<EditableTabs onTitleChange={onTitleChange} />);

    await user.click(menuTriggerFor('Tab 1'));
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));

    const input = await waitFor(() => {
      const el = renameInput();
      expect(el).toBeInTheDocument();
      return el as HTMLInputElement;
    });

    // The hand-off itself: focus has to be in the input and stay there past
    // the popover's ~350ms exit, which is when the old restore fired.
    await waitFor(() => expect(input).toHaveFocus());
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(input).toHaveFocus();
    expect(renameInput()).toBeInTheDocument();
    expect(onTitleChange).not.toHaveBeenCalled();

    // Entering edit mode selects the existing title, so the user can just
    // type over it. jsdom's `select()` does not model a real selection.
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('Tab 1'.length);
  });

  it('commits a typed title with Enter and returns focus to the tab', async () => {
    const user = userEvent.setup();
    const onTitleChange = vi.fn();

    renderWithRoot(<EditableTabs onTitleChange={onTitleChange} />);

    await user.click(menuTriggerFor('Tab 1'));
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));

    const input = await waitFor(() => {
      const el = renameInput();
      expect(el).toBeInTheDocument();
      return el as HTMLInputElement;
    });
    await waitFor(() => expect(input).toHaveFocus());

    // Real typing over the selection, then commit.
    await user.keyboard('Renamed{Enter}');

    await waitFor(() => expect(renameInput()).not.toBeInTheDocument());
    expect(onTitleChange).toHaveBeenCalledWith('tab1', 'Renamed');

    // Editing ends by handing focus back to the tab button.
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Renamed' })).toHaveFocus(),
    );
  });

  it('cancels on Escape without committing', async () => {
    const user = userEvent.setup();
    const onTitleChange = vi.fn();

    renderWithRoot(<EditableTabs onTitleChange={onTitleChange} />);

    await user.click(menuTriggerFor('Tab 1'));
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));

    const input = await waitFor(() => {
      const el = renameInput();
      expect(el).toBeInTheDocument();
      return el as HTMLInputElement;
    });
    await waitFor(() => expect(input).toHaveFocus());

    await user.keyboard('Discarded{Escape}');

    await waitFor(() => expect(renameInput()).not.toBeInTheDocument());
    expect(onTitleChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
  });

  // The sparsest wiring: `contextMenu="context-only"` with no delete handler
  // and no custom actions leaves both `containerRef` and `actionsRef` null, so
  // nothing but the tab button ref is available to the flow.
  it('works from the right-click menu in context-only mode', async () => {
    const onTitleChange = vi.fn();

    renderWithRoot(
      <EditableTabs contextMenu="context-only" onTitleChange={onTitleChange} />,
    );

    fireEvent.contextMenu(screen.getByRole('tab', { name: 'Tab 1' }));

    const rename = await screen.findByRole('menuitem', { name: 'Rename' });
    fireEvent.click(rename);

    const input = await waitFor(() => {
      const el = renameInput();
      expect(el).toBeInTheDocument();
      return el as HTMLInputElement;
    });

    await waitFor(() => expect(input).toHaveFocus());
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(input).toHaveFocus();
    expect(onTitleChange).not.toHaveBeenCalled();
  });
});

/**
 * A radio-type tab is sized by its content, but its label column used to be
 * `max-content` like every other column, so a tab given less room than its
 * title spilled the title out of the tab instead of truncating it — and the
 * auto tooltip, which only fires on a truncated label, never did.
 */
describe('Radio-type tab with a title too long for it', () => {
  const TITLE = 'A title far too long for the tab it names';

  it('truncates the title and shows it in a tooltip', async () => {
    renderWithRoot(
      <Tabs type="radio" defaultActiveKey="a" width="200px">
        <Tab key="a" title={TITLE} />
        <Tab key="b" title="Beta" />
      </Tabs>,
    );

    const [tab] = screen.getAllByRole('tab');
    const label = tab.querySelector('[data-element="Label"]') as HTMLElement;

    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);

    // React Aria ignores a hover until a pointer move sets the modality.
    await browserUserEvent.hover(document.body);
    await browserUserEvent.hover(tab);

    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent(TITLE),
    );
  });
});

/**
 * The radio pill is the Bar, `100%` of the Tabs root with `.5x` padding. It
 * used to be a content box, so in an app with no global border-box reset
 * (`<Root>` sets none) the padding landed on top of the 100%: the pill painted
 * `1x` past the root and into the gap before its sibling. jsdom has no layout.
 */
describe('Radio-type strip next to a sibling', () => {
  const GAP = 10;

  it('keeps the pill inside the Tabs box and clear of the sibling', () => {
    renderWithRoot(
      <div style={{ display: 'flex', gap: GAP }}>
        <Tabs qa="RadioTabs" type="radio" defaultActiveKey="all">
          <Tab key="all" title="All" />
          <Tab key="dashboards" title="Dashboards" />
        </Tabs>
        <div data-qa="Sibling" style={{ width: 80 }} />
      </div>,
    );

    const root = screen.getByTestId('RadioTabs');
    const bar = root.querySelector(':scope > [data-element="Bar"]')!;
    const rootRect = root.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    const siblingRect = screen.getByTestId('Sibling').getBoundingClientRect();

    expect(barRect.left).toBe(rootRect.left);
    expect(barRect.right).toBe(rootRect.right);
    expect(siblingRect.left - barRect.right).toBe(GAP);
  });
});

/**
 * A strip mounted with its LAST tab active, in a bar too narrow for every tab.
 * The active tab is scrolled into view on mount, but that commit lays the tabs
 * out before their actions runs are measured, so every tab is still narrower
 * than it is a frame later. The strip then grows past the edge and the tab that
 * was "in view" ends up clipped or under the add button. jsdom has no layout.
 */
describe('Active tab at the end of a crowded strip', () => {
  const nextFrame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  // Inside `act`: the actions runs publish their widths through state.
  const settle = () =>
    act(async () => {
      for (let i = 0; i < 5; i++) await nextFrame();
    });

  function CrowdedTabs({ activeTitle = 'Preset 2' }: { activeTitle?: string }) {
    return (
      <div style={{ width: 300 }}>
        <Tabs
          autoHideActions
          defaultActiveKey="preset2"
          menu={
            <>
              <Menu.Item key="rename">Rename</Menu.Item>
              <Menu.Item key="delete">Delete</Menu.Item>
            </>
          }
          suffix={<Tabs.Action qa="AddTab" aria-label="Add tab" />}
          onDelete={() => {}}
        >
          <Tab key="default" title="Default" />
          <Tab key="quarterly" title="Quarterly" />
          <Tab key="preset" title="Preset" />
          <Tab key="preset2" title={activeTitle} />
        </Tabs>
      </div>
    );
  }

  // At 0.5 the strip sits on a zoomed-out canvas: the tab's overflow is
  // measured in screen pixels, while the strip scrolls in its own.
  it.each([1, 0.5])(
    'keeps the active tab fully in view once the tabs reach their final size, at scale %s',
    async (scale) => {
      renderWithRoot(
        <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
          <CrowdedTabs />
        </div>,
      );

      const tab = screen.getByTestId('Tab-preset2');
      const scroller = tab.closest('[data-element="Scroll"]') as HTMLElement;
      const addButton = screen.getByTestId('AddTab');

      // Let the actions runs publish their widths and the strip settle.
      await settle();

      // Guard the guard: the strip must overflow, or nothing needs scrolling and
      // the assertions below pass trivially.
      expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);

      const tabRect = tab.parentElement!.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      const addRect = addButton.getBoundingClientRect();

      expect(tabRect.left).toBeGreaterThanOrEqual(scrollRect.left - 0.5);
      expect(tabRect.right).toBeLessThanOrEqual(scrollRect.right + 0.5);
      expect(tabRect.right).toBeLessThanOrEqual(addRect.left + 0.5);
    },
  );

  /** Grow the active tab after the strip has settled, as a counter in its title would. */
  async function growActiveTab(
    rerender: (ui: React.ReactElement) => void,
    scroller: HTMLElement,
  ) {
    const before = scroller.scrollLeft;

    await act(async () => {
      rerender(<CrowdedTabs activeTitle="Preset 2 (999)" />);
    });

    await settle();

    return { before, after: scroller.scrollLeft };
  }

  it('re-scrolls when the active tab grows and the user has not touched the strip', async () => {
    const { rerender } = renderWithRoot(<CrowdedTabs />);
    const tab = screen.getByTestId('Tab-preset2');
    const scroller = tab.closest('[data-element="Scroll"]') as HTMLElement;

    await settle();

    // Put the tab out of view programmatically: no user interaction, so the
    // strip still follows the active tab.
    scroller.scrollLeft = 0;

    const { after } = await growActiveTab(rerender, scroller);

    expect(after).toBeGreaterThan(0);
  });

  it.each(['wheel', 'pointerdown'] as const)(
    'leaves a strip the user scrolled away (%s) alone when the active tab grows',
    async (type) => {
      const { rerender } = renderWithRoot(<CrowdedTabs />);
      const tab = screen.getByTestId('Tab-preset2');
      const scroller = tab.closest('[data-element="Scroll"]') as HTMLElement;

      await settle();

      expect(scroller.scrollLeft).toBeGreaterThan(0);

      // The user scrolls the strip back to its start. A synthetic event does
      // not scroll anything, so the scroll itself is set by hand.
      scroller.dispatchEvent(
        type === 'wheel'
          ? new WheelEvent('wheel', { bubbles: true, deltaX: -1000 })
          : new PointerEvent('pointerdown', { bubbles: true }),
      );
      scroller.scrollLeft = 0;

      const { before, after } = await growActiveTab(rerender, scroller);

      expect(before).toBe(0);
      expect(after).toBe(0);
    },
  );
});

/**
 * Tabs on a zoomable canvas: an ancestor's `transform: scale()` shrinks the
 * tabs on screen, while the indicator is positioned in the tab list's own,
 * unscaled pixels. Nothing re-measures when the scale changes, so the indicator
 * stays under its tab only if what it measured does not depend on the scale.
 * jsdom has no layout.
 */
describe('Tabs inside a scaled ancestor', () => {
  function ScaledTabs({
    scale,
    placement,
  }: {
    scale: number;
    placement: 'top' | 'left';
  }) {
    return (
      <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <Tabs defaultActiveKey="charlie" placement={placement}>
          <Tab key="alpha" title="Alpha" />
          <Tab key="bravo" title="Bravo tab" />
          <Tab key="charlie" title="Charlie" />
        </Tabs>
      </div>
    );
  }

  it.each([
    ['top', 'left', 'width'],
    ['left', 'top', 'height'],
  ] as const)(
    'keeps the indicator under the selected tab with placement="%s", across a zoom',
    async (placement, start, size) => {
      const { rerender } = renderWithRoot(
        <ScaledTabs scale={0.57} placement={placement} />,
      );
      const tab = screen.getByRole('tab', { name: 'Charlie' });

      // Shorter than the test timeout, so a miss reports the positions.
      const expectUnderTab = () =>
        waitFor(
          () => {
            const tabRect = tab.getBoundingClientRect();
            const indicatorRect = tabIndicator()!.getBoundingClientRect();

            expect(indicatorRect[start]).toBeCloseTo(tabRect[start], 0);
            expect(indicatorRect[size]).toBeCloseTo(tabRect[size], 0);
          },
          { timeout: 2000 },
        );

      await expectUnderTab();

      // Zoom in with the same tab selected: nothing re-measures.
      rerender(<ScaledTabs scale={1.5} placement={placement} />);

      await expectUnderTab();
    },
  );
});

/**
 * A tab that changes size with no selection change: a title that loads after
 * the tab is selected (a fallback "Dashboard" becomes the dashboard's own
 * name), or a tab before the selected one that grows and pushes it along.
 * Nothing but the selection, the tab order and a window resize used to
 * re-measure, so the indicator kept the size and place it measured first.
 * jsdom has no layout.
 */
describe('Indicator of a tab that resizes or moves while selected', () => {
  function LoadingTabs({
    firstTitle = 'Model',
    selectedTitle = 'Dashboard',
    keyOrder,
    isReorderable,
  }: {
    firstTitle?: string;
    selectedTitle?: string;
    keyOrder?: string[];
    isReorderable?: boolean;
  }) {
    return (
      <Tabs
        defaultActiveKey="dashboard"
        keyOrder={keyOrder}
        isReorderable={isReorderable}
      >
        <Tab key="model" title={firstTitle} />
        <Tab key="dashboard" title={selectedTitle} />
      </Tabs>
    );
  }

  // Shorter than the test timeout, so a miss reports the positions.
  const expectUnderTab = (tab: HTMLElement) =>
    waitFor(
      () => {
        const tabRect = tab.getBoundingClientRect();
        const indicatorRect = tabIndicator()!.getBoundingClientRect();

        expect(indicatorRect.left).toBeCloseTo(tabRect.left, 0);
        expect(indicatorRect.width).toBeCloseTo(tabRect.width, 0);
      },
      { timeout: 2000 },
    );

  // Selecting a tab changes its colour, not its size, so no resize moves the
  // indicator here: only the new selection does.
  it('moves to a newly selected tab', async () => {
    renderWithRoot(<LoadingTabs />);

    await expectUnderTab(screen.getByRole('tab', { name: 'Dashboard' }));

    const tab = screen.getByRole('tab', { name: 'Model' });

    await userEvent.click(tab);

    await expectUnderTab(tab);
  });

  it('follows the selected tab when its title loads and widens it', async () => {
    const { rerender } = renderWithRoot(<LoadingTabs />);
    const tab = screen.getByRole('tab', { name: 'Dashboard' });

    await expectUnderTab(tab);

    const { width: before } = tab.getBoundingClientRect();

    rerender(<LoadingTabs selectedTitle="2026 Sales Performance Story" />);

    // Guard the guard: the tab must actually widen.
    await waitFor(() =>
      expect(tab.getBoundingClientRect().width).toBeGreaterThan(before + 50),
    );
    await expectUnderTab(tab);
  });

  it('follows the selected tab when a tab before it widens', async () => {
    const { rerender } = renderWithRoot(<LoadingTabs />);
    const tab = screen.getByRole('tab', { name: 'Dashboard' });

    await expectUnderTab(tab);

    const { left: before } = tab.getBoundingClientRect();

    rerender(<LoadingTabs firstTitle="Semantic model of the sales data" />);

    await waitFor(() =>
      expect(tab.getBoundingClientRect().left).toBeGreaterThan(before + 50),
    );
    await expectUnderTab(tab);
  });

  it('measures a list that mounts hidden once it is shown', async () => {
    const HiddenTabs = ({ hidden }: { hidden: boolean }) => (
      <div style={{ display: hidden ? 'none' : 'block' }}>
        <LoadingTabs />
      </div>
    );
    const { rerender } = renderWithRoot(<HiddenTabs hidden />);
    const tab = screen.getByRole('tab', { name: 'Dashboard', hidden: true });

    rerender(<HiddenTabs hidden={false} />);

    await expectUnderTab(tab);
  });

  // Turning reordering on or off replaces the tab list element, as a builder
  // does when it enters edit mode.
  it('keeps following the selected tab after reordering is turned on', async () => {
    const { rerender } = renderWithRoot(<LoadingTabs />);

    await expectUnderTab(screen.getByRole('tab', { name: 'Dashboard' }));

    rerender(<LoadingTabs isReorderable />);

    // A new list holds new tabs.
    const tab = screen.getByRole('tab', { name: 'Dashboard' });

    await expectUnderTab(tab);

    const { width: before } = tab.getBoundingClientRect();

    rerender(
      <LoadingTabs
        isReorderable
        selectedTitle="2026 Sales Performance Story"
      />,
    );

    await waitFor(() =>
      expect(tab.getBoundingClientRect().width).toBeGreaterThan(before + 50),
    );
    await expectUnderTab(tab);
  });

  // No tab changes size here, so only the order itself can re-measure. The
  // compiled build used to drop it.
  it('follows the selected tab when the tabs are reordered', async () => {
    const { rerender } = renderWithRoot(<LoadingTabs />);
    const tab = screen.getByRole('tab', { name: 'Dashboard' });

    await expectUnderTab(tab);

    const { left: before } = tab.getBoundingClientRect();

    rerender(<LoadingTabs keyOrder={['dashboard', 'model']} />);

    await waitFor(() =>
      expect(tab.getBoundingClientRect().left).toBeLessThan(before - 20),
    );
    await expectUnderTab(tab);
  });
});

/**
 * A caller themes the tabs by re-declaring current tokens on `Tabs`. Root
 * resolves the legacy colour aliases once, on the root, so a tab reading one
 * would ignore that override. jsdom does not resolve custom properties, so only
 * a browser shows which value a tab ends up with.
 */
describe('Tabs themed through the caller’s tokens', () => {
  const THEME = {
    '#surface-text-soft': 'rgb(0, 128, 0)',
    '#primary-accent-text': 'rgb(255, 0, 0)',
    '#primary-accent-surface': 'rgb(0, 0, 255)',
  } as const;
  const SECONDARY = THEME['#surface-text-soft'];
  const TITLE = THEME['#primary-accent-text'];
  const ACCENT = THEME['#primary-accent-surface'];

  const tabStyle = (name: string) =>
    getComputedStyle(screen.getByRole('tab', { name }));

  it('colours the titles and the indicator from `tabListStyles`', async () => {
    renderWithRoot(
      <Tabs defaultActiveKey="active" tabListStyles={THEME}>
        <Tab key="active" title="Active" />
        <Tab key="inactive" title="Inactive" />
      </Tabs>,
    );

    expect(tabStyle('Active').color).toBe(TITLE);
    expect(tabStyle('Inactive').color).toBe(SECONDARY);

    await waitFor(() => {
      expect(getComputedStyle(tabIndicator()!).backgroundColor).toBe(ACCENT);
    });
  });

  it('colours the file-type selection edge from `tokens`', () => {
    renderWithRoot(
      <Tabs type="file" defaultActiveKey="active" tokens={THEME}>
        <Tab key="active" title="Active" />
        <Tab key="inactive" title="Inactive" />
      </Tabs>,
    );

    expect(tabStyle('Active').boxShadow).toContain(ACCENT);
  });

  it('sets the title font from `$font-sans` in `styles`, or from a tab’s own `styles`', () => {
    renderWithRoot(
      <Tabs
        size="xsmall"
        defaultActiveKey="themed"
        styles={{ '$font-sans': 'Georgia, serif' }}
      >
        <Tab key="themed" title="Themed" />
        <Tab key="own" title="Own" styles={{ font: 'Courier' }} />
      </Tabs>,
    );

    expect(tabStyle('Themed').fontFamily).toMatch(/^georgia,/i);
    expect(tabStyle('Own').fontFamily).toMatch(/^courier,/i);
  });
});
