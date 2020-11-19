import React from 'react';
import Base from './Base';
import CloudLogo from './CloudLogo';

const DEFAULT_STYLES = {
  display: 'flex',
  flow: 'row',
  gap: '1x',
  content: 'space-between',
  padding: '1x 1.5x',
  bg: '#white',
};

export default function TopBar({ children, onLogoPress, ...props }) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={['gap', 'height', 'width', 'content', 'items']}
      {...props}
    >
      <CloudLogo onPress={onLogoPress} />
      { children }
    </Base>
  );
}
