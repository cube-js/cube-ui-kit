import { tasty } from '@tenphi/tasty';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

const Page = tasty({
  styles: {
    display: 'grid',
    gap: '5x',
    padding: '4x',
    fill: '#surface',
    color: '#surface-text',
  },
});

const Section = tasty({
  styles: {
    display: 'grid',
    gap: '2x',
  },
});

const Grid = tasty({
  styles: {
    display: 'grid',
    gridColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '2x',
  },
});

const Sample = tasty({
  styles: {
    display: 'grid',
    gap: '2x',
    padding: '3x',
    radius: '1r',
    alignContent: 'start',
  },
});

const Heading = tasty({
  as: 'h1',
  styles: {
    margin: 0,
    preset: 'h2',
  },
});

const SectionHeading = tasty({
  as: 'h2',
  styles: {
    margin: 0,
    preset: 'h4',
  },
});

const Lead = tasty({
  as: 'p',
  styles: {
    margin: 0,
    preset: 't3',
    color: '#surface-text-soft',
  },
});

const SampleHeading = tasty({
  as: 'strong',
  styles: {
    preset: 't3m',
  },
});

const Token = tasty({
  as: 'code',
  styles: {
    preset: 's4',
    opacity: 0.8,
  },
});

const PairMeta = tasty({
  styles: {
    display: 'grid',
    gap: '.5x',
  },
});

const TextGroup = tasty({
  styles: {
    display: 'grid',
    gap: '1.5x',
  },
});

const TextBlock = tasty({
  styles: {
    display: 'grid',
    gap: '.5x',
  },
});

const TextLabel = tasty({
  as: 'span',
  styles: {
    preset: 't4',
    opacity: 0.65,
  },
});

const UtilitySwatch = tasty({
  styles: {
    display: 'grid',
    gap: '.5x',
    padding: '2x',
    radius: '.5r',
  },
});

const SyntaxSample = tasty({
  as: 'pre',
  styles: {
    display: 'grid',
    gap: '.5x',
    margin: 0,
    padding: '3x',
    fill: '#surface-2',
    border: '1bw solid #border',
    radius: '1r',
    preset: 's3',
    whiteSpace: 'pre-wrap',
  },
});

/** Baked-in presets — body already defaults to `t3`. */
const TextT3m = tasty({
  as: 'span',
  styles: { preset: 't3m' },
});

const TextT3 = tasty({
  as: 'span',
  styles: { preset: 't3' },
});

const TextT4 = tasty({
  as: 'span',
  styles: { preset: 't4' },
});

const TextS3 = tasty({
  as: 'span',
  styles: { preset: 's3' },
});

const PRESETS = [
  ['t3m', TextT3m],
  ['t3', TextT3],
  ['t4', TextT4],
] as const;

type ColorPair = {
  label: string;
  fill: string;
  border?: string;
  shadow?: string;
  /** Meaningful text colors for this fill, strongest → softest. */
  texts: readonly string[];
  note?: string;
};

function PresetSamples({ color }: { color: string }) {
  return (
    <TextBlock styles={{ color }}>
      <TextLabel>{color}</TextLabel>
      {PRESETS.map(([name, Component]) => (
        <Component key={name}>{name} · The quick brown fox</Component>
      ))}
    </TextBlock>
  );
}

function PairCard({
  label,
  fill,
  border,
  shadow,
  texts,
  note,
  children,
}: ColorPair & { children?: ReactNode }) {
  return (
    <Sample
      styles={{
        fill,
        border: border ? `1bw solid ${border}` : undefined,
        shadow,
      }}
    >
      <PairMeta>
        <SampleHeading styles={{ color: texts[0] }}>{label}</SampleHeading>
        <Token styles={{ color: texts[0] }}>
          fill {fill}
          {border ? ` · border ${border}` : ''}
        </Token>
        {note ? (
          <TextLabel styles={{ color: texts[0] }}>{note}</TextLabel>
        ) : null}
      </PairMeta>
      <TextGroup>
        {texts.map((color) => (
          <PresetSamples key={color} color={color} />
        ))}
      </TextGroup>
      {children}
    </Sample>
  );
}

