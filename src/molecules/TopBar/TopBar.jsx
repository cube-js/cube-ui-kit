import React from 'react';
import { Base } from '../../components/Base';
import { CloudLogo } from '../../atoms/CloudLogo/CloudLogo';
import { Space } from '../../components/Space';
import {
  BASE_STYLES,
  BLOCK_STYLES,
  FLOW_STYLES,
  POSITION_STYLES,
} from '../../styles/list';
import { extractStyles } from '../../utils/styles';

const DEFAULT_STYLES = {
  display: 'flex',
  flow: 'row',
  gap: '1x',
  content: 'space-between',
  items: 'center',
  padding: '1x 1.5x',
  fill: '#white',
};

const STYLE_LIST = [
  ...BASE_STYLES,
  ...BLOCK_STYLES,
  ...FLOW_STYLES,
  ...POSITION_STYLES,
];

export function TopBar({ children, onLogoPress, ...props }) {
  const styles = extractStyles(props, STYLE_LIST, DEFAULT_STYLES);

  return (
    <Base role="banner" {...props} styles={styles}>
      <CloudLogo onPress={onLogoPress} />
      <Space grow={1} content="space-between">
        {children}
      </Space>
    </Base>
  );
}
