import { IconDownload } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Button,
  Checkbox,
  ColorInput,
  ColorSwatch,
  CopyIcon,
  CopySnippet,
  CubeLogo,
  DEFAULT_PALETTE_CONFIG,
  Dialog,
  DialogTrigger,
  getPaletteConfig,
  getPaletteConfigInput,
  getPaletteTokens,
  HueSlider,
  InfoBadge,
  ItemButton,
  Link,
  MAX_BASE_SATURATION,
  PrismCode,
  Radio,
  RadioGroup,
  ReloadIcon,
  renderColorTokens,
  resetPaletteConfig,
  Slider,
  Switch,
  Tag,
  tasty,
  usePaletteConfig,
  usePaletteVersion,
} from '../index';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Styles, Tokens } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type {
  PaletteConfig,
  PaletteThemeName,
  PaletteThemeSeed,
  RenderPaletteOptions,
  SurfaceMode,
} from '../index';

/**
 * Live palette tuning.
 *
 * Every control here writes to the same global palette store the kit ships —
 * there is no story-local theme. That means the tuner has to put the palette
 * back on unmount (see `useResetOnUnmount`), or navigating away would leave the
 * rest of Storybook — and any Chromatic snapshot taken after it — re-colored.
 *
 * The stories deliberately do NOT render their own `<Root>`: the global preview
 * decorator already provides one, and a second would give two `GlobalStyles`
 * both injecting the `body` token block.
 */

// ============================================================================
// Layout primitives
// ============================================================================

const Page = tasty({
  styles: {
    display: 'grid',
    gap: '4x',
    padding: '4x',
    fill: '#surface',
    color: '#surface-text',
  },
});

const Section = tasty({
  styles: { display: 'grid', gap: '2x' },
});

const Heading = tasty({
  as: 'h1',
  styles: { margin: 0, preset: 'h2' },
});

const SectionHeading = tasty({
  as: 'h2',
  styles: { margin: 0, preset: 'h5', color: '#surface-text-soft' },
});

const Lead = tasty({
  as: 'p',
  styles: { margin: 0, preset: 't3', color: '#surface-text-soft' },
});

const Panel = tasty({
  styles: {
    display: 'grid',
    gap: '3x',
    padding: '3x',
    radius: '1cr',
    fill: '#surface-2',
    border: '1bw #border',
  },
});

const Controls = tasty({
  styles: {
    display: 'grid',
    gridColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '3x 4x',
    alignItems: 'start',
  },
});

const Grid = tasty({
  styles: {
    display: 'grid',
    gridColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2x',
  },
});

const Row = tasty({
  styles: {
    display: 'flex',
    flow: 'row wrap',
    gap: '1x',
    placeItems: 'center start',
  },
});

const Swatch = tasty({
  styles: {
    display: 'grid',
    gap: '.5x',
    padding: '2x',
    radius: '1r',
    alignContent: 'start',
    minHeight: '9x',
  },
});

const SwatchLabel = tasty({
  as: 'strong',
  styles: { preset: 't4m' },
});

// `c2` is the kit's settings-heading preset: uppercase, tracked, 12px. It reads as
// a section divider rather than as another bold line of prose, which is what a
// column of labelled controls needs.
const GroupLabel = tasty({
  as: 'strong',
  styles: { preset: 'c2', color: '#surface-text-soft' },
});

const Token = tasty({
  as: 'code',
  styles: { preset: 's4', opacity: 0.75, wordBreak: 'break-all' },
});

// No `Note` / `Warning` block elements any more. Every caveat on this page is now
// an `InfoBadge` beside the control it qualifies — reached through the field
// `tooltip` prop, or placed directly where there is no field. A tuner is a dense
// column of controls, and a paragraph under each one pushed the next knob off the
// screen to explain something you only need once.

// ============================================================================
// Helpers
// ============================================================================

/**
 * Restore the shipped palette when the tuner leaves the screen. The store is
 * process-global, so without this every later story inherits the tuning.
 */
function useResetOnUnmount() {
  useEffect(() => resetPaletteConfig, []);
}

/** Light-scheme value of a token, straight out of the resolved palette. */
function resolvedValue(name: string): string {
  const token = getPaletteTokens()[name] as Record<string, string> | undefined;

  return token?.[''] ?? '—';
}

/**
 * True while the palette still emits a separate high-contrast tier.
 *
 * Only `contrastLevel: 100` drops it, and only because the normal colors already
 * are the high-contrast ones there. Every other level keeps both tiers.
 */
function hasContrastTier(): boolean {
  const token = getPaletteTokens()['#surface'] as Record<string, string>;

  return '@hc' in token;
}

/**
 * A swatch of one palette TOKEN — the name, the reference and the resolved value.
 *
 * Named for what it takes rather than what it draws, because the kit exports its own
 * `ColorSwatch` for an arbitrary color string and this page uses both. Shadowing that
 * export inside the canonical theming doc would be the wrong place to do it.
 */
function TokenSwatch({
  label,
  fill,
  color,
  border,
}: {
  label: string;
  fill: string;
  color: string;
  border?: string;
}) {
  // The *swatch* re-colors on its own — `fill` compiles to a CSS custom
  // property, so the browser repaints with no React involvement. The printed
  // value below does not: reading it from JS means this component has to
  // subscribe, or the number would go stale while the color it labels moves.
  usePaletteVersion();

  return (
    <Swatch
      styles={{ fill, color, border: border ? `1bw ${border}` : undefined }}
    >
      <SwatchLabel>{label}</SwatchLabel>
      <Token>{fill}</Token>
      <Token>{resolvedValue(fill)}</Token>
    </Swatch>
  );
}

