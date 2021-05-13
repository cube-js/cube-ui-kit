import React from 'react';
import Base from './Base';
import { COLOR_STYLES, TEXT_STYLES } from '../styles/list';

const DEFAULT_STYLES = {
  display: 'inline',
  size: 'md',
  margin: '0',
};

export default function Text({
  as,
  align,
  transform,
  weight,
  code,
  ellipsis,
  css,
  nowrap,
  italic,
  styleAttrs,
  ...props
}) {
  css = css || '';

  props = { ...props };

  if (italic) {
    props.fontStyle = 'italic';
  }

  if (align) {
    props.textAlign = align;
  }

  if (transform) {
    props.textTransform = transform;
  }

  if (weight) {
    props.fontWeight = weight;
  }

  if (ellipsis) {
    css += `
      && {
        ${!as ? 'display: block;' : ''}
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        max-width: 100%;
      }
    `;
  }

  if (nowrap) {
    css += `
      && {
        white-space: nowrap;
      }
    `;
  }

  return (
    <Base
      as={as || 'span'}
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={styleAttrs || [...TEXT_STYLES, ...COLOR_STYLES]}
      css={css}
      {...props}
    />
  );
}

Text.Minor = function MinorText(props) {
  return <Text color="#minor" {...props} />;
};

Text.Danger = function DangerText(props) {
  return <Text color="#danger-text" {...props} />;
};

Text.Success = function SuccessText(props) {
  return <Text color="#success-text" {...props} />;
};

Text.Strong = function StrongText(props) {
  return <Text color="#dark" weight={600} {...props} />;
};

Text.Selection = function SelectionText(props) {
  return <Text color="#dark" fill="#note.30" {...props} />;
};
