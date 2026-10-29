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
- **Props that only matter during an interaction.** `disabledKeys`, `hideOnClose`, `focusOnHover` — none of them paint anything until the user opens or hovers.
- **API twins.** `DynamicSections` next to `WithSections`, `WithItemsProp` next to `Default`: same output, different way of building it.
- **Values that are already the default.** A `Modal` story for a dialog whose default type is `modal`, a `SizeMedium` for a component whose default size is medium.

For those, keep the story — it still belongs in the sidebar and in the docs page — and opt the _photograph_ out:

```tsx
import { NO_SNAPSHOT } from '../../../stories/chromatic';

export const Controlled = Template.bind({});
// Renders the same field as `Default`; the story is about the state hook.
Controlled.parameters = NO_SNAPSHOT;

// Or, merged with parameters the story already has:
export const FocusOnHover = Template.bind({});
FocusOnHover.parameters = {
  // `focusOnHover` paints nothing until the pointer moves over an option.
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

## The Accessibility Baseline

`pnpm diagnostics:a11y` renders every story the way `chromatic:duplicates` does (real Chromium, `play` finished, DOM settled) and runs [axe-core](https://github.com/dequelabs/axe-core) on it against WCAG 2.2 A and AA plus axe's best practices. Rules about a whole page (`region`, `landmark-one-main`, `page-has-heading-one` and the like) are off, because a story is one component and not a page. So is `label-content-name-mismatch`: it reads an option's description and hotkey as part of its label, so it fails every described ListBox or Menu item. The list and the reasons are in `OFF_RULES` in the script.

`scripts/a11y-baseline.json` records how many elements fail each rule in each story. CI runs `--check`, which fails when a story fails a rule on more elements than its entry allows. A new story has no entry, so it has to come in clean.

```bash
pnpm build-storybook
pnpm diagnostics:a11y --filter Actions/Button --verbose   # what fails, on which elements
pnpm diagnostics:a11y --check                              # what CI runs, in three shards
pnpm diagnostics:a11y --check --shard 2/3                  # one CI shard
pnpm diagnostics:a11y --filter Actions/Button --update     # record a fix
```

- **Fix, then lower the baseline.** After a fix, run `--update` and commit the lower numbers. With `--filter` it rewrites only the entries of the stories it ran. `--check` points out counts that dropped without being recorded.
- **Violations in a story count.** An icon-only `Button` without `aria-label` in a story is the story's bug, and fixing the story is the fix. Consumers copy stories.
- **Raising the baseline is a decision.** `--update` records growth too, and the diff shows it. Do that only for an axe false positive or an axe-core upgrade, and say which in the PR. axe-core is pinned exactly for that reason: a new version finds different things, so it lands together with its baseline.
- **A changed count is rendered twice.** A story whose counts differ from the baseline is rendered again on its own, and only a change both renders agree on is reported or recorded. A story that settles differently under load neither fails CI nor slips a lower number into the baseline.
- **Linux is the reference.** CI and Chromatic render on Linux, and the baseline holds Linux's counts. Text in a system font stack (`system-ui`, `ui-monospace`) gets other fonts on macOS, so a geometry rule such as `target-size` can count differently there: the DateInput segments pass locally and fail in CI. Where a local run and CI disagree, record CI's counts. The failing job prints each one.
- **What it cannot see.** tasty compiles a two-colour `fill` to a solid `linear-gradient` layer, and axe skips contrast over any background image ([tenphi/tasty#436](https://github.com/tenphi/tasty/issues/436)). The script replaces those layers with the colour they paint before axe runs. Contrast over real gradients, images and overlapping elements stays inconclusive: it is listed, not counted. Stories render in the light scheme only. What a screen reader announces needs [the virtual screen reader](screen-reader.md) or a real one.

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
- Size a whole input field with style props (`width`) in meta `args`, and the control alone with `controlWidth`; existing `fieldStyles` sizing still works
- Create size/state matrix stories to show all variants
- Use `Space` component for layout in template functions
- Export type: `type Story = StoryObj<typeof meta>;`