function StoryPage({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  useResetOnUnmount();

  return (
    <Page>
      <Section>
        <Heading>{title}</Heading>
        <Lead>{description}</Lead>
      </Section>
      {children}
    </Page>
  );
}

// ============================================================================
// Controls
// ============================================================================

function ResetButton() {
  return <Button onPress={resetPaletteConfig}>Reset to defaults</Button>;
}

/** The chips are read alongside their labels, so they only need to be legible. */
const RESOLUTION_SWATCH_STYLES: Styles = {
  width: '2.5x',
  height: '2.5x',
  radius: '.5r',
};

/**
 * Where the accent color actually landed.
 *
 * A color seed is a REQUEST, and two things can stop it arriving. Pastel caps chroma,
 * so a saturated brand can never resolve to itself under it — `#FFD400` softens to
 * `#e4d8ad`. And on a light page a light brand has to darken to clear the fill's 3:1
 * floor. Both are correct; both look like a bug if the only thing on screen is the
 * color you typed.
 *
 * The requested color is deliberately NOT repeated here: the field above holds it, and
 * its own swatch already shows it. What is worth showing is the pair it resolved to —
 * `#accent-text` as well as `#accent-surface`, because the tone reaches both. The seed
 * setting the button fill and the link color together is the part that is hard to
 * believe without seeing it.
 */
function ColorResolution({ resolved }: { resolved?: Tokens }) {
  usePaletteVersion();

  const [palette] = usePaletteConfig();

  if (!getPaletteConfigInput().accentColor) return null;

  // The preview's own tokens when there are any, so the chip answers "what did I get in
  // the variant I am looking at". `resolvedValue` only ever reports the document's
  // light scheme, which is the wrong answer inside a dark preview.
  const valueOf = (name: string) =>
    (resolved?.[name] as string | undefined) ?? resolvedValue(name);

  return (
    <Row styles={{ gap: '2.5x' }}>
      {[
        { label: 'Accent Fill', color: valueOf('#accent-surface') },
        { label: 'Accent Text', color: valueOf('#accent-text') },
      ].map(({ label, color }) => (
        <Row key={label} styles={{ gap: '.75x' }}>
          {/* The chip carries no text of its own, so an arbitrary resolved
              color cannot land unreadable on itself. */}
          <ColorSwatch color={color} styles={RESOLUTION_SWATCH_STYLES} />
          <Token>{label}</Token>
        </Row>
      ))}
      {palette.pastel ? (
        <InfoBadge
          theme="danger"
          tooltip="Pastel caps chroma, so this color cannot render exactly — the palette takes its hue and its tone and finds the nearest color inside the ceiling. Turn Pastel off to land on it."
        />
      ) : null}
    </Row>
  );
}

/**
 * Where color mode starts when a zone switches into it.
 *
 * Hexes rather than the live tokens, so flipping the mode changes which control is in
 * charge rather than reading the page back to itself.
 *
 * The base start is picked for its **saturation**, not its hue: a base color now
 * contributes both, so a near-grey start would desaturate the chrome on the way in.
 * `#6c717f` measures ~11.8 on the palette's 0–100 scale against the 12 the chrome
 * carries by default, which makes the flip chroma-neutral to within a rounding error.
 *
 * The accent flip cannot be neutral in the same way — the chrome takes 12% of the
 * brand's own chroma once a brand color exists, and `#7a4dbf` is the brand at ~70
 * rather than at 100 — so it lightens the chrome's tint by design. That is the feature
 * announcing itself, not a glitch.
 */
const ACCENT_COLOR_START = '#7a4dbf';
const BASE_COLOR_START = '#6c717f';

/**
 * The whole palette in one of three states, read off the SPARSE config.
 *
 * Deriving it rather than keeping it in `useState` is what makes a preset able to move
 * the tabs for free — and what stops the two from ever disagreeing. Only the sparse
 * config knows the difference between a value that was chosen and one that was
 * inherited or derived.
 *
 * **Three states, one control.** `pastel` and a per-zone `Seeded by` used to be two
 * controls describing a 2×2 grid with one impossible cell — pastel cannot honour a
 * color — so one of them spent its life disabled. Three tabs spend three buttons on
 * three reachable states and make Pastel → Color one press instead of two.
 *
 * `Advanced` and `Color` are the same chroma space; they differ only in what you hand
 * it. `Pastel` is the other space, and it takes hues because a flat ceiling has nothing
 * else to do with a color.
 *
 * The base zone keeps its own *Follow accent*, which is orthogonal to all of this: it
 * is about whether the chrome has a seed at all, not about how a seed is spelled.
 */
type PaletteMode = 'pastel' | 'advanced' | 'color';

function usePaletteMode(): PaletteMode {
  usePaletteVersion();

  const input = getPaletteConfigInput();

  // A color wins even next to `pastel: true`, which the tabs cannot produce but a
  // pasted config can. Reporting `color` is the more informative of the two, and the
  // colors are what the reader will be looking for.
  if (input.accentColor !== undefined || input.baseColor !== undefined) {
    return 'color';
  }

  return getPaletteConfig().pastel ? 'pastel' : 'advanced';
}

/** What the two zones are seeded WITH — the half of the mode they care about. */
type SeedMode = 'hue' | 'color';

function useSeedMode(): SeedMode {
  return usePaletteMode() === 'color' ? 'color' : 'hue';
}

/**
 * **A derived control is not shown.** Whatever the seed already supplies, its slider
 * disappears rather than sitting on screen disabled — a disabled slider under a color
 * seed is a read-out dressed as a control, and it cost two rows of a narrow column to
 * say something the color field above it already says.
 *
 * The rule that remains for *disabling* is narrower: a control is disabled when it
 * would write a field the current mode forbids. Only the global `Seeded by` switch is
 * in that position now, under pastel.
 */
function AccentSourceControls({ resolved }: { resolved?: Tokens }) {
  const [palette, setPalette] = usePaletteConfig();
  const input = getPaletteConfigInput();
  const mode = useSeedMode();

  if (mode === 'color') {
    return (
      <Section>
        <ColorInput
          label="Color"
          size="small"
          tooltip="Hue, chroma and tone all come from here — the tone is what makes the brand fill actually be your color rather than a shade re-derived at a fixed lightness. Glaze reproduces it exactly in the light, normal-contrast variant; dark and high contrast adapt, and a 3:1 floor against the page applies everywhere."
          value={input.accentColor ?? null}
          onChange={(accentColor) =>
            // Clearing the field is a mode change, so it lands back on a hue seed
            // pinned where the color left it rather than on a half-set config.
            setPalette(({ accentColor: previous, ...config }) =>
              accentColor
                ? { ...config, accentColor }
                : { ...config, hue: Math.round(palette.hue) },
            )
          }
        />
        <ColorResolution resolved={resolved} />
      </Section>
    );
  }

  return (
    <Section>
      <HueSlider
        // No value in the label: the slider already prints it on the right, and
        // the same number twice on one line reads as two facts.
        label="Hue"
        tooltip="Drives the whole accent family, `primary` / `purple` / `special`, and the brand-tinted odds and ends — the focus ring, the loading faces, the disabled chip."
        value={Math.round(palette.hue)}
        onChange={(hue) => setPalette((config) => ({ ...config, hue }))}
      />
      {palette.pastel ? null : (
        <Slider
          label="Saturation"
          tooltip="The accent zone's chroma, and the fallback every status theme inherits until it sets its own. It is also a ceiling on the base zone, which takes a 12% share of it while it follows the accent."
          value={palette.saturation}
          onChange={(saturation) =>
            setPalette((config) => ({ ...config, saturation }))
          }
        />
      )}
    </Section>
  );
}

function BaseSourceControls() {
  const [palette, setPalette] = usePaletteConfig();
  const input = getPaletteConfigInput();
  const seedMode = useSeedMode();

  // Two states now, not three. Whether the zone has a seed of its own is one question;
  // how that seed is spelled is the global one. `baseHue`/`baseSaturation` follow the
  // accent until something sets one, so without the first state inheritance would read
  // as a stuck control.
  const isOwn =
    input.baseColor !== undefined ||
    input.baseHue !== undefined ||
    input.baseSaturation !== undefined;

  return (
    <Section>
      <RadioGroup
        label="Seeded by"
        labelPosition="split"
        type="button"
        value={isOwn ? 'own' : 'accent'}
        onChange={(next) =>
          setPalette(({ baseColor, baseHue, baseSaturation, ...config }) =>
            next === 'own'
              ? seedMode === 'color'
                ? { ...config, baseColor: BASE_COLOR_START }
                : // Hand the sliders the values they were *showing*, so taking over
                  // is not also a repaint.
                  {
                    ...config,
                    baseHue: Math.round(palette.baseHue),
                    baseSaturation: Math.round(palette.baseSaturation * 2) / 2,
                  }
              : // Dropping all three is what re-links the zone: an absent `baseHue`
                // means "inherit again", where keeping it would mean "stay at 60".
                config,
          )
        }
      >
        <Radio value="accent">Follow accent</Radio>
        <Radio value="own">Own</Radio>
      </RadioGroup>

      {isOwn && seedMode === 'color' ? (
        <ColorInput
          label="Color"
          size="small"
          tooltip={`The hue and the saturation are taken; the tone is discarded, because the chrome's own lightness ladder is the design. A base color says which way the greys lean and how far, not how dark they are — and its saturation is clipped at ${MAX_BASE_SATURATION}, since a fully saturated chrome stops being chrome.`}
          value={input.baseColor ?? null}
          onChange={(baseColor) =>
            setPalette(({ baseColor: previous, ...config }) =>
              baseColor
                ? { ...config, baseColor }
                : {
                    ...config,
                    baseHue: Math.round(palette.baseHue),
                    baseSaturation: Math.round(palette.baseSaturation * 2) / 2,
                  },
            )
          }
        />
      ) : null}

      {/* Under a color seed both of these are derived, so neither is shown. While the
          zone follows the accent they stay on screen and draggable: a drag pins the
          field, which flips the radio to Own on its own, and that drag-to-pin
          affordance predates the radio. */}
      {seedMode === 'color' && isOwn ? null : (
        <>
          <HueSlider
            label={isOwn ? 'Hue' : 'Hue (inherited)'}
            tooltip="The neutral chrome — surface and its ladder, the surface-text ramp, border, placeholder. A colored theme's tinted surface deliberately follows its own hue instead, because a danger banner should read as red."
            value={Math.round(palette.baseHue)}
            onChange={(baseHue) =>
              setPalette((config) => ({ ...config, baseHue }))
            }
          />
          {palette.pastel ? null : (
            <Slider
              label={isOwn ? 'Saturation' : 'Saturation (inherited)'}
              tooltip={
                palette.surfaceMode === 'tinted'
                  ? `The same 0–100 scale the accent saturation uses, on the chrome alone. The shipped value is 12 — a faint tint is what a neutral surface is — so the interesting range is the low end, and past about 25 the base colors run out of scale and converge.`
                  : `Reaches surface-2…surface-4, the borders and the text ramp, but not the page surface: at the end of the tone scale there is no room for chroma. Switch Surfaces to Tinted to give it some.`
              }
              // The clip a derived base color gets, so the manual and the derived
              // routes agree on what the top of the range means. `surface-inverse`
              // saturates around 25 and its siblings follow, so the upper half is
              // already colors that have stopped moving.
              maxValue={MAX_BASE_SATURATION}
              step={0.5}
              value={Math.min(palette.baseSaturation, MAX_BASE_SATURATION)}
              onChange={(baseSaturation) =>
                setPalette((config) => ({ ...config, baseSaturation }))
              }
            />
          )}
        </>
      )}
    </Section>
  );
}

/** Full-width tabs, so the three states divide the column rather than huddling left. */
const MODE_TABS_STYLES: Styles = { width: '100%' };
const MODE_TAB_STYLES: Styles = { flexGrow: 1 };

/**
 * The palette's three states, as one unlabelled tab bar at the top of the column.
 *
 * Tabs rather than a labelled switch, and no label at all: it governs everything under
 * it, so naming it would mean finding a word for "the palette" — and the two candidates,
 * *Mode* and *Surfaces*, are both already spoken for further down. A tab bar spanning the
 * column says "these are the states of the thing below" without a caption.
 *
 * Every transition hands the incoming controls the values the outgoing ones were
 * displaying, so switching changes who is in charge rather than repainting on the way.
 * Leaving `Color` therefore pins each zone at what its color derived; entering it seeds
 * the start hexes and drops the numeric pins.
 */
function PaletteModeTabs() {
  const [palette, setPalette] = usePaletteConfig();
  const mode = usePaletteMode();

  /** Colors out, and the numbers they were deriving pinned in their place. */
  const toNumbers = (config: PaletteConfig): PaletteConfig => ({
    ...config,
    accentColor: undefined,
    baseColor: undefined,
    ...(config.accentColor !== undefined
      ? { hue: Math.round(palette.hue) }
      : null),
    ...(config.baseColor !== undefined
      ? {
          baseHue: Math.round(palette.baseHue),
          baseSaturation: Math.round(palette.baseSaturation * 2) / 2,
        }
      : null),
  });

  return (
    <Radio.Tabs
      aria-label="Palette mode"
      value={mode}
      styles={MODE_TABS_STYLES}
      onChange={(next) =>
        setPalette((config) => {
          if (next === 'color') {
            return {
              ...config,
              pastel: false,
              hue: undefined,
              accentColor: ACCENT_COLOR_START,
              // Only a zone that had a seed of its own gets a color; one following the
              // accent keeps following it.
              ...(config.baseHue !== undefined ||
              config.baseSaturation !== undefined
                ? {
                    baseHue: undefined,
                    baseSaturation: undefined,
                    baseColor: BASE_COLOR_START,
                  }
                : null),
            };
          }

          // Pastel and Advanced are the same seeds in two chroma spaces, so both take
          // the numeric form — a flat ceiling has nothing to do with a color, and
          // `pastel` has to be explicit either way: an absent one is inferred from
          // whether a `saturation` is pinned.
          return { ...toNumbers(config), pastel: next === 'pastel' };
        })
      }
    >
      <Radio
        value="pastel"
        styles={MODE_TAB_STYLES}
        tooltip="One flat, hue-independent chroma ceiling. It is what makes the palette even across hues, and it leaves nothing for a saturation scale to do — so there are no saturation sliders here except the syntax one, which pastel never reaches."
      >
        Pastel
      </Radio>
      <Radio
        value="advanced"
        styles={MODE_TAB_STYLES}
        tooltip="The per-hue ceiling, with a hue and a saturation on each zone. The same space Color uses; this is the half where you dial the numbers yourself."
      >
        Advanced
      </Radio>
      <Radio
        value="color"
        styles={MODE_TAB_STYLES}
        tooltip="The same space as Advanced, seeded from the hexes a brand usually arrives as. The accent color contributes hue, chroma and tone; a base color contributes hue and saturation. Whatever a color supplies, its slider goes away."
      >
        Color
      </Radio>
    </Radio.Tabs>
  );
}

/**
 * The knobs that belong to neither zone: where the surface ramp sits on the tone scale,
 * and the contrast level.
 *
 * `Surfaces` reads as a base-zone setting — it is the neutral surfaces it moves — but it
 * is global in the config and global in effect: the status themes' tinted surfaces follow
 * it, and so does the mirrored surface the syntax palette solves against. Filed by what
 * it reaches rather than by what it is named after.
 */
function GlobalControls() {
  const [palette, setPalette] = usePaletteConfig();

  return (
    <Section>
      <RadioGroup
        // Not "Surface mode": the palette's own three states are the mode on this page,
        // and two things called a mode is one too many. `Neutral` rather than `Default`
        // for the same reason a label should say what it is instead of that it is the
        // one you get — a surface at the end of the tone scale is exactly neutral.
        label="Surfaces"
        labelPosition="split"
        type="button"
        value={palette.surfaceMode}
        tooltip="Tinted moves the whole surface ramp two tones off the end of the tone scale — the neutral surfaces, the status themes' tinted ones, and the mirrored surface the syntax palette solves against. Not a lightness change: chroma needs distance from the extreme to exist at all, so a neutral light page is white whatever the base saturation asks for. Two tones is the cheapest room in which the base hue becomes visible."
        onChange={(surfaceMode) =>
          setPalette((config) => ({
            ...config,
            surfaceMode: surfaceMode as SurfaceMode,
          }))
        }
      >
        <Radio value="neutral">Neutral</Radio>
        <Radio value="tinted">Tinted</Radio>
      </RadioGroup>
    </Section>
  );
}

/**
 * The Playground's panel, and the reason the field labels can drop their zone
 * prefix: the headings carry it.
 *
 * Without them `Seeded by` and `Hue` would each appear twice with nothing to say
 * which zone they belong to — the builder's group labels were doing that work, and
 * this story had none.
 */
function BrandControls() {
  return (
    <Section>
      {/* The Playground needs the tabs too, or Advanced and Color are unreachable —
          they used to be a `pastel` switch and a per-zone `Seeded by` living inside
          the columns below. */}
      <PaletteModeTabs />
      <Controls>
        <Section>
          <GroupLabel>Global</GroupLabel>
          <GlobalControls />
        </Section>
        <Section>
          <GroupLabel>Accent</GroupLabel>
          <AccentSourceControls />
        </Section>
        <Section>
          <GroupLabel>Base</GroupLabel>
          <BaseSourceControls />
        </Section>
      </Controls>
    </Section>
  );
}

type StatusThemeName = Exclude<PaletteThemeName, 'code'>;

const STATUS_THEMES = ['success', 'danger', 'warning', 'note'] as const;

/**
 * Patch one status theme's seed, leaving the rest of the config — and the other
 * three themes — alone. The setter replaces, so a one-field control has to spread
 * rather than send a bare `{ themes: { danger: … } }`.
 */
function statusSeed(name: StatusThemeName, seed: PaletteThemeSeed) {
  return (config: PaletteConfig): PaletteConfig => ({
    ...config,
    themes: {
      ...config.themes,
      [name]: { ...config.themes?.[name], ...seed },
    },
  });
}

function StatusControls() {
  const [palette, setPalette] = usePaletteConfig();

  return (
    <Controls>
      {STATUS_THEMES.map((name) => {
        const seed = palette.themes[name];

        return (
          <Section key={name}>
            <HueSlider
              label={`${name} hue`}
              value={Math.round(seed.hue)}
              onChange={(hue) => setPalette(statusSeed(name, { hue }))}
            />
            {/* Hidden under pastel, for the reason `StatusThemeButton` spells
                out: pastel is one flat ceiling with the palette seed pinned to
                the top of it, so a per-theme scale underneath contradicts it. */}
            {palette.pastel ? null : (
              <Slider
                label={`${name} saturation`}
                value={seed.saturation}
                onChange={(saturation) =>
                  setPalette(statusSeed(name, { saturation }))
                }
              />
            )}
          </Section>
        );
      })}
    </Controls>
  );
}

/**
 * The level as a number the slider can hold.
 *
 * `'auto'` and `0` are output-identical — the level only positions the normal
 * colors, and at 0 it leaves them exactly where the palette authored them — so
 * one always-on slider can speak for both, and there is no mode switch to
 * explain. `'auto'` is still what the config resets to, which is why this reads
 * the two apart rather than assuming a number.
 */
function contrastLevelValue(level: number | 'auto'): number {
  return level === 'auto' ? 0 : level;
}

function ContrastControls() {
  const [palette, setPalette] = usePaletteConfig();
  const level = contrastLevelValue(palette.contrastLevel);

  return (
    <Slider
      label="Contrast level"
      tooltip={
        hasContrastTier()
          ? 'The level moves the normal colors only. The high-contrast tier is the true high-contrast resolution at every level, so the two compose — a contrast preference still escalates on top of wherever the slider puts the baseline.'
          : 'One tier at level 100: the normal colors already are the high-contrast ones here, so data-contrast="high" and prefers-contrast: more have nothing left to escalate to. Every level below this keeps both tiers.'
      }
      value={level}
      onChange={(contrastLevel) =>
        setPalette((config) => ({ ...config, contrastLevel }))
      }
    />
  );
}

// ============================================================================
// Showcase panels
// ============================================================================

function NeutralRamp() {
  return (
    <Section>
      <SectionHeading>
        Neutral surfaces — the saturation seed shows up here
      </SectionHeading>
      <Lead>
        These carry saturation factors of 0.10–0.175, so the brand hue reads as
        a faint tint that appears and disappears with the saturation seed. The
        solid accents below hide that entirely.
      </Lead>
      <Grid>
        <TokenSwatch
          label="surface"
          fill="#surface"
          color="#surface-text"
          border="#border"
        />
        <TokenSwatch
          label="surface-2"
          fill="#surface-2"
          color="#surface-2-text"
        />
        <TokenSwatch
          label="surface-3"
          fill="#surface-3"
          color="#surface-3-text"
        />
        <TokenSwatch
          label="surface-4"
          fill="#surface-4"
          color="#surface-text"
        />
      </Grid>
    </Section>
  );
}

function TextRamp() {
  return (
    <Section>
      <SectionHeading>Text ramp — the contrast level moves this</SectionHeading>
      <Swatch styles={{ fill: '#surface', border: '1bw #border' }}>
        <SwatchLabel styles={{ color: '#surface-text' }}>
          #surface-text — AAA body copy
        </SwatchLabel>
        <SwatchLabel styles={{ color: '#surface-text-soft', preset: 't3' }}>
          #surface-text-soft — AA secondary copy
        </SwatchLabel>
        <SwatchLabel styles={{ color: '#surface-text-soft-2', preset: 't3' }}>
          #surface-text-soft-2 — AA-large captions
        </SwatchLabel>
        <SwatchLabel styles={{ color: '#placeholder', preset: 't3' }}>
          #placeholder — input placeholder
        </SwatchLabel>
      </Swatch>
    </Section>
  );
}

function AccentRamp() {
  return (
    <Section>
      <SectionHeading>Accent system — the brand hue drives this</SectionHeading>
      <Grid>
        <TokenSwatch
          label="accent-surface"
          fill="#accent-surface"
          color="#accent-surface-text"
        />
        <TokenSwatch
          label="accent-surface-hover"
          fill="#accent-surface-hover"
          color="#accent-surface-text"
        />
        <TokenSwatch
          label="accent-surface-2"
          fill="#accent-surface-2"
          color="#accent-surface-text"
        />
        <TokenSwatch
          label="accent-surface-3"
          fill="#accent-surface-3"
          color="#accent-surface-text"
        />
        <TokenSwatch
          label="primary-surface"
          fill="#primary-surface"
          color="#primary-surface-text"
        />
        <TokenSwatch
          label="special-surface"
          fill="#special-surface"
          color="#white"
        />
      </Grid>
      <Swatch styles={{ fill: '#surface', border: '1bw #border', gap: '1x' }}>
        <SwatchLabel styles={{ color: '#accent-text' }}>
          #accent-text — hovered link / selected label
        </SwatchLabel>
        <SwatchLabel styles={{ color: '#accent-text-soft', preset: 't3' }}>
          #accent-text-soft — rest link color
        </SwatchLabel>
        <Row>
          <Swatch
            styles={{
              fill: '#focus',
              width: '4x',
              height: '4x',
              radius: '1r',
              padding: 0,
              minHeight: 'auto',
            }}
          />
          <Token>#focus (focus ring)</Token>
        </Row>
      </Swatch>
    </Section>
  );
}

function StatusPanels() {
  return (
    <Section>
      <SectionHeading>Status themes — each carries its own hue</SectionHeading>
      <Grid>
        {STATUS_THEMES.map((name) => (
          <Section key={name}>
            <TokenSwatch
              label={`${name}-surface`}
              fill={`#${name}-surface`}
              color={`#${name}-surface-text`}
            />
            <TokenSwatch
              label={`${name}-accent-surface`}
              fill={`#${name}-accent-surface`}
              color={`#${name}-accent-surface-text`}
            />
          </Section>
        ))}
      </Grid>
    </Section>
  );
}

function ComponentPanel() {
  return (
    <Section>
      <SectionHeading>Real components</SectionHeading>
      <Lead>
        Nothing here re-renders when the palette changes: every color compiles
        to a CSS custom property, so replacing one rule on the body element
        re-colors the whole tree.
      </Lead>
      <Row>
        <Button type="primary">Primary</Button>
        {/* oxlint-disable-next-line cube-ui-kit/no-redundant-default-prop -- button type row names every type, the default included */}
        <Button type="outline">Outline</Button>
        <Button type="clear">Clear</Button>
        <Button type="link">Link</Button>
        <Button type="primary" isDisabled>
          Disabled
        </Button>
        <Button type="primary" theme="danger">
          Danger
        </Button>
        <Button theme="success">Success</Button>
        <Button type="primary" theme="special">
          Special
        </Button>
      </Row>
    </Section>
  );
}

const SAMPLE_CODE = `import { setPaletteConfig } from '@cube-dev/ui-kit';

// Re-seed the brand, and give danger its own hue.
setPaletteConfig({
  hue: 210,
  saturation: 72,
  themes: { danger: { hue: 12 } },
});`;

function CodePanel() {
  return (
    <Section>
      <SectionHeading>
        Syntax highlighting — its own theme, so the brand cannot reach it
      </SectionHeading>
      <Lead>
        The <Token>code-*</Token> family carries absolute hues <em>and</em> its
        own saturation seed, so neither the brand hue nor the palette saturation
        moves it: a brand re-seeded toward green would otherwise collide strings
        with numbers, and a muted palette would wash the whole block out. Tune
        it on its own with <Token>themes.code.saturation</Token>. Every token
        still keeps an AA/AAA floor against the real surface, so it stays
        readable in every scheme.
      </Lead>
      <Swatch styles={{ fill: '#surface-3', padding: '3x' }}>
        <PrismCode code={SAMPLE_CODE} language="javascript" />
      </Swatch>
    </Section>
  );
}

// ============================================================================
// Theme builder
// ============================================================================

/**
 * A preview renders one concrete variant, so there is no `auto` here: `auto` is a
 * *preference* ("follow the OS"), and a flat token value cannot express one.
 */
type SchemeChoice = 'light' | 'dark';

/**
 * Scheme and contrast tier are **viewing conditions**, not theme settings — the
 * same theme renders in all four of them, and a designer moves between them to
 * check their work rather than to change it. They live over the preview for
 * that reason, and nothing they do reaches the palette config.
 */
interface ViewingConditions {
  scheme: SchemeChoice;
  highContrast: boolean;
}

/** What the document is showing right now, per the states `Root` registers. */
function readViewingConditions(): ViewingConditions {
  if (typeof document === 'undefined') {
    return { scheme: 'light', highContrast: false };
  }

  const schema = document.documentElement.getAttribute('data-schema');
  const contrast = document.documentElement.getAttribute('data-contrast');

  return {
    scheme:
      schema === 'dark' || schema === 'light'
        ? schema
        : matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
    highContrast: contrast
      ? contrast === 'high'
      : matchMedia('(prefers-contrast: more)').matches,
  };
}

/**
 * The document's own scheme and contrast tier, kept live.
 *
 * This is what makes the two switches over the preview *follow* without an
 * `Auto` option to explain: they start on whatever the page is already showing,
 * and until someone presses one they keep tracking it. Flipping Storybook's
 * dark-mode toolbar with a light preview stranded inside a dark page is exactly
 * the state that reads as broken.
 *
 * Both inputs have to be watched, because both can decide the answer: the
 * attribute when `Root`'s opt-in is set, the media query otherwise.
 */
function useDocumentConditions(): ViewingConditions {
  const [conditions, setConditions] = useState(readViewingConditions);

  useEffect(() => {
    const sync = () => setConditions(readViewingConditions());
    const observer = new MutationObserver(sync);
    const queries = [
      matchMedia('(prefers-color-scheme: dark)'),
      matchMedia('(prefers-contrast: more)'),
    ];

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-schema', 'data-contrast'],
    });
    queries.forEach((query) => query.addEventListener('change', sync));

    // The attribute can land before the effect runs, so re-read on mount rather
    // than trusting the value the first render happened to see.
    sync();

    return () => {
      observer.disconnect();
      queries.forEach((query) => query.removeEventListener('change', sync));
    };
  }, []);

  return conditions;
}

