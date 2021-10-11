import { forwardRef } from 'react';
import { Action, CubeActionProps } from '../Action';
import { Space } from '../../layout/Space';
import { LoadingOutlined } from '@ant-design/icons';
import { propDeprecationWarning } from '../../../utils/warnings';
import { useContextStyles } from '../../../providers/StylesProvider';
import { FocusableRef } from '@react-types/shared';
import { Styles } from '../../../styles/types';
import { Block } from '../../Block';

export interface CubeButtonProps extends CubeActionProps {
  ghost?: boolean;
  icon?: JSX.Element;
  isLoading?: boolean;
  isSelected?: boolean;
  type?:
    | 'primary'
    | 'default'
    | 'danger'
    | 'link'
    | 'clear'
    | 'outline'
    | 'tab'
    | 'item'
    | string;
}

export function provideStyles({
  size,
  type,
  isDisabled,
  ghost,
  isLoading,
  icon,
  children,
}) {
  return {
    ...STYLES_BY_SIZE[size || 'default'],
    ...DEFAULT_STYLES,
    ...STYLES_BY_TYPE[type || 'default'],
    ...(isDisabled
      ? {
          ...(type !== 'tab' ? STYLES_BY_TYPE['disabled'] : {}),
        }
      : {}),
    ...(ghost ? { fill: '#clear' } : null),
    ...((isLoading || icon) && !children
      ? {
          padding: '0',
          width: '(2.5x + 1lh)',
          height: '(2.5x + 1lh)',
          display: 'grid',
          placeItems: 'center',
        }
      : null),
  };
}

const STYLES_BY_TYPE: { [key in keyof CubeButtonProps['type']]: Styles } = {
  default: {
    border: {
      '': '#clear',
      pressed: '#purple.30',
    },
    fill: {
      '': '#purple.10',
      hovered: '#purple.16',
      pressed: '#purple.10',
    },
    color: '#purple',
  },
  link: {
    fontWeight: 500,
    padding: '0',
    radius: {
      '': '0',
      focused: '1r',
    },
    fill: '#clear',
    color: {
      '': '#purple-text',
      hovered: '#purple',
    },
    shadow: {
      '': '0 @border-width 0 0 #purple-03.20',
      focused: '0 0 0 @outline-width #purple-03',
    },
  },
  primary: {
    border: {
      '': '#clear',
      pressed: '#purple-text',
    },
    fill: {
      hovered: '#purple-text',
      'pressed | !hovered': '#purple',
    },
    color: '#white',
  },
  clear: {
    border: {
      '': '#clear',
      pressed: '#purple-text.10',
    },
    fill: {
      '': '#purple.0',
      hovered: '#purple.16',
      pressed: '#purple.10',
    },
    color: '#purple-text',
  },
  outline: {
    border: {
      '': '#purple.30',
      pressed: '#purple-text.10',
      disabled: '#dark.12',
    },
    fill: {
      '': '#purple.0',
      hovered: '#purple.16',
      pressed: '#purple.10',
    },
    color: '#purple-text',
  },
  danger: {
    border: {
      '': '#clear',
      pressed: '#danger-text',
    },
    fill: {
      '': '#danger',
      pressed: '#danger',
      hovered: '#danger-text',
    },
    color: '#white',
  },
  item: {
    border: '0',
    fill: {
      '': '#purple.0',
      hovered: '#dark.04',
    },
    color: {
      '': '#dark.75',
      hovered: '#dark.75',
      pressed: '#purple',
    },
    textAlign: 'left',
    padding: '(1x - 1px) (1.5x - 1px)',
    height: 'min (2x + 1lh)',
    cursor: 'default',
  },
  tab: {
    // shadow: {
    //   '': '',
    //   selected: 'inset 0 -1ow 0 0 #purple',
    // },
    color: {
      '': '#dark',
      'selected, hovered': '#purple-text',
      disabled: '#dark.50',
    },
    fill: '#purple.0',
    textAlign: 'center',
    fontWeight: 600,
    padding: '(1x - 1px) (1x - 1px)',
    radius: '1r 1r 0 0',
    border: 0,
  },
  // not an actual type
  disabled: {
    // border: '#clear',
    fill: '#dark.08',
    color: '#dark.60',
  },
};

const STYLES_BY_SIZE = {
  small: {
    padding: '(.75x - 1px) (1.5x - 1px)',
  },
  default: {
    padding: '(1.25x - 1px) (2x - 1px)',
  },
};

const CSS_BY_TYPE = {
  tab: `
&::before {
  --outline-size: 0px;
  content: '';
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: inset 0 calc(-1 * var(--outline-size)) 0 var(--purple-color);
  pointer-events: none;
  transition: opacity linear .2s, box-shadow linear .2s;
}
&[data-is-selected]::before {
  --outline-size: 2px;
}
&:not([data-is-selected]):not([disabled])[data-is-hovered]::before {
  --outline-size: 1px;
}
  `,
};

const DEFAULT_STYLES = {
  display: 'inline-block',
  placeItems: 'center stretch',
  radius: true,
  opacity: {
    '': 1,
    disabled: 0.5,
    selected: 1,
  },
  cursor: 'pointer',
  fontWeight: 500,
  preset: 'default',
  textDecoration: 'none',
  transition: 'theme',
  whiteSpace: 'nowrap',
};

const CSS = `
  white-space: nowrap;

  & > .anticon.anticon-loading {
    transition: display .2s steps(1, start), margin .2s linear, opacity .2s linear;
    margin-top: -7px;
    margin-bottom: -7px;
    line-height: 0;
  }
`;

const DEPRECATED_PROPS = ['disabled', 'loading', 'onClick'];

export const Button = forwardRef(
  (allProps: CubeButtonProps, ref: FocusableRef<HTMLElement>) => {
    let {
      type,
      size,
      label,
      styles,
      ghost,
      children,
      css,
      icon,
      skipWarnings,
      ...props
    } = allProps;

    if (!skipWarnings) {
      propDeprecationWarning('Action', props, DEPRECATED_PROPS);
    }

    const isDisabled = props.isDisabled;
    const isLoading = props.isLoading;
    const isSelected = props.isSelected;
    const propsForStyles = {
      ...props,
      isLoading,
      isDisabled,
      size,
      type,
      ghost,
      icon,
      children,
    };
    const contextStyles = useContextStyles('Button', propsForStyles);

    children = children || label;

    styles = {
      ...provideStyles(propsForStyles),
      ...contextStyles,
      ...styles,
    };

    if (isLoading && !children && styles) {
      styles.size = '1em 1em';
    }

    return (
      <Action
        as={props.to ? 'a' : undefined}
        css={`
          ${CSS}${type ? CSS_BY_TYPE[type] : ''}${css || ''}
        `}
        {...props}
        ref={ref}
        isDisabled={isLoading || isDisabled}
        data-type={type}
        data-theme={
          type && ['success', 'danger', 'primary'].includes(type)
            ? 'special'
            : undefined
        }
        data-is-loading={isLoading ? '' : undefined}
        data-is-selected={isSelected ? '' : undefined}
        styles={styles}
        skipWarnings={skipWarnings}
      >
        {isLoading ? (
          <Block
            display="inline-block"
            margin={children ? '1x right' : undefined}
          >
            <LoadingOutlined />
          </Block>
        ) : null}
        {icon && !isLoading ? (
          <Space
            gap="1x"
            display="inline-flex"
            styles={{ verticalAlign: 'middle' }}
          >
            {!isLoading ? icon : null}
            {children ? <div>{children}</div> : null}
          </Space>
        ) : (
          children
        )}
      </Action>
    );
  },
);
