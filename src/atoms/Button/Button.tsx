import { forwardRef, useState, useEffect } from 'react';
import { Action } from '../../components/Action';
import { Space } from '../../components/Space';
import { useCombinedRefs } from '../../utils/react/useCombinedRefs';
import { LoadingOutlined } from '@ant-design/icons';
import { propDeprecationWarning } from '../../utils/warnings';
import { useContextStyles } from '../../providers/Styles';

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
    ...(STYLES_BY_SIZE[size] || STYLES_BY_SIZE.default),
    ...DEFAULT_STYLES,
    ...(STYLES_BY_TYPE[type] || STYLES_BY_TYPE.default),
    ...(isDisabled
      ? {
          ...(type !== 'tab' ? STYLES_BY_TYPE.disabled : {}),
        }
      : {}),
    ...(ghost ? { fill: '#clear' } : null),
    ...((isLoading || icon) && !children ? { padding: '(1.25x - 1px)' } : null),
  };
}

const STYLES_BY_TYPE = {
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
    size: 'md',
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
  items: 'center stretch',
  radius: true,
  opacity: {
    '': 1,
    disabled: 0.5,
    selected: 1,
  },
  cursor: 'pointer',
  fontWeight: 500,
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
  (
    {
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
    },
    ref,
  ) => {
    if (!skipWarnings) {
      propDeprecationWarning('Action', props, DEPRECATED_PROPS);
    }

    const isDisabled = props.isDisabled;
    const isLoading = props.isLoading;
    const isSelected = props.isSelected;
    const [showLoadingIcon, setShowLoadingIcon] = useState(isLoading || false);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [currentLoading, setCurrentLoading] = useState(isLoading);
    const combinedRef = useCombinedRefs(ref);
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

    if (isLoading && !children) {
      styles.size = '1em 1em';
    }

    useEffect(() => {
      setCurrentLoading(isLoading);
      if (isLoading) {
        setShowLoadingIcon(true);
        setTimeout(() => {
          setCurrentLoading((currentLoading) => {
            if (currentLoading) {
              setPendingLoading(true);
            }

            return currentLoading;
          });
        });
      } else {
        setPendingLoading(false);
      }
    }, [isLoading]);

    return (
      <Action
        elementType={props.to ? 'a' : null}
        css={`
          ${CSS}${CSS_BY_TYPE[type] || ''}${css || ''}
        `}
        {...props}
        ref={combinedRef}
        isDisabled={isLoading || isDisabled}
        data-is-loading={isLoading ? '' : undefined}
        data-is-selected={isSelected ? '' : undefined}
        styles={styles}
        skipWarnings={skipWarnings}
      >
        {showLoadingIcon ? (
          <LoadingOutlined
            style={{
              opacity: pendingLoading ? 1 : 0,
              marginRight: children ? (pendingLoading ? 8 : -14) : 0,
            }}
          />
        ) : null}
        {icon ? (
          <Space
            gap="1x"
            display="inline-flex"
            styles={{ verticalAlign: 'middle' }}
          >
            {!showLoadingIcon && !isLoading ? icon : null}
            {children ? <div>{children}</div> : null}
          </Space>
        ) : (
          children
        )}
      </Action>
    );
  },
);