// ----------------------------------------------------------------------------
// Controls
// ----------------------------------------------------------------------------

const ControlColumn = tasty({
  styles: {
    display: 'grid',
    gap: '3x',
    alignContent: 'start',
    // `2x` rather than `3x`: the split rows spend their width on a label and a
    // control facing each other, so the padding is the cheapest place to find some.
    padding: '2x',
    radius: '1cr',
    fill: '#surface-2',
    border: '1bw #border',
    height: 'max-content',
    // Both halves are taller than the screen, so without this every tweak is a
    // scroll back to the top to reach the next knob. Pinned, the controls stay
    // put and the preview scrolls past them.
    //
    // Only in the two-column layout: stacked, a sticky panel would sit on top
    // of the very thing it is there to let you watch. And only with a scroll of
    // its own — a sticky box taller than the viewport pins its top and hides
    // its own bottom, which is worse than not pinning at all.
    position: { '': 'static', '@media(width >= 1100px)': 'sticky' },
    top: '2x',
    maxHeight: { '': 'none', '@media(width >= 1100px)': '(100dvh - 4x)' },
    overflow: { '': 'visible', '@media(width >= 1100px)': 'hidden auto' },
  },
});

const ControlGroup = tasty({
  styles: { display: 'grid', gap: '1.5x' },
});

