import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';
import { AriaButtonProps } from 'react-aria';

import {
  AllBaseProps,
  BaseStyleProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  Styles,
  TagName,
  tasty,
  TEXT_STYLES,
  TextStyleProps,
} from '../../../tasty';
import { useAction } from '../use-action';

export interface CubeActionProps<
  T extends TagName = 'a' | 'button' | 'span' | 'div',
> extends Omit<AllBaseProps<T>, 'htmlType'>,
    BaseStyleProps,
    ContainerStyleProps,
    TextStyleProps,
    Omit<AriaButtonProps, 'type'> {
  to?: string;
  label?: string;
  htmlType?: 'button' | 'submit' | 'reset' | undefined;
  download?: string;
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
  {
    to,
    as,
    download,
    htmlType,
    label,
    theme,
    mods,
    onPress,
    ...props
  }: CubeActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const { actionProps } = useAction(
    { to, as, htmlType, label, onPress, mods, ...props },
    ref,
  );

  const styles = extractStyles(props, STYLE_PROPS);

  return (
    <ActionElement
      data-theme={theme}
      download={download}
      {...actionProps}
      isDisabled={undefined}
      styles={styles}
    />
  );
});
