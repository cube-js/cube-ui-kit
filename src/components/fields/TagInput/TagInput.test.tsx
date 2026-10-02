import { act, fireEvent, waitFor, within } from '@testing-library/react';
import { StrictMode, useState } from 'react';

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

  describe('accessible names', () => {
    function Named(props: Partial<Parameters<typeof TagInput>[0]>) {
      return (
        <>
          <span id="tag-input-header">Primary key</span>
          <span id="tag-input-cube">orders</span>
          <TagInput isClearable defaultValue={['read']} {...props}>
            {ACTIONS.map((action) => (
              <TagInput.Item key={action}>{action}</TagInput.Item>
            ))}
          </TagInput>
        </>
      );
    }

    async function openOptions(getByRole: (...args: any[]) => HTMLElement) {
      await userEvent.click(getByRole('button', { name: /Show options/ }));
      await waitFor(() =>
        expect(getByRole('option', { name: 'deploy' })).toBeInTheDocument(),
      );
    }

    it('names the parts after a visible label', async () => {
      const { getByRole } = renderWithRoot(<Named label="Actions" />);
      const input = getByRole('combobox', { name: 'Actions' });

      expect(
        getByRole('grid', { name: 'Selected values Actions' }),
      ).toBeInTheDocument();
      expect(
        getByRole('button', { name: 'Show options Actions' }),
      ).toBeInTheDocument();

      await userEvent.type(input, 'x');
      expect(
        getByRole('button', { name: 'Clear text Actions' }),
      ).toBeInTheDocument();
      await userEvent.clear(input);

      await openOptions(getByRole);
      expect(getByRole('listbox', { name: 'Actions' })).toBeInTheDocument();
    });

    it('names the parts after aria-labelledby', async () => {
      const { getByRole } = renderWithRoot(
        <Named aria-labelledby="tag-input-header tag-input-cube" />,
      );
      const input = getByRole('combobox', { name: 'Primary key orders' });

      expect(
        getByRole('grid', { name: 'Selected values Primary key orders' }),
      ).toBeInTheDocument();
      expect(
        getByRole('button', { name: 'Show options Primary key orders' }),
      ).toBeInTheDocument();

      await userEvent.type(input, 'x');
      expect(
        getByRole('button', { name: 'Clear text Primary key orders' }),
      ).toBeInTheDocument();
      await userEvent.clear(input);

      await openOptions(getByRole);
      expect(
        getByRole('listbox', { name: 'Primary key orders' }),
      ).toBeInTheDocument();
    });

    it('names the parts after aria-label', async () => {
      const { getByRole } = renderWithRoot(<Named aria-label="Values" />);
      const input = getByRole('combobox', { name: 'Values' });

      expect(
        getByRole('grid', { name: 'Selected values, Values' }),
      ).toBeInTheDocument();
      expect(
        getByRole('button', { name: 'Show options, Values' }),
      ).toBeInTheDocument();

      await userEvent.type(input, 'x');
      expect(
        getByRole('button', { name: 'Clear text, Values' }),
      ).toBeInTheDocument();
      await userEvent.clear(input);

      await openOptions(getByRole);
      expect(getByRole('listbox', { name: 'Values' })).toBeInTheDocument();
    });

    it('reads aria-label ahead of aria-labelledby, as the input does', async () => {
      const { getByRole } = renderWithRoot(
        <Named aria-label="Values" aria-labelledby="tag-input-header" />,
      );
      // React Aria points the input at itself first, so it reads both.
      const input = getByRole('combobox', { name: 'Values Primary key' });

      expect(
        getByRole('grid', { name: 'Selected values, Values Primary key' }),
      ).toBeInTheDocument();
      expect(
        getByRole('button', { name: 'Show options, Values Primary key' }),
      ).toBeInTheDocument();

      await userEvent.type(input, 'x');
      expect(
        getByRole('button', { name: 'Clear text, Values Primary key' }),
      ).toBeInTheDocument();
      await userEvent.clear(input);

      await openOptions(getByRole);
      expect(
        getByRole('listbox', { name: 'Values Primary key' }),
      ).toBeInTheDocument();
    });

    it('reads aria-label ahead of a visible label, as the input does', async () => {
      const { getByRole } = renderWithRoot(
        <Named label="Actions" aria-label="Values" />,
      );

      expect(
        getByRole('combobox', { name: 'Values Actions' }),
      ).toBeInTheDocument();
      expect(
        getByRole('grid', { name: 'Selected values, Values Actions' }),
      ).toBeInTheDocument();
      expect(
        getByRole('button', { name: 'Show options, Values Actions' }),
      ).toBeInTheDocument();

      await openOptions(getByRole);
      expect(
        getByRole('listbox', { name: 'Values Actions' }),
      ).toBeInTheDocument();
    });

    it('reads both a visible label and aria-labelledby', () => {
      const { getByRole } = renderWithRoot(
        <Named label="Actions" aria-labelledby="tag-input-cube" />,
      );

      expect(
        getByRole('combobox', { name: 'Actions orders' }),
      ).toBeInTheDocument();
      expect(
        getByRole('grid', { name: 'Selected values Actions orders' }),
      ).toBeInTheDocument();
      expect(
        getByRole('button', { name: 'Show options Actions orders' }),
      ).toBeInTheDocument();
    });
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

    it('refuses a duplicate and clears it, since the chip is there', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = render(
        <TagInput label="Tags" defaultValue={['one']} onChange={onChange} />,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'one{Enter}');

      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
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
      expect(input).toHaveValue('');
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
      expect(input).toHaveValue('');
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

  it('focuses the first match not added yet while typing', async () => {
    const { getByRole } = renderWithRoot(
      <Actions defaultValue={['read', 'rebuild']} />,
    );
    const input = getByRole('combobox');

    await userEvent.type(input, 're');

    await waitFor(() =>
      expect(getActiveDescendant(input)).toHaveTextContent('refresh'),
    );
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

    it('checks one picked back as it checks typed text', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Custom
          defaultValue={['read', 'bad']}
          validateTag={(value) => value !== 'bad'}
          onChange={onChange}
        />,
      );
      const listbox = await openList(getByRole);
      const row = () => within(listbox).getByRole('option', { name: 'bad' });

      await userEvent.click(row());
      expect(onChange).toHaveBeenLastCalledWith(['read']);

      // Only an option row is added as it is; the user's own value is text.
      await userEvent.click(row());

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(row()).toHaveAttribute('aria-selected', 'false');
    });

    it('picks one back as itself, not an option with the same text', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <TagInput
          allowsCustomValue
          label="Regions"
          defaultValue={['us']}
          onChange={onChange}
        >
          <TagInput.Item key="c1">us</TagInput.Item>
          <TagInput.Item key="c2">eu</TagInput.Item>
        </TagInput>,
      );
      await openList(getByRole);
      const row = () =>
        within(getByRole('group', { name: 'Custom values' })).getByRole(
          'option',
          { name: 'us' },
        );

      await userEvent.click(row());
      expect(onChange).toHaveBeenLastCalledWith([]);

      await userEvent.click(row());

      expect(onChange).toHaveBeenLastCalledWith(['us']);
      expect(row()).toHaveAttribute('aria-selected', 'true');
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
      // The list does not swallow the click: focus leaves on the first one.
      await userEvent.click(getByRole('button', { name: 'After' }));
      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      expect(onBlur).toHaveBeenCalledTimes(1);

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

  describe("a value that shares a section's key", () => {
    // Sections are in the collection under keys of their own, but are no
    // options: text that names one is still the user's own.
    function People(props: Partial<Parameters<typeof TagInput>[0]>) {
      return (
        <TagInput allowsCustomValue label="People" {...props}>
          <TagInput.Section key="team" title="Team">
            <TagInput.Item key="alice">Alice</TagInput.Item>
          </TagInput.Section>
        </TagInput>
      );
    }

    it('checks its row as typed text', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <People validateTag={() => false} onChange={onChange} />,
      );

      await userEvent.type(getByRole('combobox'), 'team');
      const listbox = await waitFor(() => getByRole('listbox'));

      await userEvent.click(
        within(listbox).getByRole('option', { name: 'team' }),
      );

      expect(onChange).not.toHaveBeenCalled();
    });

    it('lists and labels it as a custom value', async () => {
      const { getByRole, getByTestId } = renderWithRoot(
        <People defaultValue={['team']} />,
      );

      expect(
        within(getByTestId('TagInputTags')).getByRole('row'),
      ).toHaveAttribute('aria-label', 'team');

      await userEvent.click(getByRole('button', { name: /Show options/ }));
      await waitFor(() => getByRole('listbox'));

      expect(
        within(getByRole('group', { name: 'Custom values' })).getByRole(
          'option',
          { name: 'team' },
        ),
      ).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('matching text to options', () => {
    function Statuses(props: Partial<Parameters<typeof TagInput>[0]>) {
      return (
        <TagInput label="Statuses" {...props}>
          <TagInput.Item key="Active">Active</TagInput.Item>
          <TagInput.Item key="active">active</TagInput.Item>
        </TagInput>
      );
    }

    function Cities(props: Partial<Parameters<typeof TagInput>[0]>) {
      return (
        <TagInput label="City" {...props}>
          <TagInput.Item key="Paris">Paris</TagInput.Item>
          <TagInput.Item key="Porto">Porto</TagInput.Item>
        </TagInput>
      );
    }

    it('adds the clicked option, not an earlier one in another case', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Statuses defaultValue={['Active']} onChange={onChange} />,
      );

      await userEvent.click(getByRole('button', { name: /Show options/ }));
      await userEvent.click(
        await waitFor(() => getByRole('option', { name: 'active' })),
      );

      expect(onChange).toHaveBeenLastCalledWith(['Active', 'active']);
    });

    it('adds the option the arrows moved to, not an earlier one in another case', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(<Statuses onChange={onChange} />);
      const input = getByRole('combobox');

      await userEvent.click(input);
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent(/^Active$/),
      );
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent(/^active$/),
      );
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['active']);
    });

    it('prefers an exact match anywhere over an earlier one in another case', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(<Statuses onChange={onChange} />);
      const input = getByRole('combobox');

      await userEvent.type(input, 'active{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(['active']);

      // Without an exact match, the first option in another case still wins.
      await paste(input, 'ACTIVE\nactive');
      expect(onChange).toHaveBeenLastCalledWith(['active', 'Active']);
    });

    const COMMIT_PATHS = [
      'Enter on the focused row',
      'Enter at once',
      'a delimiter',
      'a click outside',
      'a paste',
    ] as const;

    async function commitTyped(
      path: (typeof COMMIT_PATHS)[number],
      text: string,
      { getByRole }: Pick<ReturnType<typeof renderWithRoot>, 'getByRole'>,
    ) {
      const input = getByRole('combobox');

      switch (path) {
        case 'Enter on the focused row':
          await userEvent.type(input, text);
          await waitFor(() =>
            expect(getActiveDescendant(input)).not.toBeNull(),
          );
          await userEvent.keyboard('{Enter}');
          break;
        case 'Enter at once':
          await userEvent.type(input, `${text}{Enter}`);
          break;
        case 'a delimiter':
          await userEvent.type(input, `${text},`);
          break;
        case 'a click outside':
          await userEvent.type(input, text);
          await userEvent.click(getByRole('button', { name: 'After' }));
          break;
        case 'a paste':
          // Two parts, so the paste is split rather than inserted as text.
          await paste(input, `${text}\n${text}`);
          break;
      }
    }

    describe.each(COMMIT_PATHS)('typed text committed by %s', (path) => {
      it('names an option by its label before another option by its key', async () => {
        const onChange = vi.fn();
        const utils = renderWithRoot(
          <>
            <TagInput label="Countries" onChange={onChange}>
              <TagInput.Item key="c1">us</TagInput.Item>
              <TagInput.Item key="us">United States</TagInput.Item>
            </TagInput>
            <button>After</button>
          </>,
        );

        await commitTyped(path, 'us', utils);

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(['c1']));
      });

      it('names an option by its key, listed even though the filter hides it', async () => {
        const onChange = vi.fn();
        const utils = renderWithRoot(
          <>
            <TagInput label="Countries" onChange={onChange}>
              <TagInput.Item key="us">United States</TagInput.Item>
              <TagInput.Item key="ru">Russia</TagInput.Item>
            </TagInput>
            <button>After</button>
          </>,
        );

        await commitTyped(path, 'us', utils);

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(['us']));
      });
    });

    it('focuses the row the typed text names, so Enter agrees with a delimiter', async () => {
      const { getByRole } = renderWithRoot(
        <TagInput label="Countries">
          <TagInput.Item key="us">United States</TagInput.Item>
          <TagInput.Item key="ru">Russia</TagInput.Item>
        </TagInput>,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'us');

      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent('United States'),
      );
      expect(getByRole('option', { name: 'Russia' })).toBeInTheDocument();
    });

    it('adds a clicked row as its own key, whatever option its key names by label', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <TagInput label="Countries" onChange={onChange}>
          <TagInput.Item key="c1">us</TagInput.Item>
          <TagInput.Item key="us">United States</TagInput.Item>
        </TagInput>,
      );

      await userEvent.click(getByRole('button', { name: /Show options/ }));
      await userEvent.click(
        await waitFor(() => getByRole('option', { name: 'United States' })),
      );

      expect(onChange).toHaveBeenLastCalledWith(['us']);
    });

    it('still matches a label in another case without allowsCustomValue', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(<Cities onChange={onChange} />);

      await userEvent.type(getByRole('combobox'), 'paris{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['Paris']);
    });

    it('adds text that matches an option only in another case as typed, with allowsCustomValue', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <Cities allowsCustomValue onChange={onChange} />,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'paris');
      // The typed text is offered, and focused, next to the option it resembles.
      await waitFor(() =>
        expect(getActiveDescendant(input)).toHaveTextContent(/^paris$/),
      );
      expect(getByRole('option', { name: 'Paris' })).toBeInTheDocument();
      await userEvent.keyboard('{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(['paris']);

      // Enter before the focus pass, a delimiter and a paste agree.
      await userEvent.type(input, 'porto{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(['paris', 'porto']);

      await userEvent.type(input, 'PARIS,');
      expect(onChange).toHaveBeenLastCalledWith(['paris', 'porto', 'PARIS']);

      await userEvent.type(input, 'Paris{Enter}');
      expect(onChange).toHaveBeenLastCalledWith([
        'paris',
        'porto',
        'PARIS',
        'Paris',
      ]);
    });

    it('commits text that matches an option only in another case as typed on blur', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <>
          <Cities allowsCustomValue onChange={onChange} />
          <button>After</button>
        </>,
      );

      await userEvent.type(getByRole('combobox'), 'paris');
      await waitFor(() => expect(getByRole('listbox')).toBeInTheDocument());
      await userEvent.click(getByRole('button', { name: 'After' }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(['paris']);
    });
  });

  describe('refused values', () => {
    it('hands no duplicate back to the input', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = render(
        <>
          <TagInput
            label="Principals"
            delimiters={[]}
            defaultValue={['a', 'b']}
            onChange={onChange}
          />
          <button>After</button>
        </>,
      );
      const input = getByRole('textbox');

      await paste(input, 'a\nb\nc');

      expect(onChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
      expect(input).toHaveValue('');
      expect(getByText('"a" is already added')).toBeInTheDocument();

      // Nothing is left to commit as a value nobody typed.
      await userEvent.click(getByRole('button', { name: 'After' }));
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('keeps only the first refused value when nothing can separate them', async () => {
      const onChange = vi.fn();
      const { getByRole, getByText } = render(
        <>
          <TagInput
            label="Recipients"
            delimiters={[]}
            validateTag={validateEmail}
            onChange={onChange}
          />
          <button>After</button>
        </>,
      );
      const input = getByRole('textbox');

      await paste(input, 'bad\nworse\nc@x.com');

      expect(onChange).toHaveBeenLastCalledWith(['c@x.com']);
      expect(input).toHaveValue('bad');
      expect(getByText('Enter an email address')).toBeInTheDocument();

      await userEvent.click(getByRole('button', { name: 'After' }));
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue('bad');
    });

    it('clears a duplicate message on Escape, with the input already empty', async () => {
      const onOuterKeyDown = vi.fn();
      const { getByRole, queryByText } = render(
        <div onKeyDown={(e) => onOuterKeyDown(e.key)}>
          <TagInput label="Tags" defaultValue={['one']} />
        </div>,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'one{Enter}');
      expect(queryByText('"one" is already added')).toBeInTheDocument();
      expect(input).toHaveValue('');

      await userEvent.keyboard('{Escape}');

      expect(queryByText('"one" is already added')).toBeNull();
      expect(input).not.toHaveAttribute('aria-invalid');
      // The Escape was the field's, so an enclosing dialog stays open.
      expect(onOuterKeyDown).not.toHaveBeenCalledWith('Escape');
    });

    it('clears a duplicate message when focus leaves the empty input', async () => {
      const { getByRole, queryByText } = render(
        <>
          <TagInput label="Tags" defaultValue={['one']} />
          <button>After</button>
        </>,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'one{Enter}');
      expect(queryByText('"one" is already added')).toBeInTheDocument();

      await userEvent.click(getByRole('button', { name: 'After' }));

      expect(queryByText('"one" is already added')).toBeNull();
      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('clears it at once when Tab takes focus away', async () => {
      const { getByRole, queryByText } = render(
        <>
          <TagInput label="Tags" defaultValue={['one']} />
          <button>After</button>
        </>,
      );

      await userEvent.type(getByRole('textbox'), 'one{Enter}');
      // Past the chips, which are the field's own tab stop.
      await userEvent.tab();
      await userEvent.tab();

      expect(getByRole('button', { name: 'After' })).toHaveFocus();
      expect(queryByText('"one" is already added')).toBeNull();
    });

    // Clearing moves what is below the field up by a line; mid-press, the
    // control pressed would move out from under the pointer.
    it('keeps it until the press that takes focus away ends', async () => {
      const { getByRole, getByText, queryByText } = render(
        <>
          <TagInput label="Tags" defaultValue={['one']} />
          <button>After</button>
        </>,
      );
      const after = getByRole('button', { name: 'After' });

      await userEvent.type(getByRole('textbox'), 'one{Enter}');
      fireEvent.mouseDown(after);
      act(() => after.focus());

      expect(getByText('"one" is already added')).toBeInTheDocument();

      fireEvent.mouseUp(after);

      await waitFor(() =>
        expect(queryByText('"one" is already added')).toBeNull(),
      );
    });

    it('keeps it when focus comes back before the press ends', async () => {
      const { getByRole, getByText } = render(
        <>
          <TagInput label="Tags" defaultValue={['one']} />
          <button>After</button>
        </>,
      );
      const input = getByRole('textbox');
      const after = getByRole('button', { name: 'After' });

      await userEvent.type(input, 'one{Enter}');
      fireEvent.mouseDown(after);
      act(() => after.focus());
      act(() => input.focus());
      fireEvent.mouseUp(after);
      await act(() => new Promise((resolve) => setTimeout(resolve, 10)));

      expect(getByText('"one" is already added')).toBeInTheDocument();
    });

    it('leaves no message behind when a duplicate is committed by leaving', async () => {
      const onChange = vi.fn();
      const { getByRole, queryByText } = render(
        <>
          <TagInput label="Tags" defaultValue={['one']} onChange={onChange} />
          <button>After</button>
        </>,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'one');
      await userEvent.click(getByRole('button', { name: 'After' }));

      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
      expect(queryByText('"one" is already added')).toBeNull();
      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('keeps the message for text that stays in the input on leaving', async () => {
      const { getByRole, getByText } = render(
        <>
          <TagInput label="Recipients" validateTag={validateEmail} />
          <button>After</button>
        </>,
      );
      const input = getByRole('textbox');

      await userEvent.type(input, 'bad');
      await userEvent.click(getByRole('button', { name: 'After' }));

      expect(input).toHaveValue('bad');
      expect(getByText('Enter an email address')).toBeInTheDocument();
    });

    it('explains the text it hands back, not a duplicate it dropped', async () => {
      const { getByRole, getByText, queryByText } = render(
        <TagInput
          label="Recipients"
          defaultValue={['a@x.com']}
          validateTag={validateEmail}
        />,
      );
      const input = getByRole('textbox');

      await paste(input, 'a@x.com, bad, worse');

      expect(input).toHaveValue('bad, worse');
      expect(getByText('Enter an email address')).toBeInTheDocument();
      expect(queryByText('"a@x.com" is already added')).toBeNull();
    });
  });

  describe('focus timing', () => {
    it('commits the typed text before a click outside is handled', async () => {
      const seen: string[][] = [];

      function Harness() {
        const [values, setValues] = useState<string[]>([]);

        return (
          <>
            <TagInput label="Tags" value={values} onChange={setValues} />
            <button onClick={() => seen.push(values)}>Save</button>
          </>
        );
      }

      const { getByRole } = render(<Harness />);

      await userEvent.type(getByRole('textbox'), 'one');
      await userEvent.click(getByRole('button', { name: 'Save' }));

      expect(seen).toEqual([['one']]);
    });

    it('commits the typed text before a press on something that takes no focus', async () => {
      const seen: string[][] = [];

      function Harness() {
        const [values, setValues] = useState<string[]>([]);

        return (
          <>
            <TagInput label="Tags" value={values} onChange={setValues} />
            {/* Focus goes nowhere, as a clicked button leaves it in Safari. */}
            <div role="button" onClick={() => seen.push(values)}>
              Save
            </div>
          </>
        );
      }

      const { getByRole } = render(<Harness />);

      await userEvent.type(getByRole('textbox'), 'one');
      await userEvent.click(getByRole('button', { name: 'Save' }));

      expect(getByRole('textbox')).not.toHaveFocus();
      expect(seen).toEqual([['one']]);
    });

    it('commits the typed text before a Save click while the list shows', async () => {
      const onSubmit = vi.fn();

      function Harness() {
        const [values, setValues] = useState<string[]>([]);

        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(values);
            }}
          >
            <TagInput
              allowsCustomValue
              label="Cities"
              value={values}
              onChange={setValues}
            >
              <TagInput.Item key="Paris">Paris</TagInput.Item>
            </TagInput>
            <button type="submit">Save</button>
          </form>
        );
      }

      const { getByRole } = renderWithRoot(<Harness />);

      await userEvent.type(getByRole('combobox'), 'par');
      await waitFor(() => expect(getByRole('listbox')).toBeInTheDocument());
      await userEvent.click(getByRole('button', { name: 'Save' }));

      // One click: the list does not swallow it, and the blur commits first.
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(['par']);
    });

    it('only closes the list on a press outside that is not a control', async () => {
      const onChange = vi.fn();
      const { getByRole, getByTestId, queryByRole } = renderWithRoot(
        <>
          <TagInput allowsCustomValue label="Cities" onChange={onChange}>
            <TagInput.Item key="Paris">Paris</TagInput.Item>
          </TagInput>
          <div data-qa="Blank">Blank space</div>
        </>,
      );
      const input = getByRole('combobox');

      await userEvent.type(input, 'par');
      await waitFor(() => expect(getByRole('listbox')).toBeInTheDocument());
      await userEvent.click(getByTestId('Blank'));

      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      expect(input).toHaveFocus();
      expect(input).toHaveValue('par');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('still commits before a press on something that takes no focus after a StrictMode autoFocus', async () => {
      const seen: string[][] = [];

      function Harness() {
        const [values, setValues] = useState<string[]>([]);

        return (
          <>
            <TagInput
              autoFocus
              label="Tags"
              value={values}
              onChange={setValues}
            />
            <div role="button" onClick={() => seen.push(values)}>
              Save
            </div>
          </>
        );
      }

      const { getByRole } = render(
        <StrictMode>
          <Harness />
        </StrictMode>,
      );

      await waitFor(() => expect(getByRole('textbox')).toHaveFocus());
      await userEvent.keyboard('one');
      await userEvent.click(getByRole('button', { name: 'Save' }));

      expect(seen).toEqual([['one']]);
    });

    it('reports focus before a change made in the same press', async () => {
      function Harness() {
        const [isEmpty, setIsEmpty] = useState(false);

        return (
          <>
            <button>Before</button>
            <TagInput
              label="Tags"
              defaultValue={['one']}
              onFocus={() => setIsEmpty(false)}
              onChange={(next) => setIsEmpty(next.length === 0)}
            />
            <span data-qa="Empty">{isEmpty ? 'Add a tag' : ''}</span>
          </>
        );
      }

      const { getByRole, getByTestId } = render(<Harness />);

      await userEvent.click(getByRole('button', { name: 'Before' }));
      await userEvent.click(getByRole('button', { name: 'Remove one' }));
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(getByRole('textbox')).toHaveFocus();
      expect(getByTestId('Empty')).toHaveTextContent('Add a tag');
    });

    it('reports focus and blur as they happen', () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const { getByRole } = render(
        <>
          <TagInput label="Tags" onFocus={onFocus} onBlur={onBlur} />
          <button>After</button>
        </>,
      );

      act(() => getByRole('textbox').focus());
      expect(onFocus).toHaveBeenCalledTimes(1);

      act(() => getByRole('button', { name: 'After' }).focus());
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('waits for focus that leaves to nowhere, and ignores it when it comes back', async () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const { getByRole } = render(
        <TagInput label="Tags" onFocus={onFocus} onBlur={onBlur} />,
      );
      const input = getByRole('textbox');

      act(() => input.focus());
      act(() => {
        input.blur();
        input.focus();
      });
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).not.toHaveBeenCalled();

      act(() => input.blur());
      await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1));
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