/**
 * Quick-apply seeds, so the builder opens on something other than a blank slate.
 *
 * Each one re-seeds the **status hues** as well as the brand, because moving `hue`
 * alone leaves the shipped statuses behind it and they collide: a `Forest` brand at
 * 150° lands 7° off the shipped `success` (156.9°), so a success banner and the brand
 * accent resolve to the same green. The bar here is ~35° between any two of the five
 * hues, roughly where two tinted surfaces stop reading as one color.
 *
 * Statuses still have to stay semantically legible — danger red, warning amber,
 * success green — so `note` does most of the moving, and the brand yields a little
 * where it has to (`Forest` sits at moss rather than mid-green to leave room for an
 * emerald success; `Ember` at amber rather than orange to leave room for a crimson
 * danger).
 *
 * Every preset except `Cube` also states its `pastel` stance outright rather than
 * inheriting it. `Ocean` / `Forest` / `Ember` pin it off because their saturation seeds
 * were picked against the per-hue chroma ceiling — their `saturation` would turn pastel
 * off on its own, so the field is there to be read rather than to do work. `Slate` pins
 * it on because being the soft one is its whole identity, a contrast that only reads
 * while its siblings are pinned off. `Cube` stays empty by design: it is the shipped
 * palette, so it should follow the default wherever the default goes.
 *
 * All five depart on the *numbers*. There is deliberately no preset for the other
 * half of the API — seeding a zone from a real color — because a preset that only
 * demonstrated the mechanism would be a worse teacher than the switch itself: flip
 * **Accent seeded by** to Color and the field opens on a color you can replace with
 * your own, which is the thing you actually came to do.
 */
