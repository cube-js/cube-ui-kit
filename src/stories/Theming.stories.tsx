import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Button,
  CubeLogo,
  DEFAULT_PALETTE_CONFIG,
  getPaletteConfigInput,
  getPaletteTokens,
  HueSlider,
  ItemButton,
  PrismCode,
  Radio,
  RadioGroup,
  renderColorTokens,
  resetPaletteConfig,
  Slider,
  Switch,
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

function ColorSwatch({
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

function BrandControls() {
  const [palette, setPalette] = usePaletteConfig();

  // `baseHue` follows the accent hue until something sets it, so the two sliders
  // move together at first. Only the *sparse* config knows the difference between
  // "explicitly 280.3" and "280.3 because it inherits", so read it from there and
  // say which one this is — otherwise inheritance looks like a stuck control.
  const basePinned = getPaletteConfigInput().baseHue !== undefined;

  return (
    <Controls>
      <HueSlider
        label={`Accent hue — ${palette.hue}°`}
        value={Math.round(palette.hue)}
        onChange={(hue) => setPalette({ hue })}
      />
      <Section>
        <HueSlider
          label={`Base hue — ${palette.baseHue}°${
            basePinned ? '' : ' (inherited)'
          }`}
          value={Math.round(palette.baseHue)}
          onChange={(baseHue) => setPalette({ baseHue })}
        />
        <Switch
          isSelected={!basePinned}
          onChange={(link) =>
            // Clearing the field is what re-links it: an explicit `undefined`
            // means "inherit again", where omitting it would mean "keep 60".
            setPalette({ baseHue: link ? undefined : palette.baseHue })
          }
        >
          Follow the accent hue
        </Switch>
      </Section>
      <Slider
        label={`Saturation — ${palette.saturation}`}
        minValue={0}
        maxValue={100}
        value={palette.saturation}
        onChange={(saturation) => setPalette({ saturation })}
      />
      <Switch
        isSelected={palette.pastel}
        onChange={(pastel) => setPalette({ pastel })}
      >
        Pastel
      </Switch>
    </Controls>
  );
}

type StatusThemeName = Exclude<PaletteThemeName, 'code'>;

const STATUS_THEMES = ['success', 'danger', 'warning', 'note'] as const;

/** Patch one status theme's seed without naming the other three. */
function statusSeed(
  name: StatusThemeName,
  seed: PaletteThemeSeed,
): PaletteConfig {
  const themes: Partial<Record<StatusThemeName, PaletteThemeSeed>> = {
    [name]: seed,
  };

  return { themes };
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
            setPalette({
              contrastLevel: manual ? MANUAL_CONTRAST_START : 'auto',
            })
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
          onChange={(contrastLevel) => setPalette({ contrastLevel })}
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
        <ColorSwatch
          label="surface"
          fill="#surface"
          color="#surface-text"
          border="#border"
        />
        <ColorSwatch
          label="surface-2"
          fill="#surface-2"
          color="#surface-2-text"
        />
        <ColorSwatch
          label="surface-3"
          fill="#surface-3"
          color="#surface-3-text"
        />
        <ColorSwatch
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
        <ColorSwatch
          label="accent-surface"
          fill="#accent-surface"
          color="#accent-surface-text"
        />
        <ColorSwatch
          label="accent-surface-hover"
          fill="#accent-surface-hover"
          color="#accent-surface-text"
        />
        <ColorSwatch
          label="accent-surface-2"
          fill="#accent-surface-2"
          color="#accent-surface-text"
        />
        <ColorSwatch
          label="accent-surface-3"
          fill="#accent-surface-3"
          color="#accent-surface-text"
        />
        <ColorSwatch
          label="primary-surface"
          fill="#primary-surface"
          color="#primary-surface-text"
        />
        <ColorSwatch
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
            <ColorSwatch
              label={`${name}-surface`}
              fill={`#${name}-surface`}
              color={`#${name}-surface-text`}
            />
            <ColorSwatch
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

type SchemeChoice = 'auto' | 'light' | 'dark';
type ContrastChoice = 'auto' | 'normal' | 'high' | 'custom';

/**
 * What `auto` resolves to right now.
 *
 * A region preview needs a **concrete** variant: `renderColorTokens()` returns
 * flat literal values, and a literal cannot express "follow the OS". The document
 * resolves its own scheme from a `<html>` attribute with a media-query fallback
 * (see `Root`), so read the same two sources and re-render when either moves.
 */
function useAmbientFlag(attribute: string, onValue: string, query: string) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia(query);
    const read = () => {
      const attr = root.getAttribute(`data-${attribute}`);

      setEnabled(attr ? attr === onValue : media.matches);
    };

    read();
    media.addEventListener('change', read);

    const observer = new MutationObserver(read);

    observer.observe(root, {
      attributes: true,
      attributeFilter: [`data-${attribute}`],
    });

    return () => {
      media.removeEventListener('change', read);
      observer.disconnect();
    };
  }, [attribute, onValue, query]);

  return enabled;
}

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

