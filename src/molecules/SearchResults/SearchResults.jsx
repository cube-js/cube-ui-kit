import React, { useEffect, useState, Fragment } from 'react';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { Flex } from '../../components/Flex';
import { Action } from '../../components/Action';
import { Button } from '../../atoms/Button/Button';
import { Space } from '../../components/Space';
import { Block } from '../../components/Block';
import { Paragraph } from '../../components/Paragraph';
import { Text } from '../../components/Text';

const TEXT_OVERFLOW_STYLES = {
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  overflow: 'hidden',
};

function getItemStyles({ indent, isSelected }) {
  return {
    width: 'max 100%',
    radius: true,
    textAlign: 'left',
    fill: isSelected
      ? '#purple.05'
      : {
          '': '#clear',
          hovered: '#dark.04',
        },
    color: isSelected ? '#purple-text' : '#dark.75',
    outline: {
      '': '#purple-03.0',
      'focused & focus-visible': '#purple-03',
    },
    fontWeight: 400,
    padding: `.75x .5x .75x ${indent || 0.5}x`,
  };
}

function Item({ children, indent, onPress, isSelected }) {
  return (
    <Action
      onPress={onPress}
      styles={getItemStyles({ indent, isSelected })}
      style={{ whiteSpace: 'nowrap' }}
    >
      {children}
    </Action>
  );
}

const HOVER_CSS = `
  &:hover .actions { 
    opacity: 1;
  }
  &:not(:hover) .actions {
    opacity: 0;
  }
`;

export function SearchResults({
  onSelect,
  files,
  selectedKey,
  defaultExpandAll,
  ...otherProps
}) {
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState(selectedKey);

  useEffect(() => {
    setSelected(selectedKey);
  }, [selectedKey]);

  useEffect(() => {
    if (defaultExpandAll) {
      setExpanded(files.map((file) => file.key));
    }
  }, []);

  useEffect(() => {
    if (defaultExpandAll) {
      setExpanded(files.map((file) => file.key));
    }
  }, [files]);

  function toggle(item) {
    if (expanded.includes(item.key)) {
      setExpanded(expanded.filter((key) => key !== item.key));
    } else {
      setExpanded([...expanded, item.key]);
    }
  }

  function select(item, position) {
    const key = typeof item === 'string' ? item : item.key;

    onSelect && onSelect(key.split('|')[0], position);

    setSelected(key);
  }

  const resultsNumber = files.reduce((sum, file) => sum + file.items.length, 0);

  return (
    <Flex
      styles={{
        flow: 'column',
        width: '100%',
        gap: '1bw',
        padding: '2x bottom',
      }}
      {...otherProps}
    >
      <Paragraph color="#dark.50" padding="1x 0">
        {resultsNumber
          ? `${resultsNumber} result${resultsNumber > 1 ? 's' : ''} in ${
              files.length
            } file${files.length > 1 ? 's' : ''}`
          : 'No results found'}
      </Paragraph>
      {files.map((file) => {
        return (
          <Fragment key={file.key}>
            <Item
              key={file.key}
              isSelected={selected === file.key}
              onPress={() => select(file)}
              indent={file.items.length ? null : 2.25}
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
                  onPress={() => toggle(file)}
                >
                  {file.items.length ? (
                    expanded.includes(file.key) ? (
                      <CaretUpOutlined />
                    ) : (
                      <CaretDownOutlined />
                    )
                  ) : null}
                </Button>
                <Space
                  gap="1x"
                  grow="1"
                  color={selected === file.key ? '#purple' : '#dark.50'}
                >
                  {expanded.includes(file.key) ? (
                    <FileOutlined />
                  ) : (
                    <FileOutlined />
                  )}
                  <Block
                    style={TEXT_OVERFLOW_STYLES}
                    color={selected === file.key ? '#purple-text' : '#dark.75'}
                  >
                    {file.entry ? (
                      <>
                        {file.before || ''}
                        <Text.Selection>{file.entry}</Text.Selection>
                        {file.after || ''}
                      </>
                    ) : (
                      file.title
                    )}
                  </Block>
                </Space>
              </Space>
            </Item>
            {(expanded.includes(file.key) ? file.items || [] : []).map(
              (item, i) => {
                const key = `${file.key}|${i}`;
                const isSelected = selected === key;

                return (
                  <Item
                    key={key}
                    indent={3.5}
                    isSelected={isSelected}
                    onPress={() => select(key, [item.row, item.column])}
                  >
                    <Space
                      gap="1x"
                      css={HOVER_CSS}
                      color={isSelected ? '#purple' : '#dark.50'}
                    >
                      <Block
                        style={TEXT_OVERFLOW_STYLES}
                        grow="1"
                        color={isSelected ? '#purple-text' : '#dark.75'}
                      >
                        {item.before || ''}
                        <Text.Selection>{item.entry}</Text.Selection>
                        {item.after || ''}
                      </Block>
                    </Space>
                  </Item>
                );
              },
            )}
          </Fragment>
        );
      })}
    </Flex>
  );
}
