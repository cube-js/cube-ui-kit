import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';
import { AriaButtonProps } from 'react-aria';

import {
  AllBaseProps,
  BaseStyleProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  TagName,
  tasty,
  TEXT_STYLES,
  TextStyleProps,
} from '../../../tasty';
import { NavigateArg, useAction } from '../use-action';

export interface CubeActionProps<
  T extends TagName = 'a' | 'button' | 'span' | 'div',
> extends Omit<AllBaseProps<T>, 'htmlType'>,
    BaseStyleProps,
    ContainerStyleProps,
    TextStyleProps,
    Omit<AriaButtonProps, 'type'> {
  to?: NavigateArg;
  label?: string;
  htmlType?: 'button' | 'submit' | 'reset' | undefined;
  download?: string;
}

const ActionElement = tasty({
  as: 'button',
  styles: {
    recipe: 'reset, button',
    position: 'relative',
    preset: 'inherit',
    transition: 'theme',
  },
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
      styles={styles}
    />
  );
});
