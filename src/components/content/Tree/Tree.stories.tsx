import { IconEdit, IconFile, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

import { FolderIcon, FolderOpenIcon, Icon, MoreIcon } from '../../../icons';
import { ItemAction } from '../../actions/ItemAction';
import { Menu, MenuTrigger } from '../../actions/Menu';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';
import { Text } from '../Text';

import { Tree } from './Tree';

import type { Key } from '@react-types/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  CubeTreeNodeData,
  CubeTreeProps,
  TreeLoadDataNode,
} from './types';

const FILE_SYSTEM: CubeTreeNodeData[] = [
  {
    key: 'src',
    title: 'src',
    children: [
      {
        key: 'src/components',
        title: 'components',
        children: [
          { key: 'src/components/Button.tsx', title: 'Button.tsx' },
          { key: 'src/components/Card.tsx', title: 'Card.tsx' },
          { key: 'src/components/Tree.tsx', title: 'Tree.tsx' },
        ],
      },
      {
        key: 'src/hooks',
        title: 'hooks',
        children: [
          { key: 'src/hooks/useTree.ts', title: 'useTree.ts' },
          { key: 'src/hooks/useEvent.ts', title: 'useEvent.ts' },
        ],
      },
      { key: 'src/index.ts', title: 'index.ts' },
    ],
  },
  {
    key: 'public',
    title: 'public',
    children: [
      { key: 'public/index.html', title: 'index.html' },
      { key: 'public/favicon.ico', title: 'favicon.ico' },
    ],
  },
  { key: 'package.json', title: 'package.json' },
  { key: 'README.md', title: 'README.md' },
];

const meta = {
  title: 'Content/Tree',
  component: Tree,
  parameters: {
    layout: 'padded',
  },
  args: {
    treeData: FILE_SYSTEM,
    defaultExpandedKeys: ['src'],
  },
  argTypes: {
    /* Content */
    treeData: {
      control: { type: null },
      description: 'Hierarchical tree data array',
      table: {
        type: { summary: 'CubeTreeNodeData[]' },
      },
    },

    /* Selection */
    selectionMode: {
      control: 'radio',
      options: ['none', 'single', 'multiple'],
      description: 'Selection cardinality',
      table: {
        defaultValue: { summary: 'single' },
        type: { summary: "'none' | 'single' | 'multiple'" },
      },
    },
    selectedKeys: {
      control: { type: null },
      description: 'Controlled selected keys',
      table: { type: { summary: 'string[]' } },
    },
    defaultSelectedKeys: {
      control: { type: null },
      description: 'Default selected keys (uncontrolled)',
      table: { type: { summary: 'string[]' } },
    },

    /* Expansion */
    expandedKeys: {
      control: { type: null },
      description: 'Controlled expanded keys',
      table: { type: { summary: 'string[]' } },
    },
    defaultExpandedKeys: {
      control: { type: null },
      description: 'Default expanded keys (uncontrolled)',
      table: { type: { summary: 'string[]' } },
    },
    autoExpandParent: {
      control: 'boolean',
      description: 'Auto-expand parents of currently expanded keys',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },

    /* Checking */
    isCheckable: {
      control: 'boolean',
      description: 'Render a checkbox in front of every eligible row',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    checkedKeys: {
      control: { type: null },
      description:
        'Controlled checked keys. Accepts `string[]` or `{ checked, halfChecked }`.',
      table: {
        type: {
          summary: 'string[] | { checked: string[]; halfChecked?: string[] }',
        },
      },
    },
    defaultCheckedKeys: {
      control: { type: null },
      description: 'Default checked keys (uncontrolled)',
      table: { type: { summary: 'string[]' } },
    },

    /* Presentation */
    height: {
      control: 'number',
      description:
        'Fixed height (px). When omitted, the tree fills its container.',
      table: { type: { summary: 'number' } },
    },

    /* State */
    isSelectable: {
      control: 'boolean',
      description: 'Sugar for `selectionMode="none"` when `false`',
      table: { type: { summary: 'boolean' } },
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disable the entire tree',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },

    /* Behavior */
    loadData: {
      control: { type: null },
      description: 'Async loader called on first expansion of a non-leaf node',
      table: {
        type: { summary: '(node: TreeLoadDataNode) => Promise<void>' },
      },
    },

    /* Events */
    onExpand: {
      action: 'expand',
      description: 'Called when a node is expanded or collapsed',
      table: {
        type: { summary: '(keys: Key[], info: TreeOnExpandInfo) => void' },
      },
    },
    onCheck: {
      action: 'check',
      description: 'Called when a node is checked or unchecked',
      table: {
        type: {
          summary:
            '(checked: Key[] | { checked, halfChecked }, info: TreeOnCheckInfo) => void',
        },
      },
    },
    onSelect: {
      action: 'select',
      description: 'Called when row selection changes',
      table: {
        type: { summary: '(keys: Key[], info: TreeOnSelectInfo) => void' },
      },
    },

    /* Styling */
    styles: {
      control: { type: null },
      description: 'Custom styles for the root',
      table: { type: { summary: 'Styles' } },
    },
    rowStyles: {
      control: { type: null },
      description: 'Override styles for `[data-element="Row"]`',
      table: { type: { summary: 'Styles' } },
    },
  },
} satisfies Meta<typeof Tree>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checkable: Story = {
  args: {
    isCheckable: true,
    selectionMode: 'none',
    defaultExpandedKeys: ['src', 'src/components'],
  },
};

export const Multiple: Story = {
  args: {
    selectionMode: 'multiple',
    defaultExpandedKeys: ['src'],
  },
};

export const SelectionDisabled: Story = {
  args: {
    selectionMode: 'none',
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

export const FixedHeight: Story = {
  args: {
    height: 200,
    defaultExpandedKeys: ['src', 'src/components', 'src/hooks', 'public'],
  },
};

export const PerNodeDisable: Story = {
  args: {
    treeData: [
      {
        key: 'a',
        title: 'A',
        children: [
          { key: 'a-1', title: 'A-1', isDisabled: true },
          {
            key: 'a-2',
            title: 'A-2 (checkbox disabled)',
            isCheckboxDisabled: true,
          },
          { key: 'a-3', title: 'A-3 (no checkbox)', isCheckable: false },
        ],
      },
      { key: 'b', title: 'B' },
    ],
    isCheckable: true,
    selectionMode: 'none',
    defaultExpandedKeys: ['a'],
  },
};

const ControlledCheckedRender = (args: CubeTreeProps) => {
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<Key[]>([]);

  return (
    <Flow gap="2x">
      <Tree
        {...args}
        checkedKeys={checkedKeys}
        onCheck={(keys, info) => {
          setCheckedKeys(keys as string[]);
          setHalfCheckedKeys(info.halfCheckedKeys);
        }}
      />
      <Space gap=".5x" flow="column">
        <Text preset="t3">checked: {JSON.stringify(checkedKeys)}</Text>
        <Text preset="t3">halfChecked: {JSON.stringify(halfCheckedKeys)}</Text>
      </Space>
    </Flow>
  );
};

export const ControlledChecked: Story = {
  args: {
    isCheckable: true,
    selectionMode: 'none',
    defaultExpandedKeys: ['src', 'src/components'],
  },
  render: ControlledCheckedRender,
};

const LazyLoadingRender = (args: CubeTreeProps) => {
  const [data, setData] = useState<CubeTreeNodeData[]>([
    { key: 'root-1', title: 'Folder 1', isLeaf: false },
    { key: 'root-2', title: 'Folder 2', isLeaf: false },
    { key: 'root-3', title: 'Plain leaf', isLeaf: true },
  ]);

  const handleLoadData = (node: TreeLoadDataNode) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setData((prev) =>
          prev.map((root) =>
            root.key === node.key
              ? {
                  ...root,
                  children: [
                    {
                      key: `${node.key}/child-1`,
                      title: `${root.title} / child 1`,
                    },
                    {
                      key: `${node.key}/child-2`,
                      title: `${root.title} / child 2`,
                    },
                  ],
                }
              : root,
          ),
        );
        resolve();
      }, 800);
    });

  return <Tree {...args} treeData={data} loadData={handleLoadData} />;
};

