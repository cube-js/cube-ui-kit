import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  DEFAULT_PALETTE_CONFIG,
  getPaletteConfigInput,
  getPaletteTokens,
  HueSlider,
  PrismCode,
  renderColorTokens,
  resetPaletteConfig,
  Slider,
  Switch,
  tasty,
  usePaletteConfig,
  usePaletteVersion,
} from '../index';

import type { Meta, StoryObj } from '@storybook/react-vite';
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
// Region previews
// ============================================================================

const PreviewGrid = tasty({
  styles: {
    display: 'grid',
    gridColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '3x',
  },
});

/**
 * A self-contained theme, painted inside whatever scheme the page is using.
 *
 * The whole trick is `tokens`: `renderColorTokens()` collapses the palette to one
 * scheme's literal values, and applying them here overrides the inherited custom
 * properties for this subtree only. Everything below — including real components
 * — re-colors, with no scheme attribute and no second `<Root>`.
 */
const PreviewRegion = tasty({
  styles: {
    display: 'grid',
    gap: '2x',
    padding: '3x',
    radius: '1cr',
    border: '1bw #border',
    fill: '#surface',
    color: '#surface-text',
    shadow: '$card-shadow',
  },
});

const PreviewLabel = tasty({
  as: 'strong',
  styles: { preset: 't3m', color: '#surface-text' },
});

const Chip = tasty({
  styles: {
    padding: '.5x 1.5x',
    radius: '1r',
    preset: 't4m',
    width: 'max-content',
  },
});

function PreviewCard({
  label,
  options,
}: {
  label: string;
  options: RenderPaletteOptions;
}) {
  // Re-render when the live config moves: `renderColorTokens` merges over it, so
  // these previews track the tuner above.
  const version = usePaletteVersion();

  // Resolving a palette is not free (~4 ms), and `options` is a stable module
  // constant, so memoize on it plus the config version.
  const tokens = useMemo(() => renderColorTokens(options), [options, version]);

  return (
    <PreviewRegion tokens={tokens}>
      <PreviewLabel>{label}</PreviewLabel>
      <Token>
        {options.scheme ?? 'light'}
        {options.highContrast ? ' + high contrast' : ''}
        {options.contrastLevel !== undefined
          ? ` · level ${options.contrastLevel}`
          : ''}
      </Token>
      <Row>
        <Chip
          styles={{ fill: '#accent-surface', color: '#accent-surface-text' }}
        >
          Accent
        </Chip>
        <Chip
          styles={{ fill: '#success-surface', color: '#success-surface-text' }}
        >
          Success
        </Chip>
        <Chip
          styles={{ fill: '#danger-surface', color: '#danger-surface-text' }}
        >
          Danger
        </Chip>
      </Row>
      <Section styles={{ gap: '.5x' }}>
        <SwatchLabel styles={{ color: '#surface-text' }}>
          Body copy on #surface
        </SwatchLabel>
        <SwatchLabel styles={{ color: '#surface-text-soft', preset: 't4' }}>
          Secondary copy
        </SwatchLabel>
        <SwatchLabel styles={{ color: '#surface-text-soft-2', preset: 't4' }}>
          Captions — the token contrast moves most
        </SwatchLabel>
      </Section>
      <Row>
        <Button type="primary" size="small">
          Primary
        </Button>
        <Button type="outline" size="small">
          Outline
        </Button>
      </Row>
    </PreviewRegion>
  );
}

const PREVIEW_SCHEMES = ['light', 'dark'] as const;

/**
 * Contrast control for the previews, held in local state rather than the palette
 * config — the point is that a region can carry its own contrast level.
 */
function PreviewContrastControls({
  value,
  onChange,
}: {
  value: number | 'auto';
  onChange: (value: number | 'auto') => void;
}) {
  const isManual = value !== 'auto';

  return (
    <Controls>
      <Switch
        isSelected={isManual}
        onChange={(manual) => onChange(manual ? MANUAL_CONTRAST_START : 'auto')}
      >
        Manual contrast level
      </Switch>
      <Slider
        label={`Preview contrast level — ${isManual ? value : 'auto'}`}
        minValue={0}
        maxValue={100}
        isDisabled={!isManual}
        value={isManual ? value : MANUAL_CONTRAST_START}
        onChange={onChange}
      />
    </Controls>
  );
}

const CANDIDATE_PREVIEWS: { label: string; options: RenderPaletteOptions }[] = [
  { label: 'Cube purple', options: { hue: 280.3 } },
  { label: 'Ocean', options: { hue: 235, saturation: 70 } },
  { label: 'Forest', options: { hue: 150, saturation: 65 } },
  { label: 'Ember', options: { hue: 35, saturation: 85 } },
  {
    label: 'Pastel ocean',
    options: { hue: 235, saturation: 70, pastel: true },
  },
];

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

function RegionPreviewPage() {
  // Preview-local, deliberately: driving it through `setPaletteConfig` would
  // re-contrast the whole page instead of just the two cards.
  const [contrastLevel, setContrastLevel] = useState<number | 'auto'>('auto');

  return (
    <StoryPage
      title="Region preview"
      description={
        <>
          Every card below is a live theme rendered into a single region,
          applied through a tasty <Token>tokens</Token> prop. Each one paints
          its own scheme regardless of what the page around it is doing — flip
          the toolbar dark-mode switch and the two scheme cards stay put.
        </>
      }
    >
      <Section>
        <SectionHeading>Previews track the live config</SectionHeading>
        <Lead>
          Every preview below merges over the live config, so tuning the brand
          here moves them all — except the candidates that pin their own hue,
          which stay where they are.
        </Lead>
        <Panel>
          <BrandControls />
          <Row>
            <ResetButton />
          </Row>
        </Panel>
      </Section>

      <Section>
        <SectionHeading>One config, both schemes — on one page</SectionHeading>
        <Lead>
          <Token>getPaletteTokens()</Token> emits state maps, so a document can
          only ever show one scheme at a time.{' '}
          <Token>renderColorTokens()</Token> collapses the palette to a chosen
          scheme&apos;s literal values instead, which is what lets both coexist
          here.
        </Lead>
        <Lead>
          The contrast level applies to these two previews only — the page
          around them keeps its own. At <Token>auto</Token> they show the normal
          tier; drag to 100 and they become the high-contrast one, bit for bit,
          which is why a separate pair of high-contrast cards is not needed.
        </Lead>
        <Panel>
          <PreviewContrastControls
            value={contrastLevel}
            onChange={setContrastLevel}
          />
        </Panel>
        <PreviewGrid>
          {PREVIEW_SCHEMES.map((scheme) => (
            <PreviewCard
              key={scheme}
              label={scheme === 'light' ? 'Light' : 'Dark'}
              options={{ scheme, contrastLevel }}
            />
          ))}
        </PreviewGrid>
      </Section>

      <Section>
        <SectionHeading>Candidate themes — a theme picker</SectionHeading>
        <Lead>
          These previews pass their own seeds, so they show a palette the app is
          not running. Nothing here touches the live theme — the page keeps its
          own colors while you shop.
        </Lead>
        <PreviewGrid>
          {CANDIDATE_PREVIEWS.map((preview) => (
            <PreviewCard key={preview.label} {...preview} />
          ))}
        </PreviewGrid>
      </Section>
    </StoryPage>
  );
}

export const RegionPreview: Story = {
  render: () => <RegionPreviewPage />,
};
