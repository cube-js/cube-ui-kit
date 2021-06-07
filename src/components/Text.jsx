import React, { forwardRef } from 'react';
import { Base } from './Base';
import { BASE_STYLES, COLOR_STYLES, TEXT_STYLES } from '../styles/list';
import { extractStyles } from '../utils/styles.js';
import { filterBaseProps } from '../utils/filterBaseProps';

const STYLE_LIST = [...BASE_STYLES, ...TEXT_STYLES, ...COLOR_STYLES];

const DEFAULT_STYLES = {
  display: 'inline',
  size: 'md',
  margin: '0',
};

const PROP_MAP = {
  align: 'textAlign',
  transform: 'textTransform',
  weight: 'fontWeight',
  italic: 'fontStyle',
};

export const Text = forwardRef(
  ({ as, code, ellipsis, css, nowrap, italic, styleAttrs, ...props }, ref) => {
    const styles = extractStyles(props, STYLE_LIST, DEFAULT_STYLES, PROP_MAP);

    css = css || '';

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
        css={css}
        {...filterBaseProps(props, { eventProps: true })}
        styles={styles}
        ref={ref}
      />
    );
  },
);

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
