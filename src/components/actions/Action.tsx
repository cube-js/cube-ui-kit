import { forwardRef, MouseEventHandler } from 'react';
import { AriaButtonProps } from '@react-types/button';
import { FocusableRef } from '@react-types/shared';

import {
  BaseProps,
  BaseStyleProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
  TagNameProps,
  TEXT_STYLES,
  TextStyleProps,
  tasty,
} from '../../tasty';

import { useAction } from './use-action';

export interface CubeActionProps
  extends BaseProps,
    TagNameProps,
    BaseStyleProps,
    ContainerStyleProps,
    TextStyleProps,
    Omit<AriaButtonProps, 'type'> {
  to?: string;
  label?: string;
  htmlType?: 'button' | 'submit' | 'reset' | undefined;
  onClick?: MouseEventHandler;
  onMouseEnter?: MouseEventHandler;
  onMouseLeave?: MouseEventHandler;
}

const DEFAULT_ACTION_STYLES: Styles = {
  reset: 'button',
  position: 'relative',
  margin: 0,
  preset: 'inherit',
  border: 0,
  padding: 0,
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  transition: 'theme',
  cursor: 'pointer',
  textDecoration: 'none',
  fill: '#clear',
} as const;

const ActionElement = tasty({
  as: 'button',
  styles: DEFAULT_ACTION_STYLES,
});

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

export const Action = forwardRef(function Action(
  { to, as, htmlType, label, theme, mods, onPress, ...props }: CubeActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const { actionProps } = useAction(
    { to, as, htmlType, label, onPress, mods, ...props },
    ref,
  );

  const styles = extractStyles(props, STYLE_PROPS);

  return <ActionElement data-theme={theme} {...actionProps} styles={styles} />;
});
