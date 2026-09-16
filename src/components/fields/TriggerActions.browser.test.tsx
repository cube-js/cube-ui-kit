import { FilterIcon } from '../../icons/FilterIcon';
import { renderWithRoot, screen, userEvent, waitFor } from '../../test';

import { FilterPicker } from './FilterPicker';
import { Picker } from './Picker';
import { Select } from './Select';

/**
 * The trailing run of a `Select` / `Picker` / `FilterPicker` trigger is an
 * absolutely positioned SIBLING of the `<button>`, laid over its end. The caret
 * lives in that run and yet has to open the popover, which only works because
 * the run is transparent to the pointer and the caret does not opt back in: the
 * press hit-tests through to the trigger underneath.
 *
 * None of that is observable in jsdom, which implements neither `pointer-events`
 * nor hit testing — a jsdom click dispatched at the caret bubbles to the trigger
 * whatever the CSS says, so the jsdom suite would pass against a build where the
 * caret is dead. These cases therefore have to run in a real browser, and they
 * click by COORDINATE rather than by element so the browser, not the test, picks
 * what gets hit.
 */

function centerOf(element: Element) {
  const rect = element.getBoundingClientRect();

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Whether a press at the centre of `element` would land inside `host`.
 *
 * `elementFromPoint` answers with the DEEPEST element at that point, so a hit on
 * the trigger reports whichever of its children happens to be painted there —
 * the label, an icon's `<path>`. What matters is only which control the press
 * belongs to.
 */
function pressLandsIn(element: Element, host: Element) {
  const { x, y } = centerOf(element);
  const target = document.elementFromPoint(x, y);

  return !!target && (target === host || host.contains(target));
}

async function clickAt(element: Element) {
  const { x, y } = centerOf(element);
  const target = document.elementFromPoint(x, y);

  if (!target) throw new Error('nothing to click at that point');

  await userEvent.click(target);
}

const pickerItems = [
  <Picker.Item key="1">Blue</Picker.Item>,
  <Picker.Item key="2">Red</Picker.Item>,
];

describe('trigger actions run', () => {
  it('lets a press on the caret reach the trigger and open the popover', async () => {
    renderWithRoot(
      <Picker aria-label="picker" defaultSelectedKey="1">
        {pickerItems}
      </Picker>,
    );

    const trigger = screen.getByTestId('PickerTrigger');
    const caret = document.querySelector('[data-element="ActionIcon"]')!;

    expect(caret).toBeInTheDocument();
    // The caret is outside the button in the DOM, so this is the whole test:
    // the browser must resolve a press at its centre to the trigger itself.
    expect(pressLandsIn(caret, trigger)).toBe(true);

    await clickAt(caret);

    await waitFor(() =>
      expect(screen.getByRole('listbox')).toBeInTheDocument(),
    );
  });

  it('lets a press in the run’s padding reach the trigger', async () => {
    renderWithRoot(
      <Picker aria-label="picker" defaultSelectedKey="1">
        {pickerItems}
      </Picker>,
    );

    const trigger = screen.getByTestId('PickerTrigger');
    const run = document.querySelector('[data-element="Actions"]')!;
    const rect = run.getBoundingClientRect();

    // 2px inside the run's right edge — inside its `$side-padding`, which used
    // to swallow the press.
    const target = document.elementFromPoint(
      rect.right - 2,
      rect.top + rect.height / 2,
    );

    expect(target && trigger.contains(target)).toBe(true);
  });

  it('keeps a custom action pressable, and does not open the popover with it', async () => {
    const onPress = vi.fn();

    renderWithRoot(
      <Picker
        aria-label="picker"
        defaultSelectedKey="1"
        actions={<Picker.Action qa="Reset" onPress={onPress} />}
      >
        {pickerItems}
      </Picker>,
    );

    const action = screen.getByTestId('Reset');

    // The action DOES opt back into pointer events, so it — not the trigger —
    // is what the browser finds there.
    expect(pressLandsIn(action, action)).toBe(true);

    await clickAt(action);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('keeps the clear button pressable while the popover is open', async () => {
    const onClear = vi.fn();

    renderWithRoot(
      <Picker
        isClearable
        aria-label="picker"
        defaultSelectedKey="1"
        onClear={onClear}
      >
        {pickerItems}
      </Picker>,
    );

    await userEvent.click(screen.getByTestId('PickerTrigger'));
    await waitFor(() =>
      expect(screen.getByRole('listbox')).toBeInTheDocument(),
    );

    const clear = screen.getByTestId('PickerClearButton');

    expect(pressLandsIn(clear, clear)).toBe(true);

    await clickAt(clear);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('opens FilterPicker from its caret', async () => {
    renderWithRoot(
      <FilterPicker aria-label="fp" defaultSelectedKey="1">
        <FilterPicker.Item key="1">Blue</FilterPicker.Item>
        <FilterPicker.Item key="2">Red</FilterPicker.Item>
      </FilterPicker>,
    );

    const trigger = screen.getByTestId('FilterPicker');
    const caret = document.querySelector('[data-element="ActionIcon"]')!;

    expect(pressLandsIn(caret, trigger)).toBe(true);

    await clickAt(caret);

    await waitFor(() =>
      expect(screen.getByRole('listbox')).toBeInTheDocument(),
    );
  });

  it('opens Select from its caret', async () => {
    renderWithRoot(
      <Select aria-label="select" defaultSelectedKey="1">
        <Select.Item key="1">Blue</Select.Item>
        <Select.Item key="2">Red</Select.Item>
      </Select>,
    );

    const trigger = screen.getByTestId('Select');
    const caret = document.querySelector('[data-element="ActionIcon"]')!;

    expect(pressLandsIn(caret, trigger)).toBe(true);

    await clickAt(caret);

    await waitFor(() =>
      expect(screen.getByRole('listbox')).toBeInTheDocument(),
    );
  });

  it('keeps an icon-only trigger square when `rightIcon` is suppressed', () => {
    renderWithRoot(
      <>
        <FilterPicker
          aria-label="square"
          qa="Square"
          icon={<FilterIcon />}
          rightIcon={null}
          renderSummary={false}
          selectionMode="multiple"
          defaultSelectedKeys={['1']}
        >
          <FilterPicker.Item key="1">Blue</FilterPicker.Item>
        </FilterPicker>
      </>,
    );

    const rect = screen.getByTestId('Square').getBoundingClientRect();

    // `rightIcon={null}` takes the caret away and puts nothing in its place, so
    // the run is empty and the trigger is an icon and nothing else. Reserving
    // end content for the empty run is what made it oblong.
    expect(Math.round(rect.width)).toBe(Math.round(rect.height));
  });

  it('does not nest the clear button inside the trigger button', () => {
    renderWithRoot(
      <Picker isClearable aria-label="picker" defaultSelectedKey="1">
        {pickerItems}
      </Picker>,
    );

    const trigger = screen.getByTestId('PickerTrigger');
    const clear = screen.getByTestId('PickerClearButton');

    expect(clear.tagName).toBe('BUTTON');
    expect(trigger.contains(clear)).toBe(false);
  });

  it('keeps the caret where the rightIcon slot put it', () => {
    renderWithRoot(
      <>
        <Picker qa="Bare" aria-label="a" defaultSelectedKey="1">
          {pickerItems}
        </Picker>
      </>,
    );

    const trigger = screen.getByTestId('Bare');
    const caret = document.querySelector('[data-element="ActionIcon"]')!;

    const triggerRect = trigger.getBoundingClientRect();
    const caretRect = caret.getBoundingClientRect();

    // `$side-padding + $action-size / 2` collapses to `($size - 2bw) / 2` — the
    // centre of the `rightIcon` square the caret used to sit in. At `medium`
    // that is `1bw + (32 - 2) / 2` = 16px in from the trigger's right edge, and
    // the migration is only pixel-neutral because the two expressions agree.
    expect(
      Math.round(triggerRect.right - (caretRect.left + caretRect.width / 2)),
    ).toBe(16);
    expect(
      Math.round(
        caretRect.top +
          caretRect.height / 2 -
          (triggerRect.top + triggerRect.height / 2),
      ),
    ).toBe(0);
  });
});