/** Quick-apply seeds, so the builder opens on something other than a blank slate. */
const THEME_PRESETS: { label: string; config: PaletteConfig }[] = [
  { label: 'Cube', config: { hue: 280.3, saturation: 80, pastel: false } },
  { label: 'Ocean', config: { hue: 235, saturation: 70, pastel: false } },
  { label: 'Forest', config: { hue: 150, saturation: 65, pastel: false } },
  { label: 'Ember', config: { hue: 35, saturation: 85, pastel: false } },
  { label: 'Slate', config: { hue: 250, baseHue: 250, saturation: 30 } },
];

function ThemeBuilderControls({
  scheme,
  onSchemeChange,
  contrast,
  onContrastChange,
  customLevel,
  onCustomLevelChange,
}: {
  scheme: SchemeChoice;
  onSchemeChange: (value: SchemeChoice) => void;
  contrast: ContrastChoice;
  onContrastChange: (value: ContrastChoice) => void;
  customLevel: number;
  onCustomLevelChange: (value: number) => void;
}) {
  const [palette, setPalette] = usePaletteConfig();
  const basePinned = getPaletteConfigInput().baseHue !== undefined;

  return (
    <ControlColumn>
      <ControlGroup>
        <GroupLabel>Preview mode</GroupLabel>
        <Note>
          Applies to the preview only — the page around it keeps its own.
        </Note>
        <RadioGroup
          label="Color scheme"
          type="tabs"
          value={scheme}
          onChange={(value) => onSchemeChange(value as SchemeChoice)}
        >
          <Radio value="auto">Auto</Radio>
          <Radio value="light">Light</Radio>
          <Radio value="dark">Dark</Radio>
        </RadioGroup>
        <RadioGroup
          label="Contrast"
          type="tabs"
          value={contrast}
          onChange={(value) => onContrastChange(value as ContrastChoice)}
        >
          <Radio value="auto">Auto</Radio>
          <Radio value="normal">Normal</Radio>
          <Radio value="high">High</Radio>
          <Radio value="custom">Custom</Radio>
        </RadioGroup>
        {contrast === 'custom' ? (
          <Slider
            label={`Contrast level — ${customLevel}`}
            minValue={0}
            maxValue={100}
            value={customLevel}
            onChange={onCustomLevelChange}
          />
        ) : null}
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
                resetPaletteConfig();
                setPalette(preset.config);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Row>
      </ControlGroup>

      <ControlGroup>
        <GroupLabel>Brand</GroupLabel>
        <HueSlider
          label={`Accent hue — ${palette.hue}°`}
          value={Math.round(palette.hue)}
          onChange={(hue) => setPalette({ hue })}
        />
        <HueSlider
          label={`Base hue — ${palette.baseHue}°${
            basePinned ? '' : ' (inherited)'
          }`}
          value={Math.round(palette.baseHue)}
          onChange={(baseHue) => setPalette({ baseHue })}
        />
        <Switch
          isSelected={!basePinned}
          onChange={(link) =>
            setPalette({ baseHue: link ? undefined : palette.baseHue })
          }
        >
          Base follows accent
        </Switch>
        <Slider
          label={`Saturation — ${palette.saturation}`}
          minValue={0}
          maxValue={100}
          value={palette.saturation}
          onChange={(saturation) => setPalette({ saturation })}
        />
        <Switch
          isSelected={palette.pastel}
          onChange={(pastel) => setPalette({ pastel })}
        >
          Pastel
        </Switch>
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
            setPalette({ themes: { code: { saturation } } })
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

const Link = tasty({
  as: 'span',
  styles: { preset: 't3m', color: '#accent-text' },
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

const BUTTON_THEMES = [
  'default',
  'danger',
  'success',
  'warning',
  'note',
  'special',
] as const;

const PREVIEW_NAV = [
  'Quarterly Revenue',
  'Active Users',
  'Conversion Funnel',
  'Retention',
];

function ThemePreview({ tokens }: { tokens: Tokens }) {
  const [tab, setTab] = useState(PREVIEW_TABS[0]);

  return (
    <PreviewShell tokens={tokens}>
      <PreviewHeader>
        {/* The mark's own light/dark artwork is swapped by the `@dark` state, which
            follows the *document* — a state-keyed style cannot be overridden by
            tokens. Its colour does follow the preview, since that is a token. */}
        <CubeLogo size="3x" color="#accent-surface" />
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
              type="tabs"
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
  const [scheme, setScheme] = useState<SchemeChoice>('auto');
  const [contrast, setContrast] = useState<ContrastChoice>('auto');
  const [customLevel, setCustomLevel] = useState(MANUAL_CONTRAST_START);
  const version = usePaletteVersion();

  const ambientDark = useAmbientFlag(
    'schema',
    'dark',
    '(prefers-color-scheme: dark)',
  );
  const ambientHighContrast = useAmbientFlag(
    'contrast',
    'high',
    '(prefers-contrast: more)',
  );

  const resolvedScheme =
    scheme === 'auto' ? (ambientDark ? 'dark' : 'light') : scheme;
  const isCustom = contrast === 'custom';
  const resolvedHighContrast =
    contrast === 'auto' ? ambientHighContrast : contrast === 'high';

  // Name only the axes that are actually on `auto`, so the note cannot claim the
  // scheme was inherited when it was picked explicitly.
  const autoAxes = [
    scheme === 'auto' ? 'scheme' : null,
    contrast === 'auto' ? 'contrast' : null,
  ].filter(Boolean);

  const contrastLabel = isCustom
    ? `contrast level ${customLevel}`
    : resolvedHighContrast
      ? 'high contrast'
      : 'normal contrast';

  // A manual level carries the contrast preference itself, so there is no separate
  // high-contrast tier to ask for — `highContrast` is meaningless alongside it.
  const tokens = useMemo(
    () =>
      renderColorTokens(
        isCustom
          ? { scheme: resolvedScheme, contrastLevel: customLevel }
          : {
              scheme: resolvedScheme,
              highContrast: resolvedHighContrast,
              contrastLevel: 'auto',
            },
      ),
    [isCustom, customLevel, resolvedScheme, resolvedHighContrast, version],
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
        Showing <strong>{resolvedScheme}</strong> ·{' '}
        <strong>{contrastLabel}</strong>
        {autoAxes.length > 0
          ? ` — ${autoAxes.join(' and ')} resolved from the document, since a flat` +
            ' token value cannot mean “follow the OS”.'
          : ''}
      </Note>
      <BuilderLayout>
        <ThemeBuilderControls
          scheme={scheme}
          onSchemeChange={setScheme}
          contrast={contrast}
          onContrastChange={setContrast}
          customLevel={customLevel}
          onCustomLevelChange={setCustomLevel}
        />
        <ThemePreview tokens={tokens} />
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
