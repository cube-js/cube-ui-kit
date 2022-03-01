import { CubeButtonProps } from '../../components/actions/Button/Button';
import { AriaButtonProps } from '@react-types/button';

/** Converts AriaButtonProps to CubeButtonProps */
export function ariaToCubeButtonProps(
  props: AriaButtonProps<'button'>,
): CubeButtonProps {
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

  return {
    ...filteredProps,
    type: htmlType,
  };
}
