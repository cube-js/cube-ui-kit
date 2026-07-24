import { fireEvent } from '@testing-library/react';

import { act, renderWithRoot, waitFor } from '../../../test';
import { Menu } from '../../actions/Menu';

import { Tab, Tabs } from './Tabs';

vi.mock('../../../_internal/hooks/use-warn');

describe('<Tabs /> rename from menu', () => {
  // Regression: a "Rename" item inside the tab menu used to mount the
  // inline-edit input only to have it stolen-focus + committed-out by the
  // closing Menu popover's `<FocusScope restoreFocus>`. The user clicked
  // Rename and nothing visibly happened. InlineInput's grace period plus
  // TabButton's refocus pass keep the input mounted and focused across the
  // overlay's exit.
  //
  // Kept in a dedicated file: under happy-dom, opening Menu after other
  // Title Editing cases can leave residual async work that stalls the suite.
  it('keeps the rename input mounted and focused when triggered from the tab menu', async () => {
    const handleTitleChange = vi.fn();
    const { findByRole, getByRole, queryByRole, unmount } = renderWithRoot(
      <Tabs
        isEditable
        defaultActiveKey="tab1"
        menu={<Menu.Item key="rename">Rename</Menu.Item>}
        onTitleChange={handleTitleChange}
      >
        <Tab key="tab1" title="Tab 1">
          Content 1
        </Tab>
      </Tabs>,
    );

    const tab = getByRole('tab', { name: 'Tab 1' });
    const menuTrigger = tab.parentElement?.querySelector(
      'button[aria-haspopup="true"]',
    ) as HTMLButtonElement;

    expect(menuTrigger).toBeTruthy();
    await act(async () => {
      fireEvent.click(menuTrigger);
    });

    const renameItem = await findByRole('menuitem', { name: 'Rename' });
    await act(async () => {
      fireEvent.click(renameItem);
    });

    await waitFor(() => {
      expect(queryByRole('textbox')).toBeInTheDocument();
    });

    act(() => {
      menuTrigger.focus();
    });

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(queryByRole('textbox')).toBeInTheDocument();
    expect(handleTitleChange).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.keyDown(queryByRole('textbox')!, { key: 'Escape' });
    });
    await waitFor(() => {
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });
    unmount();
  });

  // Regression: with `contextMenu="context-only"` and no delete handler
  // / custom actions, the `TabContainer` ref is replaced by the context
  // menu's target ref and the `Actions` element is never rendered — so
  // both `containerRef` and `actionsRef` are null. The TabButton refocus
  // pass must still be able to locate the editing input (via the tab
  // button ref, which is always wired up).
  it('also mounts the rename input in context-only mode with no actions', async () => {
    const handleTitleChange = vi.fn();
    const { findByRole, getByRole, queryByRole, unmount } = renderWithRoot(
      <Tabs
        isEditable
        contextMenu="context-only"
        defaultActiveKey="tab1"
        menu={<Menu.Item key="rename">Rename</Menu.Item>}
        onTitleChange={handleTitleChange}
      >
        <Tab key="tab1" title="Tab 1">
          Content 1
        </Tab>
      </Tabs>,
    );

    const tab = getByRole('tab', { name: 'Tab 1' });

    await act(async () => {
      fireEvent.contextMenu(tab);
    });
    const renameItem = await findByRole('menuitem', { name: 'Rename' });
    await act(async () => {
      fireEvent.click(renameItem);
    });

    await waitFor(() => {
      expect(queryByRole('textbox')).toBeInTheDocument();
    });

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(queryByRole('textbox')).toBeInTheDocument();
    expect(handleTitleChange).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.keyDown(queryByRole('textbox')!, { key: 'Escape' });
    });
    await waitFor(() => {
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });
    unmount();
  });
});
