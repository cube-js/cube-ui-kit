import React, { forwardRef } from 'react';
import { Base } from './Base';
import {
  BASE_STYLES,
  BaseStyleProps,
  COLOR_STYLES,
  TEXT_STYLES,
  TextStyleProps
} from '../styles/list';
import { extractStyles } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import { BaseProps } from "./types";

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

export interface TextProps extends BaseProps, TextStyleProps, BaseStyleProps {
  code?: boolean,
  ellipsis?: boolean,
  nowrap?: boolean,
  italic?: boolean,
}

const _Text = forwardRef(
  (allProps: TextProps, ref) => {
    let { as, qa, code, ellipsis, css, nowrap, italic, ...props } = allProps;
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
        qa={qa || 'Text'}
        css={css}
        {...filterBaseProps(props, { eventProps: true })}
        styles={styles}
        ref={ref}
      />
    );
  },
);

const Text = Object.assign(
  _Text,
  {
    Minor: function MinorText(props) {
      return <Text color="#minor" {...props} />;
    },
    Danger: function DangerText(props) {
      return <Text color="#danger-text" {...props} />;
    },
    Success: function SuccessText(props) {
      return <Text color="#success-text" {...props} />;
    },
    Strong: function StrongText(props) {
      return <Text color="#dark" weight={600} {...props} />;
    },
    Selection: function SelectionText(props) {
      return <Text color="#dark" fill="#note.30" {...props} />;
    },
  }
);

export { Text };
