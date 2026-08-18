import { useState } from 'react';

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
