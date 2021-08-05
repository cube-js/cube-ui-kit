import { CSSProperties, ReactNode, useEffect, useState } from 'react';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  FileOutlined,
  FolderOpenFilled,
  FolderFilled,
} from '@ant-design/icons';
import { Flex } from '../../components/Flex';
import { Action } from '../../components/Action';
import { Button } from '../../atoms/Button/Button';
import { Space } from '../../components/Space';
import { Block } from '../../components/Block';
import { NuStyles } from '../../styles/types';

export type CubeFileTree = CubeFileTreeItem[];

export interface CubeFileTreeItem {
  isLeaf?: boolean;
  title?: string;
  key?: string;
  children?: CubeFileTree;
}

const IMAGES = {
  created: (
    <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.714 8.572h2.714v2.715c0 .078.065.142.143.142h.857a.143.143 0 00.143-.143V8.572h2.715a.143.143 0 00.142-.143v-.857a.143.143 0 00-.142-.143H8.57V4.715a.143.143 0 00-.143-.143h-.857a.143.143 0 00-.143.143V7.43H4.714a.143.143 0 00-.143.143v.857c0 .079.065.143.143.143z"
        fill="#67C082"
      />
      <path
        d="M14.572.857H1.429a.57.57 0 00-.572.572v13.143a.57.57 0 00.572.571h13.143a.57.57 0 00.571-.571V1.429a.57.57 0 00-.571-.572zm-.715 13H2.143V2.143h11.714v11.714z"
        fill="#67C082"
      />
    </svg>
  ),
  deleted: (
    <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.714 8.57h6.572a.143.143 0 00.142-.142V7.57a.143.143 0 00-.142-.143H4.714a.143.143 0 00-.143.143v.857c0 .078.065.143.143.143z"
        fill="#FF646D"
      />
      <path
        d="M14.572.857H1.429a.57.57 0 00-.572.572v13.143a.57.57 0 00.572.571h13.143a.57.57 0 00.571-.571V1.429a.57.57 0 00-.571-.572zm-.715 13H2.143V2.143h11.714v11.714z"
        fill="#FF646D"
      />
    </svg>
  ),
  modified: (
    <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.572.857H1.429a.57.57 0 00-.572.572v13.143a.57.57 0 00.572.571h13.143a.57.57 0 00.571-.571V1.429a.57.57 0 00-.571-.572zm-.715 13H2.143V2.143h11.714v11.714z"
        fill="#FBBC05"
      />
      <circle cx="8" cy="8" r="2.222" fill="#FBBC05" />
    </svg>
  ),
};

const TEXT_OVERFLOW_STYLES: CSSProperties = {
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  overflow: 'hidden',
};

function calcPadding(indent) {
  return `.75x .5x .75x ${1.5 * indent + 0.5}x`;
}

function extractLeafKeys(subTreeData, dirsOnly = false) {
  return subTreeData.reduce((list, item) => {
    if (!item.isLeaf) {
      list.push(item.key);
      list.push(...extractLeafKeys(item.children || []));
    } else if (!dirsOnly) {
      list.push(item.key);
    }

    return list;
  }, []);
}

const MODE_BG = {
  created: {
    '': '#success.10',
    hovered: '#success.15',
  },
  deleted: {
    '': '#danger.08',
    hovered: '#danger.13',
  },
} as const;
const MODE_COLOR = {
  created: '#success',
  deleted: '#danger',
} as const;

function getItemStyles({ isSelected, mode, indent }): NuStyles {
  return {
    width: 'max 100%',
    radius: true,
    textAlign: 'left',
    fill: isSelected
      ? '#purple.05'
      : MODE_BG[mode] || {
          '': '#clear',
          hovered: '#dark.04',
        },
    color: isSelected ? '#purple-text' : MODE_COLOR[mode] || '#dark.75',
    outline: {
      '': '#purple-03.0',
      'focused & focus-visible': '#purple-03',
    },
    fontWeight: isSelected ? 500 : 400,
    padding: calcPadding(indent),
  };
}

export interface CubeDirectoryTreeItemProps {
  children?: ReactNode;
  mode?: keyof typeof MODE_BG;
  indent?: number;
  onPress?: () => void;
  isSelected?: boolean;
}

function Item(props: CubeDirectoryTreeItemProps) {
  let { children, mode, indent, onPress, isSelected } = props;

  return (
    <Action
      onPress={onPress}
      styles={getItemStyles({ isSelected, mode, indent })}
      style={{ whiteSpace: 'nowrap' }}
    >
      {children}
    </Action>
  );
}

