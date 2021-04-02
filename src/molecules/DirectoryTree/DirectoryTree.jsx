import React, { useEffect, useState } from 'react';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  FileOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import Flex from '../../components/Flex';
import Action from '../../components/Action';
import Button from '../../atoms/Button/Button';
import Space from '../../components/Space';
import Block from '../../components/Block';

const TEXT_OVERFLOW_STYLES = {
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  overflow: 'hidden',
};

function calcPadding(indent) {
  return `.75x .5x .75x ${1.5 * indent + 0.5}x`;
}

function extractLeafKeys(subTreeData, dirsOnly) {
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

function getItemStyles({ selected }) {
  return {
    width: 'max 100%',
    radius: true,
    textAlign: 'left',
    fill: selected
      ? '#purple.05'
      : {
          '': '#clear',
          hovered: '#dark.04',
        },
    color: selected ? '#purple-text' : '#dark.75',
    outline: {
      '': '#purple-03.0',
      'focused & focus-visible': '#purple-03',
    },
    fontWeight: selected ? 500 : 400,
    padding: '.75x .5x',
  };
}

function Item({ children, indent, onClick, selected }) {
  return (
    <Action
      padding={calcPadding(indent)}
      onClick={onClick}
      styles={getItemStyles({ selected })}
      style={{ whiteSpace: 'nowrap' }}
    >
      {children}
    </Action>
  );
}

function sortTreeData(filesTree) {
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
    } else {
      return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
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

export default function DirectoryTree({
  onSelect,
  treeData,
  selectedKey,
  defaultExpandAll,
  rootTitle,
  actionsPanel,
  onlyDirs,
  ...otherProps
}) {
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
            selected={selected === item.key}
            onClick={() => select(item)}
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
                onClick={() => toggle(item)}
              >
                {expanded.includes(item.key) ? (
                  <CaretUpOutlined />
                ) : (
                  <CaretDownOutlined />
                )}
              </Button>
              <Space
                gap="1x"
                grow="1"
                color={selected === item.key ? '#purple' : '#dark.50'}
              >
                {expanded.includes(item.key) ? (
                  <FolderOpenOutlined />
                ) : (
                  <FolderOutlined />
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
          list.push(
            ...recursiveRender(item.children || [], indent + 1, onlyDirs),
          );
        }
      } else if (!onlyDirs) {
        list.push(
          <Item
            key={item.key}
            indent={indent + 1.7}
            selected={selected === item.key}
            onClick={() => select(item)}
          >
            <Space
              gap="1x"
              css={HOVER_CSS}
              color={selected === item.key ? '#purple' : '#dark.50'}
            >
              <FileOutlined />
              <Block
                style={TEXT_OVERFLOW_STYLES}
                grow="1"
                color={selected === item.key ? '#purple-text' : '#dark.75'}
              >
                {item.title}
              </Block>
              {actionsPanel && actionsPanel(item)}
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
