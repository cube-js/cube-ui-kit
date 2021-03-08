import React, { forwardRef, useState, useEffect } from 'react';
import Action from './Action';
import { useCombinedRefs } from '../utils/react';
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
  // not an actual type
  disabled: {
    border: '#clear',
    fill: '#dark.8',
    color: '#dark.60',
  },
};

const STYLES_BY_SIZE = {
  small: {
    padding: '(.75x - 1px) (1.5x - 1px)',
  },
  default: {
    padding: '(1x - 1px) (2x - 1px)',
  },
};

const DEFAULT_STYLES = {
  display: 'inline-block',
  radius: true,
  size: 'md',
  outline: {
    '': '#purple-03.0',
    'focused & focus-visible': '#purple-03',
  },
  opacity: {
    '': 1,
    disabled: 0.5,
  },
  cursor: {
    '': 'pointer',
    disabled: 'default',
  },
  fontWeight: 500,
};
const CSS = `
  position: relative;
  appearance: none;
  outline: none;
  transition: all var(--transition) linear;
  white-space: nowrap;

  & > .anticon.anticon-loading {
    transition: display .2s steps(1, start), margin .2s linear, opacity .2s linear;
    margin-top: -7px;
    margin-bottom: -7px;
    line-height: 0;
  }
`;

export default forwardRef(function Button(
  { type, size, defaultStyles, loading, disabled, children, ...props },
  ref,
) {
  const [showLoadingIcon, setShowLoadingIcon] = useState(loading || false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const combinedRef = useCombinedRefs(ref);
  defaultStyles = defaultStyles
    ? Object.assign({}, DEFAULT_STYLES, defaultStyles)
    : DEFAULT_STYLES;

  useEffect(() => {
    if (loading) {
      setShowLoadingIcon(true);
      setTimeout(() => {
        setPendingLoading(true);
      });
    } else {
      setPendingLoading(false);
    }
  }, [loading]);

  return (
    <Action
      elementType={props.to ? 'a' : null}
      defaultStyles={{
        ...defaultStyles,
        ...(STYLES_BY_SIZE[size] || STYLES_BY_SIZE.default),
        ...(disabled
          ? STYLES_BY_TYPE.disabled
          : STYLES_BY_TYPE[type] || STYLES_BY_TYPE.default),
      }}
      css={CSS}
      {...props}
      ref={combinedRef}
      disabled={loading || disabled}
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
