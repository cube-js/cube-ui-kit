# AI Agent Reference — Cube UI Kit

This document is a comprehensive reference for AI agents maintaining or extending the `@cube-dev/ui-kit` codebase.

> **Maintenance note:** The design system reference (tokens, presets, colors, modifiers, state syntax, form system, icons) lives in `src/stories/Usage.docs.mdx` and is rendered in Storybook under **Getting Started / Usage**. The component creation guide lives in `src/stories/CreateComponent.docs.mdx` (**Getting Started / Create Component**). Update these files whenever you introduce new components, change API surface, add/remove tokens or presets, or make other material changes to the design system.

## Package Overview

- **Package:** `@cube-dev/ui-kit`
- **Repository:** https://github.com/cube-js/cube-ui-kit
- **Storybook:** https://cube-ui-kit.vercel.app/
- **Styling engine:** [Tasty](https://github.com/tenphi/tasty) (`@tenphi/tasty`)

## Tasty Documentation

Tasty documentation is bundled with this package in `docs/tasty/` (symlinked to `node_modules/@tenphi/tasty/docs` during development; copied at pack time by `scripts/prepare-docs.mjs`).

| File | Description |
|------|-------------|
| [usage.md](./docs/tasty/usage.md) | Core API: `tasty()` component creation, state mappings, sub-elements (`data-element`), variants, extending components, and React hooks (`useStyles`, `useGlobalStyles`, `useRawCSS`). |
| [configuration.md](./docs/tasty/configuration.md) | `configure()` options: tokens, recipes, custom units, style handlers, `@keyframes`, `@property`, parser cache, and TypeScript module augmentation. |
| [styles.md](./docs/tasty/styles.md) | Complete reference for all enhanced style properties: `fill`, `flow`, `preset`, `border`, `radius`, `transition`, `scrollbar`, shorthand syntax, and recommended alternatives to raw CSS properties. |
| [debug.md](./docs/tasty/debug.md) | `tastyDebug` runtime API: inspect injected CSS, view cache metrics, chunk breakdowns, and troubleshoot style issues. |
| [injector.md](./docs/tasty/injector.md) | Low-level style injector: `inject()`, `injectGlobal()`, `injectRawCSS()`, `keyframes()`, hash deduplication, reference counting, SSR, and Shadow DOM support. |
| [tasty-static.md](./docs/tasty/tasty-static.md) | Zero-runtime mode: `tastyStatic()`, Babel plugin setup, Next.js/Vite integration, and static extraction limitations. |

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

| Command | Description |
|---------|-------------|
| `pnpm storybook` | Start Storybook on port 6060 |
| `pnpm build` | Build library (tsdown, unbundled ESM) |
| `pnpm test` | Run all tests (Vitest) |
| `pnpm test -- ComponentName` | Run tests matching a pattern |
| `pnpm test -u -- ComponentName` | Update snapshots for a component |
| `pnpm fix` | Lint + format (ESLint + Prettier) |
| `pnpm size` | Check bundle size limits |
| `pnpm chromatic` | Visual regression tests |
| `pnpm add-icons` | Add new icons from tabler |

## Stack

- **Styling:** `@tenphi/tasty` — declarative token-aware CSS-in-JS
- **Accessibility:** `react-aria` + `react-stately` — keyboard nav, focus management, ARIA
- **Icons:** `@tabler/icons-react` + custom icons in `src/icons/`
- **Testing:** Vitest + React Testing Library + Chromatic
- **Build:** tsdown (unbundled ESM, `es2022`)
- **Storybook:** v10 (`@storybook/react-vite`)
- **React:** 18 and 19 supported

## Creating Components

The full guide for creating components — including style props (`styleProps` vs `extractStyles`), `filterBaseProps`, modifiers, sub-elements, React Aria integration, variants, `useEvent`, and complete examples — is maintained in **`src/stories/CreateComponent.docs.mdx`** (rendered in Storybook under **Getting Started / Create Component**).

## Design System Reference

The full reference for tokens, presets, colors, modifiers, state syntax, recipes, icons, and the form system is maintained in **`src/stories/Usage.docs.mdx`** (rendered in Storybook under **Getting Started / Usage**).

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
