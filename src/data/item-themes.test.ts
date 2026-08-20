import { ITEM_RESTING_COLOR_VARIANTS, ITEM_VARIANTS } from './item-themes';

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

/**
 * Every `current` flavour fades its label exactly once per subtree.
 *
 * `#current` is the color the element INHERITS, so a `.4` applied twice down one
 * chain multiplies to `.16` and the label washes out. Two mods mark "something
 * above already faded this" — `inherit-disabled` (set by `ItemAction` inside a
 * disabled row) and `inside-wrapper` (set by `ItemButton` on the row it renders
 * inside `ActionsWrapper`) — and a flavour that spells its fade as a bare
 * `disabled` fades a second time in both of those nestings. That is the shape
 * this pins: `current.outline` and `current.primary` are reachable as
 * `ItemAction` types, so a bare `disabled` there is a live bug, not a latent one.
 *
 * The wrapper is the other half. It reproduces the row's disabled color so
 * sibling actions inherit a faded `currentcolor`, and it is entitled to the
 * gated value because `ItemButton` gives it neither mod.
 */
describe('current theme disabled fades', () => {
  const CURRENT_VARIANTS = Object.keys(ITEM_VARIANTS).filter(
    (variant) => variant.startsWith('current.') && variant !== 'current.card',
  ) as (keyof typeof ITEM_VARIANTS)[];

  const GATE = 'disabled & !inherit-disabled & !inside-wrapper';

  it('covers every interactive current flavour', () => {
    expect(CURRENT_VARIANTS.sort()).toEqual([
      'current.clear',
      'current.invert',
      'current.item',
      'current.link',
      'current.outline',
      'current.outline-2',
      'current.primary',
    ]);
  });

  // Every `current` flavour fades its label to 40% of the inherited color. They
  // all express it the same way now that `invert` labels with `#current` like
  // the rest — the swap color it paints WITH is faded on the fill instead.
  const fadedFor = (_variant: string) => '#current.4';

  it.each(CURRENT_VARIANTS)('%s gates its label fade', (variant) => {
    const color = ITEM_VARIANTS[variant].color as Record<string, string>;

    expect(color[GATE]).toBe(fadedFor(variant));
    // A bare `disabled` key would win over the gate and fade unconditionally.
    expect(color.disabled).toBeUndefined();
  });

  it.each(CURRENT_VARIANTS)(
    '%s still hands a disabled color to the actions wrapper',
    (variant) => {
      const color = ITEM_RESTING_COLOR_VARIANTS[variant].color as Record<
        string,
        string
      >;

      // `current.primary` is the exception, and deliberately: its `color` is the
      // FILL, not the label, so reproducing it on the wrapper would hand sibling
      // actions the chip color and they would vanish into it. The wrapper gets
      // the swap color — the same thing the `Actions` slot gets inside a plain
      // `Item`. Everything else hands down its own faded label.
      if (variant === 'current.primary') {
        expect(color.disabled).toContain('var(--current-accent');
        return;
      }

      expect(color.disabled).toBe(fadedFor(variant));
    },
  );

  // One property, shared by the two filled flavours, because they are each
  // other's mirror: `primary` paints `#current` and writes the swap color on it,
  // `invert` paints the swap color and writes `#current`. A container that
  // offers one value therefore moves both at once and cannot put them out of
  // step. Nothing else reads it — the remaining flavours paint their chip ON the
  // container, so the inherited color is already the right one.
  const SWAP = 'var(--current-accent, var(--surface-color))';

  it('is read by the two filled flavours only', () => {
    const readers = CURRENT_VARIANTS.filter((variant) =>
      JSON.stringify(ITEM_VARIANTS[variant]).includes('--current-accent'),
    ).sort();

    expect(readers).toEqual(['current.invert', 'current.primary']);
  });

  // Every read spells out the same fallback, which is what keeps a container
  // that offers nothing rendering as it did before the hook existed. A bare
  // `var(--current-accent)` would resolve to nothing and drop the color.
  it.each(['current.invert', 'current.primary'] as const)(
    '%s always spells out the fallback',
    (variant) => {
      const json = JSON.stringify(ITEM_VARIANTS[variant]);
      const occurrences = (needle: string) => json.split(needle).length - 1;

      expect(occurrences('var(--current-accent')).toBeGreaterThan(0);
      expect(occurrences(SWAP)).toBe(occurrences('var(--current-accent'));
    },
  );

  // The mirror itself: whatever `primary` writes with, `invert` paints with, and
  // vice versa. Stated as a test because the pair is the whole definition of
  // `invert` on this theme, and two objects can drift where one cannot.
  it('current.invert is current.primary with the two colors exchanged', () => {
    const primary = ITEM_VARIANTS['current.primary'] as Record<string, any>;
    const invert = ITEM_VARIANTS['current.invert'] as Record<string, any>;

    // `primary` paints `#current`, `invert` writes it.
    expect(primary.fill['']).toContain('#current');
    expect(invert.color['']).toBe('#current');

    // `primary` writes the swap color, `invert` paints it.
    expect(primary['-webkit-text-fill-color']['']).toBe(SWAP);
    expect(invert.fill['']).toContain(SWAP);
  });

  // `#current`-derived fades gate, because a disabled host has already muted
  // what they resolve against. The swap color is not inherited, so wherever it
  // is faded the fade is the reader's own job and takes a bare `disabled`.
  it('gates the inherited fades and not the offered one', () => {
    const invert = ITEM_VARIANTS['current.invert'] as Record<string, any>;
    const primary = ITEM_VARIANTS['current.primary'] as Record<string, any>;

    expect(invert.color[GATE]).toBe('#current.4');
    expect(invert.color.disabled).toBeUndefined();
    expect(primary.color[GATE]).toBe('#current.4');
    expect(primary.color.disabled).toBeUndefined();

    expect(primary['-webkit-text-fill-color'].disabled).toContain(
      'var(--current-accent',
    );
    expect(primary['-webkit-text-fill-color'][GATE]).toBeUndefined();
  });
});
