import type { CubeButtonProps } from '../../actions/Button/Button';

/**
 * Gives a dialog's built-in button its default text without overriding the
 * consumer's. The text goes in `children`, since `label` is deprecated, but a
 * consumer's `children` or (deprecated) `label` still wins. An icon-only
 * button gets the text as its accessible name instead, which is what `label`
 * used to do for it. A consumer's `aria-label` replaces only that name: a
 * text button keeps its visible default. An icon given as a function (the
 * `({ loading }) => …` form) may render nothing, so it keeps the text too.
 */
export function withDefaultButtonText<P extends CubeButtonProps>(
  props: P | undefined,
  text: string,
): P {
  const own = (props ?? {}) as P;

  if (own.children != null || own.label != null) return own;

  if (isStaticIcon(own.icon) || isStaticIcon(own.rightIcon)) {
    return own['aria-label'] != null ? own : { ...own, 'aria-label': text };
  }

  return { ...own, children: text };
}

function isStaticIcon(icon: CubeButtonProps['icon']) {
  return !!icon && typeof icon !== 'function';
}
