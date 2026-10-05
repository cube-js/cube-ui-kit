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
 * The chips are exactly equal. Tasty preserves authored state priority when
 * values repeat, so disabling selection needs no artificial alpha difference.
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
    '%s keeps exactly the selected chip when disabled',
    (variant) => {
      const fill = ITEM_VARIANTS[variant].fill as Record<string, string>;

      expect(fill['selected & disabled']).toBe(fill.selected);
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
      'current.item',
      'current.link',
      'current.outline',
      'current.outline-2',
      'current.primary',
    ]);
  });

  // Every `current` flavour fades its label to 40% of the inherited color, and
  // they all express it the same way. `current.primary` is no exception: its
  // `color` IS the fill there, so this is what fades the chip too (see
  // `CURRENT_PRIMARY_STYLES.color`).
  const FADED = '#current.4';

  it.each(CURRENT_VARIANTS)('%s gates its label fade', (variant) => {
    const color = ITEM_VARIANTS[variant].color as Record<string, string>;

    expect(color[GATE]).toBe(FADED);
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
      // `#current-fill` — the same thing the `Actions` slot gets inside a plain
      // `Item`. Everything else hands down its own faded label.
      if (variant === 'current.primary') {
        expect(color.disabled).toBe('#current-fill.5');
        return;
      }

      expect(color.disabled).toBe(FADED);
    },
  );

  // `#current-fill` is read by `current.primary` and by nothing else. Every other
  // flavour paints its chip ON the container, so the inherited color is already
  // the right one to write with and an offered one would only lower contrast — a
  // `#danger-accent-text` dismiss icon on a danger banner measures 1.53, against
  // the 4.62 the inherited `#white` gets.
  it('is read by current.primary only', () => {
    const readers = CURRENT_VARIANTS.filter((variant) =>
      JSON.stringify(ITEM_VARIANTS[variant]).includes('#current-fill'),
    );

    expect(readers).toEqual(['current.primary']);
  });

  // Every slot that carries the label carries it identically, so a container
  // that sets `#current-fill` moves all of them at once and cannot leave one
  // behind. The rim is in the list on purpose: it is the same "opposite side of
  // the fill" color, at `.25`.
  it('current.primary paints label, rim and icon slots from it', () => {
    const primary = ITEM_VARIANTS['current.primary'] as Record<string, any>;

    expect(primary.fill['']).toContain('#current');
    expect(primary.border['']).toBe('#current-fill.25');
    expect(primary['-webkit-text-fill-color']['']).toBe('#current-fill');

    for (const slot of ['Icon', 'RightIcon', 'Prefix', 'Suffix', 'Actions']) {
      expect(primary[slot].color['']).toBe('#current-fill');
      expect(primary[slot].color.disabled).toBe('#current-fill.5');
    }
  });

  // `#current`-derived fades gate, because a disabled host has already muted
  // what they resolve against. `#current-fill` is not inherited from that faded
  // color — a container offers the live value only — so its fade is the reader's
  // own job and takes a bare `disabled`.
  it('gates the inherited fade and not the offered one', () => {
    const primary = ITEM_VARIANTS['current.primary'] as Record<string, any>;

    expect(primary.color[GATE]).toBe('#current.4');
    expect(primary.color.disabled).toBeUndefined();

    expect(primary['-webkit-text-fill-color'].disabled).toBe('#current-fill.5');
    expect(primary['-webkit-text-fill-color'][GATE]).toBeUndefined();
  });
});

/**
 * The `card` type is the soft flavour — pale fill, tinted border, strong
 * colored text — and every colored one is the SAME three tokens with the theme
 * prefix swapped. That uniformity is the whole reason a new hue is a four-line
 * change, and it is the thing that quietly rots: the tokens are per-theme, so a
 * card written by hand against `-accent-surface` where its neighbours use
 * `-surface` looks right in light mode and drifts in dark.
 *
 * `primary` is in this list because it is the one call sites could not spell
 * (CUB-4527): the brand hue was reachable only as a SOLID fill, so a design
 * asking for a soft purple chip settled for `note` — the same card one hue over
 * (302.3 vs 280.3). Asserting its ramp is `#primary-*` is what keeps the two
 * from collapsing back into one.
 *
 * `default` is excluded deliberately: it is the untinted path, so its card is
 * neutral grey (`#surface-3`) rather than a brand ramp. `current` is excluded
 * for the reason it always is — it mixes from `currentcolor`, not from tokens.
 */
describe('card variants', () => {
  const COLORED_CARDS = [
    'primary',
    'success',
    'danger',
    'warning',
    'note',
  ] as const;

  it.each(COLORED_CARDS)('%s.card uses its own theme ramp', (theme) => {
    expect(ITEM_VARIANTS[`${theme}.card`]).toEqual({
      border: `#${theme}-accent-surface.20`,
      fill: `#${theme}-surface`,
      color: `#${theme}-accent-text`,
    });
  });
});
