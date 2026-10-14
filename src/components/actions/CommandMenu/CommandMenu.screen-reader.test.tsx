import userEvent from '@testing-library/user-event';

import { renderWithRoot, screen, waitFor } from '../../../test';
import {
  readWithScreenReader,
  startScreenReader,
} from '../../../test/screen-reader';

import { CommandMenu } from './CommandMenu';

it('reads the named search control, its help, and the mixed command/link results', async () => {
  renderWithRoot(
    <>
      <span id="palette-name">Workbook commands</span>
      <span id="palette-help">Search commands and destinations</span>
      <CommandMenu
        aria-labelledby="palette-name"
        aria-describedby="palette-help"
      >
        <CommandMenu.Item key="create">Create workbook</CommandMenu.Item>
        <CommandMenu.Item
          key="saved"
          to="/saved"
          description="Open the saved workbook"
        >
          Saved workbook
        </CommandMenu.Item>
        <CommandMenu.Item key="disabled" to="/disabled" isDisabled>
          Unavailable workbook
        </CommandMenu.Item>
      </CommandMenu>
    </>,
  );
  const spoken = await readWithScreenReader();
  const searchPhrase = spoken.find((phrase) => phrase.startsWith('searchbox,'));
  expect(searchPhrase).toContain(
    'Workbook commands, Search commands and destinations',
  );
  const entries = spoken.filter((phrase) => phrase.startsWith('menuitem,'));
  expect(entries.map((phrase) => phrase.split(', ')[1])).toEqual([
    'Create workbook',
    'Saved workbook',
    'Unavailable workbook',
  ]);
  expect(entries[1]).toContain('Open the saved workbook');
  expect(entries[2]).toContain('disabled');
  expect(screen.getByTestId('CommandMenu')).not.toHaveAttribute(
    'aria-labelledby',
  );
});

it('speaks the consumer search name while virtual focus resolves to the primary destination', async () => {
  const user = userEvent.setup();
  const { rerender } = renderWithRoot(
    <CommandMenu
      aria-label="Find workbook"
      searchPlaceholder="Type a command"
      autoFocus={false}
    >
      <CommandMenu.Section title="Workbooks">
        <CommandMenu.Item key="create">Create workbook</CommandMenu.Item>
        <CommandMenu.Item key="disabled" to="/disabled" isDisabled>
          Unavailable workbook
        </CommandMenu.Item>
        <CommandMenu.Item
          key="saved workbook"
          to="/saved"
          description="Open the saved workbook"
        >
          Saved workbook
        </CommandMenu.Item>
      </CommandMenu.Section>
    </CommandMenu>,
  );
  const reader = await startScreenReader();
  const search = screen.getByRole('searchbox', { name: 'Find workbook' });
  await user.click(search);
  await waitFor(async () =>
    expect(await reader.lastSpokenPhrase()).toContain(
      'searchbox, Find workbook',
    ),
  );
  await reader.press('ArrowDown');
  const expectActive = (name: string) => {
    const id = search.getAttribute('aria-activedescendant');
    expect(id).toBeTruthy();
    expect(id).not.toMatch(/\s/);
    const item = document.getElementById(id!);
    expect(item).toBe(screen.getByRole('menuitem', { name }));
    expect(
      document.getElementById(search.getAttribute('aria-controls')!),
    ).toContainElement(item);
    expect(search).toHaveFocus();
    return item!;
  };
  await waitFor(() => expectActive('Create workbook'));
  await reader.press('ArrowDown');
  await waitFor(() => {
    const item = expectActive('Saved workbook');
    expect(item.tagName).toBe('A');
    expect(item).toHaveAttribute('href', '/saved');
    expect(item).toHaveAccessibleDescription('Open the saved workbook');
  });
  // The simulator does not follow aria-activedescendant. Its speech cannot
  // prove that a real reader announces this virtual focus move.
  await user.type(search, 'missing');
  await waitFor(() => {
    expect(search).not.toHaveAttribute('aria-activedescendant');
    expect(search).not.toHaveAttribute('aria-controls');
  });
  rerender(
    <CommandMenu aria-label="Find workbook" isLoading>
      <CommandMenu.Item key="saved" to="/saved">
        Saved workbook
      </CommandMenu.Item>
    </CommandMenu>,
  );
  expect(search).not.toHaveAttribute('aria-activedescendant');
  expect(search).not.toHaveAttribute('aria-controls');
  expect(screen.getByRole('progressbar')).toHaveAccessibleName(
    'Loading commands',
  );
});
