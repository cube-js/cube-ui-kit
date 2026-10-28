import { useState } from 'react';

import {
  renderWithForm,
  renderWithRoot,
  userEvent,
  waitFor,
  within,
} from '../../../test';
import { getTreeRowId } from '../../content/Tree/rowId';

import { FilterPicker } from './FilterPicker';

import type { CubeTreeNodeData } from '../../content/Tree/types';

vi.mock('../../../_internal/hooks/use-warn');

const GROUPS: CubeTreeNodeData[] = [
  {
    key: 'engineering',
    title: 'Engineering',
    children: [
      { key: 'engineering:ada', title: 'Ada Lovelace' },
      { key: 'engineering:alan', title: 'Alan Turing' },
      { key: 'engineering:grace', title: 'Grace Hopper' },
    ],
  },
  {
    key: 'design',
    title: 'Design',
    children: [
      { key: 'design:dieter', title: 'Dieter Rams' },
      { key: 'design:susan', title: 'Susan Kare' },
    ],
  },
  {
    key: 'support',
    title: 'Support',
    children: [
      { key: 'support:ada', title: 'Ada Lovelace' },
      { key: 'support:linus', title: 'Linus Torvalds' },
    ],
  },
  { key: 'contractors', title: 'Contractors', isLeaf: true },
];

const ENGINEERING = [
  'engineering',
  'engineering:ada',
  'engineering:alan',
  'engineering:grace',
];

const row = (key: string) =>
  document.querySelector<HTMLElement>(`[data-qa-key="${key}"]`);

// The row's checkbox reports the state to assistive tech; the row mirrors it
// in mods, which jsdom reads without the checkbox's `indeterminate` property.
const checkState = (key: string) => {
  const el = row(key);
  if (!el) return undefined;
  if (el.hasAttribute('data-indeterminate')) return 'mixed';
  return el.hasAttribute('data-checked') ? 'true' : 'false';
};

const search = () =>
  document.querySelector<HTMLInputElement>('[data-qa="FilterTreeSearch"]')!;

