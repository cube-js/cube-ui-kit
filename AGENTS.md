# AI Agent Reference — Cube UI Kit

Entry point for AI agents working on `@cube-dev/ui-kit`.

- **Package:** `@cube-dev/ui-kit`
- **Repository:** [cube-js/cube-ui-kit](https://github.com/cube-js/cube-ui-kit)
- **Storybook:** [cube-ui-kit.vercel.app](https://cube-ui-kit.vercel.app/)
- **Styling engine:** [Tasty](https://github.com/tenphi/tasty) (`@tenphi/tasty`)
- **Palette engine:** [Glaze](https://github.com/tenphi/glaze) (`@tenphi/glaze`)

> **Maintenance note:** The design-system reference (tokens, presets, colors, modifiers, state syntax, form system, icons) lives in `src/stories/Usage.docs.mdx` (Storybook → **Getting Started / Usage**). The component creation guide lives in `src/stories/CreateComponent.docs.mdx` (**Getting Started / Create Component**). Update these whenever you add components, change the API surface, or modify tokens/presets.

## Rules

Project-specific working rules for AI agents. Not published with the package.

- [coding.md](docs/rules/coding.md) — development flow, code style, knowledge maintenance
- [input-components.md](docs/rules/input-components.md) — form-attachable input components (`useFieldProps`, validation props, `wrapWithField`)
- [storybook.md](docs/rules/storybook.md) — `.stories.tsx` and `.docs.mdx` authoring
- [documentation.md](docs/rules/documentation.md) — `.docs.mdx` structure + update flow
- [tests.md](docs/rules/tests.md) — Vitest + React Testing Library patterns
- [commit-changes.md](docs/rules/commit-changes.md) — commit message convention
- [eslint-plugin.md](docs/rules/eslint-plugin.md) — the shipped lint rule + the defaults registry it checks against

## Changesets

When making code changes that affect end users or the public API, **always add a new changeset or update an existing one** in [`.changeset/`](.changeset/) as part of the same task. Do not wait to be asked.

- Prefer updating an existing open changeset that already covers the same work/PR; otherwise add a new `.md` file.
- Use `patch` for bug fixes and small changes; `minor` for new features and noticeable breaking changes.
- Keep the summary concise and user-focused (`"@cube-dev/ui-kit": patch|minor` frontmatter).
- Skip changesets for docs-only, test-only, Storybook-only, or internal tooling that does not affect package consumers. Also skip fixes for issues introduced and resolved within the same PR.
- Add changeset manually (no CLI) — full guidelines: [`.cursor/commands/add-changeset.md`](.cursor/commands/add-changeset.md).

## Project Structure

```
src/
├── components/        # actions, content, fields, form, layout, navigation,
│                      # organisms, overlays, status, helpers, portal, other, shared
├── icons/             # 130+ icon components
├── shared/            # Form types (FieldBaseProps, FormBaseProps, FieldCoreProps)
├── tokens/            # Design tokens (colors, typography, spacing, sizes, shadows, layout)
├── stories/           # Storybook guides and documentation pages
├── _internal/         # Internal hooks (useEvent, etc.)
├── tasty-augment.d.ts # TypeScript module augmentation for tasty
└── index.ts           # Public barrel export
```

Each component lives in `src/components/{category}/{ComponentName}/` and ships `ComponentName.tsx`, `.stories.tsx`, `.docs.mdx`, `.test.tsx`, and `index.tsx`.

## Commands

- `pnpm storybook` — start Storybook on port 6060
- `pnpm build` — build library (`tsdown`, unbundled ESM)
- `pnpm test` — run all tests (Vitest); add `-- ComponentName` to filter, `-u` to update snapshots
- `pnpm fix` — lint + format (Oxlint + Prettier)
- `pnpm size` — check bundle size limits
- `pnpm chromatic` — visual regression
- `pnpm add-icons` — add new icons from tabler
- `pnpm audit-docs` — audit component API ↔ docs ↔ argTypes sync. Options: `--component=Name`, `--fix-stories`, `--fix-docs`, `--json`, `--verbose`, `--all-props`. **Run after changing a component's API or adding a new component.**
- `pnpm audit-defaults` — regenerate the lint plugin's defaults registry (`src/eslint-plugin/defaults.generated.ts`). **Run whenever you change a default prop value.** `pnpm test` fails until the registry matches what the components actually render — see [eslint-plugin.md](docs/rules/eslint-plugin.md).
- `pnpm run update-tasty` / `pnpm run update-glaze` — bump and pin `@tenphi/tasty` or `@tenphi/glaze` to the latest version. Pass `--version=X.Y.Z` to pin a specific version.

## Environment

- Node `>=22.0.0`, pnpm `^10` (pinned to `pnpm@10.32.0`). The publish workflow (`publish.yml`) still runs on Node 24 because OIDC trusted publishing requires npm ≥ 11.5.1+, which Node 24 ships natively (Node 22 ships npm 10.x).
- After `pnpm install`, run `pnpm rebuild esbuild` (postinstall is blocked in `pnpm-workspace.yaml`).
- Husky hooks: `pre-commit` runs `pnpm lint-staged`; `pre-push` runs `pnpm test`. Skip only intentionally (`--no-verify` or `HUSKY=0`).
- No external services or databases required for local development.

## Tasty Documentation

Bundled in `docs/tasty/` (symlinked from `node_modules/@tenphi/tasty/docs` in dev, copied at pack time by `scripts/prepare-docs.mjs`). Consult these when authoring components or working with style props:

- [`getting-started.md`](docs/tasty/getting-started.md), [`methodology.md`](docs/tasty/methodology.md), [`design-system.md`](docs/tasty/design-system.md), [`react-api.md`](docs/tasty/react-api.md), [`dsl.md`](docs/tasty/dsl.md), [`styles.md`](docs/tasty/styles.md), [`configuration.md`](docs/tasty/configuration.md), [`debug.md`](docs/tasty/debug.md)

Internal-only references (`pipeline.md`, `injector.md`), positioning material (`comparison.md`, `adoption.md`), and modes the UI Kit does not ship (`tasty-static.md`, `ssr.md`) are intentionally omitted; read them directly in `docs/tasty/` if needed.

## Glaze Documentation

Bundled in `docs/glaze/` (same symlink/copy mechanism). Consult when working on color tokens, theme generation, or contrast tuning — Glaze powers `src/tokens/palette.ts`.

- [`methodology.md`](docs/glaze/methodology.md), [`api.md`](docs/glaze/api.md), [`migration.md`](docs/glaze/migration.md)

## Stack

- **Styling:** `@tenphi/tasty` (declarative token-aware CSS-in-JS)
- **Accessibility:** `react-aria` + `react-stately`
- **Icons:** `@tabler/icons-react` + custom icons in `src/icons/`
- **Testing:** Vitest + React Testing Library + Chromatic
- **Build:** tsdown (unbundled ESM, `es2022`)
- **Storybook:** v10 (`@storybook/react-vite`)
- **React:** 18 and 19 supported

## Creating Components

See `src/stories/CreateComponent.docs.mdx` (Storybook → **Getting Started / Create Component**) for the full guide: `styleProps` vs `extractStyles`, `filterBaseProps`, modifiers, sub-elements, React Aria integration, variants, `useEvent`, and complete examples.

## Design System Reference

See `src/stories/Usage.docs.mdx` (Storybook → **Getting Started / Usage**) for units, base/spacing/size/shadow/layout tokens, color tokens, typography presets, themes, recipes, modifiers, state syntax, icons, and the form system.

## TypeScript & Exports

- **Module augmentation:** `src/tasty-augment.d.ts` extends `@tenphi/tasty` with project-specific color tokens, preset names, and theme names.
- **Props naming:** `Cube{ComponentName}Props`. Extend `BaseProps`/`AllBaseProps` from `@tenphi/tasty`; mix in style-prop interfaces (`ContainerStyleProps`, `OuterStyleProps`, `ColorStyleProps`, …) as needed. Form types live in `src/shared/`.
- **Barrel exports:** every category has an `index.ts`; everything re-exports through `src/index.ts`.
- **Compound components:** `Object.assign(Button, { Group: ButtonGroup, Split: ButtonSplit })`.
- **Tasty re-exports:** only types are re-exported. Runtime imports (`tasty`, `extractStyles`, `filterBaseProps`) come directly from `@tenphi/tasty`.
- **`Aria*Props` from `react-aria` silently resolve to `any`.** `tsconfig.json` sets `preserveSymlinks: true`, so TS resolves `react-aria`'s re-exports from the symlink path and never finds the `@react-aria/*` subpackages (they are not direct dependencies); `skipLibCheck` then hides the failure. Consequences: `interface X extends AriaFooProps` contributes **no** members (`keyof X` drops them), while `Omit<AriaFooProps, …>` becomes an index signature that accepts *anything*. Either way those props are unchecked. So declare the Aria props a component genuinely supports — see `ToggleSelectionProps` in `src/shared/form.ts`, which restores `onChange` for `Switch`/`Checkbox`. Removing `preserveSymlinks` is the real fix but surfaces ~320 previously-hidden errors across ~60 files, so it needs its own migration.

## Testing

- **Helpers:** `renderWithRoot` (wraps with `<Root>`), `renderWithForm` (returns `{ formInstance, ...renderResult }`).
- **QA selectors:** `qa` prop → `data-qa` attribute → `screen.getByTestId('name')` (`testIdAttribute` is configured to `data-qa`).
- **Tasty snapshots:** `toMatchTastySnapshot()` captures markup + CSS together.
- Patterns: see [docs/rules/tests.md](docs/rules/tests.md).
