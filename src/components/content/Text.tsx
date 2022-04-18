import { CSSProperties, forwardRef } from 'react';
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
import { styled } from '../../styled';
import { useSlotProps } from '../../utils/react';

const STYLE_LIST = [...BASE_STYLES, ...TEXT_STYLES, ...COLOR_STYLES] as const;

const DEFAULT_STYLES: Styles = {
  display: {
    '': 'inline',
    ellipsis: 'block',
  },
  margin: '0',
  whiteSpace: {
    '': 'inherit',
    'nowrap | ellipsis': 'nowrap',
  },
  textOverflow: {
    '': false,
    ellipsis: 'ellipsis',
  },
  overflow: {
    '': false,
    ellipsis: 'hidden',
  },
  width: {
    '': false,
    ellipsis: 'max 100%',
  },
};

export const TEXT_PROP_MAP = {
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
  transform?: ResponsiveStyleValue<CSSProperties['textTransform']>;
}

const RawText = styled({
  name: 'Text',
  tag: 'span',
  styles: DEFAULT_STYLES,
});

const _Text = forwardRef((allProps: CubeTextProps, ref) => {
  allProps = useSlotProps(allProps, 'text');

  const { as, qa, block, styleName, ellipsis, css, nowrap, ...props } =
    allProps;
  const styles = extractStyles(props, STYLE_LIST, {}, TEXT_PROP_MAP);

  return (
    <RawText
      as={as || 'span'}
      qa={qa || 'Text'}
      styleName={styleName}
      mods={{
        nowrap,
        ellipsis,
      }}
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
    return <Text role="alert" ref={ref} color="#danger-text" {...props} />;
  }),
  Success: forwardRef(function SuccessText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#success-text" {...props} />;
  }),
  Strong: forwardRef(function StrongText(props: CubeTextProps, ref) {
    return (
      <Text as="strong" preset="strong" ref={ref} color="#dark" {...props} />
    );
  }),
  Emphasis: forwardRef(function EmphasisText(props: CubeTextProps, ref) {
    return <Text as="em" preset="em" ref={ref} {...props} />;
  }),
  Selection: forwardRef(function SelectionText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#dark" fill="#note.30" {...props} />;
  }),
});

export { Text };
