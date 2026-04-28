import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';

import { act, renderWithRoot, waitFor } from '../../../test';
import { Menu } from '../../actions/Menu';

import { Tree } from './Tree';

import type { CubeTreeNodeData, TreeLoadDataNode } from './types';

const SAMPLE: CubeTreeNodeData[] = [
  {
    key: 'fruits',
    title: 'Fruits',
    children: [
      { key: 'apple', title: 'Apple' },
      { key: 'banana', title: 'Banana' },
    ],
  },
  {
    key: 'vegetables',
    title: 'Vegetables',
    children: [
      { key: 'carrot', title: 'Carrot' },
      { key: 'potato', title: 'Potato' },
    ],
  },
];

describe('<Tree />', () => {
  it('renders the root nodes and respects defaultExpandedKeys', () => {
    const { getByText, queryByText } = renderWithRoot(
      <Tree treeData={SAMPLE} defaultExpandedKeys={['fruits']} />,
    );

    expect(getByText('Fruits')).toBeInTheDocument();
    expect(getByText('Vegetables')).toBeInTheDocument();
    expect(getByText('Apple')).toBeInTheDocument();
    expect(getByText('Banana')).toBeInTheDocument();
    expect(queryByText('Carrot')).not.toBeInTheDocument();
  });

  it('toggles expansion when clicking the expand button', async () => {
    const onExpand = vi.fn();
    const { getByText, queryByText, getAllByRole } = renderWithRoot(
      <Tree treeData={SAMPLE} onExpand={onExpand} />,
    );

    expect(queryByText('Apple')).not.toBeInTheDocument();

    const rows = getAllByRole('row');
    const fruitsToggle = rows[0].querySelector(
      'button[data-element="Toggle"]',
    ) as HTMLButtonElement;
    await act(async () => await userEvent.click(fruitsToggle));

    expect(getByText('Apple')).toBeInTheDocument();
    expect(onExpand).toHaveBeenCalled();
    const [keys, info] = onExpand.mock.calls[0];
    expect(keys).toContain('fruits');
    expect(info.expanded).toBe(true);
    expect(info.node.key).toBe('fruits');
  });

  it('reports the correct toggled node across multiple uncontrolled toggles', async () => {
    const onExpand = vi.fn();
    const { getAllByRole } = renderWithRoot(
      <Tree
        treeData={SAMPLE}
        defaultExpandedKeys={['fruits']}
        onExpand={onExpand}
      />,
    );

    const rows = getAllByRole('row');
    const fruitsToggle = rows[0].querySelector(
      'button[data-element="Toggle"]',
    ) as HTMLButtonElement;
    const vegetablesToggle = rows[3].querySelector(
      'button[data-element="Toggle"]',
    ) as HTMLButtonElement;

    await act(async () => await userEvent.click(vegetablesToggle));
    let [, info] = onExpand.mock.calls[onExpand.mock.calls.length - 1];
    expect(info.expanded).toBe(true);
    expect(info.node.key).toBe('vegetables');

    await act(async () => await userEvent.click(fruitsToggle));
    [, info] = onExpand.mock.calls[onExpand.mock.calls.length - 1];
    expect(info.expanded).toBe(false);
    expect(info.node.key).toBe('fruits');

    await act(async () => await userEvent.click(vegetablesToggle));
    [, info] = onExpand.mock.calls[onExpand.mock.calls.length - 1];
    expect(info.expanded).toBe(false);
    expect(info.node.key).toBe('vegetables');
  });

  describe('checkable mode', () => {
    it('renders checkboxes when isCheckable is true', () => {
      const { getAllByRole } = renderWithRoot(
        <Tree isCheckable treeData={SAMPLE} defaultExpandedKeys={['fruits']} />,
      );

      // Root + 2 leaves of "fruits" + Vegetables = 4 visible rows
      const checkboxes = getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });

    it('cascades a parent check to all children (uncontrolled)', async () => {
      const onCheck = vi.fn();
      const { getAllByRole } = renderWithRoot(
        <Tree
          isCheckable
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          onCheck={onCheck}
        />,
      );

      const checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
      // first checkbox should be the "Fruits" parent
      await act(async () => await userEvent.click(checkboxes[0]));

      expect(onCheck).toHaveBeenCalled();
      const [keys] = onCheck.mock.calls[onCheck.mock.calls.length - 1];
      expect(keys).toEqual(
        expect.arrayContaining(['fruits', 'apple', 'banana']),
      );
    });

    it('emits halfChecked when only some children are checked', async () => {
      const onCheck = vi.fn();
      const { getAllByRole } = renderWithRoot(
        <Tree
          isCheckable
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          onCheck={onCheck}
        />,
      );

      const checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
      // checkboxes order: Fruits, Apple, Banana, Vegetables
      await act(async () => await userEvent.click(checkboxes[1]));

      const lastCall = onCheck.mock.calls[onCheck.mock.calls.length - 1];
      const [, info] = lastCall;
      expect(info.halfCheckedKeys).toContain('fruits');
    });

    it('respects controlled checkedKeys (array form)', async () => {
      function Wrapper() {
        const [keys, setKeys] = useState<string[]>([]);
        return (
          <Tree
            isCheckable
            treeData={SAMPLE}
            defaultExpandedKeys={['fruits']}
            checkedKeys={keys}
            onCheck={(next) => setKeys(next as string[])}
          />
        );
      }

      const { getAllByRole } = renderWithRoot(<Wrapper />);

      const checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
      await act(async () => await userEvent.click(checkboxes[1])); // Apple

      // Apple was the second checkbox
      expect(checkboxes[1]).toBeChecked();
    });

    it('returns object shape from onCheck when checkedKeys is an object', async () => {
      const onCheck = vi.fn();
      const { getAllByRole } = renderWithRoot(
        <Tree
          isCheckable
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          checkedKeys={{ checked: [], halfChecked: [] }}
          onCheck={onCheck}
        />,
      );

      const checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
      await act(async () => await userEvent.click(checkboxes[1]));

      const [arg] = onCheck.mock.calls[0];
      expect(arg).toHaveProperty('checked');
      expect(arg).toHaveProperty('halfChecked');
    });

    it('marks the grandparent fully checked when completing a sibling subtree (uncontrolled)', async () => {
      // Three-level tree:
      //   root → [groupA → [a1, a2], groupB → [b1, b2]]
      // Default-checked: a1, a2, b1 (only leaves, like a typical consumer
      // would persist). Toggling b1 → b2 → b1 → b2 (or just toggling b2)
      // should leave `root` fully checked because every leaf is checked.
      const data: CubeTreeNodeData[] = [
        {
          key: 'root',
          title: 'Root',
          children: [
            {
              key: 'groupA',
              title: 'Group A',
              children: [
                { key: 'a1', title: 'A1' },
                { key: 'a2', title: 'A2' },
              ],
            },
            {
              key: 'groupB',
              title: 'Group B',
              children: [
                { key: 'b1', title: 'B1' },
                { key: 'b2', title: 'B2' },
              ],
            },
          ],
        },
      ];

      const onCheck = vi.fn();
      const { getAllByRole } = renderWithRoot(
        <Tree
          isCheckable
          treeData={data}
          defaultExpandedKeys={['root', 'groupA', 'groupB']}
          defaultCheckedKeys={['a1', 'a2', 'b1']}
          onCheck={onCheck}
        />,
      );

      const checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
      // Order: root, groupA, a1, a2, groupB, b1, b2
      const rootCheckbox = checkboxes[0];
      const b2Checkbox = checkboxes[6];

      expect(rootCheckbox).not.toBeChecked();
      expect(b2Checkbox).not.toBeChecked();

      await act(async () => await userEvent.click(b2Checkbox));

      // Every leaf is now checked → the root checkbox must reflect that.
      expect(b2Checkbox).toBeChecked();
      expect(rootCheckbox).toBeChecked();

      const [keys] = onCheck.mock.calls[onCheck.mock.calls.length - 1];
      expect(keys).toEqual(
        expect.arrayContaining([
          'root',
          'groupA',
          'groupB',
          'a1',
          'a2',
          'b1',
          'b2',
        ]),
      );
    });

    it('skips checkboxes for nodes with isCheckable={false}', () => {
      const data: CubeTreeNodeData[] = [
        {
          key: 'a',
          title: 'A',
          isCheckable: false,
        },
        { key: 'b', title: 'B' },
      ];
      const { getAllByRole } = renderWithRoot(
        <Tree isCheckable treeData={data} />,
      );
      // Only "B" should have a checkbox
      expect(getAllByRole('checkbox').length).toBe(1);
    });
  });

  describe('selection', () => {
    it('does not render checkboxes when isCheckable is omitted', () => {
      const { queryAllByRole } = renderWithRoot(
        <Tree treeData={SAMPLE} defaultExpandedKeys={['fruits']} />,
      );
      expect(queryAllByRole('checkbox').length).toBe(0);
    });

    it('fires onSelect with the toggled key when clicking a row', async () => {
      const onSelect = vi.fn();
      const { getAllByRole } = renderWithRoot(
        <Tree
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          onSelect={onSelect}
        />,
      );

      const rows = getAllByRole('row');
      // Click on the title cell of "Apple"
      await act(async () => await userEvent.click(rows[1]));

      expect(onSelect).toHaveBeenCalled();
      const [keys, info] = onSelect.mock.calls[0];
      expect(keys.length).toBe(1);
      expect(info.node).toBeDefined();
    });

    it('emits only visible keys when selecting all in multiple mode', async () => {
      const onSelect = vi.fn();
      const { getAllByRole } = renderWithRoot(
        <Tree
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          selectionMode="multiple"
          onSelect={onSelect}
        />,
      );

      // Focus the tree, then trigger Ctrl+A to select all visible rows.
      const rows = getAllByRole('row');
      await act(async () => await userEvent.click(rows[0]));
      onSelect.mockClear();
      await act(async () => await userEvent.keyboard('{Control>}a{/Control}'));

      expect(onSelect).toHaveBeenCalled();
      const [keys, info] = onSelect.mock.calls[onSelect.mock.calls.length - 1];
      // `vegetables` is collapsed, so its children must NOT be in the
      // emitted selection — only the visible rows are.
      expect(new Set(keys)).toEqual(
        new Set(['fruits', 'apple', 'banana', 'vegetables']),
      );
      expect(keys).not.toContain('carrot');
      expect(keys).not.toContain('potato');
      expect(info.selectedNodes.map((n) => n.key)).not.toContain('carrot');
      expect(info.selectedNodes.map((n) => n.key)).not.toContain('potato');
    });

    it('does not call onSelect when selectionMode is "none"', async () => {
      const onSelect = vi.fn();
      const { getAllByRole } = renderWithRoot(
        <Tree
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          selectionMode="none"
          onSelect={onSelect}
        />,
      );

      const rows = getAllByRole('row');
      await act(async () => await userEvent.click(rows[1]));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('disabled', () => {
    it('marks all rows as disabled when isDisabled is true', () => {
      const { getAllByRole } = renderWithRoot(
        <Tree isDisabled treeData={SAMPLE} defaultExpandedKeys={['fruits']} />,
      );

      const rows = getAllByRole('row');
      for (const row of rows) {
        expect(row).toHaveAttribute('aria-disabled', 'true');
      }
    });

    it('marks individual rows as disabled when node.isDisabled is true', () => {
      const data: CubeTreeNodeData[] = [
        { key: 'a', title: 'A', isDisabled: true },
        { key: 'b', title: 'B' },
      ];
      const { getAllByRole } = renderWithRoot(<Tree treeData={data} />);

      const rows = getAllByRole('row');
      expect(rows[0]).toHaveAttribute('aria-disabled', 'true');
      expect(rows[1]).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('loadData', () => {
    it('fires loadData on first expansion of a non-leaf with no children', async () => {
      const data: CubeTreeNodeData[] = [
        { key: 'lazy', title: 'Lazy', isLeaf: false },
      ];

      let resolveLoad: (() => void) | null = null;
      const loadData = vi.fn(
        (_node: TreeLoadDataNode) =>
          new Promise<void>((resolve) => {
            resolveLoad = () => resolve();
          }),
      );

      const { getAllByRole } = renderWithRoot(
        <Tree treeData={data} loadData={loadData} />,
      );

      const toggle = getAllByRole('row')[0].querySelector(
        'button[data-element="Toggle"]',
      ) as HTMLButtonElement;
      await act(async () => await userEvent.click(toggle));

      expect(loadData).toHaveBeenCalledTimes(1);
      expect(loadData.mock.calls[0][0].key).toBe('lazy');

      await act(async () => {
        resolveLoad?.();
      });
    });

    it('does not fire loadData when isLeaf is true', async () => {
      const data: CubeTreeNodeData[] = [
        { key: 'leaf', title: 'Leaf', isLeaf: true },
      ];
      const loadData = vi.fn(() => Promise.resolve());
      const { getAllByRole } = renderWithRoot(
        <Tree treeData={data} loadData={loadData} />,
      );
      const row = getAllByRole('row')[0];
      const toggle = row.querySelector(
        'button[data-element="Toggle"]',
      ) as HTMLButtonElement | null;
      // Either no toggle, or clicking it does nothing
      if (toggle) {
        await act(async () => await userEvent.click(toggle));
      }
      expect(loadData).not.toHaveBeenCalled();
    });
  });

  describe('controlled expansion', () => {
    it('honors a controlled expandedKeys array', async () => {
      const { rerender, getByText, queryByText } = renderWithRoot(
        <Tree treeData={SAMPLE} expandedKeys={[]} />,
      );

      expect(queryByText('Apple')).not.toBeInTheDocument();

      rerender(<Tree treeData={SAMPLE} expandedKeys={['fruits']} />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeInTheDocument();
      });
    });

    it('expands ancestors when autoExpandParent is true', async () => {
      // "apple" lives under "fruits"; passing only the deep key with
      // autoExpandParent should auto-expand the parent.
      const { getByText } = renderWithRoot(
        <Tree autoExpandParent treeData={SAMPLE} expandedKeys={['apple']} />,
      );

      await waitFor(() => {
        expect(getByText('Apple')).toBeInTheDocument();
      });
    });

    it('expands ancestors when autoExpandParent is true in uncontrolled mode', async () => {
      // Same as above, but with `defaultExpandedKeys` (uncontrolled). The
      // parent expansion must apply equally to the default keys.
      const { getByText } = renderWithRoot(
        <Tree
          autoExpandParent
          treeData={SAMPLE}
          defaultExpandedKeys={['apple']}
        />,
      );

      await waitFor(() => {
        expect(getByText('Apple')).toBeInTheDocument();
      });
    });
  });

  describe('ref forwarding', () => {
    it('populates the forwarded ref with the tree DOM element', () => {
      // The internal `treeRef` (used by `useTree` for keyboard nav/focus)
      // and the consumer's forwarded ref must both point at the same node.
      const ref = createRef<HTMLDivElement>();
      renderWithRoot(<Tree ref={ref} treeData={SAMPLE} />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current?.getAttribute('role')).toBe('treegrid');
    });

    it('keeps keyboard navigation working when a ref is forwarded', async () => {
      // Regression: previously `useTree` was wired to the internal ref
      // while the DOM node received only the external ref, so keyboard
      // handlers silently broke whenever a consumer forwarded a ref.
      const user = userEvent.setup();
      const ref = createRef<HTMLDivElement>();
      const { getAllByRole } = renderWithRoot(
        <Tree
          ref={ref}
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits', 'vegetables']}
        />,
      );

      const rows = getAllByRole('row');
      // Focus the tree — react-aria's `useTree` should now be able to
      // route keyboard events because `treeRef.current` is set.
      act(() => rows[0].focus());
      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(document.activeElement).toBe(rows[1]);
      });
    });
  });

  describe('per-row menu', () => {
    const TREE_MENU = (
      <>
        <Menu.Item key="rename">Rename</Menu.Item>
        <Menu.Item key="delete">Delete</Menu.Item>
      </>
    );

    it('renders a `⋮` overflow trigger when contextMenu is `true`', () => {
      const { getAllByLabelText } = renderWithRoot(
        <Tree
          contextMenu
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          menu={TREE_MENU}
        />,
      );

      // 3 visible non-empty menus in expanded subtree (Fruits + Apple + Banana
      // + Vegetables = 4 visible rows total).
      const triggers = getAllByLabelText('Actions');
      expect(triggers.length).toBe(4);
    });

    it('hides the `⋮` trigger when contextMenu is `"context-only"`', () => {
      const { queryAllByLabelText } = renderWithRoot(
        <Tree
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          menu={TREE_MENU}
          contextMenu="context-only"
        />,
      );

      expect(queryAllByLabelText('Actions').length).toBe(0);
    });

    it('does not render any menu when contextMenu is omitted', () => {
      const { queryAllByLabelText } = renderWithRoot(
        <Tree
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          menu={TREE_MENU}
        />,
      );

      expect(queryAllByLabelText('Actions').length).toBe(0);
    });

    it('per-node `data.menu` overrides the tree-level menu', () => {
      const data: CubeTreeNodeData[] = [
        { key: 'a', title: 'A', menu: null },
        { key: 'b', title: 'B' },
      ];
      const { queryAllByLabelText } = renderWithRoot(
        <Tree contextMenu treeData={data} menu={TREE_MENU} />,
      );

      // Row "a" has `menu: null` → no overflow trigger.
      // Row "b" inherits → has overflow trigger.
      expect(queryAllByLabelText('Actions').length).toBe(1);
    });

    it('fires onAction with (action, key) when a menu item is selected', async () => {
      const onAction = vi.fn();
      const { getAllByLabelText, getByText } = renderWithRoot(
        <Tree
          contextMenu
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          menu={TREE_MENU}
          onAction={onAction}
        />,
      );

      // Open the first row's overflow menu (row "Fruits").
      const triggers = getAllByLabelText('Actions');
      await act(async () => await userEvent.click(triggers[0]));

      // Click the "Rename" item.
      await act(async () => await userEvent.click(getByText('Rename')));

      expect(onAction).toHaveBeenCalledWith('rename', 'fruits');
    });

    it('forwards menu actions to a consumer-supplied `menuProps.onAction`', async () => {
      const treeOnAction = vi.fn();
      const menuOnAction = vi.fn();
      const { getAllByLabelText, getByText } = renderWithRoot(
        <Tree
          contextMenu
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          menu={TREE_MENU}
          menuProps={{ onAction: menuOnAction }}
          onAction={treeOnAction}
        />,
      );

      const triggers = getAllByLabelText('Actions');
      await act(async () => await userEvent.click(triggers[0]));
      await act(async () => await userEvent.click(getByText('Rename')));

      expect(treeOnAction).toHaveBeenCalledWith('rename', 'fruits');
      // Consumer's onAction must also fire with the same normalized key.
      expect(menuOnAction).toHaveBeenCalledWith('rename');
    });

    it('forwards `menuProps.onAction` for the right-click context menu too', async () => {
      const treeOnAction = vi.fn();
      const menuOnAction = vi.fn();
      const { getAllByRole, getByText } = renderWithRoot(
        <Tree
          contextMenu="context-only"
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          menu={TREE_MENU}
          menuProps={{ onAction: menuOnAction }}
          onAction={treeOnAction}
        />,
      );

      const rows = getAllByRole('row');
      await act(async () => {
        await userEvent.pointer({ keys: '[MouseRight>]', target: rows[0] });
      });
      await act(async () => await userEvent.click(getByText('Delete')));

      expect(treeOnAction).toHaveBeenCalledWith('delete', 'fruits');
      expect(menuOnAction).toHaveBeenCalledWith('delete');
    });
  });

  describe('expandOnFolderClick', () => {
    it('toggles expansion when a folder row is clicked', async () => {
      const onSelect = vi.fn();
      const { getByText, queryByText, getAllByRole } = renderWithRoot(
        <Tree expandOnFolderClick treeData={SAMPLE} onSelect={onSelect} />,
      );

      expect(queryByText('Apple')).not.toBeInTheDocument();

      // Click the "Fruits" folder row body (not the chevron).
      const rows = getAllByRole('row');
      await act(async () => await userEvent.click(rows[0]));

      expect(getByText('Apple')).toBeInTheDocument();
      // Folder click should NOT trigger selection.
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('still selects leaves when expandOnFolderClick is on', async () => {
      const onSelect = vi.fn();
      const { getAllByRole } = renderWithRoot(
        <Tree
          expandOnFolderClick
          treeData={SAMPLE}
          defaultExpandedKeys={['fruits']}
          onSelect={onSelect}
        />,
      );

      const rows = getAllByRole('row');
      await act(async () => await userEvent.click(rows[1])); // Apple

      expect(onSelect).toHaveBeenCalled();
      const [keys] = onSelect.mock.calls[0];
      expect(keys).toContain('apple');
    });

    it('toggles expansion via Enter without selecting the folder', async () => {
      const onSelect = vi.fn();
      const onExpand = vi.fn();
      const { getByText, queryByText, getAllByRole } = renderWithRoot(
        <Tree
          expandOnFolderClick
          treeData={SAMPLE}
          onSelect={onSelect}
          onExpand={onExpand}
        />,
      );

      expect(queryByText('Apple')).not.toBeInTheDocument();

      const rows = getAllByRole('row');
      await act(async () => {
        rows[0].focus();
        await userEvent.keyboard('{Enter}');
      });

      expect(getByText('Apple')).toBeInTheDocument();
      expect(onExpand).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('toggles expansion via Space without selecting the folder', async () => {
      const onSelect = vi.fn();
      const onExpand = vi.fn();
      const { getByText, queryByText, getAllByRole } = renderWithRoot(
        <Tree
          expandOnFolderClick
          treeData={SAMPLE}
          onSelect={onSelect}
          onExpand={onExpand}
        />,
      );

      expect(queryByText('Apple')).not.toBeInTheDocument();

      const rows = getAllByRole('row');
      await act(async () => {
        rows[0].focus();
        await userEvent.keyboard(' ');
      });

      expect(getByText('Apple')).toBeInTheDocument();
      expect(onExpand).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
