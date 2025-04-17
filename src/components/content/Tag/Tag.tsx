import { forwardRef, ReactNode } from 'react';

import THEMES from '../../../data/themes';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
} from '../../../tasty';
import { Action } from '../../actions';
import { Suffix } from '../../layout/Suffix';
import { CloseIcon } from '../../../icons';

const TagElement = tasty({
  qa: 'Tag',
  role: 'status',
  styles: {
    position: 'relative',
    display: 'inline-flex',
    gap: '1x',
    placeContent: 'center start',
    placeItems: 'center start',
    radius: '1r',
    preset: 'tag',
    width: '16px max-content max-content',
    height: 'min-content',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    padding: {
      '': '0 (1x - 1bw)',
      closable: '0 (2.5x - 1bw) 0 (1x - 1bw)',
    },
    fill: {
      '': '#dark.04',
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`[data-type="${type}"]`] = THEMES[type].fill;

        return map;
      }, {}),
    },
    color: {
      '': '#dark.65',
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`[data-type="${type}"]`] = THEMES[type].color;

        return map;
      }, {}),
    },
    border: {
      '': true,
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`[data-type="${type}"]`] = THEMES[type].border;

        return map;
      }, {}),
    },

    Icon: {
      fontSize: '@icon-size',
    },

    Content: {
      display: 'block',
      width: 'max 100%',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      pointerEvents: 'none',
    },
  },
});

const CloseAction = tasty(Action, {
  label: 'Close',
  styles: {
    display: 'grid',
    placeItems: 'center',
    color: true,
    placeSelf: 'stretch',
    opacity: {
      '': 0.85,
      'pressed | hovered': 1,
    },
    transition: 'opacity',
    padding: '0 .5x',
  },
});

export interface CubeTagProps extends BaseProps, ContainerStyleProps {
  /* @deprecated Use theme instead */
  type?: keyof typeof THEMES | string;
  theme?: keyof typeof THEMES | string;
  isClosable?: boolean;
  onClose?: () => void;
  closeButtonStyles?: Styles;
  icon?: ReactNode;
}

function Tag(allProps: CubeTagProps, ref) {
  let {
    type,
    theme,
    icon,
    isClosable,
    onClose,
    closeButtonStyles,
    children,
    mods,
    ...props
  } = allProps;

  const styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <TagElement
      {...filterBaseProps(props, { eventProps: true })}
      ref={ref}
      styles={styles}
      data-type={theme ?? type}
      mods={{ ...mods, closable: isClosable }}
    >
      {icon ? <div data-element="TagIcon">{icon}</div> : null}
      <div data-element="Content">{children}</div>
      {isClosable ? (
        <Suffix outerGap="0">
          <CloseAction styles={closeButtonStyles} onPress={onClose}>
            <CloseIcon size={12} />
          </CloseAction>
        </Suffix>
      ) : undefined}
    </TagElement>
  );
}

const _Tag = forwardRef(Tag);

_Tag.displayName = 'Tag';

export { _Tag as Tag };
