# Cube UI Kit

[![npm version](https://img.shields.io/npm/v/@cube-dev/ui-kit.svg)](https://www.npmjs.com/package/@cube-dev/ui-kit)
[![license](https://img.shields.io/npm/l/@cube-dev/ui-kit.svg)](https://github.com/cube-js/cube-ui-kit/blob/main/LICENSE)

An open-source React component library that powers [Cube Cloud](https://cubecloud.dev) and other [Cube Dev](https://cube.dev) products. While built for Cube's own interfaces, it is a general-purpose kit you can use freely in any application where it fits your needs.

**[Live Storybook](https://cube-ui-kit.vercel.app/)** · **[Tasty Docs](https://github.com/tenphi/tasty)**

## Highlights

- **100+ production-ready components** — primitives (Button, Input), layout (Grid, Flex, Space), fields (Select, ComboBox, DatePicker), overlays (Dialog, Toast), and complex organisms (CommandMenu, FilterPicker, FileTabs).
- **Accessible by default** — built on [React Aria](https://react-spectrum.adobe.com/react-aria/) with keyboard navigation, focus management, and screen reader support out of the box.
- **Tasty styling engine** — declarative, token-aware styles with state-driven values, design tokens, responsive breakpoints, and zero specificity conflicts. See the [Tasty documentation](https://github.com/tenphi/tasty).
- **Integrated form system** — async rule-based validation with field-level and form-level state management; fields plug in directly without extra wrapper components.
- **TypeScript-first** — complete type definitions with autocomplete for tokens and style props.
- **Tree-shakeable** — unbundled ESM output; import only what you use.

## Installation

```bash
pnpm add @cube-dev/ui-kit
```

Peer dependencies:

```bash
pnpm add react react-dom
```

React 18 and 19 are both supported.

## Quick Start

Wrap your application with `Root` to initialize the design system:

```tsx
import { Root, Button, TextInput, Space } from '@cube-dev/ui-kit';

function App() {
  return (
    <Root>
      <Space flow="column" gap="2x" padding="4x">
        <TextInput label="Name" placeholder="Enter your name" />
        <Button type="primary" onPress={() => console.log('clicked')}>
          Submit
        </Button>
      </Space>
    </Root>
  );
}
```

## Components

| Category | Components |
|----------|------------|
| **Layout** | Flex, Grid, Space, Flow, Panel, ResizablePanel, Prefix, Suffix |
| **Actions** | Button, Button.Group, Button.Split, Link, Menu, CommandMenu |
| **Content** | Text, Title, Paragraph, Card, Badge, Tag, Avatar, Alert, Skeleton, Placeholder, Disclosure, Divider, CopySnippet, PrismCode |
| **Fields** | TextInput, NumberInput, PasswordInput, SearchInput, TextArea, Select, ComboBox, Checkbox, RadioGroup, Switch, Slider, DatePicker, FileInput, ListBox, FilterListBox, FilterPicker, Picker |
| **Form** | Form, FieldWrapper, SubmitButton, ResetButton |
| **Overlays** | Dialog, AlertDialog, Modal, Tooltip, Toast, Notifications |
| **Navigation** | Tabs, FileTabs |
| **Status** | Spin, LoadingAnimation |

Browse all components with live examples in the [Storybook](https://cube-ui-kit.vercel.app/).

## Styling with Tasty

Cube UI Kit uses [Tasty](https://github.com/tenphi/tasty) — a styling engine that generates conflict-free CSS using mutually exclusive selectors.

Create custom styled components:

```tsx
import { tasty } from '@cube-dev/ui-kit';

const Card = tasty({
  styles: {
    display: 'flex',
    flow: 'column',
    padding: '4x',
    gap: '2x',
    fill: '#surface',
    border: '#border',
    radius: '1r',

    Title: { preset: 'h3', color: '#primary' },
    Content: { preset: 't2', color: '#text' },
  },
  elements: { Title: 'h2', Content: 'div' },
});
```

Style properties support state-driven values:

```tsx
const StatusBadge = tasty({
  styles: {
    padding: '1x 2x',
    radius: 'round',
    fill: {
      '': '#surface',
      'type=success': '#success-bg',
      'type=error': '#danger-bg',
    },
  },
});
```

## Development

### Prerequisites

- Node.js >= 22.14.0
- pnpm >= 10

### Scripts

```bash
pnpm storybook        # Start Storybook dev server on port 6060
pnpm build            # Build the library (tsdown, unbundled ESM)
pnpm test             # Run all tests (Vitest)
pnpm test -- Button   # Run tests matching "Button"
pnpm fix              # Lint and format (ESLint + Prettier)
pnpm size             # Check bundle size limits
pnpm chromatic        # Run visual regression tests
```

### Project Structure

```
src/
├── components/
│   ├── actions/       # Button, Link, Menu, CommandMenu, ...
│   ├── content/       # Card, Badge, Tag, Alert, Skeleton, ...
│   ├── fields/        # TextInput, Select, ComboBox, ...
│   ├── form/          # Form, FieldWrapper, SubmitButton, ...
│   ├── layout/        # Flex, Grid, Space, Flow, Panel, ...
│   ├── navigation/    # Tabs
│   ├── organisms/     # FileTabs, StatsCard
│   ├── overlays/      # Dialog, Tooltip, Toast, ...
│   └── status/        # Spin, LoadingAnimation
├── icons/             # 130+ icon components (Tabler-based + custom)
├── stories/           # Storybook guides and documentation
├── tasty/             # Tasty integration utilities
├── tokens/            # Design tokens
└── index.ts           # Public API barrel export
docs/
└── tasty/             # Tasty styling engine documentation
```

Each component follows a standard file layout:

```
ComponentName/
├── ComponentName.tsx          # Implementation
├── ComponentName.stories.tsx  # Storybook stories
├── ComponentName.docs.mdx     # Documentation
├── ComponentName.test.tsx     # Tests
└── index.tsx                  # Re-exports
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for commit conventions, branch naming, PR workflow, and changeset instructions.

## License

[MIT](./LICENSE) — Cube Dev, Inc.