function sortTreeData(filesTree: CubeFileTree) {
  filesTree = filesTree.map((item) => {
    return {
      ...item,
      children: item.children ? sortTreeData(item.children) : undefined,
    };
  });

  return filesTree.sort((a, b) => {
    if (!a.isLeaf && b.isLeaf) {
      return -1;
    } else if (!b.isLeaf && a.isLeaf) {
      return 1;
    } else if (a.title && b.title) {
      return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
    } else {
      return 0;
    }
  });
}

const HOVER_CSS = `
  &:hover .actions {
    opacity: 1;
  }
  &:not(:hover) .actions {
    opacity: 0;
  }
`;

export interface CubeDirectoryTreeProps {
  /** Event that fires on file selection */
  onSelect?: (key: string) => void;
  /** The selected key */
  selectedKey?: string;
  /** Whether all folders are expanded by default */
  defaultExpandAll?: boolean;
  /** Custom title for the root folder */
  rootTitle?: string;
  /** The Action panel provider  */
  actionsPanel?: (CubeFileTreeItem) => ReactNode;
  /** Whether to show only dirs */
  onlyDirs?: boolean;
  /** The full tree data */
  treeData: CubeFileTree;
}

export function DirectoryTree(props: CubeDirectoryTreeProps) {
  let {
    onSelect,
    treeData,
    selectedKey,
    defaultExpandAll,
    rootTitle,
    actionsPanel,
    onlyDirs,
    ...otherProps
  } = props;

  treeData = sortTreeData(treeData);

  const [expanded, setExpanded] = useState(['/']);
  const [selected, setSelected] = useState(selectedKey);
  const fullTreeData = [
    {
      key: '/',
      title: rootTitle || '/',
      children: treeData,
    },
  ];

  useEffect(() => {
    setSelected(selectedKey);
  }, [selectedKey]);

  useEffect(() => {
    if (defaultExpandAll) {
      setExpanded(extractLeafKeys(fullTreeData, true));
    }
  }, []);

  function toggle(item) {
    if (expanded.includes(item.key)) {
      setExpanded(expanded.filter((key) => key !== item.key));
    } else {
      setExpanded([...expanded, item.key]);
    }
  }

  function select(item) {
    onSelect && onSelect(item.key);

    setSelected(item.key);
  }

  function recursiveRender(subTreeData, indent = 0) {
    return subTreeData.reduce((list, item) => {
      if (!item.isLeaf) {
        list.push(
          <Item
            key={item.key}
            indent={indent}
            isSelected={selected === item.key}
            onPress={() => select(item)}
          >
            <Space gap=".5x" css={HOVER_CSS}>
              <Button
                type="clear"
                margin="-.5x"
                padding=".25x"
                color={{
                  '': '#dark.60',
                  hovered: '#purple',
                }}
                onPress={() => toggle(item)}
              >
                {expanded.includes(item.key) ? (
                  <CaretUpOutlined />
                ) : (
                  <CaretDownOutlined />
                )}
              </Button>
              <Space
                gap="1x"
                flexGrow={1}
                color={selected === item.key ? '#purple' : '#dark.50'}
              >
                {expanded.includes(item.key) ? (
                  <FolderOpenFilled />
                ) : (
                  <FolderFilled />
                )}
                <Block
                  style={TEXT_OVERFLOW_STYLES}
                  color={selected === item.key ? '#purple-text' : '#dark.75'}
                >
                  {item.title}
                </Block>
              </Space>
              {actionsPanel && actionsPanel(item)}
            </Space>
          </Item>,
        );
        if (expanded.includes(item.key)) {
          list.push(...recursiveRender(item.children || [], indent + 1));
        }
      } else if (!onlyDirs) {
        list.push(
          <Item
            key={item.key}
            indent={indent + 1.7}
            isSelected={selected === item.key}
            onPress={() => select(item)}
            mode={item.mode}
          >
            <Space
              gap="1x"
              css={HOVER_CSS}
              color={selected === item.key ? '#purple' : '#dark.50'}
            >
              <FileOutlined />
              <Block
                style={TEXT_OVERFLOW_STYLES}
                flexGrow={1}
                color={selected === item.key ? '#purple-text' : '#dark.75'}
              >
                {item.title}
              </Block>
              {actionsPanel && actionsPanel(item)}
              {item.mode && (
                <Flex padding="0 .5x" placeItems="center">
                  {IMAGES[item.mode]}
                </Flex>
              )}
            </Space>
          </Item>,
        );
      }

      return list;
    }, []);
  }

  return (
    <Flex
      styles={{ flow: 'column', fontWeight: 500, width: '100%', gap: '1bw' }}
      {...otherProps}
    >
      {recursiveRender(fullTreeData)}
    </Flex>
  );
}