const THEME_PRESETS: { label: string; config: PaletteConfig }[] = [
  // Empty on purpose: the setter replaces, so this *is* the shipped palette — the
  // reference the other four depart from, and the way back from any of them.
  { label: 'Cube', config: {} },
  {
    label: 'Ocean',
    config: {
      hue: 235,
      saturation: 70,
      // Pinned off. These three were authored against a non-pastel default and
      // their saturation seeds are tuned for the per-hue chroma ceiling; now that
      // the shipped palette is pastel, inheriting it would quietly restyle them
      // and flatten the contrast with `Slate`, whose whole point is being the
      // muted one. Stating it also keeps all four presets explicit about a knob
      // that visibly changes them.
      pastel: false,
      themes: {
        success: { hue: 165 },
        danger: { hue: 25 },
        warning: { hue: 80 },
        // Off purple and into magenta: at the shipped 302° a note sits 67° from a
        // blue brand and reads as a second accent rather than an aside.
        note: { hue: 315 },
      },
    },
  },
  {
    label: 'Forest',
    config: {
      hue: 128,
      saturation: 65,
      pastel: false,
      themes: {
        success: { hue: 172 },
        danger: { hue: 25 },
        warning: { hue: 75 },
        note: { hue: 300 },
      },
    },
  },
  {
    label: 'Ember',
    config: {
      hue: 48,
      saturation: 85,
      pastel: false,
      themes: {
        success: { hue: 155 },
        danger: { hue: 6 },
        warning: { hue: 100 },
        note: { hue: 300 },
      },
    },
  },
  {
    label: 'Slate',
    config: {
      hue: 250,
      // Pastel alone is what mutes this one relative to the three above, which pin
      // it off — and it needs nothing else, because pastel swaps the per-hue chroma
      // ceiling for a flat one that sits below where a saturated hue would land. A
      // pastel accent at the pinned 100 resolves softer than `Ember`'s non-pastel 85,
      // and evenly across hues rather than letting the warm statuses run ahead.
      //
      // No `saturation` here on purpose: pastel pins it to 100, so a number would be
      // inert and would read as doing work it is not doing.
      pastel: true,
      themes: {
        success: { hue: 160 },
        danger: { hue: 20 },
        warning: { hue: 85 },
        note: { hue: 312 },
        // Pastel does not reach the syntax palette, by design. Softening a code
        // block to match the rest of a muted theme goes through its own seed.
        code: { saturation: 55 },
      },
    },
  },
];

/**
 * Which preset the live config *is*, if any.
 *
 * The setter replaces rather than merges, so applying a preset makes the sparse
 * config exactly that preset's — which is what allows an equality check here
 * instead of per-field bookkeeping. Touch any control afterwards and no preset
 * matches, which is the honest answer: the theme is yours now.
 *
 * Key order cannot be relied on (`{ hue, pastel }` and `{ pastel, hue }` are the
 * same config), so the comparison sorts as it walks.
 */