const neutralPairs: ColorPair[] = [
  {
    label: 'Surface',
    fill: '#surface',
    border: '#border',
    texts: ['#surface-text', '#surface-text-soft', '#surface-text-soft-2'],
    note: 'Default page / panel background',
  },
  {
    label: 'Surface 2',
    fill: '#surface-2',
    border: '#border',
    texts: ['#surface-2-text', '#surface-2-text-soft'],
    note: 'Raised / inset secondary surface',
  },
  {
    label: 'Surface 3',
    fill: '#surface-3',
    border: '#border',
    texts: ['#surface-3-text', '#surface-3-text-soft'],
    note: 'Higher elevation / nested panels',
  },
  {
    label: 'Surface 4',
    fill: '#surface-4',
    border: '#border',
    texts: ['#surface-text', '#surface-text-soft'],
    note: 'Deepest neutral fill; uses the general surface text ramp',
  },
];

const semanticSurfacePairs: ColorPair[] = [
  {
    label: 'Primary',
    fill: '#primary-surface',
    border: '#primary-border',
    texts: ['#primary-surface-text'],
  },
  {
    label: 'Success',
    fill: '#success-surface',
    border: '#success-border',
    texts: ['#success-surface-text'],
  },
  {
    label: 'Danger',
    fill: '#danger-surface',
    border: '#danger-border',
    texts: ['#danger-surface-text'],
  },
  {
    label: 'Warning',
    fill: '#warning-surface',
    border: '#warning-border',
    texts: ['#warning-surface-text'],
  },
  {
    label: 'Note',
    fill: '#note-surface',
    border: '#note-border',
    texts: ['#note-surface-text'],
  },
];

/** Notification / Item card pairing: tinted fill + saturated accent text. */
const semanticAccentTextPairs: ColorPair[] = [
  {
    label: 'Primary',
    fill: '#primary-surface',
    border: '#primary-border',
    texts: ['#primary-accent-text', '#primary-accent-text-soft'],
    note: 'Banner / notification style',
  },
  {
    label: 'Success',
    fill: '#success-surface',
    border: '#success-border',
    texts: ['#success-accent-text', '#success-accent-text-soft'],
    note: 'Banner / notification style',
  },
  {
    label: 'Danger',
    fill: '#danger-surface',
    border: '#danger-border',
    texts: ['#danger-accent-text', '#danger-accent-text-soft'],
    note: 'Banner / notification style',
  },
  {
    label: 'Warning',
    fill: '#warning-surface',
    border: '#warning-border',
    texts: ['#warning-accent-text', '#warning-accent-text-soft'],
    note: 'Banner / notification style',
  },
  {
    label: 'Note',
    fill: '#note-surface',
    border: '#note-border',
    texts: ['#note-accent-text', '#note-accent-text-soft'],
    note: 'Banner / notification style',
  },
];

const solidAccentPairs: ColorPair[] = [
  {
    label: 'Primary accent',
    fill: '#primary-accent-surface',
    texts: ['#primary-accent-surface-text'],
    note: 'Solid PRIMARY button / badge fill',
  },
  {
    label: 'Success accent',
    fill: '#success-accent-surface',
    texts: ['#success-accent-surface-text'],
  },
  {
    label: 'Danger accent',
    fill: '#danger-accent-surface',
    texts: ['#danger-accent-surface-text'],
  },
  {
    label: 'Warning accent',
    fill: '#warning-accent-surface',
    texts: ['#warning-accent-surface-text'],
  },
  {
    label: 'Note accent',
    fill: '#note-accent-surface',
    texts: ['#note-accent-surface-text'],
  },
  {
    label: 'Inverse',
    fill: '#surface-inverse',
    texts: ['#white'],
    note: 'Fixed dark surface (tooltips, code chrome)',
  },
  {
    label: 'Special accent',
    fill: '#special-accent-surface',
    texts: ['#special-accent-surface-text'],
    note: 'Fixed special-theme brand fill',
  },
];

const disabledPairs: ColorPair[] = [
  {
    label: 'Neutral disabled',
    fill: '#disabled-surface',
    border: '#border',
    texts: ['#disabled-surface-text'],
    note: 'Outline, secondary, clear, link, and item states',
  },
  {
    label: 'Primary disabled',
    fill: '#primary-accent-disabled-surface',
    texts: ['#primary-accent-disabled-surface-text'],
    note: 'Muted brand fill for solid primary controls',
  },
  {
    label: 'Primary disabled (soft)',
    fill: '#primary-accent-disabled-surface-soft',
    texts: ['#primary-accent-disabled-surface-soft-text'],
    note: 'The neutral disabled pair at brand chroma — the selected disabled state of outline, outline-2 and clear',
  },
  {
    label: 'Success disabled',
    fill: '#success-accent-disabled-surface',
    texts: ['#success-accent-disabled-surface-text'],
  },
  {
    label: 'Danger disabled',
    fill: '#danger-accent-disabled-surface',
    texts: ['#danger-accent-disabled-surface-text'],
  },
  {
    label: 'Warning disabled',
    fill: '#warning-accent-disabled-surface',
    texts: ['#warning-accent-disabled-surface-text'],
  },
  {
    label: 'Note disabled',
    fill: '#note-accent-disabled-surface',
    texts: ['#note-accent-disabled-surface-text'],
  },
  {
    label: 'Special disabled',
    fill: '#special-accent-disabled-surface',
    texts: ['#special-accent-disabled-surface-text'],
    note: 'Fixed-mode disabled pair for the special theme',
  },
];

