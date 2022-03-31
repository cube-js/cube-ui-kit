import { useEffect, useState, Fragment, ReactNode, CSSProperties } from 'react';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { CubeFlexProps, Flex } from '../../layout/Flex';
import { Action } from '../../actions/Action';
import { Button } from '../../actions';
import { Space } from '../../layout/Space';
import { Block } from '../../Block';
import { Paragraph } from '../../content/Paragraph';
import { Text } from '../../content/Text';
import { Styles } from '../../../styles/types';

export type CubeSearchFileData = {
  title?: string;
  key: string;
  entry?: string;
  before?: string;
  after?: string;
  items: CubeSearchFileDataItem[];
};

export type CubeSearchFileDataItem = {
  entry: string;
  before?: string;
  after?: string;
  row: number;
  column: number;
};

const TEXT_OVERFLOW_STYLES: CSSProperties = {
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  overflow: 'hidden',
};

function getItemStyles({
  indent,
  isSelected,
}: CubeSearchResultsItemProps): Styles {
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

export interface CubeSearchResultsItemProps {
  children?: ReactNode;
  indent?: number | null;
  onPress?: () => void;
  isSelected?: boolean;
}

function Item({
  children,
  indent,
  onPress,
  isSelected,
}: CubeSearchResultsItemProps) {
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

export type SearchPosition = [number, number];

export interface CubeSearchResultsProps extends CubeFlexProps {
  onSelect?: (string, SearchPosition?) => void;
  files: CubeSearchFileData[];
  selectedKey?: string;
  defaultExpandAll?: boolean;
}

export function SearchResults({
  onSelect,
  files,
  selectedKey,
  defaultExpandAll,
  ...otherProps
}: CubeSearchResultsProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
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

  function select(item, position?) {
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
                  label={expanded.includes(file.key) ? 'Collapse' : 'Expand'}
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
                  flexGrow={1}
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
                        flexGrow={1}
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
