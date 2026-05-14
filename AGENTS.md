# AI Agent Reference — Cube UI Kit

This document is a comprehensive reference for AI agents maintaining or extending the `@cube-dev/ui-kit` codebase.

> **Maintenance note:** The design system reference (tokens, presets, colors, modifiers, state syntax, form system, icons) lives in `src/stories/Usage.docs.mdx` and is rendered in Storybook under **Getting Started / Usage**. The component creation guide lives in `src/stories/CreateComponent.docs.mdx` (**Getting Started / Create Component**). Update these files whenever you introduce new components, change API surface, add/remove tokens or presets, or make other material changes to the design system.

## Package Overview

- **Package:** `@cube-dev/ui-kit`
- **Repository:** [https://github.com/cube-js/cube-ui-kit](https://github.com/cube-js/cube-ui-kit)
- **Storybook:** [https://cube-ui-kit.vercel.app/](https://cube-ui-kit.vercel.app/)
- **Styling engine:** [Tasty](https://github.com/tenphi/tasty) (`@tenphi/tasty`)

## Tasty Documentation

Tasty documentation is bundled with this package in `docs/tasty/` (symlinked to `node_modules/@tenphi/tasty/docs` during development; copied at pack time by `scripts/prepare-docs.mjs`).


Only the docs relevant to authoring UI Kit components are listed here. Internal-only references (`pipeline.md`, `injector.md`), positioning material (`comparison.md`, `adoption.md`), and modes the UI Kit does not ship (`tasty-static.md`, `ssr.md`) are intentionally omitted; consult `docs/tasty/` directly if you need them.

| File                                                  | Description                                                                                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [getting-started.md](./docs/tasty/getting-started.md) | Setup, prerequisites, first component, configuration scaffolding, and editor tooling.                                                                             |
| [methodology.md](./docs/tasty/methodology.md)         | Recommended patterns for Tasty components: root + sub-elements model, `styleProps` as the public API, `styles` vs `style` props, wrapping, and anti-patterns.     |
| [design-system.md](./docs/tasty/design-system.md)     | Building a design-system layer with Tasty: token vocabularies, state aliases, recipes, primitive layout components, and compound components with sub-elements.   |
| [react-api.md](./docs/tasty/react-api.md)             | React API: `tasty()` factory, component creation, extending, `styleProps`, variants, sub-elements, and hooks (`useStyles`, `useGlobalStyles`, `useRawCSS`, etc.). |
| [dsl.md](./docs/tasty/dsl.md)                         | Style DSL: state maps, color tokens, built-in units, replace tokens, recipes, extending/replacing semantics, advanced states (`@media`, `@parent`, `@root`).      |
| [styles.md](./docs/tasty/styles.md)                   | Reference for enhanced style properties: `fill`, `flow`, `preset`, `border`, `radius`, `padding`, `margin`, `gap`, `shadow`, `outline`, `scrollbar`, etc.         |
| [configuration.md](./docs/tasty/configuration.md)     | `configure()` options: tokens, recipes, custom units, custom functions, style handlers, plugins, and TypeScript module augmentation.                              |
| [debug.md](./docs/tasty/debug.md)                     | `tastyDebug` runtime API: inspect injected CSS, view cache metrics, chunk breakdowns, and troubleshoot style issues during development.                           |


## Project Structure

```
src/
├── components/
│   ├── actions/       # Button, Link, Menu, CommandMenu, Banner, ...
│   ├── content/       # Card, Badge, Tag, Alert, Avatar, Skeleton, ...
│   ├── fields/        # TextInput, Select, ComboBox, DatePicker, ...
│   ├── form/          # Form, Field, FieldWrapper, SubmitButton, ResetButton
│   ├── layout/        # Flex, Grid, Space, Flow, Panel, ResizablePanel, ...
│   ├── navigation/    # Tabs
│   ├── organisms/     # FileTabs, StatsCard
│   ├── overlays/      # Dialog, AlertDialog, Modal, Tooltip, Toast, Notifications
│   ├── status/        # Spin, LoadingAnimation
│   ├── helpers/       # DisplayTransition, IconSwitch
│   ├── portal/        # Portal
│   ├── other/         # Calendar, CloudLogo
│   └── shared/        # InvalidIcon, ValidIcon
├── icons/             # 130+ icon components
├── shared/            # Form types (FieldBaseProps, FormBaseProps, FieldCoreProps)
├── tokens/            # Design tokens (colors, typography, spacing, sizes, shadows, layout)
├── stories/           # Storybook guides and documentation pages
├── _internal/         # Internal hooks (useEvent, etc.)
├── tasty-augment.d.ts # TypeScript module augmentation for tasty
└── index.ts           # Public barrel export
```

### Component File Layout

Each component lives in `src/components/{category}/{ComponentName}/`:

```
ComponentName/
├── ComponentName.tsx          # Implementation
├── ComponentName.stories.tsx  # Storybook stories
├── ComponentName.docs.mdx     # Documentation
├── ComponentName.test.tsx     # Tests
└── index.tsx                  # Re-exports
```

## Commands


| Command                         | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm storybook`                | Start Storybook on port 6060                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm build`                    | Build library (tsdown, unbundled ESM)                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test`                     | Run all tests (Vitest)                                                                                                                                                                                                                                                                                                                                                                        |
| `pnpm test -- ComponentName`    | Run tests matching a pattern                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test -u -- ComponentName` | Update snapshots for a component                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm fix`                      | Lint + format (ESLint + Prettier)                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm size`                     | Check bundle size limits                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm chromatic`                | Visual regression tests                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm add-icons`                | Add new icons from tabler                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm audit-docs`               | Audit component API ↔ docs ↔ argTypes sync. Uses TS Compiler API for full type resolution. Options: `--component=Name` (single component), `--fix-stories` (auto-add/remove argTypes in `.stories.tsx`), `--fix-docs` (auto-update `### Style Properties` sections in `.docs.mdx`), `--json`, `--verbose`, `--all-props`. **Run after changing a component's API or adding a new component.** |


## Stack

- **Styling:** `@tenphi/tasty` — declarative token-aware CSS-in-JS
- **Accessibility:** `react-aria` + `react-stately` — keyboard nav, focus management, ARIA
- **Icons:** `@tabler/icons-react` + custom icons in `src/icons/`
- **Testing:** Vitest + React Testing Library + Chromatic
- **Build:** tsdown (unbundled ESM, `es2022`)
- **Storybook:** v10 (`@storybook/react-vite`)
- **React:** 18 and 19 supported

## Creating Components

The full guide for creating components — including style props (`styleProps` vs `extractStyles`), `filterBaseProps`, modifiers, sub-elements, React Aria integration, variants, `useEvent`, and complete examples — is maintained in `**src/stories/CreateComponent.docs.mdx`** (rendered in Storybook under **Getting Started / Create Component**).

## Design System Reference

The full reference for tokens, presets, colors, modifiers, state syntax, recipes, icons, and the form system is maintained in `**src/stories/Usage.docs.mdx`** (rendered in Storybook under **Getting Started / Usage**).

Refer to that file for:

- **Units** — `x`, `r`, `cr`, `bw`, `ow` and their CSS variable mappings
- **Base tokens** — `$gap`, `$radius`, `$border-width`, transitions, etc.
- **Spacing / Size / Shadow / Layout tokens**
- **Color tokens** — base colors, semantic groups (primary, danger, success, warning, note), dark scale, purple scale, disabled colors
- **Typography presets** — headings (`h1`–`h6`), text (`t1`–`t4m`), paragraph (`p1`–`p4`), markdown (`m1`–`m3`), captions (`c1`–`c2`), and special presets
- **Themes** — `default`, `danger`, `special`, `success`, `warning`, `note`
- **Recipes** — `reset`, `button`, `input`, `input-autofill`, `input-placeholder`, `input-search-cancel-button`
- **Modifiers** — `disabled`, `hovered`, `focused`, `pressed`, `selected`, `checked`, `invalid`, etc.
- **State syntax** — pseudo-classes, modifiers, media/container queries, boolean combinators
- **Icons** — `<Icon>`, `wrapIcon()`, usage conventions
- **Form system** — `<Form>`, `useForm`, validation rules, field integration

## Testing

- **Framework:** Vitest + React Testing Library
- **Config:** `vitest.config.ts` + `src/test/setup.ts`
- **Helpers:** `renderWithRoot` (wraps with `<Root>`), `renderWithForm` (wraps with `<Form>`)
- **QA selectors:** use `qa` prop → `data-qa` attribute → `screen.getByTestId('name')`
- **Setup:** `testIdAttribute` is configured to `data-qa`
- **Tasty snapshots:** `toMatchTastySnapshot()` matcher captures markup + CSS together

## TypeScript

- **Module augmentation:** `src/tasty-augment.d.ts` extends `@tenphi/tasty` with project-specific color tokens, preset names, and theme names.
- **Props naming:** `Cube{ComponentName}Props` for component prop interfaces.
- **Base props:** Extend `BaseProps` or `AllBaseProps` from `@tenphi/tasty`.
- **Style props:** Mix in `ContainerStyleProps`, `OuterStyleProps`, `ColorStyleProps`, etc.
- **Form types:** `FieldBaseProps`, `FormBaseProps`, `FieldCoreProps` from `src/shared/`.

## Export Patterns

- **Barrel exports:** each category has `index.ts` files; everything re-exports through `src/index.ts`.
- **Compound components:** `Object.assign(Button, { Group: ButtonGroup, Split: ButtonSplit })`.
- **Tasty re-exports:** Only types are re-exported from `@tenphi/tasty`. Runtime imports (`tasty`, `extractStyles`, `filterBaseProps`) come directly from `@tenphi/tasty`.

## Cursor Cloud specific instructions

### Environment

- **Node.js** >= 22.14.0 and **pnpm** 10.32.0 are pre-installed.
- After `pnpm install`, run `pnpm rebuild esbuild` — pnpm blocks esbuild's postinstall by default, but Vite (used by Storybook) requires the native esbuild binary.

### Running services

- **Storybook dev server**: `pnpm storybook` (port 6060). Note: Vite's unbundled dev mode generates hundreds of parallel module requests on first load, which may trigger `ERR_INSUFFICIENT_RESOURCES` in Chrome in resource-constrained VMs. If you need to visually verify components via `computerUse`, build a static Storybook (`pnpm build-storybook`) and serve it (`npx serve storybook-static -l 6060`) instead.
- **Tests**: `pnpm test` (Vitest, single run) or `pnpm test-watch` (watch mode).
- **Lint**: `pnpm fix` (ESLint + Prettier, auto-fix mode).
- **Build**: `pnpm build` (tsdown, unbundled ESM output in `dist/`).

### Key gotchas

- Husky hooks are installed via `prepare` script during `pnpm install`. Pre-push hook runs `pnpm test`; pre-commit runs `pnpm lint-staged`. To skip hooks on commits use `git commit --no-verify`.
- No external services (databases, Docker, APIs) are needed — this is a pure frontend component library.

