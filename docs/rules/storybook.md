# Storybook & Docs Authoring

## Imports

### Stories Files (.stories.tsx)
- Import types: `import type { Meta, StoryObj } from '@storybook/react-vite';`
- Import `StoryFn` for custom template functions
- For interactive tests: `import { userEvent, within } from 'storybook/test';` (NOT from `@testing-library/react`)

### Documentation Files (.docs.mdx)
- `import { Meta, Canvas, Story } from '@storybook/addon-docs/blocks';`
  - `Meta` - Define meta information with `<Meta of={StoriesImport} />`
  - `Canvas` - Display story with code panel
  - `Story` - Reference specific story with `<Story of={StoriesImport.StoryName} />`
  - `ArgTypes` - Display argument types documentation
  - `Source` - Show code examples
- Import stories: `import * as ComponentStories from './Component.stories';`

## Meta Configuration

Use `satisfies Meta<typeof Component>` or `as Meta<typeof Component>`:

```tsx
const meta = {
  title: 'Category/ComponentName',
  component: ComponentName,
  subcomponents: { Item: Component.Item }, // For compound components
  args: { /* common default args */ },
  parameters: { controls: { exclude: baseProps } }, // Exclude base design system props
  argTypes: { /* ... */ }
} satisfies Meta<typeof Component>;

export default meta;
```

## ArgTypes Structure

Group by categories with comments:
- `/* Content */` - children, labels, placeholders, icons
- `/* Selection */` - selectedKey, defaultSelectedKey
- `/* Behavior */` - filter, trigger modes, loading states
- `/* Presentation */` - type, theme, size, direction
- `/* State */` - isDisabled, isRequired, isReadOnly, isInvalid, isValid, autoFocus
- `/* Events */` - onPress, onChange, onSelectionChange, onBlur, onFocus

### ArgType Format

```tsx
propName: {
  control: { type: 'radio' | 'boolean' | 'text' | 'number' | null },
  options: ['option1', 'option2'], // For radio/select
  description: 'Clear description',
  table: {
    defaultValue: { summary: 'value' },
    type: { summary: 'string' }
  }
}
```

- Use `control: { type: null }` to disable controls (for functions, complex types)
- Use `action: 'event-name'` for event handlers
- Use `action: (e) => ({ type: 'event', data })` for custom action logging

## Stories

### Named Exports (Preferred)
```tsx
export const StoryName = (args) => <Component {...args} />;
```

### Story Objects with CSF3
```tsx
export const StoryName: StoryObj<typeof Component> = {
  render: (args) => <Component {...args} />,
  args: { /* story-specific args */ },
  play: async ({ canvasElement }) => {
    // Interactive test
  }
};
```

### Templates (Legacy Pattern)
```tsx
const Template: StoryFn<ComponentProps> = (args) => <Component {...args} />;

export const Story = Template.bind({});
Story.args = { /* ... */ };
```

### Validation Story

Input components expose their validation state through **one** story named `Validation` that renders the
valid case and the invalid case together. Do not add separate `Valid`, `Invalid`, `ValidationStates` or
`WithValidation` stories.

```tsx
export const Validation: StoryFn<CubeComponentProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Component {...args} label="Valid" isValid />
    <Component {...args} label="Invalid" isInvalid />
  </Space>
);
```

Pull the `isInvalid` / `isValid` argTypes from `VALIDATION_ARGS` in `src/stories/FormFieldArgs.ts` instead
of declaring them inline.

## Testing with Play Functions

```tsx
export const Interactive: StoryObj = {
  render: () => { /* ... */ },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('button');
    await userEvent.click(element);
  }
};
```

**Important:** Always import `userEvent` and `within` from `'storybook/test'` in story files. This ensures they respect Storybook's configuration (e.g., `testIdAttribute: 'data-qa'` set in `.storybook/preview.jsx`). Do NOT use `@testing-library/react` imports in stories.

### Interaction-Only States Need a Play Function

A state that only exists during an interaction — an open tooltip, a hover or focus style, an expanded
overlay — is invisible to Chromatic unless a `play` function puts the story into it. Chromatic runs
`play` before it snapshots, so the state it leaves behind is what gets captured and diffed. A story
whose whole point is such a state must drive it:

```tsx
export const DisabledWithTooltip: StoryFn<CubeButtonProps> = () => (
  <Button qa="DisabledButton" isDisabled tooltip="Not enough permissions">
    Delete project
  </Button>
);

DisabledWithTooltip.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.findByTestId('DisabledButton');

  // React Aria opens a tooltip only when the last interaction came from a
  // pointer, and it learns that from a mouse move — which the leading
  // `unhover` provides. Without it the first hover of the page is ignored.
  await userEvent.unhover(button);
  await userEvent.hover(button);

  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};
```

- Give the target a `qa` and find it with `findByTestId`, so the story does not depend on the order of
  roles on the page.
- Always `unhover` before `hover`. `userEvent.hover` alone fires `mouseEnter` before its `mouseMove`,
  so on the first interaction of the page React Aria's modality is still unset and the tooltip stays
  closed. The `unhover` moves the pointer over the body first, which sets it.
- End on an `await waitFor(...)` assertion for the state you want captured. It doubles as the wait
  Chromatic needs — a snapshot taken before the overlay has mounted is a flaky diff.
- Drive **one** element per story. Hovering a second one closes the first, and only the final state
  is snapshotted, so a story showing several variants should hover the most interesting one.

## MDX Documentation Structure

```mdx
import { Meta, Canvas, Story } from '@storybook/addon-docs/blocks';
import * as ComponentStories from './Component.stories';

<Meta of={ComponentStories} />

# ComponentName

Component description

## When to Use
- Use case 1
- Use case 2

## Component

<Story of={ComponentStories.Default} />

---

### Properties

- **`propName`** `type` (default: `value`) — Description of the property
- **`anotherProp`** `boolean` (default: `false`) — Description of the property

### Base Properties

Supports [Base properties](/docs/getting-started-base-properties--docs)

### Field Properties

[For input components only]

Supports all [Field properties](/docs/getting-started-field-properties--docs)

## Examples

### Example Section

<Story of={ComponentStories.ExampleStory} />
```

## Common Patterns

- Use `baseProps` exclusion for design system props
- Define default `width` in meta `args` for form components
- Create size/state matrix stories to show all variants
- Use `Space` component for layout in template functions
- Export type: `type Story = StoryObj<typeof meta>;`
