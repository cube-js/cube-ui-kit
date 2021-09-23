import { CSSProperties, forwardRef } from 'react';
import { Base } from '../Base';
import { BASE_STYLES, COLOR_STYLES, TEXT_STYLES } from '../../styles/list';
import { extractStyles, ResponsiveStyleValue } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import {
  BaseProps,
  BaseStyleProps,
  ColorStyleProps,
  TagNameProps,
  TextStyleProps,
} from '../types';
import { Styles } from '../../styles/types';

const STYLE_LIST = [...BASE_STYLES, ...TEXT_STYLES, ...COLOR_STYLES] as const;

const DEFAULT_STYLES: Styles = {
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
    TagNameProps,
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
  italic?: ResponsiveStyleValue<CSSProperties['fontStyle']>;
  weight?: string | number;
  align?: ResponsiveStyleValue<CSSProperties['textAlign']>;
  transform?: ResponsiveStyleValue<CSSProperties['textTransform']>;
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
  Minor: forwardRef(function MinorText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#minor" {...props} />;
  }),
  Danger: forwardRef(function DangerText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#danger-text" {...props} />;
  }),
  Success: forwardRef(function SuccessText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#success-text" {...props} />;
  }),
  Strong: forwardRef(function StrongText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#dark" weight={600} {...props} />;
  }),
  Selection: forwardRef(function SelectionText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#dark" fill="#note.30" {...props} />;
  }),
});

export { Text };