function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);

  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;

  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
    .join(',')}}`;
}

function useActivePreset(): string | null {
  usePaletteVersion();

  const input = stableJson(getPaletteConfigInput());

  return (
    THEME_PRESETS.find((preset) => stableJson(preset.config) === input)
      ?.label ?? null
  );
}

/**
 * One status theme, as a chip you can read at a glance and open to tune.
 *
 * Four themes used to mean eight sliders standing open — a wall that pushed the
 * brand controls off the screen and gave no answer to the question actually
 * being asked, which is "do these four still read as four different things".
 * Four chips of the themes' own colors, side by side, answer exactly that; the
 * sliders are one press away for the theme that does not.
 *
 * The hue is not printed on the chip. It belongs to the slider that sets it, and
 * carrying it here cost the whole row: `success — 157°` is wide enough that four
 * of them had to stack, which is the arrangement the chips were meant to replace.
 *
 * `type="current"` is what makes a chip *be* its theme rather than describe one:
 * every part of the button — the resting fill, the border, the hover step — is
 * mixed from the inherited text color, so setting `color` to the theme's own text
 * token colors the whole control from a single value.
 */

// `Dialog` pads through its `Content` slot, and this popover holds raw children —
// the same arrangement `ColorPanel` is in, and the same `1x` a popover's own
// padding token resolves to.
const STATUS_POPOVER_STYLES: Styles = {
  display: 'grid',
  gap: '2x',
  padding: '1x',
  width: '32x',
};

function StatusThemeButton({
  name,
  tokens,
}: {
  name: StatusThemeName;
  /** The document's own resolved colors — the control column is painted by them. */
  tokens: Tokens;
}) {
  const [palette, setPalette] = usePaletteConfig();
  const seed = palette.themes[name];
  // The SPARSE config: only a saturation that was actually written counts as
  // pinned. The resolved one always carries a number, inherited or not.
  const pinnedSaturation = getPaletteConfigInput().themes?.[name]?.saturation;

  return (
    <DialogTrigger
      hideArrow
      type="popover"
      mobileType="tray"
      placement="bottom start"
    >
      <Button
        type="current"
        size="small"
        color={`#${name}-text`}
        tooltip={`Tune the ${name} theme — currently ${Math.round(seed.hue)}°`}
        icon={
          <ColorSwatch
            color={tokens[`#${name}-accent-surface`] as string | undefined}
          />
        }
      >
        {name}
      </Button>
      <Dialog aria-label={`${name} theme`} width="max-content">
        <Section styles={STATUS_POPOVER_STYLES}>
          <HueSlider
            label="Hue"
            tooltip="Status hues have to stay semantically legible — danger red, warning amber, success green — and about 35° apart from each other and from the brand, which is roughly where two tinted surfaces stop reading as one color."
            value={Math.round(seed.hue)}
            onChange={(hue) => setPalette(statusSeed(name, { hue }))}
          />
          {/* No saturation slider under pastel.

              Pastel is one flat chroma ceiling and the palette-level saturation is
              pinned to the top of it, so offering a *per-theme* scale underneath
              reads as a contradiction — and the range that survives the ceiling is
              about a third of the non-pastel one, narrow enough that dragging it
              looks like nothing happening. Hue is the knob that still means
              something here.

              The engine still honours a `themes.<status>.saturation` under pastel,
              which is why the pinned case below gets said out loud rather than
              hidden: a number set before pastel went on is still in effect. */}
          {palette.pastel ? (
            pinnedSaturation !== undefined ? (
              <Row>
                <Token>Saturation {pinnedSaturation} — pinned</Token>
                <InfoBadge
                  theme="danger"
                  tooltip={`Set while pastel was off, and still in effect. Pastel's flat ceiling is what governs status chroma now, so there is no scale to offer on top of it — turn pastel off to reach this number again, or to clear it.`}
                />
              </Row>
            ) : null
          ) : (
            <Slider
              label="Saturation"
              tooltip="Inherits the palette saturation until you move it, and stays pinned afterwards — so a re-seeded palette leaves this theme where you put it."
              value={seed.saturation}
              onChange={(saturation) =>
                setPalette(statusSeed(name, { saturation }))
              }
            />
          )}
        </Section>
      </Dialog>
    </DialogTrigger>
  );
}

/**
 * The theme, on its way out of this page.
 *
 * The sparse input rather than the resolved config, in both forms: it is far
 * shorter, and it is the honest answer, since an inherited `baseHue` written out
 * as a number would stop following the accent the moment it was pasted.
 */
const EXPORT_POPOVER_STYLES: Styles = {
  display: 'grid',
  padding: '1x',
  width: '48x',
};

/** The sparse config as JSON, and as a `setPaletteConfig()` call. */
function useConfigExport() {
  usePaletteVersion();

  const json = JSON.stringify(getPaletteConfigInput(), null, 2);

  return {
    json,
    // JSON quotes every key; these are all plain identifiers, and the snippet is
    // meant to be pasted into a `.ts` file.
    source: `setPaletteConfig(${json.replace(/"([A-Za-z][\w]*)":/g, '$1:')});`,
  };
}

/**
 * The snippet stays behind a popover — it is the one thing here that needs room
 * to be read rather than a place in the toolbar. The download does not: it has no
 * intermediate state worth showing, so a second click to reach it was a click for
 * nothing.
 */
function ExportButton() {
  const { source } = useConfigExport();

  return (
    <DialogTrigger
      hideArrow
      type="popover"
      mobileType="tray"
      placement="bottom start"
    >
      <Button size="small" icon={<CopyIcon />}>
        Export
      </Button>
      <Dialog aria-label="Export the palette config" width="max-content">
        <Section styles={EXPORT_POPOVER_STYLES}>
          <CopySnippet title="Palette config" code={source} />
        </Section>
      </Dialog>
    </DialogTrigger>
  );
}

function DownloadButton() {
  const { json } = useConfigExport();

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([`${json}\n`], { type: 'application/json' }),
    );
    const link = document.createElement('a');

    link.href = url;
    link.download = 'palette.json';
    link.click();
    // The click is synchronous, so the object URL has already been read and the
    // blob can go. Left alive it would leak for the life of the document.
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      size="small"
      icon={<IconDownload />}
      tooltip="Download the config as palette.json"
      onPress={download}
    >
      JSON
    </Button>
  );
}

/**
 * Reset, Export, Download — at the TOP of the column.
 *
 * They were at the bottom, which put the one button you reach for when a
 * experiment goes wrong behind 1100px of the controls that caused it. Actions on
 * a settings panel belong where they can be found without reading it.
 */
function BuilderActions() {
  return (
    <Row>
      <Button
        size="small"
        icon={<ReloadIcon />}
        tooltip="Discard every change and return to the shipped palette"
        onPress={resetPaletteConfig}
      >
        Reset
      </Button>
      <ExportButton />
      <DownloadButton />
    </Row>
  );
}

