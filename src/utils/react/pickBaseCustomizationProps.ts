import type { BaseProps } from '@tenphi/tasty';

type BaseCustomizationProps = Pick<
  BaseProps,
  'qaVal' | 'className' | 'style' | 'tokens' | 'theme' | 'element'
> & { title?: string };

/** Props that can sit under the control's existing DOM and event wiring. */
export function pickBaseCustomizationProps(
  props: BaseCustomizationProps,
): BaseCustomizationProps {
  const { qaVal, className, style, tokens, theme, title, element } = props;

  return { qaVal, className, style, tokens, theme, title, element };
}
