import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { TextArea } from './TextArea';

/**
 * A line height tighter than the font's natural line box. This is the case the
 * row arithmetic used to get wrong: a textarea's `height: auto` height comes
 * from the font's own metrics, so dividing it by a tighter `line-height`
 * rounded a single line up to two rows.
 */
const TIGHT_TYPOGRAPHY = { fontSize: '16px', lineHeight: '16px' } as const;

const input = () => screen.getByTestId('area') as HTMLTextAreaElement;

/** The height one row of this textarea should occupy, borders included. */
function rowMetrics(el: HTMLTextAreaElement) {
  const style = getComputedStyle(el);
  const lineHeight = parseFloat(style.lineHeight);
  const box =
    style.boxSizing === 'border-box'
      ? (parseFloat(style.paddingTop) || 0) +
        (parseFloat(style.paddingBottom) || 0) +
        (parseFloat(style.borderTopWidth) || 0) +
        (parseFloat(style.borderBottomWidth) || 0)
      : 0;

  return { lineHeight, box };
}

const heightInRows = (el: HTMLTextAreaElement) => {
  const { lineHeight, box } = rowMetrics(el);

  return (el.getBoundingClientRect().height - box) / lineHeight;
};

/**
 * `autoSize` geometry, in a real browser.
 *
 * jsdom reports 0 for every box and has no line boxes, so the row arithmetic
 * here — the part that decided a single line was two rows tall — is invisible
 * to the jsdom suite.
 */
describe('TextArea autoSize', () => {
  it('gives a single line exactly one row', async () => {
    renderWithRoot(
      <TextArea
        autoSize
        qa="area"
        rows={1}
        label="Note"
        defaultValue="one"
        inputStyles={TIGHT_TYPOGRAPHY}
      />,
    );

    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(1, 1));
  });

  it('grows with the content and shrinks back', async () => {
    renderWithRoot(
      <TextArea
        autoSize
        qa="area"
        rows={1}
        label="Note"
        inputStyles={TIGHT_TYPOGRAPHY}
      />,
    );

    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(1, 1));

    await userEvent.click(input());
    await userEvent.keyboard('one{Enter}two{Enter}three');

    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(3, 1));

    await userEvent.clear(input());

    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(1, 1));
  });

  it('stops growing at maxRows', async () => {
    renderWithRoot(
      <TextArea
        autoSize
        qa="area"
        rows={1}
        maxRows={2}
        label="Note"
        defaultValue={'one\ntwo\nthree\nfour'}
        inputStyles={TIGHT_TYPOGRAPHY}
      />,
    );

    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(2, 1));
  });

  it('counts a trailing newline as a row', async () => {
    renderWithRoot(
      <TextArea
        autoSize
        qa="area"
        rows={1}
        label="Note"
        inputStyles={TIGHT_TYPOGRAPHY}
      />,
    );

    await userEvent.click(input());
    await userEvent.keyboard('one{Enter}');

    expect(input().value).toBe('one\n');
    // The caret sits on an empty second row, so the box has to make room for
    // it. The mirror is a textarea rather than a div precisely so that it lays
    // a trailing newline out the same way the live field does.
    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(2, 1));
  });

  it('honours rows as a minimum', async () => {
    renderWithRoot(
      <TextArea
        autoSize
        qa="area"
        rows={3}
        label="Note"
        defaultValue="one"
        inputStyles={TIGHT_TYPOGRAPHY}
      />,
    );

    await waitFor(() => expect(heightInRows(input())).toBeCloseTo(3, 1));
  });
});
