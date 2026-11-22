// @vitest-environment node
// The build of the real pages runs in `pnpm check:harness` (`--check`), which
// CI's lint job runs on every PR. These cases use fixed inputs, so a docs edit
// can't fail them.
import {
  llmsIndex,
  metaTitle,
  outputOf,
  pruneEmptySections,
  rewriteLinks,
  storybookLeft,
  storyId,
  stripMdx,
  summarize,
} from './prepare-docs.mjs';

describe('prepare-docs', () => {
  it('maps sources to short paths in docs/', () => {
    expect(outputOf('src/stories/Usage.docs.mdx')).toBe('docs/Usage.md');
    expect(outputOf('src/components/Block.docs.mdx')).toBe(
      'docs/components/Block.md',
    );
    expect(outputOf('src/components/actions/Button/Button.docs.mdx')).toBe(
      'docs/components/actions/Button.md',
    );
    expect(outputOf('src/components/actions/use-context-menu.docs.mdx')).toBe(
      'docs/components/actions/use-context-menu.md',
    );
    expect(outputOf('src/components/form/Form/modern-form-migration.md')).toBe(
      'docs/components/form/modern-form-migration.md',
    );
  });

  it("reads the meta title, not a story's data, and makes Storybook's id", () => {
    const stories = `
const data = [{ key: 'a', title: 'Name' }];
const meta = {
  title: 'Actions/Button.Split',
  component: ButtonSplit,
} satisfies Meta;
export default meta;`;

    expect(metaTitle(stories)).toBe('Actions/Button.Split');
    expect(storyId('Actions/Button.Split')).toBe('actions-button-split');
    expect(storyId('Getting Started/Base Properties')).toBe(
      'getting-started-base-properties',
    );
  });

  it('drops imports and Storybook blocks, and keeps code as it is', () => {
    const mdx = [
      "import { Meta, Story } from '@storybook/addon-docs/blocks';",
      'import {',
      '  Button,',
      "} from './Button';",
      "import guide from './guide.md?raw';",
      '',
      '<Meta of={ButtonStories} />',
      '',
      '# Button',
      '',
      '<Canvas>',
      '  <Story of={ButtonStories.Default} />',
      '</Canvas>',
      '',
      '<Root',
      '  palette={palette}',
      '/>',
      '',
      '<Badge>NEW</Badge> marks a new item.',
      '',
      'Next paragraph.',
      '',
      '````jsx',
      "import { Button } from '@cube-dev/ui-kit';",
      '```',
      '<Story of={X} />',
      '````',
      '',
      '<Markdown>{guide}</Markdown>',
    ].join('\n');

    expect(stripMdx(mdx, 'src/components/actions/Button/Button.docs.mdx'))
      .toBe(`# Button

<Badge>NEW</Badge> marks a new item.

Next paragraph.

\`\`\`\`jsx
import { Button } from '@cube-dev/ui-kit';
\`\`\`
<Story of={X} />
\`\`\`\`

{{include src/components/actions/Button/guide.md}}
`);
  });

  describe('links', () => {
    const site = {
      outputs: new Map([
        [
          'src/components/form/Form/modern-form-migration.md',
          'docs/components/form/modern-form-migration.md',
        ],
      ]),
      pageById: new Map([
        ['getting-started-base-properties--docs', 'docs/BaseProperties.md'],
      ]),
      ids: new Set(['content-avatar--docs']),
    };
    const rewrite = (line) => {
      const errors = [];
      const result = rewriteLinks(line, {
        file: 'src/components/form/Form/Form.docs.mdx',
        out: 'docs/components/form/Form.md',
        site,
        errors,
      });

      return { result, errors };
    };

    it('lead a Storybook route to its page, or to Storybook for an autodocs page', () => {
      expect(
        rewrite(
          '[Base](/docs/getting-started-base-properties--docs#styles), [Base](?path=/docs/getting-started-base-properties--docs)',
        ).result,
      ).toBe(
        '[Base](../../BaseProperties.md#styles), [Base](../../BaseProperties.md)',
      );
      expect(
        rewrite(
          '[Base](/docs/getting-started-base-properties--docs "Base properties")',
        ).result,
      ).toBe('[Base](../../BaseProperties.md "Base properties")');
      expect(rewrite('[Avatar](/docs/content-avatar--docs)').result).toBe(
        '[Avatar](https://cube-ui-kit.vercel.app/?path=/docs/content-avatar--docs)',
      );
    });

    it('lead a shipped file to its page, and any other file to GitHub', () => {
      expect(
        rewrite(
          '[guide](https://github.com/cube-js/cube-ui-kit/blob/main/src/components/form/Form/modern-form-migration.md#steps)',
        ).result,
      ).toBe('[guide](./modern-form-migration.md#steps)');
      expect(rewrite('[form](./Form.tsx)').result).toBe(
        '[form](https://github.com/cube-js/cube-ui-kit/blob/main/src/components/form/Form/Form.tsx)',
      );
    });

    it('report a dead link, and leave anchors, URLs and inline code alone', () => {
      expect(
        rewrite(
          '[x](/docs/nothing--docs) [y](/components/Modal) [z](./gone.md) [s](/story/nothing--basic)',
        ).errors,
      ).toHaveLength(4);
      // A docs route needs a page or a stories file's autodocs id.
      expect(rewrite('[d](/docs/content-avatar--basic)').errors).toHaveLength(
        1,
      );
      // A story route needs only its stories title to exist.
      expect(rewrite('[s](/story/content-avatar--basic)')).toEqual({
        result:
          '[s](https://cube-ui-kit.vercel.app/?path=/story/content-avatar--basic)',
        errors: [],
      });
      expect(
        rewrite(
          '[a](#props) [b](https://example.com) `[c](/docs/nothing--docs)`',
        ),
      ).toEqual({
        result:
          '[a](#props) [b](https://example.com) `[c](/docs/nothing--docs)`',
        errors: [],
      });
    });
  });

  it('finds Storybook markup or a route left in prose, not in code', () => {
    expect(storybookLeft('# A\n\n<Story of={X} /> shows it.\n')).toBe('<Story');
    expect(storybookLeft('# A\n\n[ref]: /docs/content-avatar--docs\n')).toBe(
      '[ref]: /docs/content-avatar--docs',
    );
    expect(
      storybookLeft(
        "# A\n\n`[c](/docs/x--docs)` in code.\n\n```ts\nimport type { Meta } from '@storybook/react-vite';\n<Story of={X} />\n```\n",
      ),
    ).toBe(undefined);
  });

  it('drops sections left empty, and keeps one with content below', () => {
    expect(
      pruneEmptySections(
        '# Toast\n\n## Examples\n\n### Basic\n\n### Progress\n\n## Props\n\n- `title`\n\n## Component\n\n---\n\n## Notes\n',
      ),
    ).toBe('# Toast\n\n## Props\n\n- `title`\n\n---\n');
    // The documented structure: `---` separates a section from its subsections.
    const dialog =
      '# Dialog\n\n## When to Use\n\n- a\n\n## Component\n\n---\n\n### Properties\n\n- x\n';

    expect(pruneEmptySections(dialog)).toBe(dialog);
  });

  it('indexes guides, then components by category, with one sentence each', () => {
    const { title, description } = summarize(
      '# Button\n\n## When to Use\n\nA versatile [action](../Action.md) component. It does **more**.\n',
    );

    expect({ title, description }).toEqual({
      title: 'Button',
      description: 'A versatile action component.',
    });
    // Only the heading a page starts with is its title, not a comment in code.
    expect(summarize('Intro.\n\n```bash\n# install\nnpm i\n```\n').title).toBe(
      undefined,
    );
    expect(
      llmsIndex([
        {
          out: 'docs/components/actions/Button.md',
          title: 'Button',
          description,
        },
        { out: 'docs/components/Block.md', title: 'Block' },
        { out: 'docs/Usage.md', title: 'Usage Guide' },
      ]),
    ).toContain(
      '## Guides\n\n- [Usage Guide](Usage.md)\n\n## Components\n\n- [Block](components/Block.md)\n\n## Actions\n\n- [Button](components/actions/Button.md): A versatile action component.\n',
    );
  });
});
