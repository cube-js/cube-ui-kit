import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, MouseEventHandler } from 'react';
import { FocusableOptions, useFocusable, useHover } from 'react-aria';

import {
  BaseProps,
  BaseStyleProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Element,
  extractStyles,
  filterBaseProps,
  Styles,
  TEXT_STYLES,
  TextStyleProps,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';

export interface CubeActiveZoneProps
  extends BaseProps,
    BaseStyleProps,
    ContainerStyleProps,
    TextStyleProps,
    FocusableOptions {
  label?: string;
  onClick?: MouseEventHandler;
}

const DEFAULT_STYLES: Styles = {
  display: 'inline-grid',
  position: 'relative',
  opacity: {
    '': 1,
    '[disabled]': 0.4,
  },
  transition: 'theme',
} as const;

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

function ActiveZone(
  { as, label, onClick, ...props }: CubeActiveZoneProps,
  ref,
) {
  const isDisabled = props.isDisabled;
  const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);
  const domRef = useFocusableRef(ref);

  let { hoverProps, isHovered } = useHover({ isDisabled });
  let { focusProps, isFocused } = useFocus({ isDisabled });
  let { focusableProps } = useFocusable(props, domRef);

  return (
    <Element
      data-is-hovered={isHovered && !isDisabled ? '' : null}
      data-is-focused={isFocused && !isDisabled ? '' : null}
      data-is-disabled={isDisabled || null}
      aria-label={label}
      {...mergeProps(
        hoverProps,
        focusProps,
        focusableProps,
        { onClick },
        filterBaseProps(props, { eventProps: true }),
      )}
      ref={domRef}
      tabIndex={props.excludeFromTabOrder || isDisabled ? -1 : 0}
      as={as}
      styles={styles}
    />
  );
}

const _ActiveZone = forwardRef(ActiveZone);

_ActiveZone.displayName = 'ActiveZone';

export { _ActiveZone as ActiveZone };
