import { forwardRef, Fragment } from 'react';

import {
  AllBaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
} from '../../../tasty';
import { useKeySymbols } from '../../../utils/react/useKeySymbols';
import { Space } from '../../layout/Space';
import { Tag } from '../Tag/Tag';
import { Text } from '../Text';

export interface CubeHotKeysProps extends AllBaseProps, ContainerStyleProps {
  keys: string;
}

function HotKeys(props: CubeHotKeysProps, ref) {
  const { keys, ...otherProps } = props;
  const parsedKeys = useKeySymbols(keys);
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <Space
      qa="HotKeys"
      aria-label="Keyboard shortcuts"
      {...filterBaseProps(otherProps, { eventProps: true, labelable: true })}
      ref={ref}
      styles={styles}
      flow="row"
      gap="1x"
      role="group"
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
    </Space>
  );
}

const _HotKeys = forwardRef(HotKeys);

_HotKeys.displayName = 'HotKeys';

export { _HotKeys as HotKeys };
