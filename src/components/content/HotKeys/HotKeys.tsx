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

const KeyElement = tasty({
  as: 'kbd',
  role: 'text',
  styles: {
    display: 'inline-flex',
    placeContent: 'center',
    placeItems: 'center start',
    radius: '1r',
    preset: 'tag',
    boxSizing: 'border-box',
    width: '2.5x max-content max-content',
    height: 'min-content',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    padding: '0 (.5x - 1bw)',
    color: {
      '': '#dark.65',
      'type=primary': '#white',
      'type=inherit': 'currentColor',
    },
    fill: {
      '': '#dark.04',
      'type=primary | type=inherit': '#clear',
    },
    border: {
      '': true,
      'type=primary': '#white',
      'type=inherit': 'currentColor',
    },
  },
});

export interface CubeHotKeysProps
  extends BasePropsWithoutChildren,
    ContainerStyleProps {
  children: string;
  type?: 'default' | 'primary' | 'inherit';
}

function HotKeys(props: CubeHotKeysProps, ref) {
  const { children: keys, type, ...otherProps } = props;
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
              <KeyElement
                key={keyIndex}
                data-type={type}
                as="kbd"
                role="text"
                aria-label={`Key ${key}`}
              >
                {key}
              </KeyElement>
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
