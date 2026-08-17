import { Linter, RuleTester } from 'eslint';

import { DefaultsRegistry } from '../types';

import { createRule } from './no-redundant-default-prop';

/**
 * A fixed registry, so these tests exercise the *rule* rather than the
 * pregenerated data. `defaults.test.ts` is what guards the data.
 */
const REGISTRY: DefaultsRegistry = {
  components: {
    Button: {
      props: {
        type: { kind: 'default', value: 'outline' },
        theme: { kind: 'default', value: 'default' },
        isLoading: { kind: 'default', value: false },
        tooltip: { kind: 'default', value: true },
        level: { kind: 'default', value: 3 },
        size: {
          kind: 'skip',
          reason: 'conditional',
          note: 'depends on type',
        },
      },
    },
    'Button.Split': {
      props: { theme: { kind: 'default', value: 'default' } },
    },
    Dialog: {
      props: {
        size: { kind: 'default', value: 'M', aliases: ['medium'] },
      },
    },
  },
};

const rule = createRule(REGISTRY) as any;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const IMPORT = "import { Button } from '@cube-dev/ui-kit';";

ruleTester.run('no-redundant-default-prop', rule, {
  valid: [
    // ---------------------------------------------------------------------
    // Provenance. Every one of these uses a name that IS a ui-kit export, so
    // a name-based rule would rewrite unrelated components. None may report.
    // ---------------------------------------------------------------------
    {
      name: 'locally defined component sharing a ui-kit name',
      code: `function Button({ type }) { return null }
const App = () => <Button type="outline" />;`,
    },
    {
      name: 'same-named import from another package',
      code: `import { Button } from '@mui/material';
const App = () => <Button type="outline" />;`,
    },
    {
      name: 'same-named import from a relative path',
      code: `import { Button } from './ui/Button';
const App = () => <Button type="outline" />;`,
    },

    // ---------------------------------------------------------------------
    // `relativeImports` — opt-in provenance for linting the ui-kit repo
    // itself, where components arrive by path and never by package name.
    // ---------------------------------------------------------------------
    {
      name: 'relative import is still ignored when the option is absent',
      code: `import { Button } from '../../actions/Button';
const App = () => <Button type="outline" />;`,
    },
    {
      name: 'relativeImports does not widen bare specifiers',
      code: `import { Button } from '@mui/material';
const App = () => <Button type="outline" />;`,
      options: [{ relativeImports: true }],
    },
    {
      name: 'relativeImports still loses to a local binding',
      code: `const Button = tasty({});
const App = () => <Button type="outline" />;`,
      options: [{ relativeImports: true }],
    },
    {
      name: 'ui-kit import shadowed by an inner binding',
      code: `${IMPORT}
function render() {
  const Button = (props) => null;
  return <Button type="outline" />;
}`,
    },
    {
      name: 'component shadowed by a function parameter',
      code: `${IMPORT}
const render = (Button) => <Button type="outline" />;`,
    },
    {
      name: 'never imported at all',
      code: 'const App = () => <Button type="outline" />;',
    },
    {
      name: 'lowercase intrinsic element',
      code: '<button type="outline" />;',
    },

    // ---------------------------------------------------------------------
    // Not actually redundant.
    // ---------------------------------------------------------------------
    {
      name: 'non-default value',
      code: `${IMPORT}<Button type="primary" />;`,
    },
    {
      name: 'prop excluded as conditional',
      code: `${IMPORT}<Button size="medium" />;`,
    },
    {
      name: 'unknown prop',
      code: `${IMPORT}<Button unknownProp="outline" />;`,
    },
    {
      name: 'unregistered component',
      code: `import { Card } from '@cube-dev/ui-kit';<Card type="outline" />;`,
    },
    {
      name: 'boolean shorthand where the default is false',
      code: `${IMPORT}<Button isLoading />;`,
    },
    {
      name: 'non-literal value',
      code: `${IMPORT}<Button type={someVar} />;`,
    },
    {
      name: 'template literal value',
      code: `${IMPORT}<Button type={\`outline\`} />;`,
    },

    // ---------------------------------------------------------------------
    // Spread ordering: a preceding spread makes the attribute load-bearing,
    // because removing it would hand control back to the spread.
    // ---------------------------------------------------------------------
    {
      name: 'attribute after a spread',
      code: `${IMPORT}<Button {...props} type="outline" />;`,
    },
    {
      name: 'every attribute sits after a spread',
      code: `${IMPORT}<Button {...props} type="outline" theme="default" />;`,
    },
  ],

  invalid: [
    {
      name: 'string default',
      code: `${IMPORT}<Button type="outline" />;`,
      output: `${IMPORT}<Button />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'boolean default via expression container',
      code: `${IMPORT}<Button isLoading={false} />;`,
      output: `${IMPORT}<Button />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'boolean shorthand where the default is true',
      code: `${IMPORT}<Button tooltip />;`,
      output: `${IMPORT}<Button />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'numeric default',
      code: `${IMPORT}<Button level={3} />;`,
      output: `${IMPORT}<Button />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      // Both props are reported, but the fixer removes each attribute together
      // with its preceding whitespace, so two adjacent removals share a
      // boundary and ESLint applies only the first per pass. `--fix` runs
      // repeated passes and converges — see the `verifyAndFix` test below.
      name: 'several redundant props at once (first pass)',
      code: `${IMPORT}<Button type="outline" theme="default" />;`,
      output: `${IMPORT}<Button theme="default" />;`,
      errors: [{ messageId: 'redundant' }, { messageId: 'redundant' }],
    },
    {
      name: 'keeps the non-redundant prop',
      code: `${IMPORT}<Button type="outline" size="small" />;`,
      output: `${IMPORT}<Button size="small" />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'attribute BEFORE a spread is still redundant',
      code: `${IMPORT}<Button type="outline" {...props} />;`,
      output: `${IMPORT}<Button {...props} />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'only the pre-spread attribute is reported',
      code: `${IMPORT}<Button theme="default" {...props} type="outline" />;`,
      output: `${IMPORT}<Button {...props} type="outline" />;`,
      errors: [{ messageId: 'redundant' }],
    },

    // Positive controls for the provenance resolver: these forms MUST report,
    // otherwise the shadowing checks above would pass trivially.
    {
      name: 'aliased import keys off the exported name',
      code: `import { Button as Btn } from '@cube-dev/ui-kit';<Btn type="outline" />;`,
      output: `import { Button as Btn } from '@cube-dev/ui-kit';<Btn />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'namespace import',
      code: `import * as UI from '@cube-dev/ui-kit';<UI.Button type="outline" />;`,
      output: `import * as UI from '@cube-dev/ui-kit';<UI.Button />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'compound component',
      code: `${IMPORT}<Button.Split theme="default" />;`,
      output: `${IMPORT}<Button.Split />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'relativeImports reaches a deep relative specifier',
      code: `import { Button } from '../../actions/Button';<Button type="outline" />;`,
      output: `import { Button } from '../../actions/Button';<Button />;`,
      options: [{ relativeImports: true }],
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'relativeImports reaches a bare parent-directory barrel',
      code: `import { Button } from '..';<Button type="outline" />;`,
      output: `import { Button } from '..';<Button />;`,
      options: [{ relativeImports: true }],
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'subpath import is still ui-kit',
      code: `import { Button } from '@cube-dev/ui-kit/eslint-plugin';<Button type="outline" />;`,
      output: `import { Button } from '@cube-dev/ui-kit/eslint-plugin';<Button />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'alias value matches via aliases list',
      code: `import { Dialog } from '@cube-dev/ui-kit';<Dialog size="medium" />;`,
      output: `import { Dialog } from '@cube-dev/ui-kit';<Dialog />;`,
      errors: [{ messageId: 'redundant' }],
    },
    {
      name: 'opted-in internal barrel via packages option',
      code: `import { Button } from '~/components/ui';<Button type="outline" />;`,
      output: `import { Button } from '~/components/ui';<Button />;`,
      options: [{ packages: ['~/components/ui'] }],
      errors: [{ messageId: 'redundant' }],
    },
  ],
});

/**
 * `--fix` convergence.
 *
 * RuleTester only reports a single fix pass, so it cannot show that adjacent
 * redundant props are all removed eventually. `Linter.verifyAndFix` runs the
 * same multi-pass loop `eslint --fix` uses, which is what consumers actually
 * get.
 */
describe('autofix convergence', () => {
  const linter = new Linter();

  const fix = (code: string) =>
    linter.verifyAndFix(code, {
      plugins: { local: { rules: { 'no-redundant': rule } } },
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      rules: { 'local/no-redundant': 'error' },
    }).output;

  it('removes every redundant prop across passes', () => {
    expect(
      fix(
        `${IMPORT}<Button type="outline" theme="default" isLoading={false} />;`,
      ),
    ).toBe(`${IMPORT}<Button />;`);
  });

  it('leaves load-bearing props untouched', () => {
    expect(
      fix(
        `${IMPORT}<Button type="outline" size="small" {...rest} theme="default" />;`,
      ),
    ).toBe(`${IMPORT}<Button size="small" {...rest} theme="default" />;`);
  });

  it('does not touch a same-named non-ui-kit component', () => {
    const code = `import { Button } from '@mui/material';<Button type="outline" theme="default" />;`;

    expect(fix(code)).toBe(code);
  });
});
