import React from 'react';
import Base from '../../components/Base';
import CloudLogo from '../../atoms/CloudLogo/CloudLogo';
import Space from '../../components/Space';

const DEFAULT_STYLES = {
  display: 'flex',
  flow: 'row',
  gap: '1x',
  content: 'space-between',
  items: 'center',
  padding: '1x 1.5x',
  fill: '#white',
};

export default function TopBar({ children, onLogoPress, ...props }) {
  return (
    <Base
      role="banner"
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={['gap', 'height', 'width', 'content', 'items', 'border']}
      content="space-between"
      {...props}
    >
      <CloudLogo onPress={onLogoPress} />
      <Space grow={1} content="space-between">
        {children}
      </Space>
    </Base>
  );
}
