import { noRedundantDefaultProp } from './rules/no-redundant-default-prop';

export { createRule } from './rules/no-redundant-default-prop';
export type { RuleOptions } from './rules/no-redundant-default-prop';
export { DEFAULTS } from './defaults.generated';
export type {
  ComponentEntry,
  DefaultsRegistry,
  DefaultValue,
  PropEntry,
  SkipReason,
  VerifiedDefault,
} from './types';

const rules = {
  'no-redundant-default-prop': noRedundantDefaultProp,
};

const plugin = {
  meta: { name: '@cube-dev/ui-kit/eslint-plugin' },
  rules,
  configs: {} as Record<string, unknown>,
};

/**
 * Flat config.
 *
 * The rule is `warn` rather than `error` because it is a cleanliness rule, not a
 * correctness one, and it ships with an autofix.
 *
 * Stories and docs stay at `warn` rather than dropping to `off`. They are the
 * code people copy, so redundant props there propagate outward and are worth
 * surfacing — but a deliberate side-by-side contrast (`<Switch isSelected />`
 * next to `<Switch isSelected={false} />`) has a real reason to name the default,
 * and that pattern is common enough in stories that failing a build over it would
 * be wrong. Silence the individual sites with a disable comment.
 */
plugin.configs.recommended = [
  {
    // `files` is explicit because ESLint's flat-config default only covers
    // `.js`/`.mjs`/`.cjs`. Without this the rule would silently never run in
    // the `.jsx`/`.tsx` files that are the entire point.
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    plugins: { 'cube-ui-kit': plugin },
    rules: { 'cube-ui-kit/no-redundant-default-prop': 'warn' },
  },
  {
    files: [
      '**/*.stories.ts',
      '**/*.stories.tsx',
      '**/*.stories.jsx',
      '**/*.docs.mdx',
    ],
    rules: { 'cube-ui-kit/no-redundant-default-prop': 'warn' },
  },
];

export { rules };
export default plugin;
