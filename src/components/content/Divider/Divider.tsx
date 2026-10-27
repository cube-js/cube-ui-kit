import {
  BASE_STYLES,
  BaseProps,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  tasty,
} from '@tenphi/tasty';
import { forwardRef, useId } from 'react';
import { useSeparator } from 'react-aria';

import { useSlotProps } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import type { ReactNode } from 'react';

const STYLE_LIST = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

const DividerElement = tasty({
  qa: 'Divider',
  styles: {
    display: {
      '': 'block',
      text: 'grid',
    },
    gridColumns: {
      '': '1fr auto 1fr',
      vertical: 'auto',
    },
    gridRows: {
      '': false,
      vertical: '1fr auto 1fr',
    },
    placeItems: {
      '': 'center stretch',
      vertical: 'stretch center',
    },
    gap: '1x',
    preset: 'c1',
    // `false` leaves a size alone, so `inlineSize` and `blockSize` still apply.
    width: {
      '': false,
      'vertical & !text': '1bw 1bw',
    },
    height: {
      '': '1bw 1bw',
      'vertical | text': false,
    },
    // A vertical divider fills the height of the row it separates, even when
    // the row centers its items. One given a height follows the row's
    // alignment instead.
    alignSelf: {
      '': false,
      'vertical & !sized': 'stretch',
    },
    fill: {
      '': '#border',
      text: 'none',
    },
    border: '0',
    margin: '0',

    Line: {
      width: {
        '': false,
        vertical: '1bw 1bw',
      },
      height: {
        '': '1bw 1bw',
        vertical: false,
      },
      fill: '#border',
    },
  },
});

export interface CubeDividerProps
  extends BaseProps, BaseStyleProps, OuterStyleProps, ColorStyleProps {
  /**
   * Text shown between two lines, such as "or". It also becomes the
   * separator's accessible name, unless `aria-label` or `aria-labelledby`
   * gives one.
   */
  children?: ReactNode;
  /**
   * The direction of the line. A vertical divider separates the items of a
   * flex or grid row and stretches to the row's height, even when the row
   * centers its items. Elsewhere, or to make it shorter, give it a `height`.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = forwardRef(function Divider(
  props: CubeDividerProps,
  ref,
) {
  const allProps = useSlotProps(props, 'divider');
  const { mods, children, orientation = 'horizontal' } = allProps;
  const labelId = useId();

  const hasText = children != null && children !== false && children !== '';
  const isVertical = orientation === 'vertical';
  // An `<hr>` is a horizontal separator on its own. React Aria leaves
  // `aria-orientation` off an `<hr>`, so a vertical divider is a `div`.
  const elementType = hasText || isVertical ? 'div' : 'hr';

  const { separatorProps } = useSeparator({ orientation, elementType });
  const styles = extractStyles(allProps, STYLE_LIST);

  // ARIA makes a separator's children presentational, so its text alone is
  // not a name a screen reader can rely on.
  const labelledBy =
    allProps['aria-labelledby'] ??
    (hasText && !allProps['aria-label'] ? labelId : undefined);

  return (
    <DividerElement
      {...separatorProps}
      {...filterBaseProps(allProps, { eventProps: true })}
      ref={ref}
      as={elementType}
      aria-labelledby={labelledBy}
      mods={{
        text: hasText,
        vertical: isVertical,
        sized: styles.height != null || styles.blockSize != null,
        ...mods,
      }}
      styles={styles}
    >
      {hasText ? (
        <>
          <div data-element="Line" />
          {/* Hidden, so the text is read once, as the name. */}
          <div id={labelId} aria-hidden>
            {children}
          </div>
          <div data-element="Line" />
        </>
      ) : null}
    </DividerElement>
  );
});
