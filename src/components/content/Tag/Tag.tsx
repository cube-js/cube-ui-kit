import { Styles, tasty } from '@tenphi/tasty';
import { forwardRef } from 'react';

import { ItemVariant } from '../../../data/item-themes';
import { useI18n } from '../../../i18n/useI18n';
import { CloseIcon } from '../../../icons/CloseIcon';
import { mergeStyleLayers } from '../../../utils/styles';
import { CubeItemProps, Item } from '../Item/Item';

const TagElement = tasty(Item, {
  qa: 'Tag',
  role: 'status',
  styles: {
    padding: 0,
    preset: {
      '': 'tag',
      'size=xsmall': 't4',
      'size=small | size=medium': 't3',
      'size=large | size=xlarge': 't2',
    },
    border: {
      // extend
      // The default card's border is the text color at 20%, darker than a
      // field's; a neutral chip takes the standard one. Tinted themes keep
      // their own.
      neutral: '#border',
      'type=primary': '#clear',
    },

    '$min-inline-padding': '.5x',

    // Squeezed below its label, the label keeps its end padding as a box the
    // column can't hold: `stretch` keeps that box after the icon, and `clip`
    // hides the part past the edge. End content zeroes that padding, so then
    // only the content itself overflows, and it must stay visible.
    overflow: { '': 'clip', 'has-end-content': 'visible' },

    Label: {
      textAlign: 'center',
      placeSelf: 'center stretch',
    },
  },
});

/**
 * A chip's close button: a small mark, quieter than the label until the
 * pointer is on it. The button keeps its full size, so the target does not
 * shrink with the glyph.
 */
export const TAG_CLOSE_ACTION_STYLES: Styles = {
  color: {
    '': '#current.6',
    'hovered | pressed': '#current',
  },
  '$local-icon-size': '1.5x',
};

export interface CubeTagProps extends CubeItemProps {
  /**
   * Visual theme. Every value but `special` is a soft card — pale fill, tinted
   * border, strong colored text. `primary` and `special` are the same brand
   * hue at two weights: `primary` is the soft card, `special` the solid fill.
   */
  theme?:
    | 'default'
    | 'primary'
    | 'danger'
    | 'success'
    | 'warning'
    | 'note'
    | 'special';
  isClosable?: boolean;
  onClose?: () => void;
  closeButtonStyles?: Styles;
}

function Tag(allProps: CubeTagProps, ref) {
  const { t } = useI18n();

  let {
    theme = 'default',
    isClosable,
    onClose,
    closeButtonStyles,
    children,
    size = 'inline',
    mods,
    ...props
  } = allProps;

  let type = 'card';

  // `special` is the SOLID brand chip, and it is spelled as the `default`
  // theme's `primary` type rather than as a theme of its own. Not a typo to be
  // tidied into `theme = 'primary'`: that is the SOFT brand card
  // (`primary.card`), which is a different weight and reachable under its own
  // name. The two are deliberately separate spellings of the same hue.
  if (theme === 'special') {
    theme = 'default';
    type = 'primary';
  }

  return (
    <TagElement
      ref={ref}
      size={size}
      data-type={type}
      variant={`${theme}.${type}` as ItemVariant}
      // The element's own `theme` mod is always `default`: the theme travels
      // in `variant`.
      mods={{ neutral: theme === 'default' && type === 'card', ...mods }}
      actions={
        isClosable ? (
          <Item.Action
            aria-label={t('tag.close', 'Close')}
            styles={mergeStyleLayers(
              TAG_CLOSE_ACTION_STYLES,
              closeButtonStyles,
            )}
            icon={<CloseIcon />}
            onPress={onClose}
          />
        ) : undefined
      }
      {...props}
    >
      {children}
    </TagElement>
  );
}

const _Tag = forwardRef(Tag);

_Tag.displayName = 'Tag';

export { _Tag as Tag };
