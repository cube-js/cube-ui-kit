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

  // Every flavour fades to 40% of whatever it paints its label with. That is
  // `#current.4` for all but `invert`, which sources its label from the
  // `--current-accent` a container may offer and therefore has to spell the mix
  // out — `#current.4` would compile to `color-mix(… currentcolor …)`, and
  // `currentcolor` inside the `color` property means the inherited value rather
  // than the accent.
  const FADED: Record<string, string> = {
    'current.invert':
      'color-mix(in oklab, var(--current-accent, currentcolor) 40%, transparent)',
  };
  const fadedFor = (variant: string) => FADED[variant] ?? '#current.4';

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

      expect(color.disabled).toBe(fadedFor(variant));
    },
  );

  // Each filled flavour takes its own property, and reads nobody else's. They
  // sit on different chips — `invert` on `#surface`, `primary` on
  // `currentcolor` — so a container painting a scheme-fixed color cannot
  // satisfy both with one value: offering the container's own fill drops
  // `invert` to cr 1.00 in dark, offering `#surface-text` drops `primary` to
  // 1.12. Two properties is the smallest thing that serves both.
  const HOOKS = {
    'current.invert': {
      property: '--current-accent',
      fallback: 'var(--current-accent, currentcolor)',
    },
    'current.primary': {
      property: '--current-label',
      fallback: 'var(--current-label, var(--surface-color))',
    },
  } as const;

  const READERS = Object.keys(HOOKS) as (keyof typeof HOOKS)[];

  it('redirects the filled flavours only', () => {
    const readers = CURRENT_VARIANTS.filter((variant) =>
      /var\(--current-(accent|label)/.test(
        JSON.stringify(ITEM_VARIANTS[variant]),
      ),
    ).sort();

    expect(readers).toEqual([...READERS].sort());
  });

  it.each(READERS)('%s reads only its own property', (variant) => {
    const json = JSON.stringify(ITEM_VARIANTS[variant]);
    const foreign = READERS.filter((other) => other !== variant).map(
      (other) => HOOKS[other].property,
    );

    expect(json).toContain(HOOKS[variant].property);
    for (const property of foreign) {
      expect(json).not.toContain(property);
    }
  });

  // Every read spells out its fallback, which is what keeps a container that
  // offers nothing rendering exactly as it did before the hooks existed. A bare
  // `var(--current-accent)` would resolve to nothing and drop the label.
  it.each(READERS)('%s always spells out its fallback', (variant) => {
    const json = JSON.stringify(ITEM_VARIANTS[variant]);
    const occurrences = (needle: string) => json.split(needle).length - 1;
    const bare = `var(${HOOKS[variant].property}`;

    expect(occurrences(bare)).toBeGreaterThan(0);
    expect(occurrences(HOOKS[variant].fallback)).toBe(occurrences(bare));
  });

  // Anywhere an offered color is faded, the fade must carry the gate: the
  // offering container owns its color in every state, so inside a disabled one
  // the value already arrives muted and a bare `disabled` key would mix it a
  // second time. Which property carries the label differs between the two —
  // `color` on `invert`, `-webkit-text-fill-color` plus the icon slots on
  // `primary` — so this walks the whole style object rather than naming one.
  it.each(READERS)(
    '%s never fades an offered color on a bare `disabled`',
    (variant) => {
      const offenders: string[] = [];

      const walk = (node: unknown, path: string) => {
        if (!node || typeof node !== 'object') return;

        const map = node as Record<string, unknown>;
        const reads = Object.values(map).some(
          (value) =>
            typeof value === 'string' &&
            value.includes(HOOKS[variant].property),
        );

        if (reads && 'disabled' in map) offenders.push(path);

        for (const [key, value] of Object.entries(map))
          walk(value, `${path}.${key}`);
      };

      walk(ITEM_VARIANTS[variant], variant);

      expect(offenders).toEqual([]);
    },
  );
});
