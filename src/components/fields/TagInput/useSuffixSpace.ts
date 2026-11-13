import { RefObject, useLayoutEffect, useRef } from 'react';

const SUFFIX = ':scope > [data-element="Suffix"]';

/**
 * Inside the box, the suffix (validation icon, clear button, trigger) rides on
 * the end of the text: the text reserves its room and the suffix takes none of
 * its own in the row, so the two always wrap together. A consumer's `suffix`
 * can be anything, so the room is measured: the suffix's width plus the row's
 * gap, as `--suffix-space` on the box, kept current as buttons come and go.
 */
export function useSuffixSpace(
  boxRef: RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  const observed = useRef<{ suffix: Element; observer?: ResizeObserver }>(null);

  // Every commit: the suffix element comes and goes with its content.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const suffix = (isActive && box?.querySelector(SUFFIX)) || null;

    if (observed.current?.suffix === suffix) return;

    observed.current?.observer?.disconnect();
    observed.current = null;

    if (!box) return;

    if (!suffix) {
      box.style.removeProperty('--suffix-space');

      return;
    }

    const measure = () => {
      const gap = parseFloat(getComputedStyle(box).columnGap) || 0;

      box.style.setProperty(
        '--suffix-space',
        `${suffix.getBoundingClientRect().width + gap}px`,
      );
    };

    measure();

    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);

    observer?.observe(suffix);
    observed.current = { suffix, observer };
  });

  useLayoutEffect(() => () => observed.current?.observer?.disconnect(), []);
}
