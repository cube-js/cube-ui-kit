import { renderWithRoot, screen } from '../../test';
import { Checkbox } from '../fields/Checkbox/Checkbox';
import { ListBox } from '../fields/ListBox/ListBox';
import { Picker } from '../fields/Picker/Picker';
import { Switch } from '../fields/Switch/Switch';
import { TextArea } from '../fields/TextArea/TextArea';
import { TextInput } from '../fields/TextInput/TextInput';
import { Flex } from '../layout/Flex';

import { Form } from './Form/Form';

/** `1x` is `--gap`, 8px off the block. */
const X = 8;

const rect = (element: Element) => element.getBoundingClientRect();

function fieldOf(element: Element) {
  return element.closest('[data-qa="Field"]') as HTMLElement;
}

function inputBoxOf(name: string) {
  return screen
    .getByRole('textbox', { name })
    .closest('[data-qa="InputWrapper"]') as HTMLElement;
}

function labelOf(field: HTMLElement) {
  return field.querySelector('label') as HTMLElement;
}

const options = Array.from({ length: 30 }, (_, index) => (
  <ListBox.Item key={index}>{`Option ${index + 1}`}</ListBox.Item>
));

/**
 * An input's style props size its outer element, and a field they size lets
 * its input fill it. Whether it does is real geometry, so this needs a
 * browser; `wrapper.test.tsx` checks where the styles land.
 */
