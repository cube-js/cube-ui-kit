import { forwardRef } from 'react';

import THEMES from '../../../data/themes';
import { CloseIcon } from '../../../icons';
import { Styles, tasty } from '../../../tasty';
import { CubeItemProps, Item } from '../Item';

const TagElement = tasty(Item, {
  qa: 'Tag',
  role: 'status',
  styles: {
    fill: {
      '': '#dark.04',
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`type=${type}`] = THEMES[type].fill;

        return map;
      }, {}),
    },
    color: {
      '': '#dark.65',
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`type=${type}`] = THEMES[type].color;

        return map;
      }, {}),
    },
    border: {
      '': true,
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`type=${type}`] = THEMES[type].border;

        return map;
      }, {}),
    },

    Label: {
      textAlign: 'center',
      placeSelf: 'center',
    },
  },
});

export interface CubeTagProps extends CubeItemProps {
  /* @deprecated Use theme instead */
  type?: keyof typeof THEMES | string;
  theme?: keyof typeof THEMES | string;
  isClosable?: boolean;
  onClose?: () => void;
  closeButtonStyles?: Styles;
}

function Tag(allProps: CubeTagProps, ref) {
  let {
    type,
    theme,
    isClosable,
    onClose,
    closeButtonStyles,
    children,
    size = 'inline',
    mods,
    ...props
  } = allProps;

  const tagTheme = theme ?? type;

  return (
    <TagElement
      ref={ref}
      size={size}
      data-type={tagTheme}
      type={tagTheme === 'special' ? 'primary' : 'neutral'}
      mods={mods}
      actions={
        isClosable ? (
          <Item.Action
            aria-label="Close"
            styles={{ color: 'currentColor', ...closeButtonStyles }}
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
