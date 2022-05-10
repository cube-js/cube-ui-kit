import { forwardRef } from 'react';
import THEMES from '../../../data/themes';
import { CONTAINER_STYLES } from '../../../tasty/styles/list';
import { extractStyles } from '../../../tasty/utils/styles';
import { filterBaseProps } from '../../../tasty/utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../../tasty/types';
import { Action } from '../../actions/Action';
import { Suffix } from '../../layout/Suffix';
import { Block } from '../../Block';
import { CloseOutlined } from '@ant-design/icons';
import { tasty } from '../../../tasty';

const RawTag = tasty({
  qa: 'Tag',
  role: 'status',
  styles: {
    position: 'relative',
    display: 'inline-flex',
    placeContent: 'center start',
    placeItems: 'center start',
    radius: '1r',
    preset: 't4m',
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
  },
});

const RawContent = tasty(Block, {
  styles: {
    width: 'max 100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
});

const CloseAction = tasty(Action, {
  label: 'Close',
  styles: {
    display: 'grid',
    placeItems: 'center',
    color: true,
    placeSelf: 'center',
    opacity: {
      '': 0.85,
      'pressed | hovered': 1,
    },
    transition: 'opacity',
    padding: '0 .5x',
  },
});

export interface CubeTagProps extends BaseProps, ContainerStyleProps {
  type?: keyof typeof THEMES | string;
  isClosable?: boolean;
  onClose?: () => void;
}

const Tag = (allProps: CubeTagProps, ref) => {
  let { type, isClosable, onClose, children, ...props } = allProps;

  const styles = extractStyles(props, CONTAINER_STYLES);

  return (
    <RawTag
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      data-type={type}
      mods={{ closable: isClosable }}
      ref={ref}
    >
      <RawContent mods={{ closable: isClosable }}>{children}</RawContent>
      {isClosable ? (
        <Suffix outerGap="0">
          <CloseAction onPress={onClose}>
            <CloseOutlined
              style={{
                fontSize: 'calc(var(--font-size) - (var(--border-width) * 2))',
              }}
            />
          </CloseAction>
        </Suffix>
      ) : undefined}
    </RawTag>
  );
};

const _Tag = forwardRef(Tag);
export { _Tag as Tag };
