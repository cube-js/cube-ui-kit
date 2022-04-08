import { forwardRef, ReactNode } from 'react';
import { Action, CubeActionProps } from '../Action';
import { LoadingOutlined } from '@ant-design/icons';
import { useContextStyles } from '../../../providers/StylesProvider';
import { FocusableRef } from '@react-types/shared';
import { Styles } from '../../../styles/types';
import { accessibilityWarning } from '../../../utils/warnings';

export interface CubeButtonProps extends CubeActionProps {
  icon?: ReactNode;
  isLoading?: boolean;
  isSelected?: boolean;
  type?:
    | 'primary'
    | 'default'
    | 'danger'
    | 'link'
    | 'clear'
    | 'outline'
    | 'neutral'
    | string;
  size?: 'small' | 'default' | 'large' | (string & {});
}

export function provideStyles({
  size,
  type,
  theme,
  isLoading,
  icon,
  children,
  label,
}) {
  children = children || icon ? children : label;

  return {
    ...STYLES_BY_SIZE[size || 'default'],
    ...DEFAULT_STYLES,
    ...(theme === 'danger' ? DANGER_STYLES_BY_TYPE : DEFAULT_STYLES_BY_TYPE)[
      type || 'default'
    ],
    ...((isLoading || icon) && !children
      ? {
          padding: '0',
          width: '(2.5x + 1lh)',
          height: '(2.5x + 1lh)',
        }
      : null),
  };
}

const DEFAULT_STYLES_BY_TYPE: { [key: string]: Styles } = {
  primary: {
    border: {
      '': '#clear',
      pressed: '#purple-text',
    },
    fill: {
      hovered: '#purple-text',
      'pressed | !hovered': '#purple',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#white',
      '[disabled]': '#dark.30',
    },
  },
  default: {
    border: {
      '': '#clear',
      pressed: '#purple.30',
    },
    fill: {
      '': '#purple.10',
      hovered: '#purple.16',
      pressed: '#purple.10',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#purple',
      '[disabled]': '#dark.30',
    },
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
      '[disabled]': '#purple.0',
    },
    color: {
      '': '#purple-text',
      '[disabled]': '#dark.30',
    },
  },
  outline: {
    border: {
      '': '#purple.30',
      pressed: '#purple-text.10',
      '[disabled]': '#dark.12',
    },
    fill: {
      '': '#purple.0',
      hovered: '#purple.16',
      pressed: '#purple.10',
      '[disabled]': '#purple.0',
    },
    color: {
      '': '#purple-text',
      '[disabled]': '#dark.30',
    },
  },
  link: {
    fontWeight: 500,
    padding: '0',
    radius: {
      '': '0',
      focused: true,
    },
    fill: '#clear',
    color: {
      '': '#purple-text',
      pressed: '#purple',
      '[disabled]': '#dark.30',
    },
    shadow: {
      '': '0 @border-width 0 0 #purple-03.20',
      focused: '0 0 0 @outline-width #purple-03.20',
      'pressed | hovered | [disabled]': '0 0 0 0 #purple.20',
    },
  },
  neutral: {
    border: '#clear',
    fill: {
      '': '#dark.0',
      hovered: '#dark.04',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#dark.75',
      hovered: '#dark.75',
      pressed: '#purple',
      '[disabled]': '#dark.30',
    },
  },
};

const DANGER_STYLES_BY_TYPE: { [key: string]: Styles } = {
  primary: {
    border: {
      '': '#clear',
      pressed: '#danger-text',
    },
    fill: {
      hovered: '#danger-text',
      'pressed | !hovered': '#danger',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#white',
      '[disabled]': '#dark.30',
    },
  },
  default: {
    border: {
      '': '#clear',
      pressed: '#danger.30',
    },
    fill: {
      '': '#danger.05',
      hovered: '#danger.1',
      pressed: '#danger.05',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#danger',
      '[disabled]': '#dark.30',
    },
  },
  clear: {
    border: {
      '': '#clear',
      pressed: '#danger-text.10',
    },
    fill: {
      '': '#danger.0',
      hovered: '#danger.1',
      pressed: '#danger.05',
      '[disabled]': '#danger.0',
    },
    color: {
      '': '#danger-text',
      '[disabled]': '#dark.30',
    },
  },
  outline: {
    border: {
      '': '#danger.30',
      pressed: '#danger-text.10',
      '[disabled]': '#dark.04',
    },
    fill: {
      '': '#danger.0',
      hovered: '#danger.1',
      pressed: '#danger.05',
      '[disabled]': '#danger.0',
    },
    color: {
      '': '#danger-text',
      '[disabled]': '#dark.30',
    },
  },
  link: {
    ...DEFAULT_STYLES_BY_TYPE.link,
    color: {
      '': '#danger-text',
      pressed: '#danger',
      '[disabled]': '#dark.30',
    },
    shadow: {
      '': '0 @border-width 0 0 #danger.20',
      focused: '0 0 0 @outline-width #danger.20',
      'pressed | hovered | [disabled]': '0 0 0 0 #danger.20',
    },
  },
  neutral: {
    border: '0',
    fill: {
      '': '#dark.0',
      hovered: '#dark.04',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#dark.75',
      hovered: '#dark.75',
      pressed: '#danger',
      '[disabled]': '#dark.30',
    },
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

const DEFAULT_STYLES = {
  display: 'inline-grid',
  placeItems: 'center stretch',
  placeContent: 'center',
  gap: '1x',
  flow: 'column',
  radius: true,
  fontWeight: 500,
  preset: 'default',
  textDecoration: 'none',
  transition: 'theme',
  whiteSpace: 'nowrap',
  '& .anticon.anticon-loading': {
    transition:
      'display .2s steps(1, start), margin .2s linear, opacity .2s linear',
    // lineHeight: 0,
  },
} as Styles;

export const Button = forwardRef(
  (allProps: CubeButtonProps, ref: FocusableRef<HTMLElement>) => {
    let {
      type,
      size,
      label,
      styles,
      children,
      theme,
      css,
      icon,
      mods,
      ...props
    } = allProps;

    const isDisabled = props.isDisabled;
    const isLoading = props.isLoading;
    const isSelected = props.isSelected;
    const propsForStyles = {
      ...props,
      label,
      isLoading,
      isDisabled,
      theme,
      size,
      type,
      icon,
      children,
    };
    const contextStyles = useContextStyles('Button', propsForStyles);

    if (!children) {
      if (icon) {
        if (!label) {
          accessibilityWarning(
            'If you provide `icon` property for a Button and do not provide any children then you should specify the `label` property to make sure the Button element stays accessible.',
          );
        }
      } else {
        if (!label) {
          accessibilityWarning(
            'If you provide no children for a Button then you should specify the `label` property to make sure the Button element stays accessible.',
          );
        }
      }
    }

    children = children || icon ? children : label;

    styles = {
      ...provideStyles(propsForStyles),
      ...contextStyles,
      ...styles,
    };

    if (isLoading && !children && styles) {
      styles.fontSize = '1em';
      styles.lineHeight = '1em';
    }

    return (
      <Action
        as={props.to ? 'a' : undefined}
        css={css}
        {...props}
        ref={ref}
        isDisabled={isLoading || isDisabled}
        theme={theme}
        data-type={type}
        data-is-loading={isLoading ? '' : undefined}
        data-is-selected={isSelected ? '' : undefined}
        data-size={size}
        mods={mods}
        styles={styles}
        label={label}
      >
        {icon || isLoading ? !isLoading ? icon : <LoadingOutlined /> : null}
        {children}
      </Action>
    );
  },
);
