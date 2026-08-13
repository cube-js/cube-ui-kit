import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Button,
  Checkbox,
  ColorInput,
  ColorSwatch,
  CubeLogo,
  DEFAULT_PALETTE_CONFIG,
  getPaletteConfigInput,
  getPaletteTokens,
  HueSlider,
  ItemButton,
  Link,
  PrismCode,
  Radio,
  RadioGroup,
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
import type { Tokens } from '@tenphi/tasty';
import type { ReactNode } from 'react';
import type {
  PaletteConfig,
  PaletteThemeName,
  PaletteThemeSeed,
  RenderPaletteOptions,
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

const Token = tasty({
  as: 'code',
  styles: { preset: 's4', opacity: 0.75, wordBreak: 'break-all' },
});

const Note = tasty({
  as: 'p',
  styles: { margin: 0, preset: 't4', color: '#surface-text-soft-2' },
});

const Warning = tasty({
  styles: {
    padding: '1.5x 2x',
    radius: '1r',
    fill: '#note-surface',
    color: '#note-surface-text',
    // The tinted surface alone is nearly invisible against `#surface-2` in the
    // dark scheme; the themed border is what makes this read as a callout.
    border: '1bw #note-border',
    preset: 't4',
  },
});

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

/** True while the palette still emits a separate high-contrast tier. */
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
  return (
    <Button type="outline" onPress={resetPaletteConfig}>
      Reset to defaults
    </Button>
  );
}

/**
 * What was asked for, next to what the palette landed on.
 *
 * A color seed is a REQUEST, and two things can stop it arriving. Pastel caps chroma,
 * so a saturated brand can never resolve to itself under it — `#FFD400` softens to
 * `#e4d8ad`. And on a light page a light brand has to darken to clear the fill's 3:1
 * floor. Both are correct; both look like a bug if the only thing on screen is the
 * color you typed. Showing the pair makes them a visible cap instead.
 *
 * `#accent-text` is here as well as `#accent-surface` because the tone reaches both —
 * the seed sets the button fill and the link color together, which is the part that is
 * hard to believe without seeing it.
 */
function ColorResolution({ resolved }: { resolved?: Tokens }) {
  usePaletteVersion();

  const [palette] = usePaletteConfig();
  const requested = getPaletteConfigInput().accentColor;

  if (!requested) return null;

  // The preview's own tokens when there are any, so the chip answers "what did I get in
  // the variant I am looking at". `resolvedValue` only ever reports the document's
  // light scheme, which is the wrong answer inside a dark preview.
  const valueOf = (name: string) =>
    (resolved?.[name] as string | undefined) ?? resolvedValue(name);

  return (
    <Section styles={{ gap: '1x' }}>
      <Row>
        {[
          { label: 'Requested', color: requested },
          { label: 'Fill', color: valueOf('#accent-surface') },
          { label: 'Link', color: valueOf('#accent-text') },
        ].map(({ label, color }) => (
          <Row key={label} styles={{ gap: '.75x' }}>
            {/* The chip carries no text of its own, so an arbitrary requested
                color cannot land unreadable on itself. */}
            <ColorSwatch
              color={color}
              styles={{ width: '3x', height: '3x', radius: '.5r' }}
            />
            <Token>{label}</Token>
          </Row>
        ))}
      </Row>
      {palette.pastel ? (
        <Warning>
          Pastel caps chroma, so this color cannot render exactly — the palette
          takes its hue and its tone and finds the nearest color inside the
          ceiling. Turn Pastel off to land on it.
        </Warning>
      ) : null}
    </Section>
  );
}

/**
 * Where color mode starts when you switch a zone into it.
 *
 * A hex rather than the live `#accent-surface`, for the same reason
 * {@link MANUAL_CONTRAST_START} is `0`: flipping the mode should change which control
 * is in charge, not repaint the page on the way.
 */
const ACCENT_COLOR_START = '#7a4dbf';
const BASE_COLOR_START = '#6e7076';

/**
 * Which control owns a zone right now, read off the SPARSE config.
 *
 * Deriving it rather than keeping it in `useState` is what makes a preset able to flip
 * the mode switch for free — and what stops the two from ever disagreeing. It is the
 * same trick the base-hue label already used to say "(inherited)": only the sparse
 * config knows the difference between a value that was chosen and one that was
 * inherited or derived.
 */