const accentStatePairs: ColorPair[] = [
  {
    label: 'Primary default',
    fill: '#primary-accent-surface',
    border: '#primary-accent-surface-border',
    texts: ['#primary-accent-surface-text'],
    note: '#primary-accent-surface',
  },
  {
    label: 'Primary hover',
    fill: '#primary-accent-surface-2',
    texts: ['#primary-accent-surface-text'],
    note: '#primary-accent-surface-2',
  },
  {
    label: 'Primary pressed',
    fill: '#primary-accent-surface-3',
    texts: ['#primary-accent-surface-text'],
    note: '#primary-accent-surface-3',
  },
];

const borderSamples = [
  ['Default', '#border'],
  ['Primary', '#primary-border'],
  ['Success', '#success-border'],
  ['Danger', '#danger-border'],
  ['Warning', '#warning-border'],
  ['Note', '#note-border'],
] as const;

const shadowSamples = [
  ['$item-shadow', '0 1bw .375x #shadow-sm'],
  ['$card-shadow', '0 .5x 2x #shadow-md'],
  ['$dialog-shadow', '0 1x 4x #shadow-lg'],
] as const;

function StoryPage({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
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

const meta = {
  title: 'Getting Started/Colors',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const NeutralSurfaces: Story = {
  render: () => (
    <StoryPage
      title="Neutral surfaces"
      description={
        <>
          Match text tokens to the surface they sit on. Each token is shown with
          t3m, t3, and t4 typography presets.
        </>
      }
    >
      <Grid>
        {neutralPairs.map((pair) => (
          <PairCard key={pair.label} {...pair} />
        ))}
      </Grid>
    </StoryPage>
  ),
};

export const SemanticSurfaceText: Story = {
  render: () => (
    <StoryPage
      title="Semantic surfaces with surface text"
      description="Tinted theme surfaces with the deep, neutralized surface-text ramp."
    >
      <Grid>
        {semanticSurfacePairs.map((pair) => (
          <PairCard key={pair.label} {...pair} />
        ))}
      </Grid>
    </StoryPage>
  ),
};

export const SemanticAccentText: Story = {
  render: () => (
    <StoryPage
      title="Semantic surfaces with accent text"
      description="Tinted fills with saturated accent text, as used by notifications and Item cards."
    >
      <Grid>
        {semanticAccentTextPairs.map((pair) => (
          <PairCard key={pair.label} {...pair} />
        ))}
      </Grid>
    </StoryPage>
  ),
};

export const SolidAndInteractionStates: Story = {
  render: () => (
    <StoryPage
      title="Solid accents and interaction states"
      description="Fixed brand fills pair with accent-surface-text. The primary ramp represents the state shape shared by semantic themes."
    >
      <Section>
        <SectionHeading>Solid accent and inverse fills</SectionHeading>
        <Grid>
          {solidAccentPairs.map((pair) => (
            <PairCard key={pair.label} {...pair} />
          ))}
        </Grid>
      </Section>
      <Section>
        <SectionHeading>Default, hover, and pressed</SectionHeading>
        <Grid>
          {accentStatePairs.map((pair) => (
            <PairCard key={pair.label} {...pair} />
          ))}
        </Grid>
      </Section>
    </StoryPage>
  ),
};

export const DisabledStates: Story = {
  render: () => (
    <StoryPage
      title="Disabled states"
      description="Neutral disabled tokens support low-emphasis controls; semantic pairs retain a muted brand tint on solid controls."
    >
      <Grid>
        {disabledPairs.map((pair) => (
          <PairCard key={pair.label} {...pair} />
        ))}
      </Grid>
    </StoryPage>
  ),
};

export const UtilityColors: Story = {
  render: () => (
    <StoryPage
      title="Utility colors"
      description="Purpose-specific colors should remain in their intended roles instead of becoming general text or fill colors."
    >
      <Grid>
        <Sample
          styles={{
            fill: '#surface',
            color: '#surface-text',
            border: '1bw solid #border',
          }}
        >
          <SampleHeading>Form affordances</SampleHeading>
          <UtilitySwatch
            styles={{
              fill: '#surface-2',
              color: '#placeholder',
              border: '1bw solid #border',
            }}
          >
            <TextT3>Placeholder text</TextT3>
            <Token>#placeholder</Token>
          </UtilitySwatch>
          <UtilitySwatch
            styles={{
              fill: '#surface',
              color: '#surface-text',
              border: '1bw solid #focus',
            }}
          >
            <TextT3>Focused control</TextT3>
            <Token styles={{ color: '#focus' }}>#focus</Token>
          </UtilitySwatch>
        </Sample>

        <Sample
          styles={{
            fill: '#primary-surface',
            color: '#primary-surface-text',
            border: '1bw solid #primary-border',
          }}
        >
          <SampleHeading>Accent icon</SampleHeading>
          <UtilitySwatch styles={{ color: '#primary-accent-icon' }}>
            <TextT3m>◆ Icon foreground</TextT3m>
            <Token>#primary-accent-icon</Token>
          </UtilitySwatch>
          <TextLabel>
            Intended for non-text graphics on the matching semantic surface.
          </TextLabel>
        </Sample>

        <Sample
          styles={{
            fill: '#surface-3',
            color: '#surface-3-text',
            border: '1bw solid #border',
          }}
        >
          <SampleHeading>Backdrop overlay</SampleHeading>
          <UtilitySwatch
            styles={{
              fill: '#overlay',
              color: '#white',
              minHeight: '8x',
              alignContent: 'center',
            }}
          >
            <Token>#overlay</Token>
          </UtilitySwatch>
          <TextLabel>Translucent backdrop; not a content surface.</TextLabel>
        </Sample>
      </Grid>
    </StoryPage>
  ),
};

export const CodeSyntax: Story = {
  render: () => (
    <StoryPage
      title="Code syntax colors"
      description="Adaptive syntax tokens are designed together on #surface and remain readable in light, dark, and high-contrast schemes."
    >
      <SyntaxSample>
        <TextS3 styles={{ color: '#code-comment' }}>
          {'// deployment status'}
        </TextS3>
        <TextS3>
          <TextS3 styles={{ color: '#code-keyword' }}>const</TextS3>
          {' status '}
          <TextS3 styles={{ color: '#code-punctuation' }}>=</TextS3>{' '}
          <TextS3 styles={{ color: '#code-function' }}>deploy</TextS3>
          <TextS3 styles={{ color: '#code-punctuation' }}>(</TextS3>
          <TextS3 styles={{ color: '#code-string' }}>'production'</TextS3>
          <TextS3 styles={{ color: '#code-punctuation' }}>,</TextS3>{' '}
          <TextS3 styles={{ color: '#code-number' }}>3</TextS3>
          <TextS3 styles={{ color: '#code-punctuation' }}>);</TextS3>
        </TextS3>
        <TextS3>
          <TextS3 styles={{ color: '#code-punctuation' }}>{'<'}</TextS3>
          <TextS3 styles={{ color: '#code-keyword' }}>button</TextS3>{' '}
          <TextS3 styles={{ color: '#code-attribute' }}>status</TextS3>
          <TextS3 styles={{ color: '#code-punctuation' }}>=</TextS3>
          <TextS3 styles={{ color: '#code-string' }}>"ready"</TextS3>
          <TextS3 styles={{ color: '#code-punctuation' }}>{' />'}</TextS3>
        </TextS3>
      </SyntaxSample>
    </StoryPage>
  ),
};

export const BordersAndShadows: Story = {
  render: () => (
    <StoryPage
      title="Borders and shadows"
      description="Borders communicate grouping and focus; scheme-aware shadow colors provide elevation."
    >
      <Section>
        <SectionHeading>Borders</SectionHeading>
        <Grid>
          {borderSamples.map(([label, border]) => (
            <Sample
              key={label}
              styles={{
                fill: '#surface',
                color: '#surface-text',
                border: `1bw solid ${border}`,
              }}
            >
              <SampleHeading>{label}</SampleHeading>
              <Token>{border}</Token>
            </Sample>
          ))}
        </Grid>
      </Section>
      <Section>
        <SectionHeading>Shadows</SectionHeading>
        <Grid styles={{ gap: '4x' }}>
          {shadowSamples.map(([token, value]) => (
            <Sample
              key={token}
              styles={{
                fill: '#surface',
                color: '#surface-text',
                shadow: token,
              }}
            >
              <SampleHeading>{token}</SampleHeading>
              <Token>{value}</Token>
            </Sample>
          ))}
        </Grid>
      </Section>
    </StoryPage>
  ),
};
