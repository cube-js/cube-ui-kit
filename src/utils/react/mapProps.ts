import { AriaButtonProps } from 'react-aria';

import { CubeButtonProps } from '../../components/actions/Button/Button';

/** Converts AriaButtonProps to CubeButtonProps */
export function ariaToCubeButtonProps(
  props: AriaButtonProps<'button'>,
): Omit<AriaButtonProps<'button'>, 'type'> & Pick<CubeButtonProps, 'htmlType'> {
  const { type, ...filteredProps } = props;

  return {
    ...filteredProps,
    htmlType: type,
  };
}

/** Converts CubeButtonProps to AriaButtonProps */
export function cubeToAriaButtonProps(
  props: CubeButtonProps,
): AriaButtonProps<'button'> {
  const { htmlType, ...filteredProps } = props;

  // Cube's handlers target its supported HTML elements; Aria declares the
  // same events against a broader Element/FocusableElement boundary.
  return {
    ...filteredProps,
    type: htmlType,
  } as AriaButtonProps<'button'>;
}
