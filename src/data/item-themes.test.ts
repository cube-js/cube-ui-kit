import { ITEM_VARIANTS } from './item-themes';

/**
 * `selected & disabled` on the non-solid types keeps the ENABLED selected chip
 * and fades only the label — the chip is what says "this one is on", and a
 * disabled control has no business saying that differently from a live one.
 *
 * That invariant is easy to break by hand, because the two halves of it are
 * written per theme and the tokens are not uniform: `default.clear` tints from
 * `accent-surface` while the four status themes tint from `accent-text`, and
 * `special` works in white alpha over a fixed dark base. A blanket edit against
 * any one of those shapes silently shifts the others.
 *
 * The chips are asserted to differ only in their final alpha, and to differ at
 * all: two entries in one state-map must not serialize to the same string, or
 * Tasty's `mergeEntriesByValue` pass coalesces them at the group's max priority
 * and negates `selected & (hovered | focused)`. See `SPECIAL_CLEAR_STYLES`.
 */
describe('ITEM_VARIANTS', () => {
  const VARIANTS = [
    'default.outline',
    'default.outline-2',
    'default.clear',
    'danger.outline',
    'danger.outline-2',
    'danger.clear',
    'success.outline',
    'success.outline-2',
    'success.clear',
    'warning.outline',
    'warning.outline-2',
    'warning.clear',
    'note.outline',
    'note.outline-2',
    'note.clear',
    'special.outline',
    'special.clear',
  ] as const;

  /**
   * The `current` theme carries the state but cannot follow the rule literally,
   * for two reasons.
   *
   * Its alphas resolve against the element's OWN `currentcolor`, which the
   * disabled label has already faded to `.4`, so its disabled entries are
   * written PRE-MULTIPLIED: an authored `.18` renders as ~`.07`, below the
   * `.12` it is compared against. The chip is muted in effect; only the
   * authored number goes up. See `CURRENT_OUTLINE_STYLES`.
   *
   * And `current.clear` steps its enabled states through the custom properties
   * of `CURRENT_ITEM_RAMP` — one per scheme and surface — while its disabled
   * chip is a plain alpha, so the two are not comparable as strings at all.
   */
  const CURRENT = [
    'current.outline',
    'current.outline-2',
    'current.clear',
  ] as const;

  /** `'#surface-2 #primary-accent-surface.09'` -> `['#surface-2 #primary-accent-surface', 0.09]` */
  function splitAlpha(value: string): [string, number] {
    const match = value.match(/^(.*?)(\.\d+)$/);

    if (!match) return [value, 1];

    return [match[1], Number(match[2])];
  }

  it('lists every variant that carries the state', () => {
    const carriers = Object.entries(ITEM_VARIANTS)
      .filter(([, styles]) => {
        const fill = styles.fill;

        return (
          !!fill &&
          typeof fill === 'object' &&
          'selected & disabled' in (fill as Record<string, string>)
        );
      })
      .map(([variant]) => variant);

    expect(carriers.sort()).toEqual([...VARIANTS, ...CURRENT].sort());
  });

  it.each(VARIANTS)(
    '%s keeps the selected chip when disabled, changing only the alpha',
    (variant) => {
      const fill = ITEM_VARIANTS[variant].fill as Record<string, string>;
      const [enabledToken, enabledAlpha] = splitAlpha(fill.selected);
      const [disabledToken, disabledAlpha] = splitAlpha(
        fill['selected & disabled'],
      );

      // Same layers, same token — only the alpha may move.
      expect(disabledToken).toBe(enabledToken);
      // Down, never up: a dead control must not out-read a live one.
      expect(disabledAlpha).toBeLessThan(enabledAlpha);
      // Distinct strings, or `mergeEntriesByValue` coalesces them.
      expect(fill['selected & disabled']).not.toBe(fill.selected);
    },
  );

  it.each(VARIANTS)('%s fades the label when disabled', (variant) => {
    const color = ITEM_VARIANTS[variant].color as Record<string, string>;

    expect(color['selected & disabled']).toBeDefined();
    expect(color['selected & disabled']).not.toBe(color.selected);
  });
});