function ThemeBuilderControls({
  tokens,
  documentTokens,
}: {
  /** The variant on screen, so the resolved chips report it rather than the document. */
  tokens: Tokens;
  /** The document's own variant — what the control column itself is painted in. */
  documentTokens: Tokens;
}) {
  const [palette, setPalette] = usePaletteConfig();
  const activePreset = useActivePreset();

  return (
    <ControlColumn>
      <BuilderActions />

      {/* Above the groups rather than inside one, because it governs all of them.
          Everything below reads as the state the tabs have selected. */}
      <PaletteModeTabs />

      <ControlGroup>
        <GroupLabel>Presets</GroupLabel>
        <Row>
          {THEME_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              // The default `outline` shows selection as a filled chip, so the
              // active preset reads as the state it is rather than as a fifth style.
              isSelected={activePreset === preset.label}
              onPress={() => {
                // No reset first — the setter replaces, so the preset config
                // is the whole config.
                setPalette(preset.config);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Row>
      </ControlGroup>

      {/* Ahead of the zones, because everything in here governs both of them —
          and because `pastel` decides whether the saturation under it is even
          live. Reading the panel top to bottom now goes global, then accent, then
          base, which is the order the config resolves in. */}
      <ControlGroup>
        <GroupLabel>Global</GroupLabel>
        <GlobalControls />
        <ContrastControls />
      </ControlGroup>

      <ControlGroup>
        <GroupLabel>Accent</GroupLabel>
        {/* The same three clusters the Playground uses, so the two stories cannot
            drift — and so a knob added here appears there too. `ColorResolution`
            reads the PREVIEW's tokens rather than the document's, which is the one
            thing the builder has that the Playground does not. */}
        <AccentSourceControls resolved={tokens} />
      </ControlGroup>

      <ControlGroup>
        <GroupLabel>Base</GroupLabel>
        <BaseSourceControls />
      </ControlGroup>

      <ControlGroup>
        <GroupLabel>Status themes</GroupLabel>
        <Row>
          {STATUS_THEMES.map((name) => (
            <StatusThemeButton key={name} name={name} tokens={documentTokens} />
          ))}
        </Row>
      </ControlGroup>

      <ControlGroup>
        <GroupLabel>Syntax</GroupLabel>
        <Slider
          label="Code saturation"
          tooltip="Hues are fixed; only saturation is tunable. The syntax family carries absolute hues and its own seed, so neither the brand hue nor the palette saturation reaches it — a brand re-seeded toward green would otherwise collide strings with numbers."
          value={palette.themes.code.saturation}
          onChange={(saturation) =>
            setPalette((config) => ({
              ...config,
              themes: { ...config.themes, code: { saturation } },
            }))
          }
        />
      </ControlGroup>
    </ControlColumn>
  );
}

// ----------------------------------------------------------------------------
// Preview
// ----------------------------------------------------------------------------

const BuilderLayout = tasty({
  styles: {
    display: 'grid',
    gridColumns: {
      '': '1fr',
      // Wider than it was: a `split` row needs room for a label and a button group
      // side by side, and the longest pair — "Base seeded by" against three
      // options — is what sets the floor.
      '@media(width >= 1100px)': 'minmax(340px, 400px) 1fr',
    },
    gap: '4x',
    alignItems: 'start',
  },
});

/** The preview and the switches that say which of its four variants to show. */
const PreviewColumn = tasty({
  styles: {
    display: 'grid',
    gridRows: 'max-content 1fr',
    gap: '1.5x',
    // A `1fr` column inside a grid is `min-width: auto` by default, which lets
    // the preview's own content set the floor and pushes the controls off a
    // narrow screen.
    width: '0 100%',
  },
});

/**
 * Outside the preview shell on purpose, and outside the control column too.
 *
 * These two switches are not part of the theme — the same palette renders in
 * all four combinations, and moving between them is how you *check* a theme
 * rather than how you change one. Sitting them on the theme controls put a
 * viewing preference where every other knob writes to the config; sitting them
 * over the thing they govern says what they are without a caption.
 */
const PreviewToolbar = tasty({
  styles: {
    display: 'flex',
    flow: 'row wrap',
    gap: '1x 2x',
    placeItems: 'center start',
  },
});

/**
 * The previewed theme, scoped to this subtree by the `tokens` prop.
 *
 * Everything inside resolves against these values instead of the document's, so a
 * dark or high-contrast theme renders inside a light page.
 */
const PreviewShell = tasty({
  styles: {
    display: 'grid',
    gridRows: 'max-content 1fr',
    radius: '1cr',
    border: '1bw #border',
    fill: '#surface',
    color: '#surface-text',
    overflow: 'hidden',
    shadow: '$card-shadow',
    minHeight: '40x',
  },
});

const PreviewHeader = tasty({
  styles: {
    display: 'flex',
    flow: 'row',
    gap: '1.5x',
    placeItems: 'center',
    padding: '1.5x 2x',
    fill: '#surface-2',
    border: 'bottom 1bw #border',
  },
});

const PreviewBody = tasty({
  styles: {
    display: 'grid',
    // Wide enough for the longest label: `Item` is `nowrap`, so a narrow column
    // would ellipsize rather than wrap.
    gridColumns: { '': '1fr', '@media(width >= 700px)': '24x 1fr' },
  },
});

// Mirrors the sidebar pattern from the Layout guide: a hairline gap so the items
// read as one stack, and even padding so the first and last sit off the edges by
// the same amount. `ItemButton` also gives us the real selected treatment and its
// own `nowrap`, so "Conversion Funnel" stays on one line.
const PreviewNav = tasty({
  styles: {
    display: 'grid',
    gap: '1bw',
    alignContent: 'start',
    padding: '1x',
    fill: '#surface-2',
    border: 'right 1bw #border',
  },
});

const PreviewMain = tasty({
  styles: {
    display: 'grid',
    gridColumns: {
      '': '1fr',
      '@media(width >= 900px)': '1fr minmax(200px, 260px)',
    },
    gap: '2x',
    padding: '2x',
    alignContent: 'start',
  },
});

/** The primary column: surfaces, text, controls. */
const MainColumn = tasty({
  styles: { display: 'grid', gap: '2x', alignContent: 'start', gridColumn: 1 },
});

/**
 * Every alert theme in one column. Alerts pair a tinted `<theme>-surface` with
 * `<theme>-surface-text` and a themed border, so they are the quickest read on
 * whether the status hues still work at a given saturation.
 */
const AlertColumn = tasty({
  styles: { display: 'grid', gap: '1x', alignContent: 'start' },
});

/** Second surface level: a panel sitting on the page. */
const Panel2 = tasty({
  styles: {
    display: 'grid',
    gap: '1.5x',
    padding: '2x',
    radius: '1cr',
    fill: '#surface-2',
    color: '#surface-2-text',
    border: '1bw #border',
  },
});

/** Third surface level: nested inside a panel. */
const Panel3 = tasty({
  styles: {
    display: 'grid',
    gap: '1x',
    padding: '2x',
    radius: '1r',
    fill: '#surface-3',
    color: '#surface-3-text',
  },
});

const Badge = tasty({
  styles: {
    padding: '0 1x',
    radius: '1r',
    preset: 't4',
    border: '1bw #border',
    color: '#surface-text-soft-2',
    width: 'max-content',
  },
});

/** The `surface-N-text` ramp, so each surface level can be judged on its own. */
function SurfaceTextRamp({ level }: { level: '' | '-2' | '-3' }) {
  return (
    <>
      <SwatchLabel styles={{ preset: 'h5', color: `#surface${level}-text` }}>
        Heading — surface{level || ''}-text
      </SwatchLabel>
      <SwatchLabel
        styles={{ preset: 't3', color: `#surface${level}-text-soft` }}
      >
        Body copy — surface{level || ''}-text-soft
      </SwatchLabel>
      {level === '' ? (
        <SwatchLabel styles={{ preset: 't4', color: '#surface-text-soft-2' }}>
          Caption — surface-text-soft-2
        </SwatchLabel>
      ) : null}
    </>
  );
}

const PREVIEW_TABS = ['Results', 'Chart', 'SQL'];
const ALERT_THEMES = ['note', 'success', 'danger', 'warning'] as const;

/**
 * The two `item-themes` axes, kept separate on purpose: one row varies the *type*
 * at a fixed theme, the other varies the *theme* at a fixed type. Mixing them (a
 * `Disabled` next to an `Outline` next to a `Danger`) reads as one row of peers
 * when it is really three different things.
 */
const BUTTON_TYPES = [
  'primary',
  'outline',
  'outline-2',
  'clear',
  'link',
] as const;

/** `Tag` carries the full theme axis, `special` included. */
const TAG_THEMES = [
  'default',
  'danger',
  'success',
  'warning',
  'note',
  'special',
] as const;

const BUTTON_THEMES = [
  'default',
  'danger',
  'success',
  'warning',
  'note',
] as const;

const PREVIEW_NAV = [
  'Quarterly Revenue',
  'Active Users',
  'Conversion Funnel',
  'Retention',
];

function ThemePreview({
  tokens,
  scheme,
}: {
  tokens: Tokens;
  scheme: SchemeChoice;
}) {
  const [tab, setTab] = useState(PREVIEW_TABS[0]);

  return (
    <PreviewShell tokens={tokens}>
      <PreviewHeader>
        {/* The mark is two drawings swapped by the `@dark` state, which follows the
            *document* — tokens override token values, not states, so the preview has
            to pin the scheme explicitly. Its colour is a token and needs no help. */}
        <CubeLogo size="3x" scheme={scheme} color="#accent-surface" />
        <SwatchLabel styles={{ preset: 't3m' }}>Quarterly Revenue</SwatchLabel>
        <Badge>Draft</Badge>
        <Row styles={{ gap: '1x', marginLeft: 'auto' }}>
          <Button size="small">Share</Button>
          <Button type="primary" size="small">
            Run
          </Button>
        </Row>
      </PreviewHeader>

      <PreviewBody>
        <PreviewNav>
          {PREVIEW_NAV.map((item, index) => (
            <ItemButton
              key={item}
              type="clear"
              size="small"
              isSelected={index === 0}
            >
              {item}
            </ItemButton>
          ))}
        </PreviewNav>

        <PreviewMain>
          <MainColumn>
            <Section styles={{ gap: '1x' }}>
              <SurfaceTextRamp level="" />
            </Section>

            <RadioGroup
              aria-label="Preview tabs"
              type="button"
              value={tab}
              onChange={setTab}
            >
              {PREVIEW_TABS.map((name) => (
                <Radio key={name} value={name}>
                  {name}
                </Radio>
              ))}
            </RadioGroup>

            <Panel2>
              <Row styles={{ placeItems: 'center', gap: '1x' }}>
                <GroupLabel styles={{ color: '#surface-2-text-soft' }}>
                  MEMBERS
                </GroupLabel>
                <Link styles={{ marginLeft: 'auto' }}>View documentation</Link>
              </Row>
              <SurfaceTextRamp level="-2" />
              <Panel3>
                <SurfaceTextRamp level="-3" />
                <Token>Third surface level — nested inside a panel</Token>
              </Panel3>
            </Panel2>

            <Section styles={{ gap: '1x' }}>
              <GroupLabel>CONTROLS</GroupLabel>
              <Row styles={{ gap: '2x' }}>
                <Switch isSelected>Switch</Switch>
                <Checkbox isSelected>Checkbox</Checkbox>
              </Row>
              <RadioGroup aria-label="Radio sample" defaultValue="one">
                <Radio value="one">Radio</Radio>
                <Radio value="two">Another</Radio>
              </RadioGroup>
            </Section>

            <Section styles={{ gap: '1x' }}>
              <GroupLabel>TAGS</GroupLabel>
              <Row>
                {TAG_THEMES.map((theme) => (
                  <Tag key={theme} theme={theme}>
                    {theme}
                  </Tag>
                ))}
              </Row>
            </Section>

            <Section styles={{ gap: '1x' }}>
              <GroupLabel>BUTTON TYPES</GroupLabel>
              <Row>
                {BUTTON_TYPES.map((type) => (
                  <Button key={type} type={type} size="small">
                    {type}
                  </Button>
                ))}
              </Row>
            </Section>

            <Section styles={{ gap: '1x' }}>
              <GroupLabel>BUTTON THEMES</GroupLabel>
              <Row>
                {BUTTON_THEMES.map((theme) => (
                  <Button key={theme} type="primary" theme={theme} size="small">
                    {theme}
                  </Button>
                ))}
              </Row>
            </Section>

            <Panel3 styles={{ padding: '2x' }}>
              <PrismCode code={SAMPLE_CODE} language="javascript" />
            </Panel3>
          </MainColumn>

          <AlertColumn>
            <GroupLabel>ALERTS</GroupLabel>
            {ALERT_THEMES.map((theme) => (
              <Alert key={theme} theme={theme}>
                {theme}
              </Alert>
            ))}
          </AlertColumn>
        </PreviewMain>
      </PreviewBody>
    </PreviewShell>
  );
}

function ThemeBuilderPage() {
  const documentConditions = useDocumentConditions();
  // `null` while the switch is still following the document. Deriving the shown
  // value from "override ?? document" is what lets a two-option control follow
  // without an `Auto` option standing for the third state.
  const [schemeOverride, setSchemeOverride] = useState<SchemeChoice | null>(
    null,
  );
  const [contrastOverride, setContrastOverride] = useState<boolean | null>(
    null,
  );
  const version = usePaletteVersion();

  const scheme = schemeOverride ?? documentConditions.scheme;
  const isHighContrast = contrastOverride ?? documentConditions.highContrast;

  // The level lives in the palette config now, so it needs no mention here: it
  // is part of the theme being built, and both of these pick it up.
  const tokens = useMemo(
    () => renderColorTokens({ scheme, highContrast: isHighContrast }),
    [scheme, isHighContrast, version],
  );

  // Resolved separately for the controls, which the *document* paints. Both
  // calls land on the same memo inside `renderPaletteTokens` — it holds all four
  // variants of one config — so the second one costs nothing.
  const documentTokens = useMemo(
    () => renderColorTokens(documentConditions),
    [documentConditions, version],
  );

  return (
    <StoryPage
      title="Theme builder"
      description={
        <>
          Every control on the left writes to the live palette config; the panel
          on the right renders it into a single region through a tasty{' '}
          <Token>tokens</Token> prop. The two switches over the preview pick
          which of the theme&rsquo;s four variants to show — they start on
          whatever this page is already in, and change nothing about the theme
          itself.
        </>
      }
    >
      <BuilderLayout>
        <ThemeBuilderControls tokens={tokens} documentTokens={documentTokens} />
        <PreviewColumn>
          <PreviewToolbar>
            <RadioGroup
              aria-label="Color scheme"
              type="button"
              value={scheme}
              onChange={(value) => setSchemeOverride(value as SchemeChoice)}
            >
              <Radio value="light">Light</Radio>
              <Radio value="dark">Dark</Radio>
            </RadioGroup>
            <RadioGroup
              aria-label="Contrast tier"
              type="button"
              // Off rather than live-and-warned once the tier is gone: there is
              // no second variant to switch to, so an enabled control would be
              // offering a state the palette cannot produce. A disabled
              // segmented control still paints its selected option, so this
              // reads as "Normal, and that is the only one" instead of going
              // flat — which is why the badge had to carry the news before.
              isDisabled={!hasContrastTier()}
              value={isHighContrast && hasContrastTier() ? 'high' : 'normal'}
              onChange={(value) => setContrastOverride(value === 'high')}
            >
              <Radio value="normal">Normal</Radio>
              <Radio value="high">High contrast</Radio>
            </RadioGroup>
            {hasContrastTier() ? null : (
              <InfoBadge
                theme="danger"
                tooltip="No separate tier at contrast level 100 — the normal colors already are the high-contrast ones, so there is nothing to escalate to and the preview is the normal variant."
              />
            )}
          </PreviewToolbar>
          <ThemePreview tokens={tokens} scheme={scheme} />
        </PreviewColumn>
      </BuilderLayout>
    </StoryPage>
  );
}

// ============================================================================
// Stories
// ============================================================================

const meta = {
  title: 'Getting Started/Theming',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <StoryPage
      title="Palette playground"
      description={
        <>
          Drag any control and the whole page re-colors. The defaults are hue{' '}
          {DEFAULT_PALETTE_CONFIG.hue}° / saturation{' '}
          {DEFAULT_PALETTE_CONFIG.saturation}; the hue slider steps by 1°, so
          use Reset to get back to the exact shipped value. Flip the toolbar
          dark-mode switch at any point — both schemes are generated from the
          same seed.
        </>
      }
    >
      <Panel>
        <BrandControls />
        <Row>
          <ResetButton />
        </Row>
      </Panel>
      <AccentRamp />
      <NeutralRamp />
      <TextRamp />
      <ComponentPanel />
      <CodePanel />
    </StoryPage>
  ),
};

export const StatusThemes: Story = {
  render: () => (
    <StoryPage
      title="Status themes"
      description="Each status theme carries its own hue and saturation, and tuning one leaves every other token untouched. The saturation sliders appear only with pastel off: pastel is a single flat chroma ceiling with the palette seed pinned to the top of it, so a per-theme scale underneath it would be arguing with the mode."
    >
      <Panel>
        <StatusControls />
        <Row>
          <ResetButton />
        </Row>
      </Panel>
      <StatusPanels />
    </StoryPage>
  ),
};

export const ContrastLevel: Story = {
  render: () => (
    <StoryPage
      title="Contrast level"
      description="Contrast is a two-tier switch: normal colors plus a separate high-contrast set. The level puts the normal tier on a 0–100 slider without touching the other one, so the two compose — and level 0 is the shipped palette, tier included."
    >
      <Panel>
        <ContrastControls />
        <Row>
          <ResetButton />
        </Row>
      </Panel>
      <TextRamp />
      <NeutralRamp />
    </StoryPage>
  ),
};

export const ThemeBuilder: Story = {
  render: () => <ThemeBuilderPage />,
};
