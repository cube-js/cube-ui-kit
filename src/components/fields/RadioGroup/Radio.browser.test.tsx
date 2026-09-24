import { userEvent } from 'vitest/browser';

import { CheckIcon } from '../../../icons/CheckIcon';
import { CloseIcon } from '../../../icons/CloseIcon';
import { renderWithRoot, screen, waitFor } from '../../../test';

import { Radio } from './Radio';

const LONG_LABEL = 'An option label far too long for its button';

function tooltipTexts() {
  return Array.from(document.querySelectorAll('[role="tooltip"]')).map(
    (tip) => tip.textContent,
  );
}

/**
 * A button radio's `tooltip` defaults to the auto form: a tooltip carrying the
 * label, only while the label is truncated. It never fired (CUB-5017). The
 * radio handed its native input to `Item` as label content, so the label was
 * never the plain string auto mode requires, and every grid column was
 * `max-content`, so the label could not truncate in the first place.
 *
 * jsdom lays nothing out, so truncation is only observable in a real browser.
 */
describe('Radio.Button auto tooltip', () => {
  // React Aria ignores a hover until a pointer move has set the interaction
  // modality, so the first hover of a fresh page opens no tooltip for any
  // trigger. Move the pointer once before measuring anything.
  beforeAll(async () => {
    await userEvent.hover(document.body);
  });

  it('truncates the label of a radio narrower than it, and shows it in a tooltip', async () => {
    renderWithRoot(
      <Radio.ButtonGroup aria-label="Group">
        <Radio.Button value="a" width="80px">
          {LONG_LABEL}
        </Radio.Button>
        <Radio.Button value="b">Beta</Radio.Button>
      </Radio.ButtonGroup>,
    );

    const [button] = screen.getAllByTestId('RadioButton');
    const label = button.querySelector('[data-element="Label"]') as HTMLElement;

    expect(button.getBoundingClientRect().width).toBe(80);
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);

    await userEvent.hover(button);

    await waitFor(() => expect(tooltipTexts()).toEqual([LONG_LABEL]));
  });

  // The zero-minimum label column only gives way under pressure: a radio with
  // room for its label keeps sizing to it.
  it('leaves a label that fits untruncated', async () => {
    renderWithRoot(
      <Radio.ButtonGroup aria-label="Group">
        <Radio.Button value="a">Alpha</Radio.Button>
        <Radio.Button value="b">Beta</Radio.Button>
      </Radio.ButtonGroup>,
    );

    const [button] = screen.getAllByTestId('RadioButton');
    const label = button.querySelector('[data-element="Label"]') as HTMLElement;

    expect(label.scrollWidth).toBe(label.clientWidth);
  });
});

/**
 * A block description spans every column, and a spanning item's width goes to
 * the columns with an intrinsic minimum. Give the label column a zero minimum
 * in this layout too and the description's width lands in the empty icon /
 * prefix / suffix columns: the button grows to label PLUS description.
 */
describe('Radio.Button with a block description', () => {
  it('is as wide as the wider of label and description, not their sum', () => {
    renderWithRoot(
      <Radio.ButtonGroup aria-label="Group" size="large">
        <Radio.Button
          value="a"
          description="A block description"
          descriptionPlacement="block"
        >
          Yes
        </Radio.Button>
      </Radio.ButtonGroup>,
    );

    const button = screen.getByTestId('RadioButton');
    const label = button.querySelector('[data-element="Label"]')!;
    const description = button.querySelector('[data-element="Description"]')!;
    const text = document.createRange();

    text.selectNodeContents(description);

    expect(button.getBoundingClientRect().width).toBeLessThan(
      text.getBoundingClientRect().width + label.getBoundingClientRect().width,
    );
  });
});

/**
 * Whether a button radio's label truncates follows the room its group gets, so
 * it can change while the radio has focus. The auto tooltip used to wrap the
 * element only once the label truncated, which remounted the `<label>` and the
 * native input inside it — and dropped focus to the body.
 */
describe('Radio.Button whose label starts truncating while focused', () => {
  it('keeps focus on its input', async () => {
    renderWithRoot(
      <div data-qa="Box" style={{ width: 600 }}>
        <Radio.Tabs aria-label="Mode" defaultValue="a" width="100%">
          <Radio.Button value="a">{LONG_LABEL}</Radio.Button>
          <Radio.Button value="b">Beta</Radio.Button>
        </Radio.Tabs>
      </div>,
    );

    const input = screen.getAllByRole('radio')[0];

    await userEvent.keyboard('{Tab}');

    expect(input).toHaveFocus();

    screen.getByTestId('Box').style.width = '200px';

    const label = screen
      .getAllByTestId('RadioButton')[0]
      .querySelector('[data-element="Label"]') as HTMLElement;

    await waitFor(() =>
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth),
    );
    // The resize observer, then the re-render its overflow verdict causes.
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(input.isConnected).toBe(true);
    expect(input).toHaveFocus();
  });
});

/**
 * A radio's tooltip used to open on hover only. Its trigger props all landed on
 * the `<label>`, while keyboard focus goes to the native input inside it, and
 * React Aria ignores focus that bubbles up from a child — so the tooltip never
 * opened from the keyboard, and the focused input was never described by it.
 */
describe('Radio tooltip on keyboard focus', () => {
  it('opens on the focused option and follows arrow-key navigation', async () => {
    renderWithRoot(
      <>
        <button type="button">Before</button>
        <Radio.Tabs aria-label="Answer" defaultValue="yes">
          <Radio.Button
            value="yes"
            icon={<CheckIcon />}
            aria-label="Yes"
            tooltip="Accept the change"
          />
          <Radio.Button
            value="no"
            icon={<CloseIcon />}
            aria-label="No"
            tooltip="Reject the change"
          />
        </Radio.Tabs>
      </>,
    );

    const [yes, no] = screen.getAllByRole('radio');

    screen.getByRole('button', { name: 'Before' }).focus();
    await userEvent.keyboard('{Tab}');

    expect(yes).toHaveFocus();

    await waitFor(() => expect(tooltipTexts()).toEqual(['Accept the change']));

    const tooltip = screen.getByRole('tooltip');

    expect(yes.getAttribute('aria-describedby')?.split(' ')).toContain(
      tooltip.id,
    );

    await userEvent.keyboard('{ArrowRight}');

    expect(no).toHaveFocus();
    expect(no).toBeChecked();

    await waitFor(() => expect(tooltipTexts()).toEqual(['Reject the change']));
  });
});
