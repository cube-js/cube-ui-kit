import { CSSProperties, forwardRef } from 'react';

import {
  AllBaseProps,
  BASE_STYLES,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  extractStyles,
  filterBaseProps,
  ResponsiveStyleValue,
  TagName,
  tasty,
  TEXT_STYLES,
  TextStyleProps,
} from '../../tasty';
import { useSlotProps } from '../../utils/react';

const STYLE_LIST = [...BASE_STYLES, ...TEXT_STYLES, ...COLOR_STYLES] as const;

export const TEXT_PROP_MAP = {
  transform: 'textTransform',
  weight: 'fontWeight',
  italic: 'fontStyle',
} as const;

export interface CubeTextProps<T extends TagName = TagName>
  extends AllBaseProps<T>,
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

const TextElement = tasty({
  qa: 'Text',
  as: 'span',
  styles: {
    display: {
      '': 'inline',
      'ellipsis | block': 'block',
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
  },
});

const Text = forwardRef(function CubeText(allProps: CubeTextProps, ref) {
  allProps = useSlotProps(allProps, 'text');

  const { as, qa, block, styleName, ellipsis, nowrap, ...props } = allProps;
  const styles = extractStyles(props, STYLE_LIST, {}, TEXT_PROP_MAP);

  return (
    <TextElement
      as={as || 'span'}
      qa={qa || 'Text'}
      styleName={styleName}
      mods={{
        nowrap,
        ellipsis: !!ellipsis,
        block: !!block,
      }}
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      styles={styles}
    />
  );
});

const _Text = Object.assign(Text, {
  Minor: forwardRef(function MinorText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#minor" {...props} />;
  }),
  Danger: forwardRef(function DangerText(props: CubeTextProps, ref) {
    return <Text ref={ref} role="alert" color="#danger-text" {...props} />;
  }),
  Success: forwardRef(function SuccessText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#success-text" {...props} />;
  }),
  Strong: forwardRef(function StrongText(props: CubeTextProps<'strong'>, ref) {
    return <Text ref={ref} as="strong" preset="strong" {...props} />;
  }),
  Emphasis: forwardRef(function StrongText(props: CubeTextProps<'em'>, ref) {
    return <Text ref={ref} as="em" preset="em" {...props} />;
  }),
  Selection: forwardRef(function SelectionText(props: CubeTextProps, ref) {
    return <Text ref={ref} color="#dark" fill="#note.30" {...props} />;
  }),
});

_Text.displayName = 'Text';

export { _Text as Text };
