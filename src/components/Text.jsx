import React from 'react';
import Base from './Base';
import { COLOR_STYLES, TEXT_STYLES } from '../styles/list';

const DEFAULT_STYLES = {
  display: 'inline',
  size: 'md',
  margin: '0',
};

export default function Text({ as, align, transform, weight, code, ...props }) {
  if (align) {
    props.textAlign = align;
  }

  if (transform) {
    props.textTransform = transform;
  }

  if (weight) {
    props.fontWeight = weight;
  }

  return (
    <Base
      as={as || 'span'}
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        ...TEXT_STYLES,
        ...COLOR_STYLES,
      ]}
      {...props}
    />
  );
}

Text.Minor = function MinorText(props) {
  return <Text color="#minor" {...props} />;
};

Text.Danger = function DangerText(props) {
  return <Text color="#danger" {...props} />;
};

Text.Paragraph = function Paragraph(props) {
  return <Text as="p" {...props} />;
};
