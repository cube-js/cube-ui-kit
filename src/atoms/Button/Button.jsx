import React, { forwardRef, useState, useEffect } from 'react';
import Action from '../../components/Action';
import { useCombinedRefs } from '../../utils/react';
import { LoadingOutlined } from '@ant-design/icons';

const STYLES_BY_TYPE = {
  default: {
    border: {
      '': '#clear',
      pressed: '#purple.30',
    },
    fill: {
      ',pressed': '#purple.10',
      hovered: '#purple.20',
    },
    color: '#purple',
  },
  primary: {
    border: {
      '': '#clear',
      pressed: '#purple-text',
    },
    fill: {
      ',pressed': '#purple',
      hovered: '#purple-text',
    },
    color: '#white',
  },
  clear: {
    border: {
      '': '#clear',
      pressed: '#purple-text.10',
    },
    fill: {
      ',pressed': '#purple.0',
      hovered: '#purple.05',
    },
    color: '#purple-text',
  },
  danger: {
    border: {
      '': '#clear',
      pressed: '#danger-text',
    },
    fill: {
      ',pressed': '#danger',
      hovered: '#danger-text',
    },
    color: '#white',
  },
  item: {
    border: '#clear',
    fill: {
      '': '#purple.0',
      hovered: '#dark.04',
    },
    color: {
      '': '#dark.75',
      hovered: '#dark.75',
      'pressed, hovered & pressed': '#purple',
    },
    textAlign: 'left',
    padding: '(1x - 1px) (1.5x - 1px)',
  },
  tab: {
    // shadow: {
    //   '': '',
    //   selected: 'inset 0 -1ow 0 0 #purple',
    // },
    opacity: 1,
    color: {
      '': '#dark',
      disabled: '#dark.50',
      'hovered & disabled': '#dark.50',
      'selected, hovered': '#purple-text',
    },
    fill: '#purple.0',
    textAlign: 'center',
    fontWeight: 600,
    padding: '(1x - 1px) (1x - 1px)',
    radius: '1r 1r 0 0',
  },
  // not an actual type
  disabled: {
    // border: '#clear',
    fill: '#dark.8',
    color: '#dark.60',
    disabled: 0.5,
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
  flow: 'column',
  gap: '1x',
  radius: true,
  outline: {
    '': '#purple-03.0',
    'focused & focus-visible': '#purple-03',
  },
  opacity: {
    '': 1,
    disabled: 0.5,
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

export default forwardRef(function Button(
  {
    type,
    size,
    defaultStyles,
    loading,
    disabled,
    selected,
    children,
    ...props
  },
  ref,
) {
  const [showLoadingIcon, setShowLoadingIcon] = useState(loading || false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [currentLoading, setCurrentLoading] = useState(loading);
  const combinedRef = useCombinedRefs(ref);

  defaultStyles = defaultStyles
    ? Object.assign({}, DEFAULT_STYLES, defaultStyles)
    : DEFAULT_STYLES;

  useEffect(() => {
    setCurrentLoading(loading);
    if (loading) {
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
  }, [loading]);

  return (
    <Action
      elementType={props.to ? 'a' : null}
      defaultStyles={{
        ...(STYLES_BY_SIZE[size] || STYLES_BY_SIZE.default),
        ...defaultStyles,
        ...(disabled
          ? {
              ...(STYLES_BY_TYPE[type] || STYLES_BY_TYPE.default),
              ...STYLES_BY_TYPE.disabled,
            }
          : STYLES_BY_TYPE[type] || STYLES_BY_TYPE.default),
      }}
      css={`
        ${CSS}${CSS_BY_TYPE[type] || ''}
      `}
      {...props}
      ref={combinedRef}
      disabled={loading || disabled || (type === 'tab' && selected)}
      data-is-loading={loading ? '' : undefined}
      data-is-selected={selected ? '' : undefined}
    >
      {showLoadingIcon ? (
        <LoadingOutlined
          style={{
            opacity: pendingLoading ? 1 : 0,
            marginRight: pendingLoading ? 8 : -14,
          }}
        />
      ) : null}
      {children}
    </Action>
  );
});
