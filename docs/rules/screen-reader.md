# Screen reader testing — `@guidepup/virtual-screen-reader`

Detail behind the summary in [`AGENTS.md`](../../AGENTS.md#hearing-what-a-screen-reader-says). [`@guidepup/virtual-screen-reader`](https://www.guidepup.dev/docs/virtual) builds the accessibility tree a screen reader would — names, roles, states, descriptions, `aria-modal` containment, live regions — and reports what it would speak. It reads only the DOM, so it runs unchanged in jsdom and in Chromium.

It answers what a role query cannot: an icon read out as an unnamed graphic, an error message the field never describes, an announcement that never fires, a reading order that wanders out of a dialog. It is a simulator, not a screen reader. Use it to catch regressions and to check a claim before you make it; sign-off on a new pattern still needs VoiceOver or NVDA.

## Ad hoc: `pnpm probe render --sr`

The quickest answer to "what does a screen reader say here?" is one probe call. Like the rest of the [probe](probe.md), use it as freely as you like.

```bash
pnpm probe render --sr <<'TSX'
import { Button, CloseIcon } from '@cube-dev/ui-kit';

<>
  <Button>Save</Button>
  <Button icon={<CloseIcon />} />
</>
TSX
```

```
=== SCREEN READER — reading the page ===
document
button, Save
button
end of document
```

The second button has no name: its icon is `aria-hidden` and nothing else labels it, so a screen reader user hears only "button". The markup follows the reading in the output; the CSS is left out under `--sr` and kept in `--json`.

To hear an interaction, export `play` from the snippet. It runs after the mount with `{ reader, screen, userEvent, waitFor, within }`, where `reader` is the virtual screen reader. `--sr` then prints what the reader said during `play`, followed by a reading of the page `play` left behind:

```bash
pnpm probe render --sr <<'TSX'
import { Button, Content, Dialog, DialogTrigger, Header, Title } from '@cube-dev/ui-kit';

export async function play({ reader, waitFor }) {
  await reader.press('Tab');
  await reader.press('Enter');
  await waitFor(async () => {
    if (!(await reader.lastSpokenPhrase()).startsWith('dialog')) throw new Error('not open yet');
  });
}

<DialogTrigger>
  <Button>Rename</Button>
  <Dialog>
    <Header><Title>Rename file</Title></Header>
    <Content>Pick a new name</Content>
  </Dialog>
</DialogTrigger>
TSX
```

```
=== SCREEN READER — during play() ===
document
button, Rename
dialog, Rename file

=== SCREEN READER — reading the page ===
document
button, Rename
dialog, Rename file
button, Dismiss
…
```

`play` works without `--sr` too, `reader` included: the HTML and CSS are then captured after it, which is how to probe an open popover or a focused option. `--sr` adds what the reader said. All of this works on both tiers: `pnpm probe:browser render --sr` reads the page after real layout and styles.

## In specs

Import the helpers from [`src/test/screen-reader.ts`](../../src/test/screen-reader.ts) by path, not through the `src/test` barrel, so the package stays out of the specs that do not use it.

- **`readWithScreenReader(container = document.body)`** reads the container top to bottom and returns every phrase. It is the assertion for names, descriptions, states and reading order.
- **`startScreenReader(container = document.body)`** starts a session and returns the reader, for flows driven by keys, focus or live regions. The test stops it when it finishes, pass or fail.

Never call `virtual.start()` from the package directly. It exports a singleton, and `start()` never stops the previous session: an unstopped session's observer and `focusin` listener stay on `document.body` and write into the next spec's log.

```tsx
import { startScreenReader } from '../../../test/screen-reader';

it('speaks the dialog by its title, and the trigger again once it closes', async () => {
  renderWithRoot(<RenameDialog />);
  const reader = await startScreenReader();

  await reader.press('Tab');
  await reader.press('Enter');
  await waitFor(async () =>
    expect(await reader.lastSpokenPhrase()).toBe('dialog, Rename file'),
  );

  await reader.press('Escape');
  await waitFor(async () =>
    expect(await reader.lastSpokenPhrase()).toBe('button, Rename'),
  );
});
```

For a live region, clear the log before the step and assert with `toContain`; see "speaks the same rejection again when it repeats" in `TagInput.test.tsx`.

Write a screen reader spec when what the user hears is the behavior under test: an announcement, a name or description association, reading order, modal containment. Ordinary ARIA wiring is still a `getByRole` query, and a one-off question is still a probe.

## Reading the phrases

A phrase is `role, name, value, description, states…`, with empty parts left out: `option, Apple, not selected, position 1, set size 2`. A container is announced on entry and again as `end of navigation` on exit, and the container itself opens and closes the reading (`document` … `end of document`). Live regions arrive prefixed with their politeness: `polite: Added two`, `assertive: …`. An `aria-modal` dialog carries `modal` among its states.

A phrase that names no role at all is usually plain text or a labelled generic element. `graphics-document` is an exposed `<svg>`: decorative icons need `aria-hidden`, which the icons built by `wrapIcon` already set.

## Limits

Know these before trusting a silence or a repeat:

- **`press()` re-focuses the element under the cursor first.** When a component moves focus asynchronously, wait until the move is spoken before the next press, or the press lands on the element focus just left.
- **Plain fake timers hang `press()` and `type()`.** Use `vi.useFakeTimers({ shouldAdvanceTime: true })`, as specs here already do for `userEvent`.
- **`aria-activedescendant` is not followed.** Arrowing through a combobox, menu or listbox that keeps focus in its input speaks no option; the input is spoken again with `active descendant …` only when a `press()` changes it synchronously. Assert the attribute and the element it points at instead.
- **A region inserted with its text already inside is silent.** The package only announces a change within a live region that already existed. Real screen readers do announce an inserted `role="alert"`, so for one of those, assert that it is present rather than spoken.
- **Atomic live regions speak on any change.** In a `role="status"` or `role="alert"` region, or one with `aria-atomic="true"`, changing only an attribute — a `data-*` mod, a `class` — logs the whole region again, where a real screen reader stays silent; replacing a node there logs it twice. So to prove a message is announced again, also assert that its node was replaced, as the paste spec in `TagInput.test.tsx` does with `not.toBe(first)`, and assert with `toContain` rather than counting.
- **Adjacent text nodes are separate items.** `<p>Added {n} items</p>` reads as `paragraph`, `Added`, `3`, `items`, and an element named by its content is read again through its parts: `button, 3 files`, `3`, `files`, `end of button, 3 files`. A field label reads its text twice for the same reason. Neither is a duplicated label.
- **The reading starts at the top of the container.** A ui-kit modal, fullscreen or tray `Dialog` hides the page behind it with `aria-hidden` while it is open, so reading the page reads just the dialog and the lists and popovers opened from it. A popover or panel dialog leaves the page in the reading; pass the dialog as the container to read just the dialog.
- **`next()`, `previous()` and `perform()` speak a dialog element twice** in the package's own log, when they land on it. `readWithScreenReader` keeps one; a `reader` log keeps both. Focus moving into the dialog speaks it once.
- **`position` and `set size` count DOM siblings.** An item wrapped in its own element, as ui-kit's tabs are, reads `position 1, set size 1` however many there are. Trust a real screen reader there, or `aria-posinset` and `aria-setsize` when the component sets them.
- **Visibility comes from computed styles.** jsdom honours a `display: none` from tasty styles, but not one inside a rule it skips — `@media` and container queries, `@container style()` among them — so responsive hiding is still read there. Read on the browser tier when visibility depends on one.
- **Phrases are the package's, not a screen reader's.** Verbosity, order of states and wording differ between VoiceOver, NVDA and JAWS. Assert on what matters to the behavior, and confirm a new pattern with a real screen reader.
