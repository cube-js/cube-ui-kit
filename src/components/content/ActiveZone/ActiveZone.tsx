import { forwardRef, MouseEventHandler } from 'react';
import { useHover } from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../../styles/list';
import { Base } from '../../Base';
import { extractStyles } from '../../../utils/styles';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import {
  BaseProps,
  BaseStyleProps,
  ContainerStyleProps,
  TagNameProps,
  TextStyleProps,
} from '../../types';
import { Styles } from '../../../styles/types';
import { useFocusableRef } from '@react-spectrum/utils';
import { FocusableOptions, useFocusable } from '@react-aria/focus';
import { useFocus } from '../../../utils/interactions';

export interface CubeActiveZoneProps
  extends BaseProps,
    TagNameProps,
    BaseStyleProps,
    ContainerStyleProps,
    TextStyleProps,
    FocusableOptions {
  label?: string;
  onClick?: MouseEventHandler;
}

const DEFAULT_STYLES: Styles = {
  display: 'block',
  position: 'relative',
  opacity: {
    '': 1,
    '[disabled]': 0.4,
  },
  transition: 'theme',
} as const;

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

const ActiveZone = (
  { as, label, onClick, ...props }: CubeActiveZoneProps,
  ref,
) => {
  const isDisabled = props.isDisabled;
  const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);
  const domRef = useFocusableRef(ref);

  let { hoverProps, isHovered } = useHover({ isDisabled });
  let { focusProps, isFocused } = useFocus({ isDisabled });
  let { focusableProps } = useFocusable(props, domRef);

  return (
    <Base
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
      tabIndex={props.excludeFromTabOrder || isDisabled ? -1 : 0}
      as={as}
      styles={styles}
      ref={domRef}
    />
  );
};

const _ActiveZone = forwardRef(ActiveZone);
export { _ActiveZone as ActiveZone };
