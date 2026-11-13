import type { ComponentBaseProps } from './componentBaseProps';

type BaseCustomizationProps = Pick<
  ComponentBaseProps,
  'qaVal' | 'className' | 'style' | 'tokens'
>;

/** Customization props that can sit under a control's DOM and event wiring. */
export function pickBaseCustomizationProps(
  props: BaseCustomizationProps,
): BaseCustomizationProps {
  const { qaVal, className, style, tokens } = props;

  return { qaVal, className, style, tokens };
}
