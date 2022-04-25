import { forwardRef } from 'react';
import THEMES from '../../../data/themes';
import { CONTAINER_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../types';
import { Styles } from '../../../styles/types';
import { Action } from '../../actions/Action';
import { Suffix } from '../../layout/Suffix';
import { Block } from '../../Block';
import { CloseOutlined } from '@ant-design/icons';
import { styled } from '../../../tasty';

const RawTag = styled({
  name: 'Tag',
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
  props: { role: 'status' },
});

const DEFAULT_CONTENT_STYLES: Styles = {
  width: 'max 100%',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  pointerEvents: 'none',
} as const;

const DEFAULT_CLOSE_STYLES: Styles = {
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
} as const;

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
      <Block mods={{ closable: isClosable }} styles={DEFAULT_CONTENT_STYLES}>
        {children}
      </Block>
      {isClosable ? (
        <Suffix outerGap="0">
          <Action onPress={onClose} styles={DEFAULT_CLOSE_STYLES} label="Close">
            <CloseOutlined
              style={{
                fontSize: 'calc(var(--font-size) - (var(--border-width) * 2))',
              }}
            />
          </Action>
        </Suffix>
      ) : undefined}
    </RawTag>
  );
};

const _Tag = forwardRef(Tag);
export { _Tag as Tag };
