import type { CubeButtonProps } from '../../actions/Button/Button';

/**
 * Gives a dialog's built-in button its default text without overriding the
 * consumer's. The text goes in `children`, since `label` is deprecated, but a
 * consumer's `children` or (deprecated) `label` still wins. An icon-only
 * button gets the text as its accessible name instead, which is what `label`
 * used to do for it.
 */
export function withDefaultButtonText<P extends CubeButtonProps>(
  props: P | undefined,
  text: string,
): P {
  const own = (props ?? {}) as P;

  if (own.children != null || own.label != null || own['aria-label'] != null) {
    return own;
  }

  return own.icon || own.rightIcon
    ? { ...own, 'aria-label': text }
    : { ...own, children: text };
}
