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

Input components expose their validation state through **one** story named `Validation` that renders the valid case and the invalid case together. Do not add separate `Valid`, `Invalid`, `ValidationStates` or `WithValidation` stories.

```tsx
export const Validation: StoryFn<CubeComponentProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Component {...args} label="Valid" isValid />
    <Component {...args} label="Invalid" isInvalid />
  </Space>
);
```

Pull the `isInvalid` / `isValid` argTypes from `VALIDATION_ARGS` in `src/stories/FormFieldArgs.ts` instead of declaring them inline.

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

A state that only exists during an interaction — an open tooltip, a hover or focus style, an expanded overlay — is invisible to Chromatic unless a `play` function puts the story into it. Chromatic runs `play` before it snapshots, so the state it leaves behind is what gets captured and diffed. A story whose whole point is such a state must drive it:

```tsx
const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const DisabledWithTooltip: StoryFn<CubeButtonProps> = () => (
  <Button
    qa="DisabledButton"
    isDisabled
    // `delay: 0` only so the snapshot does not depend on the open delay
    tooltip={{ title: 'Not enough permissions', delay: 0 }}
  >
    Delete project
  </Button>
);

DisabledWithTooltip.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // `TooltipProvider` wires the trigger up in a mount effect, so a hover fired
  // before that lands is dropped with nothing to replay it.
  await timeout(250);

  const button = await canvas.findByTestId('DisabledButton');

  // React Aria opens a tooltip only when the last interaction came from a
  // pointer, and it learns that from a mouse move — which the leading
  // `unhover` provides. Without it the first hover of the page is ignored.
  await userEvent.unhover(button);
  await userEvent.hover(button);

  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};
```

Every line of that recipe is load-bearing for a tooltip. Two independent things make a hover fired from `play` do nothing, and both fail silently — the story renders, the snapshot just shows no tooltip:

- **The trigger is not wired yet.** `TooltipProvider` renders its child without trigger props until its mount effect flips `rendered`. A hover that lands before that has no handler to reach, and nothing replays it later. Wait ~250ms first (`timeout(250)`), as the other tooltip stories do.
- **React Aria has no interaction modality yet.** It opens a tooltip only when the last interaction came from a pointer, which it learns from a mouse move on the document. `userEvent.hover` fires `mouseEnter` _before_ its `mouseMove`, so the page's first hover is ignored. The leading `unhover` moves the pointer over the body and supplies that move.

Then:

- Give the target a `qa` and find it with `findByTestId`, so the story does not depend on the order of roles on the page.
- Pass `delay: 0` in the tooltip config. The default 250ms open delay is real time the snapshot would otherwise have to wait out, and it makes any retry racy.
- End on an `await waitFor(...)` assertion for the state you want captured. It doubles as the wait Chromatic needs — a snapshot taken before the overlay has mounted is a flaky diff.
- Drive **one** element per story. Hovering a second one closes the first, and only the final state is snapshotted, so a story showing several variants should hover the most interesting one.
- Chromatic is the only real check on a `play` function: it fails the build with "component threw an error during testing" when one throws. A local render test can pass while the story fails, because the mount-effect timing above only shows up in Storybook.

## The Snapshot Budget

Chromatic bills per snapshot, and a snapshot is one story. Every story you add is a recurring cost on every build for as long as it exists, so a story earns its snapshot by showing something no other story shows. Plenty of stories do not, and they are not obvious from the name:

- **Behaviour demos.** Whatever a `Controlled` story proves happens in a `useState` the camera cannot see. At rest it renders the same tree as `Default`.
- **Props that only matter during an interaction.** `compact`, `isResizable`, `disabledKeys`, `showGridLines="drag"`, `hideOnClose`, `focusOnHover` — none of them paint anything until the user drags, opens or hovers.
- **API twins.** `DynamicSections` next to `WithSections`, `WithItemsProp` next to `Default`: same output, different way of building it.
- **Values that are already the default.** A `Modal` story for a dialog whose default type is `modal`, a `SizeMedium` for a component whose default size is medium.

For those, keep the story — it still belongs in the sidebar and in the docs page — and opt the _photograph_ out:

```tsx
import { NO_SNAPSHOT } from '../../../stories/chromatic';

export const Controlled = Template.bind({});
// Renders the same field as `Default`; the story is about the state hook.
Controlled.parameters = NO_SNAPSHOT;

// Or, merged with parameters the story already has:
export const GridLines = Template.bind({});
GridLines.parameters = {
  // `showGridLines="drag"` paints nothing until a drag starts.
  ...NO_SNAPSHOT,
  docs: { description: { story: '…' } },
};
```

Always say **why** in a comment next to it. "This is a duplicate of X" is a claim that stops being true when X changes, and the next person needs to be able to check it.

When in doubt, keep the snapshot. A missed regression costs more than an extra photograph.

### Prefer One Matrix Over N Near-Copies

Where several stories differ only in one enum value — themes, shapes, sizes — one story that sweeps the axis is both cheaper and a better review artefact: an inconsistency between two themes is visible in a single image and invisible across two. `Alert` is the worked example (`Themes`, `Shapes`), and the `Validation` story above follows the same shape.

Merge only when the merged view reads better. If the docs page needs each variant in its own section with its own prose, keep the stories separate and use `NO_SNAPSHOT` instead — the saving is identical and the docs stay intact.

### Measuring It

Two scripts read the built Storybook, so run `pnpm build-storybook` first.

```bash
pnpm chromatic:duplicates
```

Renders every story in real Chromium — waiting for `play` to finish, exactly as Chromatic does — and fingerprints the result by markup and by pixels. Stories sharing a fingerprint are reported as a group: that is proof two snapshots are paying for one image. It also lists stories **named for an overlay that never opened** — a `WithTooltip` or `InPopover` with no `play` function and no `tooltip`/`dialog`/`menu` role on the page. Those are the ones to fix rather than opt out: give them a `play` function (see above) so they finally show what they are named for.

That second list is a heuristic over story names, so it has honest false positives — a `FieldWrapper / WithTooltip` whose subject is where the info badge sits in the label row, an `OverlayPanel` that renders open from the start, a `Skeleton / Menu` that is a skeleton. When you have looked and the overlay genuinely is not what the story shows, say so in a comment above it and the report stops asking:

```tsx
// chromatic-overlay-reviewed: the badge, not the tooltip, is the subject
export const WithTooltip: Story = { … };
```

Both lists are meant to reach zero and stay there. An entry nobody can act on is an entry everybody learns to skip.

```bash
pnpm chromatic:report
```

Reports the snapshot inventory and the TurboSnap blast radius — how much of the suite one changed file drags in. `pnpm chromatic:check` is the same thing as a pass/fail gate and runs in CI.

### Keep Imports Out of the Root Decorator's Tree

TurboSnap (`onlyChanged: true`) reruns only the stories that depend on the files a PR touched — except for files reachable from `.storybook/preview.jsx`, which wraps every story in `<Root>`. A change there could affect anything, so Chromatic gives up and rebuilds all of it.

That set should stay small, and a single barrel import inside it is enough to blow it open: `import { ItemButton } from '../../actions'` pulls in `actions/index.ts`, which pulls in `Menu`, `CommandMenu`, `ButtonSplit` and everything they import. Inside `Root`'s dependency tree, import the defining file directly:

```tsx
// Drags the whole `actions` barrel — and, through it, most of the library.
import { ItemButton } from '../../actions';

// Pulls in one component.
import { ItemButton } from '../../actions/ItemButton/ItemButton';
```

`pnpm chromatic:check` fails when that set grows past its budget, which is the only thing that would ever notice.

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
