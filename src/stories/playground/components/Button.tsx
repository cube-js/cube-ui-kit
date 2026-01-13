import { ReactNode, useRef } from 'react';
import { useButton, useFocusRing, useHover } from 'react-aria';

import { tasty } from '../../../tasty';
import { Styles } from '../../../tasty/styles/types';

const ButtonElement = tasty({
  as: 'button',
  qa: 'PlaygroundButton',
  styles: {
    display: 'inline-flex',
    placeItems: 'center',
    border: 0,
    background: 'none',
    font: 'inherit',
  },
});

export interface ButtonProps {
  styles?: Styles;
  children?: ReactNode;
  isDisabled?: boolean;
  onPress?: () => void;
  /** Override internal mods (for forcing specific states in demos) */
  mods?: Record<string, boolean>;
}

export function Button({
  styles,
  children,
  isDisabled = false,
  onPress,
  mods: externalMods,
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const { buttonProps, isPressed } = useButton(
    {
      isDisabled,
      onPress,
    },
    ref,
  );

  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  // Internal mods from react-aria hooks
  const internalMods = {
    pressed: isPressed,
    hovered: isHovered,
    focused: isFocusVisible,
    disabled: isDisabled,
  };

  // External mods override internal ones
  const mergedMods = externalMods
    ? { ...internalMods, ...externalMods }
    : internalMods;

  return (
    <ButtonElement
      {...buttonProps}
      {...hoverProps}
      {...focusProps}
      ref={ref}
      styles={styles}
      mods={mergedMods}
    >
      {children || 'Click me'}
    </ButtonElement>
  );
}
