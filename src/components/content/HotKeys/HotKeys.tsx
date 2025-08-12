import { forwardRef, Fragment } from 'react';

import {
  BasePropsWithoutChildren,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../../tasty';
import { useKeySymbols } from '../../../utils/react/useKeySymbols';
import { Space } from '../../layout/Space';
import { Tag } from '../Tag/Tag';
import { Text } from '../Text';

const StyledHotKeys = tasty(Space, {
  qa: 'HotKeys',
  role: 'group',
  'aria-label': 'Keyboard shortcuts',
  styles: {
    display: 'inline-flex',
    flow: 'row',
    gap: '1x',
    placeSelf: 'center',
  },
});

export interface CubeHotKeysProps
  extends BasePropsWithoutChildren,
    ContainerStyleProps {
  children: string;
  theme?: 'default' | 'special';
}

function HotKeys(props: CubeHotKeysProps, ref) {
  const { children: keys, theme, ...otherProps } = props;
  const parsedKeys = useKeySymbols(keys);
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <StyledHotKeys
      qa="HotKeys"
      {...filterBaseProps(otherProps, { eventProps: true, labelable: true })}
      ref={ref}
      styles={styles}
    >
      {parsedKeys.map((keyGroup, groupIndex) => (
        <Fragment key={groupIndex}>
          {groupIndex > 0 && (
            <Text color="#dark-03" role="separator" aria-hidden="true">
              or
            </Text>
          )}
          <Space
            flow="row"
            gap="0.25x"
            role="group"
            aria-label={`Key combination ${groupIndex + 1}`}
          >
            {keyGroup.map((key, keyIndex) => (
              <Tag
                key={keyIndex}
                theme={theme}
                as="kbd"
                role="text"
                aria-label={`Key ${key}`}
              >
                {key}
              </Tag>
            ))}
          </Space>
        </Fragment>
      ))}
    </StyledHotKeys>
  );
}

const _HotKeys = forwardRef(HotKeys);

_HotKeys.displayName = 'HotKeys';

export { _HotKeys as HotKeys };
