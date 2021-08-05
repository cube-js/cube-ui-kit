import { CSSProperties, forwardRef } from 'react';
import { Base } from './Base';
import { BASE_STYLES, COLOR_STYLES, TEXT_STYLES } from '../styles/list';
import { extractStyles, NuResponsiveStyleValue } from '../utils/styles';
import { filterBaseProps } from '../utils/filterBaseProps';
import {
  BaseProps,
  BaseStyleProps,
  ColorStyleProps,
  TextStyleProps,
} from './types';
import { NuStyles } from '../styles/types';

const STYLE_LIST = [...BASE_STYLES, ...TEXT_STYLES, ...COLOR_STYLES] as const;

const DEFAULT_STYLES: NuStyles = {
  display: 'inline',
  size: 'md',
  margin: '0',
} as const;

const PROP_MAP = {
  align: 'textAlign',
  transform: 'textTransform',
  weight: 'fontWeight',
  italic: 'fontStyle',
} as const;

export interface CubeTextProps
  extends BaseProps,
    TextStyleProps,
    BaseStyleProps,
    ColorStyleProps {
  code?: boolean;
  ellipsis?: boolean;
  nowrap?: boolean;
  italic?: NuResponsiveStyleValue<CSSProperties['fontStyle']>;
  weight?: NuResponsiveStyleValue<CSSProperties['fontWeight']>;
  align?: NuResponsiveStyleValue<CSSProperties['textAlign']>;
  transform?: NuResponsiveStyleValue<CSSProperties['textTransform']>;
}

const _Text = forwardRef((allProps: CubeTextProps, ref) => {
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
});

const Text = Object.assign(_Text, {
  Minor: function MinorText(props: CubeTextProps) {
    return <Text color="#minor" {...props} />;
  },
  Danger: function DangerText(props: CubeTextProps) {
    return <Text color="#danger-text" {...props} />;
  },
  Success: function SuccessText(props: CubeTextProps) {
    return <Text color="#success-text" {...props} />;
  },
  Strong: function StrongText(props: CubeTextProps) {
    return <Text color="#dark" weight={600} {...props} />;
  },
  Selection: function SelectionText(props: CubeTextProps) {
    return <Text color="#dark" fill="#note.30" {...props} />;
  },
});

export { Text };
