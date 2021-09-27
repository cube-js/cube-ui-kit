import { forwardRef } from 'react';
import THEMES from '../../../data/themes';
import { Base } from '../../Base';
import { CONTAINER_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../types';
import { Styles } from '../../../styles/types';
import { Action } from '../../actions/Action';
import { Suffix } from '../../layout/Suffix';
import { Block } from '../../Block';
import { CloseOutlined } from '@ant-design/icons';

const DEFAULT_STYLES: Styles = {
  position: 'relative',
  display: 'inline-flex',
  placeContent: 'center start',
  placeItems: 'center start',
  radius: '1r',
  preset: 't4m',
  width: '16px max-content max-content',
  height: 'min-content',
  textAlign: 'left',
  color: '#dark.65',
  border: '#border',
  fill: '#dark.04',
  whiteSpace: 'nowrap',
  padding: {
    '': '0 (1x - 1bw)',
    closable: '0 (2.5x - 1bw) 0 (1x - 1bw)',
  },
} as const;

const DEFAULT_CONTENT_STYLES: Styles = {
  width: 'max 100%',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
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
  type?: keyof typeof THEMES;
  isClosable?: boolean;
  onClose?: () => void;
}

const Tag = (allProps: CubeTagProps, ref) => {
  let { type, isClosable, onClose, children, ...props } = allProps;

  const styles = extractStyles(props, CONTAINER_STYLES, {
    ...DEFAULT_STYLES,
    ...(type && type in THEMES
      ? {
          fill: type && THEMES[type] ? THEMES[type].fill : '#white',
          color: type && THEMES[type] ? THEMES[type].color : '#purple',
          border: type && THEMES[type] ? THEMES[type].border : '#purple',
        }
      : {}),
  });

  return (
    <Base
      role="region"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      mods={{ closable: isClosable }}
      ref={ref}
    >
      <Block
        mods={{ closable: isClosable }}
        styles={DEFAULT_CONTENT_STYLES}
      >
        {children}
      </Block>
      {isClosable ? (
        <Suffix outerGap="0">
          <Action onPress={onClose} styles={DEFAULT_CLOSE_STYLES}>
            <CloseOutlined
              style={{
                fontSize: 'calc(var(--font-size) - (var(--border-width) * 2))',
              }}
            />
          </Action>
        </Suffix>
      ) : undefined}
    </Base>
  );
};

const _Tag = forwardRef(Tag);
export { _Tag as Tag };