describe('<FilterPicker treeData />', () => {
  const user = userEvent.setup({ delay: null });

  const open = async (getByRole: (role: string, options?: any) => any) => {
    await user.click(getByRole('button', { name: /Groups/ }));
    await waitFor(() => expect(search()).toHaveFocus());
  };

  it('checks the subtree of a parent key and half-checks a partly checked parent', async () => {
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        defaultSelectedKeys={['design', 'engineering:ada']}
        defaultExpandedKeys={['engineering', 'design']}
      />,
    );

    await open(getByRole);

    expect(checkState('design')).toBe('true');
    expect(checkState('design:dieter')).toBe('true');
    expect(checkState('design:susan')).toBe('true');
    expect(checkState('engineering')).toBe('mixed');
    expect(checkState('engineering:ada')).toBe('true');
    expect(checkState('engineering:alan')).toBe('false');
  });

  it('checks a parent with its children and reports every fully checked key in tree order', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        onSelectionChange={onSelectionChange}
      />,
    );

    await open(getByRole);
    await user.click(within(row('engineering')!).getByRole('checkbox'));

    expect(onSelectionChange).toHaveBeenLastCalledWith(ENGINEERING);
    expect(checkState('engineering')).toBe('true');
    // A checkbox click hands focus back to the search.
    await waitFor(() => expect(search()).toHaveFocus());
  });

  it('toggles a row when it is pressed and keeps the popover open', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        defaultExpandedKeys={['design']}
        onSelectionChange={onSelectionChange}
      />,
    );

    await open(getByRole);
    await user.click(within(row('design:susan')!).getByText('Susan Kare'));

    expect(onSelectionChange).toHaveBeenLastCalledWith(['design:susan']);
    expect(checkState('design')).toBe('mixed');
    expect(row('design')).toBeInTheDocument();
  });

  it('keeps the ancestors of a match with only the matching branch, expanded', async () => {
    const { getByRole } = renderWithRoot(
      <FilterPicker label="Groups" treeData={GROUPS} />,
    );

    await open(getByRole);
    await user.keyboard('ada');

    await waitFor(() => expect(row('support:ada')).toBeInTheDocument());
    expect(row('engineering:ada')).toBeInTheDocument();
    expect(row('engineering:alan')).toBeNull();
    expect(row('support:linus')).toBeNull();
    expect(row('design')).toBeNull();
    expect(row('engineering')).toHaveAttribute('aria-expanded', 'true');

    // A parent that matches by name keeps its whole subtree.
    await user.clear(search());
    await user.keyboard('design');
    await waitFor(() => expect(row('engineering')).toBeNull());
    expect(row('design')).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the nodes a search hides checked when a visible one is unchecked', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        defaultSelectedKeys={['engineering']}
        onSelectionChange={onSelectionChange}
      />,
    );

    await open(getByRole);
    await user.keyboard('ada');
    await waitFor(() => expect(row('engineering:ada')).toBeInTheDocument());

    await user.click(within(row('engineering:ada')!).getByRole('checkbox'));

    expect(onSelectionChange).toHaveBeenLastCalledWith([
      'engineering:alan',
      'engineering:grace',
    ]);
    expect(checkState('engineering')).toBe('mixed');
  });

  it('brings back the expansion it had once the search clears', async () => {
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        defaultExpandedKeys={['design']}
      />,
    );

    await open(getByRole);
    await user.keyboard('ada');
    await waitFor(() =>
      expect(row('support')).toHaveAttribute('aria-expanded', 'true'),
    );

    await user.keyboard('{Escape}');

    await waitFor(() => expect(search()).toHaveValue(''));
    expect(row('design')).toHaveAttribute('aria-expanded', 'true');
    expect(row('support')).toHaveAttribute('aria-expanded', 'false');
    expect(row('engineering')).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts the search expansion over when a controlled query comes back', async () => {
    const picker = (searchValue: string) => (
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        searchValue={searchValue}
        onSearchChange={() => {}}
      />
    );
    const { getByRole, rerender } = renderWithRoot(picker('ada'));

    await open(getByRole);
    expect(row('engineering')).toHaveAttribute('aria-expanded', 'true');

    // Caret to the start of the text, then Left collapses the active row.
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(row('engineering')).toHaveAttribute('aria-expanded', 'false');

    rerender(picker(''));
    rerender(picker('ada'));
    expect(row('engineering')).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves the active row with the arrow keys and toggles it with Space', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        onSelectionChange={onSelectionChange}
      />,
    );

    await open(getByRole);

    const activeRow = () =>
      document.getElementById(
        search().getAttribute('aria-activedescendant') ?? '',
      );

    // The input points at a real row: the id scheme matches React Aria's.
    expect(activeRow()).toBe(row('engineering'));
    expect(search().getAttribute('aria-activedescendant')).toBe(
      getTreeRowId(search().getAttribute('aria-controls')!, 'engineering'),
    );

    await user.keyboard('{ArrowDown}');
    expect(activeRow()).toBe(row('design'));

    await user.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith([
      'design',
      'design:dieter',
      'design:susan',
    ]);
    expect(search()).toHaveFocus();
  });

  it('expands with ArrowRight and collapses with ArrowLeft only at the edges of the text', async () => {
    const { getByRole } = renderWithRoot(
      <FilterPicker label="Groups" treeData={GROUPS} />,
    );

    await open(getByRole);

    await user.keyboard('{ArrowRight}');
    expect(row('engineering')).toHaveAttribute('aria-expanded', 'true');

    // Expanded, Right steps into the first child; Left goes back up.
    await user.keyboard('{ArrowRight}');
    expect(search().getAttribute('aria-activedescendant')).toBe(
      row('engineering:ada')!.id,
    );
    await user.keyboard('{ArrowLeft}');
    expect(search().getAttribute('aria-activedescendant')).toBe(
      row('engineering')!.id,
    );
    await user.keyboard('{ArrowLeft}');
    expect(row('engineering')).toHaveAttribute('aria-expanded', 'false');

    // With the caret inside the text, the arrows move the caret.
    await user.keyboard('en{ArrowLeft}');
    expect(search().selectionStart).toBe(1);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(search().selectionStart).toBe(0);
  });

  it('toggles the active row on Enter and closes the popover', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        onSelectionChange={onSelectionChange}
      />,
    );

    await open(getByRole);
    await user.keyboard('contr{Enter}');

    expect(onSelectionChange).toHaveBeenLastCalledWith(['contractors']);
    await waitFor(() => expect(search()).toBeNull());
  });

  it('summarises the topmost checked nodes and clears them', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole, getByLabelText } = renderWithRoot(
      <FilterPicker
        isClearable
        label="Groups"
        placeholder="Pick groups"
        treeData={GROUPS}
        defaultSelectedKeys={['design', 'engineering:ada']}
        onSelectionChange={onSelectionChange}
      />,
    );

    const trigger = getByRole('button', { name: /Groups/ });
    expect(trigger).toHaveTextContent('Ada Lovelace, Design');

    await user.click(getByLabelText('Clear value'));

    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    expect(trigger).toHaveTextContent('Pick groups');
  });

  it('follows controlled expandedKeys and reports changes outside a search', async () => {
    const onExpand = vi.fn();

    function Controlled() {
      const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

      return (
        <FilterPicker
          label="Groups"
          treeData={GROUPS}
          expandedKeys={expandedKeys}
          onExpand={(keys) => {
            onExpand(keys);
            setExpandedKeys(keys);
          }}
        />
      );
    }

    const { getByRole } = renderWithRoot(<Controlled />);

    await open(getByRole);
    await user.keyboard('{ArrowRight}');

    expect(onExpand).toHaveBeenLastCalledWith(['engineering']);
    expect(row('engineering')).toHaveAttribute('aria-expanded', 'true');

    // A search expands on its own and reports nothing.
    await user.keyboard('linus');
    await waitFor(() =>
      expect(row('support')).toHaveAttribute('aria-expanded', 'true'),
    );
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('passes every checked key, in tree order, to renderSummary', () => {
    const renderSummary = vi.fn(() => 'summary');
    renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        defaultSelectedKeys={['design', 'engineering:ada']}
        renderSummary={renderSummary}
      />,
    );

    expect(renderSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedLabels: ['Ada Lovelace', 'Design'],
        selectedKeys: [
          'engineering:ada',
          'design',
          'design:dieter',
          'design:susan',
        ],
      }),
    );
  });

  it('follows controlled selectedKeys holding a parent key', async () => {
    function Controlled() {
      const [keys, setKeys] = useState<string[]>(['design']);

      return (
        <FilterPicker
          label="Groups"
          treeData={GROUPS}
          selectedKeys={keys}
          defaultExpandedKeys={['design']}
          onSelectionChange={(next) => setKeys(next as string[])}
        />
      );
    }

    const { getByRole } = renderWithRoot(<Controlled />);

    await open(getByRole);
    expect(checkState('design:susan')).toBe('true');

    await user.click(within(row('design:susan')!).getByRole('checkbox'));

    expect(checkState('design')).toBe('mixed');
    expect(checkState('design:dieter')).toBe('true');
    expect(checkState('design:susan')).toBe('false');
    expect(getByRole('button', { name: /Groups/ })).toHaveTextContent(
      'Dieter Rams',
    );
  });

  it('lets Tab move on from the search to the footer', async () => {
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        defaultExpandedKeys={['engineering']}
        footer={<button type="button">Apply</button>}
      />,
    );

    await open(getByRole);
    await user.tab();

    expect(getByRole('button', { name: 'Apply' })).toHaveFocus();
  });

  it('keeps the active row when Space unchecks it', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={GROUPS}
        defaultSelectedKeys={['design']}
        onSelectionChange={onSelectionChange}
      />,
    );

    await open(getByRole);
    expect(search().getAttribute('aria-activedescendant')).toBe(
      row('design')!.id,
    );

    await user.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    expect(search().getAttribute('aria-activedescendant')).toBe(
      row('design')!.id,
    );

    await user.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith([
      'design',
      'design:dieter',
      'design:susan',
    ]);
  });

  it('keeps a parent whose checkbox is disabled, and leaves Enter on it a no-op', async () => {
    const onSelectionChange = vi.fn();
    const data: CubeTreeNodeData[] = [
      {
        key: 'locked',
        title: 'Locked',
        isCheckboxDisabled: true,
        children: [
          { key: 'locked:a', title: 'Member A' },
          { key: 'locked:b', title: 'Member B' },
        ],
      },
      { key: 'contractors', title: 'Contractors', isLeaf: true },
    ];
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={data}
        defaultSelectedKeys={['locked']}
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(getByRole('button', { name: /Groups/ })).toHaveTextContent('Locked');

    await open(getByRole);
    expect(checkState('locked')).toBe('true');

    await user.keyboard('{Enter}');
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(search()).toBeInTheDocument();

    await user.click(within(row('contractors')!).getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenLastCalledWith([
      'locked',
      'locked:a',
      'locked:b',
      'contractors',
    ]);
  });

  it('keeps a grandparent key whose subtree passes through a locked parent', async () => {
    const onSelectionChange = vi.fn();
    const data: CubeTreeNodeData[] = [
      {
        key: 'org',
        title: 'Organisation',
        children: [
          {
            key: 'locked',
            title: 'Locked',
            isCheckboxDisabled: true,
            children: [
              { key: 'locked:a', title: 'Member A' },
              { key: 'locked:b', title: 'Member B' },
            ],
          },
          { key: 'org:c', title: 'Member C' },
        ],
      },
      { key: 'contractors', title: 'Contractors', isLeaf: true },
    ];
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={data}
        defaultSelectedKeys={['org']}
        defaultExpandedKeys={['org', 'locked']}
        onSelectionChange={onSelectionChange}
      />,
    );

    await open(getByRole);
    expect(checkState('org')).toBe('true');
    expect(checkState('locked:a')).toBe('true');

    await user.click(within(row('contractors')!).getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenLastCalledWith([
      'org',
      'locked',
      'locked:a',
      'locked:b',
      'org:c',
      'contractors',
    ]);

    await user.click(within(row('org')!).getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['contractors']);
  });

  it('opens a matching node that has a match below it, every time the query is typed', async () => {
    const data: CubeTreeNodeData[] = [
      {
        key: 'support',
        title: 'Support',
        children: [
          { key: 'support:bot', title: 'Support Bot' },
          { key: 'support:linus', title: 'Linus Torvalds' },
        ],
      },
    ];
    const { getByRole } = renderWithRoot(
      <FilterPicker label="Groups" treeData={data} />,
    );

    await open(getByRole);
    await user.keyboard('support');
    await waitFor(() =>
      expect(row('support')).toHaveAttribute('aria-expanded', 'true'),
    );
    // The match keeps its whole subtree.
    expect(row('support:linus')).toBeInTheDocument();

    // Collapse it, clear, and type the same query again: it opens again.
    await user.click(within(row('support')!).getByLabelText(/Collapse/));
    expect(row('support')).toHaveAttribute('aria-expanded', 'false');
    await user.clear(search());
    await user.keyboard('support');
    await waitFor(() =>
      expect(row('support')).toHaveAttribute('aria-expanded', 'true'),
    );
  });

  it('keeps the expansion it was left with across closing and reopening', async () => {
    const { getByRole } = renderWithRoot(
      <FilterPicker label="Groups" treeData={GROUPS} />,
    );

    await open(getByRole);
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(row('design')).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(search()).toBeNull());

    await open(getByRole);
    expect(row('design')).toHaveAttribute('aria-expanded', 'true');
  });

  it('points at no tree while a search finds nothing', async () => {
    const { getByRole } = renderWithRoot(
      <FilterPicker label="Groups" treeData={GROUPS} />,
    );

    await open(getByRole);
    expect(search()).toHaveAttribute('aria-controls');

    await user.keyboard('zzz');
    await waitFor(() => expect(search()).not.toHaveAttribute('aria-controls'));
    expect(search()).not.toHaveAttribute('aria-activedescendant');
  });

  it('steps Left past a disabled parent to the nearest reachable one', async () => {
    const data: CubeTreeNodeData[] = [
      {
        key: 'org',
        title: 'Org',
        children: [
          {
            key: 'team',
            title: 'Team',
            isDisabled: true,
            children: [{ key: 'team:ada', title: 'Ada Lovelace' }],
          },
        ],
      },
    ];
    const { getByRole } = renderWithRoot(
      <FilterPicker
        label="Groups"
        treeData={data}
        defaultExpandedKeys={['org', 'team']}
      />,
    );

    await open(getByRole);
    await user.keyboard('{End}{ArrowLeft}');

    expect(search().getAttribute('aria-activedescendant')).toBe(row('org')!.id);
  });

  it('holds its value as a form field', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <FilterPicker name="groups" label="Groups" treeData={GROUPS} />,
      { formProps: { defaultValues: { groups: ['support'] } } },
    );

    expect(getByRole('button', { name: /Groups/ })).toHaveTextContent(
      'Support',
    );

    await open(getByRole);
    await user.click(within(row('contractors')!).getByRole('checkbox'));

    expect(formInstance.getFieldValue('groups')).toEqual([
      'support',
      'support:ada',
      'support:linus',
      'contractors',
    ]);
  });
});