type SeedMode = 'hue' | 'color';

function useAccentMode(): SeedMode {
  usePaletteVersion();

  return getPaletteConfigInput().accentColor !== undefined ? 'color' : 'hue';
}

/**
 * A control is disabled exactly when the config field it writes is not the field in
 * charge. That one rule covers every inert control on this page: a hue slider under a
 * color seed, and the saturation slider under pastel.
 *
 * Disabled and still on screen, never hidden. A hue slider that vanished would take
 * the derived hue with it — and the derived hue is the whole point, since seeing the
 * same slider you drag by hand move on its own is what makes the two ways of seeding a
 * zone legible as two ways of doing one thing.
 */
function AccentSourceControls({ resolved }: { resolved?: Tokens }) {
  const [palette, setPalette] = usePaletteConfig();
  const input = getPaletteConfigInput();
  const mode = useAccentMode();

  return (
    <Section>
      <RadioGroup
        label="Accent seeded by"
        type="button"
        value={mode}
        onChange={(next) =>
          setPalette(({ accentColor, hue, ...config }) =>
            next === 'color'
              ? { ...config, accentColor: ACCENT_COLOR_START }
              : // Hand the slider the hue the color derived, so the value it was
                // *showing* is the value it now owns.
                { ...config, hue: Math.round(palette.hue) },
          )
        }
      >
        <Radio value="hue">Hue</Radio>
        <Radio value="color">Color</Radio>
      </RadioGroup>
      {mode === 'color' ? (
        <ColorInput
          label="Accent color"
          size="small"
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
      ) : null}
      <HueSlider
        label={`Accent hue — ${Math.round(palette.hue)}°${
          mode === 'color' ? ' (from the color)' : ''
        }`}
        isDisabled={mode === 'color'}
        value={Math.round(palette.hue)}
        onChange={(hue) => setPalette((config) => ({ ...config, hue }))}
      />
      {mode === 'color' ? <ColorResolution resolved={resolved} /> : null}
    </Section>
  );
}

function BaseSourceControls() {
  const [palette, setPalette] = usePaletteConfig();
  const input = getPaletteConfigInput();

  // Three states, not two: the base zone can follow the accent, carry its own hue, or
  // be seeded by a color. `baseHue` follows the accent hue until something sets it, so
  // without the first state inheritance would read as a stuck control.
  const mode: SeedMode | 'accent' =
    input.baseColor !== undefined
      ? 'color'
      : input.baseHue !== undefined
        ? 'hue'
        : 'accent';

  return (
    <Section>
      <RadioGroup
        label="Base seeded by"
        type="button"
        value={mode}
        onChange={(next) =>
          setPalette(({ baseColor, baseHue, ...config }) => {
            if (next === 'color') {
              return { ...config, baseColor: BASE_COLOR_START };
            }

            // Dropping both fields is what re-links the zone: an absent `baseHue`
            // means "inherit again", where keeping it would mean "stay at 60".
            return next === 'accent'
              ? config
              : { ...config, baseHue: Math.round(palette.baseHue) };
          })
        }
      >
        <Radio value="accent">Follow accent</Radio>
        <Radio value="hue">Hue</Radio>
        <Radio value="color">Color</Radio>
      </RadioGroup>
      {mode === 'color' ? (
        <>
          <ColorInput
            label="Base color"
            size="small"
            value={input.baseColor ?? null}
            onChange={(baseColor) =>
              setPalette(({ baseColor: previous, ...config }) =>
                baseColor
                  ? { ...config, baseColor }
                  : { ...config, baseHue: Math.round(palette.baseHue) },
              )
            }
          />
          <Note>
            Only the hue is taken. A base color&rsquo;s chroma and lightness are
            discarded — the chrome&rsquo;s own lightness ladder and its
            0.10–0.20 saturation factors are the design.
          </Note>
        </>
      ) : null}
      <HueSlider
        label={`Base hue — ${Math.round(palette.baseHue)}°${
          mode === 'accent'
            ? ' (inherited)'
            : mode === 'color'
              ? ' (from the color)'
              : ''
        }`}
        // Left enabled while it inherits: dragging pins `baseHue`, which flips the
        // radio to Hue on its own, and that drag-to-pin affordance predates the radio.
        isDisabled={mode === 'color'}
        value={Math.round(palette.baseHue)}
        onChange={(baseHue) => setPalette((config) => ({ ...config, baseHue }))}
      />
    </Section>
  );
}

