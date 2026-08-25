/**
 * Chromatic parameters shared by story files.
 *
 * Chromatic bills per snapshot, and a snapshot is one story. Not every story
 * earns one: a lot of them exist to demonstrate *behaviour* (a controlled
 * value, an event handler, a hotkey, an async load) and render, at rest,
 * exactly what a neighbouring story already renders. Photographing those costs
 * money and buys no coverage — a diff can only ever appear in the story that
 * owns the visual.
 *
 * `NO_SNAPSHOT` opts a story out of the photograph while leaving everything
 * else intact: it still appears in the sidebar, still runs its `play` function
 * in Storybook, and still renders inside the `.docs.mdx` page that documents
 * it. Only Chromatic skips it.
 *
 * ```tsx
 * export const Controlled: StoryFn<CubeSwitchProps> = () => { ... };
 *
 * // Renders the same switch as `Default`; the story is about the state hook.
 * Controlled.parameters = NO_SNAPSHOT;
 * ```
 *
 * Merge it when the story already carries parameters:
 *
 * ```tsx
 * Controlled.parameters = {
 *   ...NO_SNAPSHOT,
 *   docs: { description: { story: '…' } },
 * };
 * ```
 *
 * ## When to use it
 *
 * - **Behaviour demos.** The story's point is an interaction — toggling,
 *   typing, dragging, an imperative API call. Whatever it proves happens after
 *   the snapshot is taken.
 * - **Controlled/uncontrolled twins.** `Controlled` next to `Default` renders
 *   an identical tree; the difference lives in a `useState`.
 * - **Interaction-only states with no `play`.** A story called `WithTooltip` or
 *   `WithContextMenu` that never opens the overlay photographs the closed
 *   trigger — which the default story already covers. Either give it a `play`
 *   (see [storybook.md](../../docs/rules/storybook.md)) so it captures the
 *   state it is named for, or opt it out. Do not leave it snapshotting nothing.
 * - **Subsets of a matrix.** A single `Small` button when a `Sizes` story
 *   already sweeps every size in one image.
 *
 * ## When NOT to use it
 *
 * If the story is the only place a visual appears, it needs the snapshot —
 * however boring it looks. When in doubt, keep the snapshot: a missed
 * regression costs more than an extra photograph.
 */
export const NO_SNAPSHOT = {
  chromatic: { disableSnapshot: true },
} as const;
