import {
  CSSProperties,
  forwardRef,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';

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

  const { as, qa, block, ellipsis, nowrap, ...props } = allProps;
  const styles = extractStyles(props, STYLE_LIST, {}, TEXT_PROP_MAP);

  return (
    <TextElement
      as={as || 'span'}
      qa={qa || 'Text'}
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

const MinorText = tasty(Text, {
  styles: {
    color: '#minor',
  },
});

const DangerText = tasty(Text, {
  role: 'alert',
  styles: {
    color: '#danger-text',
  },
});

const SuccessText = tasty(Text, {
  styles: {
    color: '#success-text',
  },
});

const StrongText = tasty(Text, {
  as: 'strong',
  preset: 'strong',
});

const EmphasisText = tasty(Text, {
  as: 'em',
  preset: 'em',
});

const SelectionText = tasty(Text, {
  styles: {
    color: '#dark',
    fill: '#note.30',
  },
});

const PlaceholderText = tasty(Text, {
  styles: {
    color: '#current.5',
  },
});

export interface TextComponent
  extends ForwardRefExoticComponent<
    CubeTextProps & RefAttributes<HTMLElement>
  > {
  Minor: typeof MinorText;
  Danger: typeof DangerText;
  Success: typeof SuccessText;
  Strong: typeof StrongText;
  Emphasis: typeof EmphasisText;
  Selection: typeof SelectionText;
  Placeholder: typeof PlaceholderText;
}

const _Text: TextComponent = Object.assign(Text, {
  Minor: MinorText,
  Danger: DangerText,
  Success: SuccessText,
  Strong: StrongText,
  Emphasis: EmphasisText,
  Selection: SelectionText,
  Placeholder: PlaceholderText,
});

_Text.displayName = 'Text';

export { _Text as Text };