function SaturationControls() {
  const [palette, setPalette] = usePaletteConfig();

  return (
    <Section>
      {/* Above the slider it governs — see the rule on `AccentSourceControls`. */}
      <Switch
        isSelected={palette.pastel}
        onChange={(pastel) => setPalette((config) => ({ ...config, pastel }))}
      >
        Pastel
      </Switch>
      <Slider
        label={`Saturation — ${palette.saturation}${
          palette.pastel ? ' (pinned by pastel)' : ''
        }`}
        minValue={0}
        maxValue={100}
        isDisabled={palette.pastel}
        value={palette.saturation}
        onChange={(saturation) =>
          setPalette((config) => ({ ...config, saturation }))
        }
      />
      {palette.pastel ? (
        <Note>
          Pastel pins saturation at 100. The flat, hue-independent chroma
          ceiling is what makes it even across hues, and a second scale on top
          of it would only undo that. Turn pastel off for a free 0–100 scale.
        </Note>
      ) : (
        <Note>
          Independent of the accent color: the brand family carries its own
          chroma, so a color seed no longer moves this — and cannot wash the
          neutral chrome or the status themes along with it.
        </Note>
      )}
    </Section>
  );
}

function BrandControls() {
  return (
    <Controls>
      <AccentSourceControls />
      <BaseSourceControls />
      <SaturationControls />
    </Controls>
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
              label={`${name} hue — ${seed.hue}°`}
              value={Math.round(seed.hue)}
              onChange={(hue) => setPalette(statusSeed(name, { hue }))}
            />
            <Slider
              label={`${name} saturation — ${seed.saturation}`}
              minValue={0}
              maxValue={100}
              value={seed.saturation}
              onChange={(saturation) =>
                setPalette(statusSeed(name, { saturation }))
              }
            />
          </Section>
        );
      })}
    </Controls>
  );
}

/** Where the slider lands when you leave `'auto'`. See the comment below. */
const MANUAL_CONTRAST_START = 0;

