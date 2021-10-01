import { forwardRef } from 'react';
import { useHover } from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import { CONTAINER_STYLES, TEXT_STYLES } from '../../../styles/list';
import { Base } from '../../Base';
import { useFocus } from '../../../utils/interactions';
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
import { FocusableProps } from '@react-types/shared';

export interface CubeActiveZoneProps
  extends BaseProps,
    TagNameProps,
    BaseStyleProps,
    ContainerStyleProps,
    TextStyleProps,
    FocusableProps {
  label?: string;
}

const DEFAULT_STYLES: Styles = {
  position: 'relative',
  opacity: {
    '': 1,
    disabled: 0.4,
  },
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  transition: 'theme',
} as const;

const STYLE_PROPS = [...CONTAINER_STYLES, ...TEXT_STYLES];

const ActiveZone = (
  {
    as,
    label,
    ...props
  }: CubeActiveZoneProps,
  ref,
) => {
  const isDisabled = props.isDisabled;
  const styles = extractStyles(props, STYLE_PROPS, DEFAULT_STYLES);

  let { hoverProps, isHovered } = useHover({ isDisabled });
  let { focusProps, isFocused } = useFocus({ isDisabled }, true);

  return (
    <Base
      ref={ref}
      data-is-hovered={isHovered && !isDisabled ? '' : null}
      data-is-focused={isFocused && !isDisabled ? '' : null}
      data-is-disabled={isDisabled || null}
      aria-label={label}
      {...mergeProps(
        hoverProps,
        focusProps,
        filterBaseProps(props, { eventProps: true }),
      )}
      as={as}
      isDisabled={isDisabled}
      styles={styles}
    />
  );
};

const _ActiveZone = forwardRef(ActiveZone);
export { _ActiveZone as ActiveZone };
