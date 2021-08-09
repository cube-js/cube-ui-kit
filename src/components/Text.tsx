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
  /**
   * Whether the text uses the monospace font.
   */
  monospace?: boolean;
  /**
   * Whether the text overflow is ellipsis
   */
  ellipsis?: boolean;
  /**
   * Whether the text is not wrapping
   */
  nowrap?: boolean;
  /**
   * Whether the text has italic style
   */
  italic?: NuResponsiveStyleValue<CSSProperties['fontStyle']>;
  weight?: NuResponsiveStyleValue<CSSProperties['fontWeight']>;
  align?: NuResponsiveStyleValue<CSSProperties['textAlign']>;
  transform?: NuResponsiveStyleValue<CSSProperties['textTransform']>;
}

const _Text = forwardRef((allProps: CubeTextProps, ref) => {
  let { as, qa, block, ellipsis, css, nowrap, ...props } = allProps;

  const styles = extractStyles(
    props,
    STYLE_LIST,
    {
      ...DEFAULT_STYLES,
      whiteSpace: nowrap ? 'nowrap' : 'initial',
      ...(ellipsis
        ? {
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            width: 'max 100%',
          }
        : null),
    },
    PROP_MAP,
  );

  css = css || '';

  return (
    <Base
      as={as || 'span'}
      qa={qa || 'Text'}
      block={!!(block || ellipsis)}
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
