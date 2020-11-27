import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'inline',
  size: 'md',
};

export default function Text({ as, align, transform, weight, ...props }) {
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
      styleAttrs={['size', 'color', 'textAlign', 'textTransform', 'fontWeight', 'italic']}
      {...props}
    />
  );
}

Text.Minor = function MinorText(props) {
  return <Text color="#minor" {...props}/>;
};

Text.Danger = function DangerText(props) {
  return <Text color="#danger" {...props}/>;
};

Text.Paragraph = function Paragraph(props) {
  return <Text as="p" {...props}/>;
};