describe('field layout geometry', () => {
  it('sizes a labelled field and fills it with the input', () => {
    renderWithRoot(
      <>
        <TextInput label="Name" width="30x" />
        <Picker label="Pick" width="30x">
          <Picker.Item key="one">One</Picker.Item>
        </Picker>
      </>,
    );

    const box = inputBoxOf('Name');
    const trigger = screen.getByRole('button', { name: /Pick/ });

    expect(rect(fieldOf(box)).width).toBe(30 * X);
    expect(rect(box).width).toBe(30 * X);
    expect(rect(fieldOf(trigger)).width).toBe(30 * X);
    expect(rect(trigger).width).toBe(30 * X);
  });

  it('keeps the outer box when a sized bare field gains a label', () => {
    renderWithRoot(
      <>
        <TextInput aria-label="Bare" width="30x" />
        <TextInput label="Labelled" width="30x" />
      </>,
    );

    expect(rect(inputBoxOf('Bare')).width).toBe(30 * X);
    expect(rect(fieldOf(inputBoxOf('Labelled'))).width).toBe(30 * X);
  });

  it.each([
    ['standalone', false],
    ['in a Form', true],
  ])('counts a side label in the width %s', (_, inForm) => {
    const input = <TextInput label="Name" labelPosition="side" width="40x" />;

    renderWithRoot(inForm ? <Form>{input}</Form> : input);

    const box = inputBoxOf('Name');
    const field = fieldOf(box);

    expect(rect(field).width).toBe(40 * X);
    expect(rect(box).right).toBe(rect(field).right);
    expect(rect(labelOf(field)).right).toBeLessThanOrEqual(rect(box).left);
  });

  it('sizes the field and the input apart with styles', () => {
    renderWithRoot(
      <TextInput label="Name" width="40x" styles={{ width: '20x' }} />,
    );

    const box = inputBoxOf('Name');

    expect(rect(fieldOf(box)).width).toBe(40 * X);
    expect(rect(box).width).toBe(20 * X);
  });

  it('keeps an input at its content width beside a split label', () => {
    renderWithRoot(
      <TextInput label="Name" labelPosition="split" width="60x" />,
    );

    const box = inputBoxOf('Name');
    const field = fieldOf(box);

    expect(rect(field).width).toBe(60 * X);
    expect(rect(box).width).toBeLessThan(40 * X);
    expect(rect(box).right).toBe(rect(field).right);
  });

  it('keeps the content width of a Checkbox and a Switch', () => {
    renderWithRoot(
      <>
        <Checkbox label="Check" width="40x" />
        <Switch label="Toggle" width="40x" />
      </>,
    );

    for (const control of [
      screen.getByRole('checkbox'),
      screen.getByRole('switch'),
    ]) {
      const field = fieldOf(control);
      const target = control.closest('label') as HTMLElement;

      expect(rect(field).width).toBe(40 * X);
      expect(rect(target).width).toBeLessThan(10 * X);
    }
  });

  it('leaves an unsized labelled Picker at its own width', () => {
    renderWithRoot(
      <>
        <Picker aria-label="Bare">
          <Picker.Item key="one">One</Picker.Item>
        </Picker>
        <Picker label="Labelled">
          <Picker.Item key="one">One</Picker.Item>
        </Picker>
      </>,
    );

    const [bare, labelled] = screen.getAllByRole('button');

    expect(fieldOf(labelled)).not.toHaveAttribute('data-fill-width');
    expect(rect(labelled).width).toBe(rect(bare).width);
  });

  it('grows fields in a row, keeping each message under its input', () => {
    renderWithRoot(
      <Flex gap="2x" width="90x">
        <TextInput label="First" flexGrow={1} />
        <TextInput
          label="Second"
          flexGrow={1}
          isInvalid
          errorMessage="Required"
        />
        <TextArea label="Notes" flexGrow={1} />
        <TextInput aria-label="Reference" />
      </Flex>,
    );

    const first = inputBoxOf('First');
    const second = inputBoxOf('Second');
    const notes = inputBoxOf('Notes');
    const height = rect(inputBoxOf('Reference')).height;
    const message = fieldOf(second).querySelector(
      '[data-qa="FieldMessage"]',
    ) as HTMLElement;

    expect(rect(first).width).toBe(rect(fieldOf(first)).width);
    expect(rect(second).width).toBe(rect(fieldOf(second)).width);
    // Single-line boxes keep their height; the text area grows with the row.
    expect(rect(first).height).toBe(height);
    expect(rect(second).height).toBe(height);
    expect(rect(message).top - rect(second).bottom).toBeLessThan(X);
    expect(rect(notes).bottom).toBe(rect(fieldOf(notes)).bottom);
  });

  it('fills a sized field with a ListBox that scrolls inside it', () => {
    renderWithRoot(
      <ListBox label="Options" height="40x">
        {options}
      </ListBox>,
    );

    const list = screen.getByRole('listbox');
    const field = fieldOf(list);
    const root = list.closest('[data-qa="ListBoxWrapper"]') as HTMLElement;

    expect(rect(field).height).toBe(40 * X);
    expect(rect(root).bottom).toBe(rect(field).bottom);
    expect(rect(labelOf(field)).top).toBe(rect(field).top);
    // The options scroll inside the list's scroll area.
    let scroller = list.parentElement as HTMLElement;

    while (getComputedStyle(scroller).overflowY !== 'auto') {
      scroller = scroller.parentElement as HTMLElement;
    }

    expect(root).toContainElement(scroller);
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    expect(rect(scroller).bottom).toBeLessThanOrEqual(rect(field).bottom);
  });

  it('fills a short column with a ListBox that grows in it', () => {
    renderWithRoot(
      <Flex flow="column" height="30x">
        <ListBox label="Options" flexGrow={1}>
          {options}
        </ListBox>
      </Flex>,
    );

    const list = screen.getByRole('listbox');
    const field = fieldOf(list);
    const root = list.closest('[data-qa="ListBoxWrapper"]') as HTMLElement;

    expect(rect(field).height).toBe(30 * X);
    expect(rect(root).bottom).toBe(rect(field).bottom);
    expect(rect(labelOf(field)).top).toBe(rect(field).top);
  });

  it('fills a sized field with a TextArea, not a single-line input', () => {
    renderWithRoot(
      <>
        <TextArea label="Notes" height="30x" />
        <TextInput label="Name" height="30x" />
        <TextInput aria-label="Reference" />
      </>,
    );

    const notes = inputBoxOf('Notes');
    const name = inputBoxOf('Name');

    expect(rect(fieldOf(notes)).height).toBe(30 * X);
    expect(rect(notes).bottom).toBe(rect(fieldOf(notes)).bottom);
    expect(rect(fieldOf(name)).height).toBe(30 * X);
    expect(rect(name).height).toBe(rect(inputBoxOf('Reference')).height);
  });

  it('keeps a side label at the top and a split label centred', () => {
    renderWithRoot(
      <>
        <TextArea label="Side" labelPosition="side" height="30x" />
        <TextArea label="Split" labelPosition="split" height="30x" />
      </>,
    );

    const side = fieldOf(inputBoxOf('Side'));
    const split = fieldOf(inputBoxOf('Split'));
    const centre = (box: DOMRect) => box.top + box.height / 2;

    expect(rect(labelOf(side)).top - rect(side).top).toBeLessThan(2 * X);
    expect(
      Math.abs(centre(rect(labelOf(split))) - centre(rect(split))),
    ).toBeLessThan(1);
  });

  it('keeps an unsized height for a field with only a maximum', () => {
    renderWithRoot(
      <>
        <TextArea label="Capped" height="max 40x" />
        <TextArea label="Free" />
      </>,
    );

    expect(rect(fieldOf(inputBoxOf('Capped'))).height).toBe(
      rect(fieldOf(inputBoxOf('Free'))).height,
    );
  });
});
