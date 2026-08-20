import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { CommandTextArea } from './CommandTextArea';

const input = () => screen.getByTestId('prompt') as HTMLTextAreaElement;
const scroller = () => screen.getByTestId('scroller');

const heightInRows = (el: HTMLTextAreaElement) => {
  const style = getComputedStyle(el);
  const box =
    style.boxSizing === 'border-box'
      ? (parseFloat(style.paddingTop) || 0) +
        (parseFloat(style.paddingBottom) || 0) +
        (parseFloat(style.borderTopWidth) || 0) +
        (parseFloat(style.borderBottomWidth) || 0)
      : 0;

  return (
    (el.getBoundingClientRect().height - box) / parseFloat(style.lineHeight)
  );
};

/** Three rows of content, so the prompt sits above its own `rows` minimum. */
const GROWN_VALUE = 'one\ntwo\nthree';

/**
 * A chat layout: a scrolled transcript above, the prompt below, both sharing
 * one column, so anything that changes the prompt's height changes the
 * transcript's viewport.
 *
 * Two details make the perturbation observable:
 *
 * - The prompt starts **grown** (three rows of content against `rows={1}`).
 *   `height: auto` sizes a textarea from its `rows` attribute, so a prompt
 *   sitting at its minimum has nothing to collapse — the state that jitters is
 *   the everyday one where the user has typed a few lines.
 * - `overflow-anchor: none`. Chrome's scroll anchoring hides a transient scroll
 *   perturbation by undoing it, so with anchoring left on this assertion passes
 *   whether or not the perturbation happens.
 */
function ChatHarness() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '320px',
        width: '360px',
      }}
    >
      <div
        data-qa="scroller"
        style={{ flex: 1, overflow: 'auto', overflowAnchor: 'none' }}
      >
        {Array.from({ length: 40 }, (_, index) => (
          <p key={index} style={{ margin: 0, overflowAnchor: 'none' }}>
            Message {index}
          </p>
        ))}
      </div>
      <CommandTextArea
        autoSize
        aria-label="Prompt"
        qa="prompt"
        rows={1}
        maxRows={10}
        defaultValue={GROWN_VALUE}
      />
    </div>
  );
}

describe('CommandTextArea autoSize', () => {
  it('gives a single line exactly one row', async () => {
    renderWithRoot(
      <CommandTextArea
        autoSize
        aria-label="Prompt"
        qa="prompt"
        rows={1}
        defaultValue="one"
        inputStyles={{ fontSize: '16px', lineHeight: '16px' }}
      />,
    );

    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(1, 1));
  });

  // CUB-4042: measuring the live textarea (`height: auto` → read `scrollHeight`
  // → restore) collapsed the prompt mid-keystroke, which grew the transcript's
  // viewport and moved its scroll offset. The conversation visibly bounced on
  // every keystroke.
  it('does not move a sibling scroll container while typing', async () => {
    renderWithRoot(<ChatHarness />);

    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(3, 1));

    const container = scroller();

    container.scrollTop = container.scrollHeight;

    await waitFor(() => expect(container.scrollTop).toBeGreaterThan(0));

    const before = container.scrollTop;

    // Appending to the last line keeps the row count — and so the prompt's own
    // height — unchanged, leaving the transient as the only thing that could
    // move the transcript.
    await userEvent.click(input());
    await userEvent.keyboard('{End}x');

    expect(input().value).toBe(`${GROWN_VALUE}x`);
    expect(heightInRows(input())).toBeCloseTo(3, 1);
    expect(container.scrollTop).toBe(before);
  });
});
