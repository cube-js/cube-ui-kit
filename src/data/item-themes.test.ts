import { ITEM_VARIANTS } from './item-themes';

/**
 * `selected & disabled` on the non-solid types keeps the ENABLED selected chip
 * and fades only the label — the chip is what says "this one is on", and a
 * disabled control has no business saying that differently from a live one.
 *
 * That invariant is easy to break by hand: the fill token is not the same
 * across themes (`default.clear` tints from `accent-surface`, the four status
 * themes from `accent-text`), so a blanket edit silently shifts the hue on four
 * of the fifteen variants. This asserts the two entries differ only in their
 * alpha, which is itself deliberate: they must not serialize to the same string
 * or Tasty's `mergeEntriesByValue` pass coalesces them and negates
 * `selected & (hovered | focused)`. See `DEFAULT_OUTLINE_STYLES.fill`.
 */
describe('ITEM_VARIANTS', () => {
  const NON_SOLID = ['outline', 'outline-2', 'clear'];
  const BRAND_THEMES = ['default', 'danger', 'success', 'warning', 'note'];

  const cases = BRAND_THEMES.flatMap((theme) =>
    NON_SOLID.map((type) => [`${theme}.${type}`] as const),
  ).filter(([variant]) => variant in ITEM_VARIANTS);

  it('covers every brand theme x non-solid type', () => {
    expect(cases).toHaveLength(BRAND_THEMES.length * NON_SOLID.length);
  });

  it.each(cases)(
    '%s keeps the selected chip when disabled, changing only the alpha',
    (variant) => {
      const fill = ITEM_VARIANTS[variant].fill as Record<string, string>;

      expect(fill.selected).toBeDefined();
      expect(fill['selected & disabled']).toBeDefined();

      // Same layers and same token, one alpha step apart.
      expect(fill['selected & disabled']).toBe(
        fill.selected.replace(/\.09$/, '.08'),
      );

      // Distinct strings, or `mergeEntriesByValue` coalesces them.
      expect(fill['selected & disabled']).not.toBe(fill.selected);
    },
  );

  it.each(cases)('%s fades only the label when disabled', (variant) => {
    const color = ITEM_VARIANTS[variant].color as Record<string, string>;

    expect(color['selected & disabled']).toMatch(/-accent-disabled-text$/);
  });
});
