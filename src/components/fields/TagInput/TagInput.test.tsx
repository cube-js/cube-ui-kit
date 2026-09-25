import { act, fireEvent, waitFor, within } from '@testing-library/react';
import { useState } from 'react';

import { Button, Dialog, DialogTrigger, Field } from '../../../index';
import {
  getActiveDescendant,
  render,
  renderWithForm,
  renderWithRoot,
  userEvent,
} from '../../../test/index';

import { splitTagText, TagInput } from './TagInput';

vi.mock('../../../_internal/hooks/use-warn');

const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const validateEmail = (value: string) =>
  EMAIL.test(value) || 'Enter an email address';

function chipLabels(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll('[data-qa="TagInputTag"]'),
    (node) => node.textContent,
  );
}

async function paste(input: HTMLElement, text: string) {
  await userEvent.click(input);
  await userEvent.paste(text);
}

const ACTIONS = ['read', 'refresh', 'rebuild', 'deploy'];

function Actions(props: Partial<Parameters<typeof TagInput>[0]>) {
  return (
    <TagInput label="Actions" {...props}>
      {ACTIONS.map((action) => (
        <TagInput.Item key={action}>{action}</TagInput.Item>
      ))}
    </TagInput>
  );
}

describe('<TagInput />', () => {
  describe('splitTagText', () => {
    it('splits on the delimiters and line breaks, dropping empty parts', () => {
      expect(splitTagText(' a, b ;\nc\r\n,, d ', [',', ';'])).toEqual([
        'a',
        'b',
        'c',
        'd',
      ]);
    });

    it('splits only on line breaks without delimiters', () => {
      expect(splitTagText('a,b\nc', [])).toEqual(['a,b', 'c']);
    });
  });

  it('labels the input and renders a chip per value', () => {
    const { getByRole, container } = render(
      <TagInput label="Recipients" defaultValue={['a@x.com', 'b@x.com']} />,
    );

    expect(getByRole('textbox', { name: 'Recipients' })).toBeInTheDocument();
    expect(
      getByRole('grid', { name: 'Selected values Recipients' }),
    ).toBeInTheDocument();
    expect(chipLabels(container)).toEqual(['a@x.com', 'b@x.com']);
  });

  it('describes the input with the current values', () => {
    const { getByRole } = render(
      <TagInput label="Recipients" defaultValue={['a@x.com', 'b@x.com']} />,
    );

    expect(getByRole('textbox')).toHaveAccessibleDescription(
      'Selected: a@x.com and b@x.com. Press Backspace to go to the selected values.',
    );
  });

  it('renders no chip list without values', () => {
    const { queryByRole } = render(<TagInput label="Recipients" />);

    expect(queryByRole('grid')).not.toBeInTheDocument();
  });

  describe('typing', () => {
    it('commits the typed text on Enter and clears the input', async () => {
      const onChange = vi.fn();
      const { getByRole, container } = render(
        <TagInput
          label="Recipients"
          defaultValue={['a@x.com']}
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'b@x.com{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['a@x.com', 'b@x.com']);
      expect(input).toHaveValue('');
      expect(chipLabels(container)).toEqual(['a@x.com', 'b@x.com']);
    });

    it('commits on a delimiter without typing it', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput label="Tags" delimiters={[',', ';']} onChange={onChange} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'one,two;');

      expect(onChange).toHaveBeenLastCalledWith(['one', 'two']);
      expect(input).toHaveValue('');
    });

    it('keeps commas in values when delimiters are turned off', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput label="Names" delimiters={[]} onChange={onChange} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'Doe, Jane{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['Doe, Jane']);
    });

    it('never submits the form on Enter, even with nothing typed', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault());
      const { getByRole } = render(
        <form onSubmit={onSubmit}>
          <TagInput label="Tags" />
        </form>,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'one{Enter}');
      await userEvent.type(input, '{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('passes the virtual keyboard hints to the input', () => {
      const { getByRole } = render(
        <TagInput label="Numbers" inputMode="decimal" enterKeyHint="done" />,
      );

      expect(getByRole('textbox')).toHaveAttribute('inputmode', 'decimal');
      expect(getByRole('textbox')).toHaveAttribute('enterkeyhint', 'done');
    });

    it('commits the typed text when focus leaves the field', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <>
          <TagInput label="Tags" onChange={onChange} />
          <button>Save</button>
        </>,
      );

      await userEvent.type(getByRole('textbox'), 'one');
      await userEvent.click(getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(['one']));
    });

    it('keeps the typed text on blur with shouldCommitOnBlur={false}', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <>
          <TagInput
            label="Tags"
            shouldCommitOnBlur={false}
            onChange={onChange}
          />
          <button>Save</button>
        </>,
      );

      await userEvent.type(getByRole('textbox'), 'one');
      await userEvent.click(getByRole('button', { name: 'Save' }));

      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(onChange).not.toHaveBeenCalled();
      expect(getByRole('textbox')).toHaveValue('one');
    });

    it('lets onKeyDown take over a key with preventDefault', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput
          label="Tags"
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
        />,
      );

      await userEvent.type(getByRole('textbox'), 'one{Enter}');

      expect(onChange).not.toHaveBeenCalled();
      expect(getByRole('textbox')).toHaveValue('one');
    });

    it('clears the typed text on Escape', async () => {
      const { getByRole } = render(<TagInput label="Tags" />);
      const input = getByRole('textbox');

      await userEvent.type(input, 'one{Escape}');

      expect(input).toHaveValue('');
    });
  });

  describe('pasting', () => {
    it('splits a pasted list on delimiters and line breaks', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput label="Recipients" onChange={onChange} />,
      );

      await paste(getByRole('textbox'), 'a@x.com, b@x.com\nc@x.com');

      expect(onChange).toHaveBeenLastCalledWith([
        'a@x.com',
        'b@x.com',
        'c@x.com',
      ]);
    });

    it('pastes a single value as plain text', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput label="Recipients" onChange={onChange} />,
      );
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('a@x.com');

      expect(input).toHaveValue('a@x.com');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('adds the accepted values and leaves the rejected ones in the input', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = render(
        <TagInput
          label="Recipients"
          validateTag={validateEmail}
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      await paste(input, 'a@x.com, bad, b@x.com');

      expect(onChange).toHaveBeenLastCalledWith(['a@x.com', 'b@x.com']);
      expect(input).toHaveValue('bad');
      expect(getByText('Enter an email address')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('rejection', () => {
    it('keeps a rejected value typed, with the default message', async () => {
      const { getByRole, getByText } = render(
        <TagInput label="Numbers" validateTag={(v) => !isNaN(Number(v))} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'abc{Enter}');

      expect(input).toHaveValue('abc');
      expect(getByText('"abc" is not a valid value')).toBeInTheDocument();
    });

    it('refuses a duplicate', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = render(
        <TagInput label="Tags" defaultValue={['one']} onChange={onChange} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'one{Enter}');

      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('one');
      expect(getByText('"one" is already added')).toBeInTheDocument();
    });

    it('clears the message once the text is edited', async () => {
      const { getByRole, queryByText } = render(
        <TagInput label="Recipients" validateTag={validateEmail} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'bad{Enter}');
      expect(queryByText('Enter an email address')).toBeInTheDocument();

      await userEvent.type(input, 'x');
      expect(queryByText('Enter an email address')).not.toBeInTheDocument();
      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('marks an existing value that fails validateTag', () => {
      const { container } = render(
        <TagInput
          label="Recipients"
          defaultValue={['a@x.com', 'bad']}
          validateTag={validateEmail}
        />,
      );
      const [valid, invalid] = Array.from(
        container.querySelectorAll('[data-qa="Tag"]'),
      );

      // The danger variant compiles to its own class set.
      expect(invalid.className).not.toBe(valid.className);
    });
  });

  describe('chips', () => {
    it('removes a chip with its remove button', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one', 'two']}
          onChange={onChange}
        />,
      );

      await userEvent.click(getByRole('button', { name: 'Remove one' }));

      expect(onChange).toHaveBeenLastCalledWith(['two']);
    });

    it('is one Tab stop, moved through with arrow keys', async () => {
      const { getByRole, getAllByRole } = render(
        <>
          <TagInput label="Tags" defaultValue={['one', 'two', 'three']} />
          <button>After</button>
        </>,
      );
      const rows = getAllByRole('row');

      await userEvent.click(getByRole('textbox'));
      await userEvent.tab();
      expect(rows[0]).toHaveFocus();

      await userEvent.keyboard('{ArrowRight}');
      expect(rows[1]).toHaveFocus();

      await userEvent.tab();
      expect(getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('removes the focused chip on Delete and focuses its neighbour', async () => {
      const onChange = vi.fn();
      const { getByRole, getAllByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one', 'two', 'three']}
          onChange={onChange}
        />,
      );

      await userEvent.click(getByRole('textbox'));
      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}{Delete}');

      expect(onChange).toHaveBeenLastCalledWith(['one', 'three']);
      await waitFor(() =>
        expect(getAllByRole('row')[1]).toHaveTextContent('three'),
      );
      expect(getAllByRole('row')[1]).toHaveFocus();
    });

    it('moves focus to the input when the last chip is removed', async () => {
      const { getByRole, queryByRole } = render(
        <TagInput label="Tags" defaultValue={['one']} />,
      );

      await userEvent.click(getByRole('textbox'));
      await userEvent.tab();
      await userEvent.keyboard('{Backspace}');

      expect(queryByRole('grid')).not.toBeInTheDocument();
      expect(getByRole('textbox')).toHaveFocus();
    });

    it('moves to the last chip on Backspace in an empty input, then removes chips from the end', async () => {
      const onChange = vi.fn();
      const { getByRole, getAllByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one', 'two', 'three']}
          onChange={onChange}
        />,
      );

      await userEvent.click(getByRole('textbox'));
      await userEvent.keyboard('{Backspace}');

      // The first press only moves: nothing out of view is removed.
      expect(onChange).not.toHaveBeenCalled();
      expect(getAllByRole('row')[2]).toHaveFocus();

      await userEvent.keyboard('{Backspace}');
      expect(onChange).toHaveBeenLastCalledWith(['one', 'two']);
      await waitFor(() => expect(getAllByRole('row')[1]).toHaveFocus());

      await userEvent.keyboard('{Backspace}{Backspace}');
      expect(onChange).toHaveBeenLastCalledWith([]);
      expect(getByRole('textbox')).toHaveFocus();
    });

    it('keeps Backspace in the input while there is text', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput label="Tags" defaultValue={['one']} onChange={onChange} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'ab{Backspace}');

      expect(input).toHaveValue('a');
      expect(input).toHaveFocus();
    });

    it('stops a held Backspace at the empty input', async () => {
      const { getByRole } = render(
        <TagInput label="Tags" defaultValue={['one']} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'a{Backspace}');
      // user-event never marks a held key as repeating.
      fireEvent.keyDown(input, { key: 'Backspace', repeat: true });

      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
    });

    it('commits the typed text when tabbing into the chips', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput label="Tags" defaultValue={['one']} onChange={onChange} />,
      );

      await userEvent.type(getByRole('textbox'), 'two');
      await userEvent.tab();

      expect(onChange).toHaveBeenLastCalledWith(['one', 'two']);
    });

    it('announces additions and removals', async () => {
      const { getByRole, container } = render(
        <TagInput label="Tags" defaultValue={['one']} />,
      );
      const status = () => container.querySelector('[role="status"]');

      await userEvent.type(getByRole('textbox'), 'two{Enter}');
      expect(status()).toHaveTextContent('Added two');

      await userEvent.click(getByRole('button', { name: 'Remove one' }));
      expect(status()).toHaveTextContent('Removed one');
    });

    it('applies tagProps per value', () => {
      const { getAllByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one', 'two']}
          tagProps={(value) => ({ qa: `Chip-${value}` })}
        />,
      );

      expect(
        within(getAllByRole('row')[1]).getByTestId('Chip-two'),
      ).toBeInTheDocument();
    });
  });

  describe('states', () => {
    it('renders no remove buttons when disabled and keeps chips out of the Tab order', async () => {
      const { getByRole, queryByRole, getAllByRole } = render(
        <TagInput label="Tags" defaultValue={['one', 'two']} isDisabled />,
      );

      expect(getByRole('textbox')).toBeDisabled();
      expect(queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
      getAllByRole('row').forEach((row) =>
        expect(row).toHaveAttribute('tabindex', '-1'),
      );
    });

    it('renders no remove buttons and ignores Delete when read-only', async () => {
      const onChange = vi.fn();
      const { getByRole, queryByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one', 'two']}
          isReadOnly
          onChange={onChange}
        />,
      );

      expect(queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();

      await userEvent.click(getByRole('textbox'));
      await userEvent.tab();
      await userEvent.keyboard('{Delete}');

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('controlled', () => {
    it('follows the value prop', async () => {
      function Controlled() {
        const [value, setValue] = useState<string[]>(['one']);

        return (
          <>
            <TagInput label="Tags" value={value} onChange={setValue} />
            <button onClick={() => setValue([])}>Clear</button>
          </>
        );
      }

      const { getByRole, container } = render(<Controlled />);

      await userEvent.type(getByRole('textbox'), 'two{Enter}');
      expect(chipLabels(container)).toEqual(['one', 'two']);

      await userEvent.click(getByRole('button', { name: 'Clear' }));
      expect(chipLabels(container)).toEqual([]);
    });

    it('renders a repeated value once', () => {
      const { container } = render(
        <TagInput label="Tags" value={['one', 'one', 'two']} />,
      );

      expect(chipLabels(container)).toEqual(['one', 'two']);
    });
  });

  describe('suggestions', () => {
    it('is a combobox that opens a listbox while typing', async () => {
      const { getByRole, getAllByRole } = renderWithRoot(<Actions />);
      const input = getByRole('combobox', { name: 'Actions' });

      await userEvent.type(input, 're');

      await waitFor(() =>
        expect(input).toHaveAttribute('aria-expanded', 'true'),
      );
      expect(getAllByRole('option').map((o) => o.textContent)).toEqual([
        'read',
        'refresh',
        'rebuild',
      ]);
    });

    it('checks the options that already are chips', async () => {
      const { getByRole } = renderWithRoot(
        <Actions defaultValue={['refresh']} />,
      );

      await userEvent.type(getByRole('combobox'), 're');

      await waitFor(() =>
        expect(getByRole('option', { name: 'refresh' })).toHaveAttribute(
          'aria-selected',
          'true',
        ),
      );
      expect(getByRole('option', { name: 'read' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('adds the focused option on Enter, clears the text and stays open', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(<Actions onChange={onChange} />);
      const input = getByRole('combobox');

      await userEvent.type(input, 'reb');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent('rebuild'),
      );
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['rebuild']);
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('removes a picked option when it is picked again', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Actions defaultValue={['read', 'deploy']} onChange={onChange} />,
      );

      await userEvent.click(
        getByRole('button', { name: 'Show options Actions' }),
      );
      await waitFor(() =>
        expect(getByRole('option', { name: 'read' })).toBeInTheDocument(),
      );
      await userEvent.click(getByRole('option', { name: 'read' }));

      expect(onChange).toHaveBeenLastCalledWith(['deploy']);
    });

    it('adds an option on click', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(<Actions onChange={onChange} />);

      await userEvent.type(getByRole('combobox'), 'dep');
      await waitFor(() =>
        expect(getByRole('option', { name: 'deploy' })).toBeInTheDocument(),
      );
      await userEvent.click(getByRole('option', { name: 'deploy' }));

      expect(onChange).toHaveBeenLastCalledWith(['deploy']);
    });

    it('matches typed text to an option by its label', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <TagInput label="Colors" onChange={onChange}>
          <TagInput.Item key="c1">Red</TagInput.Item>
          <TagInput.Item key="c2">Blue</TagInput.Item>
        </TagInput>,
      );

      await paste(getByRole('combobox'), 'blue\nred');

      expect(onChange).toHaveBeenLastCalledWith(['c2', 'c1']);
    });

    it('shows chips with the option labels', () => {
      const { container } = renderWithRoot(
        <TagInput label="Colors" defaultValue={['c2']}>
          <TagInput.Item key="c1">Red</TagInput.Item>
          <TagInput.Item key="c2">Blue</TagInput.Item>
        </TagInput>,
      );

      expect(chipLabels(container)).toEqual(['Blue']);
    });

    it('rejects a value that is not an option', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = renderWithRoot(
        <Actions onChange={onChange} />,
      );
      const input = getByRole('combobox');

      await paste(input, 'read, launch');

      expect(onChange).toHaveBeenLastCalledWith(['read']);
      expect(input).toHaveValue('launch');
      expect(getByText('"launch" is not in the list')).toBeInTheDocument();
    });

    it('drops a filter query that matches no option on blur', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <>
          <Actions onChange={onChange} />
          <button>After</button>
        </>,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'xyz');
      await userEvent.click(getByRole('button', { name: 'After' }));

      await waitFor(() => expect(input).toHaveValue(''));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('offers the typed text as a custom value', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Actions allowsCustomValue onChange={onChange} />,
      );

      await userEvent.type(getByRole('combobox'), 'launch');

      await waitFor(() =>
        expect(getByRole('option', { name: 'launch' })).toBeInTheDocument(),
      );
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['launch']);
    });

    it('closes on Escape without clearing the text', async () => {
      const { getByRole } = renderWithRoot(<Actions />);
      const input = getByRole('combobox');

      await userEvent.type(input, 're');
      await waitFor(() =>
        expect(input).toHaveAttribute('aria-expanded', 'true'),
      );
      await userEvent.keyboard('{Escape}');

      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveValue('re');
    });
  });

  describe('review fixes', () => {
    it('splits at the caret when a delimiter is typed mid-text', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput label="Tags" onChange={onChange} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'abcd{ArrowLeft}{ArrowLeft},');

      expect(onChange).toHaveBeenLastCalledWith(['ab']);
      expect(input).toHaveValue('cd');
    });

    it('keeps the typed text when a chip is removed with the mouse', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one', 'two']}
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'thr');
      await userEvent.click(getByRole('button', { name: 'Remove one' }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(['two']);
      expect(input).toHaveValue('thr');
    });

    it('clears a duplicate message once the chip it names is removed', async () => {
      const { getByRole, queryByText } = render(
        <TagInput label="Tags" defaultValue={['one', 'two']} />,
      );

      await userEvent.type(getByRole('textbox'), 'one{Enter}');
      expect(queryByText('"one" is already added')).toBeInTheDocument();

      await userEvent.click(getByRole('button', { name: 'Remove one' }));
      expect(queryByText('"one" is already added')).not.toBeInTheDocument();
    });

    it('announces a rejection when there is no label to show it', async () => {
      const { getByRole, container } = render(
        <TagInput aria-label="Recipients" validateTag={validateEmail} />,
      );

      await userEvent.type(getByRole('textbox'), 'bad{Enter}');

      expect(container.querySelector('[role="status"]')).toHaveTextContent(
        'Enter an email address',
      );
    });

    it('keeps a consumer aria-describedby next to the value summary', () => {
      const { getByRole } = render(
        <>
          <span id="hint">Up to five</span>
          <TagInput
            label="Recipients"
            aria-describedby="hint"
            defaultValue={['a@x.com']}
          />
        </>,
      );

      expect(getByRole('textbox')).toHaveAccessibleDescription(
        'Up to five Selected: a@x.com. Press Backspace to go to the selected values.',
      );
    });

    it('describes an invalid chip in words', () => {
      const { getAllByRole } = render(
        <TagInput
          label="Recipients"
          defaultValue={['a@x.com', 'bad']}
          validateTag={validateEmail}
        />,
      );

      expect(getAllByRole('row')[1]).toHaveAccessibleDescription(
        /Enter an email address/,
      );
    });

    it('leaves a disabled field out of the Tab order', async () => {
      const { getByRole } = render(
        <>
          <button>Before</button>
          <TagInput label="Tags" defaultValue={['one']} isDisabled />
          <button>After</button>
        </>,
      );

      await userEvent.click(getByRole('button', { name: 'Before' }));
      await userEvent.tab();

      expect(getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('ignores a paste into a read-only field', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one']}
          isReadOnly
          onChange={onChange}
        />,
      );

      await paste(getByRole('textbox'), 'two\nthree');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('passes className, style and mods through', () => {
      const { container, getByRole } = render(
        <TagInput
          label="Tags"
          className="custom"
          style={{ order: 2 }}
          mods={{ custom: true }}
        />,
      );
      const root = container.querySelector('[data-qa="TagInputContainer"]');

      expect(root).toHaveClass('custom');
      expect(root).toHaveStyle({ order: '2' });
      // On the bordered box, not only on the input inside it.
      expect(
        container.querySelector('[data-qa="InputWrapper"]'),
      ).toHaveAttribute('data-custom');
    });

    it('refuses a disabled option however it is entered', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = renderWithRoot(
        <Actions disabledKeys={['deploy']} onChange={onChange} />,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'deploy{Enter}');
      expect(getByText('"deploy" is not available')).toBeInTheDocument();

      await paste(input, 'read\ndeploy');

      expect(onChange).toHaveBeenLastCalledWith(['read']);
      expect(onChange).not.toHaveBeenCalledWith(
        expect.arrayContaining(['deploy']),
      );
    });

    it('points aria-activedescendant at a real option', async () => {
      const { getByRole } = renderWithRoot(<Actions />);
      const input = getByRole('combobox');

      await userEvent.type(input, 're');

      await waitFor(() =>
        expect(getActiveDescendant(input)).toBe(
          getByRole('option', { name: 'read' }),
        ),
      );
    });

    it('focuses the option that matches the text exactly', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <TagInput label="Steps" onChange={onChange}>
          <TagInput.Item key="rebuild">rebuild</TagInput.Item>
          <TagInput.Item key="build">build</TagInput.Item>
        </TagInput>,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'build');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent(/^build$/),
      );
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['build']);
    });

    it('follows a click with aria-activedescendant', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(<Actions onChange={onChange} />);
      const input = getByRole('combobox');

      await userEvent.type(input, 're');
      await waitFor(() => expect(getActiveDescendant(input)).not.toBeNull());
      await userEvent.click(getByRole('option', { name: 'rebuild' }));

      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent('rebuild'),
      );
      await userEvent.keyboard('{Enter}');

      // Enter acts on the option a screen reader was told about.
      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('closes the list and commits the text when Tab moves to the chips', async () => {
      const onChange = vi.fn();
      const { getByRole, getAllByRole } = renderWithRoot(
        <Actions
          allowsCustomValue
          defaultValue={['read']}
          onChange={onChange}
        />,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 're');
      await waitFor(() =>
        expect(input).toHaveAttribute('aria-expanded', 'true'),
      );
      await userEvent.tab();

      // The trigger is skipped: Tab goes from the input to the chips.
      expect(getAllByRole('row')[0]).toHaveFocus();
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(onChange).toHaveBeenLastCalledWith(['read', 're']);
    });

    it('keeps option labels on chips when the options are filtered on the server', async () => {
      const COLORS = [
        { key: 'c1', label: 'Red' },
        { key: 'c2', label: 'Blue' },
      ];

      function ServerFiltered() {
        const [query, setQuery] = useState('');
        const items = COLORS.filter((color) =>
          color.label.toLowerCase().includes(query.toLowerCase()),
        );

        return (
          <TagInput
            label="Colors"
            items={items}
            filter={false}
            defaultValue={['c1']}
            onInputChange={setQuery}
          >
            {(color) => (
              <TagInput.Item key={color.key}>{color.label}</TagInput.Item>
            )}
          </TagInput>
        );
      }

      const { getByRole, container } = renderWithRoot(<ServerFiltered />);

      await userEvent.type(getByRole('combobox'), 'blu');

      expect(chipLabels(container)).toEqual(['Red']);
    });
  });

  describe('second review fixes', () => {
    it('still lets another popover close when its input is clicked', async () => {
      const { getByRole, queryByTestId, getByTestId } = renderWithRoot(
        <>
          <DialogTrigger type="popover">
            <Button qa="Open">Open</Button>
            <Dialog qa="Popup">Popup</Dialog>
          </DialogTrigger>
          <Actions />
        </>,
      );

      await userEvent.click(getByTestId('Open'));
      await waitFor(() => expect(getByTestId('Popup')).toBeInTheDocument());

      await userEvent.click(getByRole('combobox'));

      await waitFor(() =>
        expect(queryByTestId('Popup')).not.toBeInTheDocument(),
      );
    });

    it('keeps its own list open when the input is clicked again', async () => {
      const { getByRole } = renderWithRoot(<Actions />);
      const input = getByRole('combobox');

      await userEvent.type(input, 're');
      await waitFor(() =>
        expect(input).toHaveAttribute('aria-expanded', 'true'),
      );
      await userEvent.click(input);

      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('picks the exact match even when Enter follows the typing at once', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <TagInput label="Steps" onChange={onChange}>
          <TagInput.Item key="rebuild">rebuild</TagInput.Item>
          <TagInput.Item key="build">build</TagInput.Item>
        </TagInput>,
      );

      await userEvent.type(getByRole('combobox'), 'build{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['build']);
    });

    it('refuses a retyped option as a duplicate instead of removing it', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = renderWithRoot(
        <Actions defaultValue={['deploy']} onChange={onChange} />,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'deploy');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent('deploy'),
      );
      await userEvent.keyboard('{Enter}');

      expect(onChange).not.toHaveBeenCalled();
      expect(getByText('"deploy" is already added')).toBeInTheDocument();
    });

    it('unpicks an option the user moved to with the arrows', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Actions defaultValue={['refresh']} onChange={onChange} />,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 're');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent('read'),
      );
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('acts on the announced option after a close and reopen', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(<Actions onChange={onChange} />);
      const input = getByRole('combobox');

      await userEvent.click(input);
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent('read'),
      );
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Escape}{ArrowDown}');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent('rebuild'),
      );
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['rebuild']);
    });

    it('announces a repeated rejection from a paste again', async () => {
      const { getByRole, getByText } = render(
        <TagInput label="Recipients" validateTag={validateEmail} />,
      );
      const input = getByRole('textbox') as HTMLInputElement;

      await paste(input, 'a@x.com, bad');
      const first = getByText('Enter an email address');

      input.setSelectionRange(0, input.value.length);
      await userEvent.paste('b@x.com, worse');

      expect(input).toHaveValue('worse');
      expect(getByText('Enter an email address')).not.toBe(first);
    });

    it('keeps the typed text when a prevented Tab is followed by a remove click', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one', 'two']}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === 'Tab') e.preventDefault();
          }}
        />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'thr');
      await userEvent.tab();
      await userEvent.click(getByRole('button', { name: 'Remove one' }));

      expect(onChange).toHaveBeenLastCalledWith(['two']);
      expect(input).toHaveValue('thr');
    });
  });

  describe('leaving the chips', () => {
    it('closes the list when Backspace moves to the chips', async () => {
      const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
        <Actions popoverTrigger="focus" defaultValue={['read', 'deploy']} />,
      );

      await userEvent.click(getByRole('combobox'));
      await waitFor(() => expect(getByRole('listbox')).toBeInTheDocument());

      await userEvent.keyboard('{Backspace}');

      expect(getAllByRole('row')[1]).toHaveFocus();
      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
    });

    it('goes back to the input with Escape', async () => {
      const onOuterKeyDown = vi.fn();
      const { getByRole, getAllByRole } = render(
        <div onKeyDown={(e) => onOuterKeyDown(e.key)}>
          <TagInput label="Tags" defaultValue={['one', 'two']} />
        </div>,
      );

      await userEvent.click(getByRole('textbox'));
      await userEvent.keyboard('{Backspace}');
      expect(getAllByRole('row')[1]).toHaveFocus();

      await userEvent.keyboard('{Escape}');

      expect(getByRole('textbox')).toHaveFocus();
      // Taken by the chips, so an enclosing dialog stays open.
      expect(onOuterKeyDown).not.toHaveBeenCalledWith('Escape');
    });

    it('carries typing on a chip over to the input', async () => {
      const { getByRole, getAllByRole } = render(
        <TagInput label="Tags" defaultValue={['one', 'two', 'tea']} />,
      );
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.tab();
      expect(getAllByRole('row')[0]).toHaveFocus();

      // `t` would otherwise jump to the chip it starts.
      await userEvent.keyboard('t');

      expect(input).toHaveFocus();
      expect(input).toHaveValue('t');
    });

    it('removes one chip for a Delete held down', async () => {
      const onChange = vi.fn();
      const { getByRole, getAllByRole } = render(
        <TagInput
          label="Tags"
          defaultValue={['one', 'two', 'three']}
          onChange={onChange}
        />,
      );

      await userEvent.click(getByRole('textbox'));
      await userEvent.tab();
      await userEvent.keyboard('{Delete}');
      expect(onChange).toHaveBeenLastCalledWith(['two', 'three']);

      await waitFor(() => expect(getAllByRole('row')[0]).toHaveFocus());
      fireEvent.keyDown(getAllByRole('row')[0], {
        key: 'Delete',
        repeat: true,
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('describes the Backspace route in the input, unless read-only', () => {
      const { getByRole, rerender } = render(
        <TagInput label="Tags" defaultValue={['one']} />,
      );

      expect(getByRole('textbox')).toHaveAccessibleDescription(
        'Selected: one. Press Backspace to go to the selected values.',
      );

      rerender(<TagInput isReadOnly label="Tags" defaultValue={['one']} />);

      expect(getByRole('textbox')).toHaveAccessibleDescription(
        'Selected: one.',
      );
    });
  });

  describe('clear button', () => {
    it('clears the typed text and keeps the values', async () => {
      const onChange = vi.fn();
      const onClear = vi.fn();
      const { getByRole, queryByRole, getAllByRole } = render(
        <TagInput
          isClearable
          label="Tags"
          defaultValue={['one', 'two']}
          onChange={onChange}
          onClear={onClear}
        />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'thr');
      await userEvent.click(getByRole('button', { name: 'Clear text Tags' }));

      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
      expect(getAllByRole('row')).toHaveLength(2);
      expect(
        queryByRole('button', { name: 'Clear text Tags' }),
      ).not.toBeInTheDocument();
    });

    it('shows only while there is text', async () => {
      const { getByRole, queryByRole } = render(
        <TagInput isClearable label="Tags" defaultValue={['one']} />,
      );

      expect(queryByRole('button', { name: /Clear text/ })).toBeNull();

      await userEvent.type(getByRole('textbox'), 'a');

      expect(getByRole('button', { name: /Clear text/ })).toBeInTheDocument();
    });

    it('is not a Tab stop, so Tab still commits the text and reaches the chips', async () => {
      const onChange = vi.fn();
      const { getByRole, getAllByRole } = render(
        <TagInput
          isClearable
          label="Tags"
          defaultValue={['one']}
          onChange={onChange}
        />,
      );

      await userEvent.type(getByRole('textbox'), 'two');
      await userEvent.tab();

      expect(onChange).toHaveBeenLastCalledWith(['one', 'two']);
      expect(getAllByRole('row')[0]).toHaveFocus();
    });

    it('is not offered when read-only', () => {
      const { queryByRole } = render(
        <TagInput
          isClearable
          isReadOnly
          label="Tags"
          defaultInputValue="one"
        />,
      );

      expect(queryByRole('button', { name: /Clear text/ })).toBeNull();
    });
  });

  describe('maxTags', () => {
    it('refuses values past the limit and keeps them typed', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = render(
        <TagInput
          label="Tags"
          maxTags={2}
          defaultValue={['one']}
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      await paste(input, 'two, three, four');

      expect(onChange).toHaveBeenLastCalledWith(['one', 'two']);
      expect(input).toHaveValue('three, four');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(getByText('You can add up to 2')).toBeInTheDocument();
    });

    it('refuses a pick past the limit and keeps the query', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = renderWithRoot(
        <Actions maxTags={1} defaultValue={['read']} onChange={onChange} />,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'dep');
      await waitFor(() => expect(getActiveDescendant(input)).not.toBeNull());
      await userEvent.keyboard('{Enter}');

      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('dep');
      expect(getByText('You can add up to 1')).toBeInTheDocument();
    });
  });

  describe('normalizeTag', () => {
    it('rewrites typed values before the duplicate check', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = render(
        <TagInput
          label="Recipients"
          defaultValue={['a@x.com']}
          normalizeTag={(value) => value.toLowerCase()}
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'B@X.com{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(['a@x.com', 'b@x.com']);

      await userEvent.type(input, 'A@X.COM{Enter}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue('A@X.COM');
      expect(getByText('"A@X.COM" is already added')).toBeInTheDocument();
    });

    it('drops a value it rewrites to nothing', async () => {
      const onChange = vi.fn();
      const { getByRole } = render(
        <TagInput
          label="Numbers"
          normalizeTag={(value) => value.replace(/[^\d]/g, '')}
          onChange={onChange}
        />,
      );

      await paste(getByRole('textbox'), '1,000\nabc\n25');

      expect(onChange).toHaveBeenLastCalledWith(['1', '000', '25']);
    });

    it('leaves picked options alone', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Actions
          normalizeTag={(value) => value.toUpperCase()}
          onChange={onChange}
        />,
      );

      await userEvent.type(getByRole('combobox'), 'read{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['read']);
    });
  });

  describe('tagProps', () => {
    it('keeps an invalid chip in the danger theme whatever theme it asks for', () => {
      const { container } = render(
        <TagInput
          label="Recipients"
          defaultValue={['a@x.com', 'bad']}
          validateTag={validateEmail}
          tagProps={() => ({ theme: 'success' })}
        />,
      );
      const [valid, invalid] = Array.from(
        container.querySelectorAll('[data-qa="Tag"]'),
      );

      expect(invalid.className).not.toBe(valid.className);
    });

    it('names a value by its chip label everywhere', async () => {
      const titles: Record<string, string> = { u1: 'Ann', u2: 'Bob' };
      const { getByRole, container } = render(
        <TagInput
          label="Owners"
          defaultValue={['u1', 'u2']}
          tagProps={(value) => ({ children: titles[value] })}
        />,
      );

      expect(getByRole('textbox')).toHaveAccessibleDescription(
        'Selected: Ann and Bob. Press Backspace to go to the selected values.',
      );

      await userEvent.click(getByRole('button', { name: 'Remove Ann' }));

      expect(container.querySelector('[role="status"]')).toHaveTextContent(
        'Removed Ann',
      );
    });

    it('locks a chip with isDisabled', async () => {
      const onChange = vi.fn();
      const { getByRole, getAllByRole, queryByRole } = render(
        <TagInput
          label="Owners"
          defaultValue={['owner', 'one', 'two']}
          tagProps={(value) =>
            value === 'owner' ? { isDisabled: true } : undefined
          }
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      expect(queryByRole('button', { name: 'Remove owner' })).toBeNull();

      // Backspace works back through the chips and stops short of the locked one.
      await userEvent.click(input);
      await userEvent.keyboard('{Backspace}{Backspace}');
      await waitFor(() => expect(getAllByRole('row')[1]).toHaveFocus());
      await userEvent.keyboard('{Backspace}');

      expect(onChange).toHaveBeenLastCalledWith(['owner']);
      expect(input).toHaveFocus();

      await userEvent.keyboard('{Backspace}');
      expect(input).toHaveFocus();
    });

    it('keeps a locked value checked and disabled in the options', async () => {
      const { getByRole } = renderWithRoot(
        <Actions
          defaultValue={['read', 'deploy']}
          tagProps={(value) =>
            value === 'read' ? { isDisabled: true } : undefined
          }
        />,
      );

      await userEvent.click(getByRole('button', { name: /Show options/ }));
      const option = await waitFor(() => getByRole('option', { name: 'read' }));

      expect(option).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('custom values in the list', () => {
    function Custom(props: Partial<Parameters<typeof TagInput>[0]>) {
      return <Actions allowsCustomValue {...props} />;
    }

    const openList = async (getByRole) => {
      await userEvent.click(getByRole('button', { name: /Show options/ }));

      return waitFor(() => getByRole('listbox'));
    };

    it('lists picked custom values, checked, after the options', async () => {
      const { getByRole } = renderWithRoot(
        <Custom defaultValue={['read', 'zeta', 'audit']} />,
      );
      const listbox = await openList(getByRole);
      const options = within(listbox).getAllByRole('option');

      expect(options.map((option) => option.textContent)).toEqual([
        'read',
        'refresh',
        'rebuild',
        'deploy',
        'audit',
        'zeta',
      ]);
      expect(
        within(listbox).getByRole('option', { name: 'audit' }),
      ).toHaveAttribute('aria-selected', 'true');
    });

    it('unpicks one there, keeps the row unchecked, and picks it back', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Custom defaultValue={['read', 'audit']} onChange={onChange} />,
      );
      const listbox = await openList(getByRole);

      await userEvent.click(
        within(listbox).getByRole('option', { name: 'audit' }),
      );

      expect(onChange).toHaveBeenLastCalledWith(['read']);
      const row = within(listbox).getByRole('option', { name: 'audit' });
      expect(row).toHaveAttribute('aria-selected', 'false');

      await userEvent.click(row);

      expect(onChange).toHaveBeenLastCalledWith(['read', 'audit']);
    });

    it('narrows them with the typed text and does not offer one twice', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Custom defaultValue={['audit', 'debug']} onChange={onChange} />,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'aud');
      const listbox = await waitFor(() => getByRole('listbox'));

      expect(
        within(listbox)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['audit', 'aud']);

      await userEvent.type(input, 'it');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent('audit'),
      );
      expect(within(listbox).getAllByRole('option')).toHaveLength(1);

      // Typed text means "add", so the existing value is a duplicate.
      await userEvent.keyboard('{Enter}');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('forgets an unpicked one once focus leaves the field', async () => {
      const onBlur = vi.fn();
      const { getByRole, queryByRole } = renderWithRoot(
        <>
          <Custom defaultValue={['read', 'audit']} onBlur={onBlur} />
          <button>After</button>
        </>,
      );
      const listbox = await openList(getByRole);

      await userEvent.click(
        within(listbox).getByRole('option', { name: 'audit' }),
      );
      // The pick hands focus back to the input a tick later.
      await waitFor(() => expect(getByRole('combobox')).toHaveFocus());
      // The first click outside only closes the list, as with every popover.
      await userEvent.click(getByRole('button', { name: 'After' }));
      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      await userEvent.click(getByRole('button', { name: 'After' }));
      await waitFor(() => expect(onBlur).toHaveBeenCalled());

      const reopened = await openList(getByRole);

      expect(
        within(reopened).queryByRole('option', { name: 'audit' }),
      ).toBeNull();
    });

    it('lists no outside values without allowsCustomValue', async () => {
      const { getByRole } = renderWithRoot(
        <Actions defaultValue={['read', 'audit']} />,
      );
      const listbox = await openList(getByRole);

      expect(
        within(listbox).queryByRole('option', { name: 'audit' }),
      ).toBeNull();
    });
  });

  describe('forms', () => {
    it('stores the values in the form', async () => {
      const { getByRole, formInstance } = renderWithForm(
        <TagInput name="tags" label="Tags" />,
      );

      await userEvent.type(getByRole('textbox'), 'one{Enter}two{Enter}');

      expect(formInstance.getFieldValue('tags')).toEqual(['one', 'two']);
    });

    it('starts from the form value and validates on change', async () => {
      const { getByRole, getByText, formInstance } = renderWithForm(
        <TagInput
          name="tags"
          label="Tags"
          rules={[{ required: true, message: 'Add a tag' }]}
        />,
        { formProps: { defaultValues: { tags: ['one'] } } },
      );

      expect(getByRole('row')).toHaveTextContent('one');

      await userEvent.click(getByRole('button', { name: 'Remove one' }));

      await waitFor(() => expect(getByText('Add a tag')).toBeInTheDocument());
      expect(formInstance.getFieldValue('tags')).toEqual([]);
    });

    it('interops with the legacy <Field />', async () => {
      const { getByRole, formInstance } = renderWithForm(
        <Field name="tags" defaultValue={['one']}>
          <TagInput label="Tags" />
        </Field>,
      );

      await userEvent.type(getByRole('textbox'), 'two{Enter}');

      expect(formInstance.getFieldValue('tags')).toEqual(['one', 'two']);
    });

    it('does not submit the typed text under the field name', () => {
      const { getByRole } = renderWithForm(
        <TagInput name="tags" label="Tags" />,
      );

      expect(getByRole('textbox')).not.toHaveAttribute('name');
    });
  });
});