function ContrastControls() {
  const [palette, setPalette] = usePaletteConfig();
  const isManual = palette.contrastLevel !== 'auto';

  return (
    <Section>
      <Controls>
        <Switch
          isSelected={isManual}
          onChange={(manual) =>
            // Enter manual mode at 0, not mid-slider: level 0 reproduces the
            // normal palette bit for bit, so the only thing flipping the switch
            // changes is that the high-contrast tier goes away. Starting at 50
            // would recolor the page and hide which of the two effects you got.
            setPalette((config) => ({
              ...config,
              contrastLevel: manual ? MANUAL_CONTRAST_START : 'auto',
            }))
          }
        >
          Manual contrast level
        </Switch>
        <Slider
          label={`Contrast level — ${isManual ? palette.contrastLevel : 'auto'}`}
          minValue={0}
          maxValue={100}
          isDisabled={!isManual}
          value={
            isManual ? (palette.contrastLevel as number) : MANUAL_CONTRAST_START
          }
          onChange={(contrastLevel) =>
            setPalette((config) => ({ ...config, contrastLevel }))
          }
        />
      </Controls>
      {hasContrastTier() ? (
        <Note>
          High-contrast tier active. <Token>data-contrast="high"</Token> on{' '}
          <Token>html</Token>, or a <Token>prefers-contrast: more</Token>{' '}
          preference, switches every token to its high-contrast variant.
        </Note>
      ) : (
        <Warning>
          High-contrast tier disabled. A manual level already carries the
          contrast preference, so no separate high-contrast variant is emitted —{' '}
          <strong>
            data-contrast=&quot;high&quot; and prefers-contrast: more have no
            effect at this setting.
          </strong>{' '}
          Level 0 reproduces the normal palette and 100 the high-contrast one,
          bit for bit.
        </Warning>
      )}
    </Section>
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
        <Button type="outline">Outline</Button>
        <Button type="clear">Clear</Button>
        <Button type="link">Link</Button>
        <Button type="primary" isDisabled>
          Disabled
        </Button>
        <Button type="primary" theme="danger">
          Danger
        </Button>
        <Button type="outline" theme="success">
          Success
        </Button>
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
 * *preference* ("follow the OS"), and a flat token value cannot express one. Only
 * the contrast *level* keeps an `auto`, because there the choice is between the
 * two-tier model and a hand-set number.
 */
type SchemeChoice = 'light' | 'dark';
/** Whether the level is derived from the two-tier model or set by hand. */
type LevelMode = 'auto' | 'custom';
/** Which tier to show, while the level is `auto`. */
type ContrastMode = 'normal' | 'high';

// ----------------------------------------------------------------------------
// Controls
// ----------------------------------------------------------------------------

const ControlColumn = tasty({
  styles: {
    display: 'grid',
    gap: '3x',
    alignContent: 'start',
    padding: '3x',
    radius: '1cr',
    fill: '#surface-2',
    border: '1bw #border',
    height: 'max-content',
  },
});

const ControlGroup = tasty({
  styles: { display: 'grid', gap: '1.5x' },
});

const GroupLabel = tasty({
  as: 'strong',
  styles: { preset: 't4m', color: '#surface-text-soft' },
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
 * `Cobalt` is the odd one out, and deliberately so: it departs on the *mechanism*
 * rather than on the numbers, seeding both zones from real colors instead of hues.
 * Its `pastel: false` is not a chroma preference but a precondition — the pastel
 * ceiling cannot reproduce an arbitrary color, so a preset whose point is "the color
 * you asked for" has to have it off to make the point.
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
  {
    // The one preset seeded by a COLOR rather than a hue, and the way into that half
    // of the API.
    label: 'Cobalt',
    config: {
      accentColor: '#2F5BFF',
      // Hue only — and a near-neutral color makes that legible: 9% saturation and a
      // mid tone are both thrown away, and only the ~71° reaches the chrome. Against
      // a ~266° brand that is a warm grey UI under a cool blue accent, which is the
      // case `baseHue` was split out for in the first place.
      baseColor: '#7A7269',
      // Pinned off, because this preset's whole claim is that you get the color you
      // asked for. Under pastel the flat ceiling caps `#2F5BFF` well short of itself
      // — turn Pastel on afterwards and the requested/resolved chips separate, which
      // is the cap made visible rather than a rounding error.
      pastel: false,
      // Borrowed from `Ocean`: the derived hue lands in the same blue family, and the
      // closest of the four still sits 48.8° off it.
      themes: {
        success: { hue: 165 },
        danger: { hue: 25 },
        warning: { hue: 80 },
        note: { hue: 315 },
      },
    },
  },
];

function ThemeBuilderControls({
  scheme,
  onSchemeChange,
  levelMode,
  onLevelModeChange,
  contrastMode,
  onContrastModeChange,
  customLevel,
  onCustomLevelChange,
  tokens,
}: {
  scheme: SchemeChoice;
  onSchemeChange: (value: SchemeChoice) => void;
  levelMode: LevelMode;
  onLevelModeChange: (value: LevelMode) => void;
  contrastMode: ContrastMode;
  onContrastModeChange: (value: ContrastMode) => void;
  customLevel: number;
  onCustomLevelChange: (value: number) => void;
  /** The variant on screen, so the resolved chips report it rather than the document. */
  tokens: Tokens;
}) {
  const [palette, setPalette] = usePaletteConfig();

  return (
    <ControlColumn>
      <ControlGroup>
        <GroupLabel>Preview mode</GroupLabel>
        <Note>
          Applies to the preview only — the page around it keeps its own.
        </Note>
        <RadioGroup
          label="Color scheme"
          type="button"
          value={scheme}
          onChange={(value) => onSchemeChange(value as SchemeChoice)}
        >
          <Radio value="light">Light</Radio>
          <Radio value="dark">Dark</Radio>
        </RadioGroup>
        <RadioGroup
          label="Contrast level"
          type="button"
          value={levelMode}
          onChange={(value) => onLevelModeChange(value as LevelMode)}
        >
          <Radio value="auto">Auto</Radio>
          <Radio value="custom">Custom</Radio>
        </RadioGroup>
        {levelMode === 'custom' ? (
          <Slider
            label={`Level — ${customLevel}`}
            minValue={0}
            maxValue={100}
            value={customLevel}
            onChange={onCustomLevelChange}
          />
        ) : (
          // Only meaningful while the level is automatic: a manual level carries
          // the contrast preference itself, leaving no tier to choose between.
          <RadioGroup
            label="Contrast mode"
            type="button"
            value={contrastMode}
            onChange={(value) => onContrastModeChange(value as ContrastMode)}
          >
            <Radio value="normal">Normal</Radio>
            <Radio value="high">High</Radio>
          </RadioGroup>
        )}
      </ControlGroup>

      <ControlGroup>
        <GroupLabel>Presets</GroupLabel>
        <Row>
          {THEME_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="outline"
              size="small"
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
        <GroupLabel>Saturation</GroupLabel>
        <SaturationControls />
      </ControlGroup>

      <ControlGroup>
        <GroupLabel>Status hues</GroupLabel>
        {STATUS_THEMES.map((name) => (
          <HueSlider
            key={name}
            label={`${name} — ${palette.themes[name].hue}°`}
            value={Math.round(palette.themes[name].hue)}
            onChange={(hue) => setPalette(statusSeed(name, { hue }))}
          />
        ))}
      </ControlGroup>

      <ControlGroup>
        <GroupLabel>Syntax</GroupLabel>
        <Note>Hues are fixed; only saturation is tunable.</Note>
        <Slider
          label={`Code saturation — ${palette.themes.code.saturation}`}
          minValue={0}
          maxValue={100}
          value={palette.themes.code.saturation}
          onChange={(saturation) =>
            setPalette((config) => ({
              ...config,
              themes: { ...config.themes, code: { saturation } },
            }))
          }
        />
      </ControlGroup>

      <Row>
        <ResetButton />
      </Row>
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
      '@media(width >= 1100px)': 'minmax(280px, 340px) 1fr',
    },
    gap: '4x',
    alignItems: 'start',
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
          <Button type="outline" size="small">
            Share
          </Button>
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
  const [scheme, setScheme] = useState<SchemeChoice>('light');
  const [levelMode, setLevelMode] = useState<LevelMode>('auto');
  const [contrastMode, setContrastMode] = useState<ContrastMode>('normal');
  const [customLevel, setCustomLevel] = useState(MANUAL_CONTRAST_START);
  const version = usePaletteVersion();

  const isCustom = levelMode === 'custom';
  const isHighContrast = contrastMode === 'high';

  const contrastLabel = isCustom
    ? `contrast level ${customLevel}`
    : isHighContrast
      ? 'high contrast'
      : 'normal contrast';

  // A manual level carries the contrast preference itself, so there is no separate
  // high-contrast tier to ask for — `highContrast` is meaningless alongside it.
  const tokens = useMemo(
    () =>
      renderColorTokens(
        isCustom
          ? { scheme, contrastLevel: customLevel }
          : { scheme, highContrast: isHighContrast, contrastLevel: 'auto' },
      ),
    [isCustom, customLevel, scheme, isHighContrast, version],
  );

  return (
    <StoryPage
      title="Theme builder"
      description={
        <>
          Every control on the left writes to the live palette config; the panel
          on the right renders it into a single region through a tasty{' '}
          <Token>tokens</Token> prop. Pick a scheme and a contrast mode and the
          preview shows exactly that variant — the page around it does not move.
        </>
      }
    >
      <Note>
        Showing <strong>{scheme}</strong> · <strong>{contrastLabel}</strong>
      </Note>
      <BuilderLayout>
        <ThemeBuilderControls
          scheme={scheme}
          onSchemeChange={setScheme}
          levelMode={levelMode}
          onLevelModeChange={setLevelMode}
          contrastMode={contrastMode}
          onContrastModeChange={setContrastMode}
          customLevel={customLevel}
          onCustomLevelChange={setCustomLevel}
          tokens={tokens}
        />
        <ThemePreview tokens={tokens} scheme={scheme} />
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
      description="Each status theme carries its own hue and saturation. Tuning one leaves every other token untouched."
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
      description="Contrast is a two-tier switch by default: normal colors plus a separate high-contrast set. A manual level replaces both with a single 0–100 slider."
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