export const LazyLoading: Story = {
  args: {
    selectionMode: 'single',
  },
  render: LazyLoadingRender,
};

const AutoExpandParentRender = (args: CubeTreeProps) => {
  const [filter, setFilter] = useState('Tree');

  const { treeData, matchedKeys } = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return { treeData: FILE_SYSTEM, matchedKeys: [] as string[] };

    const matched: string[] = [];

    const filterNodes = (nodes: CubeTreeNodeData[]): CubeTreeNodeData[] => {
      const result: CubeTreeNodeData[] = [];
      for (const node of nodes) {
        const titleMatches =
          typeof node.title === 'string' &&
          node.title.toLowerCase().includes(query);
        const filteredChildren = node.children
          ? filterNodes(node.children)
          : undefined;

        if (titleMatches || (filteredChildren && filteredChildren.length > 0)) {
          if (titleMatches) matched.push(node.key);
          result.push({
            ...node,
            children: filteredChildren,
          });
        }
      }
      return result;
    };

    return { treeData: filterNodes(FILE_SYSTEM), matchedKeys: matched };
  }, [filter]);

  return (
    <Flow gap="2x">
      <input
        value={filter}
        placeholder="Filter…"
        style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
        onChange={(e) => setFilter(e.target.value)}
      />
      <Tree
        {...args}
        autoExpandParent
        treeData={treeData}
        expandedKeys={matchedKeys}
      />
    </Flow>
  );
};

export const AutoExpandParent: Story = {
  args: {
    selectionMode: 'single',
  },
  render: AutoExpandParentRender,
};

export const Empty: Story = {
  args: {
    treeData: [],
  },
};

const prefixIconStyles = { width: '($size - 2bw)' } as const;

const WrappedFileIcon = () => (
  <Icon styles={prefixIconStyles}>
    <IconFile />
  </Icon>
);

export const DirectoryTree: Story = {
  args: {
    selectionMode: 'none',
    defaultExpandedKeys: ['src', 'src/components'],
    styles: {
      width: '200px',
      border: true,
      radius: '1cr',
    },
    itemProps: (data, { isExpanded }) => {
      const isFolder = !!data.children;
      return {
        prefix: isFolder ? (
          isExpanded ? (
            <FolderOpenIcon styles={prefixIconStyles} />
          ) : (
            <FolderIcon styles={prefixIconStyles} />
          )
        ) : (
          <WrappedFileIcon />
        ),
        actions: (
          <MenuTrigger>
            <ItemAction icon={<MoreIcon />} aria-label="Actions" />
            <Menu>
              <Menu.Item key="rename" icon={<IconEdit />}>
                Rename
              </Menu.Item>
              <Menu.Item key="delete" icon={<IconTrash />}>
                Delete
              </Menu.Item>
            </Menu>
          </MenuTrigger>
        ),
        autoHideActions: true,
      };
    },
  },
};
