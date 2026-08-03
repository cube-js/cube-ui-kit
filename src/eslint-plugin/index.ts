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
 * Stories and docs are exempt on purpose: a story that enumerates variants side
 * by side has to name the default explicitly to be readable, so linting them
 * buries the real findings.
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
    files: ['**/*.stories.tsx', '**/*.stories.jsx', '**/*.docs.mdx'],
    rules: { 'cube-ui-kit/no-redundant-default-prop': 'off' },
  },
];

export { rules };
export default plugin;
