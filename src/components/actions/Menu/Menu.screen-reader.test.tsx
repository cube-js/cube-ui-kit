import { PlusIcon } from '../../../icons/PlusIcon';
import { renderWithRoot } from '../../../test';
import { readWithScreenReader } from '../../../test/screen-reader';

import { Menu } from './Menu';

it('reads mixed commands, destinations and inline actions in their keyboard order', async () => {
  renderWithRoot(
    <Menu aria-label="Workbook actions">
      <Menu.Item
        key="create"
        icon={<PlusIcon />}
        actions={<Menu.Item.Action aria-label="Create settings" />}
      >
        Create workbook
      </Menu.Item>
      <Menu.Item
        key="saved"
        to="/saved"
        description="Open the saved workbook"
        actions={<Menu.Item.Action aria-label="Delete saved workbook" />}
      >
        Saved workbook
      </Menu.Item>
      <Menu.Item key="unavailable" to="/unavailable" isDisabled>
        Unavailable workbook
      </Menu.Item>
      <Menu.Item key="last">Last command</Menu.Item>
    </Menu>,
  );
  const spoken = await readWithScreenReader();
  const entries = spoken.filter((phrase) => phrase.startsWith('menuitem,'));
  expect(entries.map((phrase) => phrase.split(', ')[1])).toEqual([
    'Create workbook',
    'Create settings',
    'Saved workbook',
    'Delete saved workbook',
    'Unavailable workbook',
    'Last command',
  ]);
  expect(entries[2]).toContain('Open the saved workbook');
  expect(entries[4]).toContain('disabled');
  expect(
    spoken.some((phrase) => /^(link|graphics-document),/.test(phrase)),
  ).toBe(false);
});

it.each(['header', 'card'] as const)(
  'reads a %s destination by its heading and description',
  async (type) => {
    renderWithRoot(
      <Menu aria-label="Workbooks">
        <Menu.Item
          key="saved"
          to="/saved"
          type={type}
          level={3}
          description="Open the saved workbook"
        >
          Saved workbook
        </Menu.Item>
      </Menu>,
    );
    const spoken = await readWithScreenReader();
    const entries = spoken.filter((phrase) => phrase.startsWith('menuitem,'));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain(
      'menuitem, Saved workbook, Open the saved workbook',
    );
    expect(spoken).toContain('heading, Saved workbook, level 3');
  },
);

it('reads explicit names and descriptions instead of replacing them with visible link content', async () => {
  renderWithRoot(
    <>
      <span id="saved-name">Quarterly workbook</span>
      <span id="saved-help">Updated yesterday</span>
      <Menu aria-label="Workbooks">
        <Menu.Item key="label" to="/label" aria-label="Open workbook">
          Visible label
        </Menu.Item>
        <Menu.Item
          key="referenced"
          href="/saved"
          aria-labelledby="saved-name"
          aria-describedby="saved-help"
        >
          Visible saved label
        </Menu.Item>
        <Menu.Item
          key="description"
          to="/description"
          description="Description only"
        >
          {null}
        </Menu.Item>
      </Menu>
    </>,
  );
  const entries = (await readWithScreenReader()).filter((phrase) =>
    phrase.startsWith('menuitem,'),
  );
  expect(entries.map((phrase) => phrase.split(', ')[1])).toEqual([
    'Open workbook',
    'Quarterly workbook',
    'Description only',
  ]);
  expect(entries[1]).toContain('Updated yesterday');
});
