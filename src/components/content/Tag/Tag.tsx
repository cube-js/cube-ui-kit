import { forwardRef } from 'react';
import { ItemVariant } from 'src/data/item-themes';

import { CloseIcon } from '../../../icons';
import { Styles, tasty } from '../../../tasty';
import { CubeItemProps, Item } from '../Item';

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

    '$min-inline-padding': '.5x',

    Label: {
      textAlign: 'center',
      placeSelf: 'center',
    },
  },
});

export interface CubeTagProps extends CubeItemProps {
  theme?: 'default' | 'danger' | 'success' | 'note' | 'special';
  isClosable?: boolean;
  onClose?: () => void;
  closeButtonStyles?: Styles;
}

function Tag(allProps: CubeTagProps, ref) {
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

  let type = 'alert';

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
