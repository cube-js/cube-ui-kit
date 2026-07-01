import { act, waitFor } from '@testing-library/react';

import { renderWithForm, renderWithRoot, userEvent } from '../../../test/index';

import { CommandTextArea } from './CommandTextArea';

vi.mock('../../../_internal/hooks/use-warn');

const commands = [
  { key: '/clear', description: 'Clear conversation', textValue: '/clear' },
  { key: '/help', description: 'Show help', textValue: '/help' },
  { key: '/share', description: 'Share conversation', textValue: '/share' },
  {
    key: '/summarize',
    description: 'Summarize thread',
    textValue: '/summarize',
  },
];

const commandItems = commands.map((c) => (
  <CommandTextArea.Item key={c.key} textValue={c.textValue}>
    {c.key}
  </CommandTextArea.Item>
));

describe('<CommandTextArea />', () => {
  it('renders as a textarea and does not show a listbox by default', () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message" placeholder="Type / to see commands…">
        {commandItems}
      </CommandTextArea>,
    );

    expect(getByRole('combobox')).toBeInTheDocument();
    expect(queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a listbox when a slash command is typed at the start', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message">{commandItems}</CommandTextArea>,
    );

    const input = getByRole('combobox');

    await userEvent.type(input, '/c');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('does not show a listbox for a normal (non-command) query', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message">{commandItems}</CommandTextArea>,
    );

    const input = getByRole('combobox');
    await userEvent.type(input, 'hello world');

    expect(queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters options by the typed token', async () => {
    const { getByRole, getAllByRole } = renderWithRoot(
      <CommandTextArea label="Message">{commandItems}</CommandTextArea>,
    );

    const input = getByRole('combobox');
    await userEvent.type(input, '/s');

    await waitFor(() => {
      // /share and /summarize match "/s"
      expect(getAllByRole('option')).toHaveLength(2);
    });
  });

  it('matches an option by its (text) children when the textValue differs', async () => {
    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message">
        <CommandTextArea.Item key="a" textValue="/xxx">
          /alpha
        </CommandTextArea.Item>
        <CommandTextArea.Item key="b" textValue="/yyy">
          /beta
        </CommandTextArea.Item>
      </CommandTextArea>,
    );

    const input = getByRole('combobox');
    // "/al" matches neither textValue but does match the "/alpha" children.
    await userEvent.type(input, '/al');

    await waitFor(() => expect(queryByRole('listbox')).toBeInTheDocument());
    await waitFor(() => {
      const options = getAllByRole('option').map((o) => o.textContent);
      expect(options).toEqual(['/alpha']);
    });
  });

  it('matches an option by its (text) description', async () => {
    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message">
        <CommandTextArea.Item
          key="/clear"
          textValue="/clear"
          description="run /reset first"
        >
          /clear
        </CommandTextArea.Item>
        <CommandTextArea.Item
          key="/help"
          textValue="/help"
          description="Show help"
        >
          /help
        </CommandTextArea.Item>
      </CommandTextArea>,
    );

    const input = getByRole('combobox');
    // "/re" isn't in any command's textValue/children, but the /clear option's
    // description contains "/reset".
    await userEvent.type(input, '/re');

    await waitFor(() => expect(queryByRole('listbox')).toBeInTheDocument());
    await waitFor(() => {
      const options = getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0].textContent).toContain('/clear');
    });
  });

  it('highlights the typed token within the matching option', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message">{commandItems}</CommandTextArea>,
    );

    const input = getByRole('combobox');
    await userEvent.type(input, '/cl');

    await waitFor(() => expect(queryByRole('listbox')).toBeInTheDocument());
    await waitFor(() => {
      const option = getByRole('option');
      const mark = option.querySelector('mark');
      expect(mark).not.toBeNull();
      // The trigger char is stripped from the query, so "cl" is highlighted
      // within the "/clear" children.
      expect(mark?.textContent).toBe('cl');
    });
  });

  it('highlights the matched substring within the description', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message">
        <CommandTextArea.Item
          key="/clear"
          textValue="/clear"
          description="Clear conversation"
        >
          /clear
        </CommandTextArea.Item>
      </CommandTextArea>,
    );

    const input = getByRole('combobox');
    // "/co" matches the description ("Clear c[o]nversation") but not the command.
    await userEvent.type(input, '/co');

    await waitFor(() => expect(queryByRole('listbox')).toBeInTheDocument());
    await waitFor(() => {
      const description = getByRole('option').querySelector(
        '[data-element="Description"]',
      );
      const mark = description?.querySelector('mark');
      expect(mark).not.toBeNull();
      expect(mark?.textContent?.toLowerCase()).toBe('co');
    });
  });

  it('inserts the full command on Enter', async () => {
    const onCommand = vi.fn();
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message" onCommand={onCommand}>
        {commandItems}
      </CommandTextArea>,
    );

    const input = getByRole('combobox') as HTMLTextAreaElement;
    await userEvent.type(input, '/cl');

    await waitFor(() => expect(queryByRole('listbox')).toBeInTheDocument());
    // Wait until the first option is virtually focused (auto-focus init).
    await waitFor(() =>
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        'ListBoxItem-/clear',
      ),
    );

    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(input.value).toBe('/clear ');
    });
    expect(onCommand).toHaveBeenCalledWith('/clear', expect.any(Object));
  });

  it('closes the popover with Escape and keeps the text', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message">{commandItems}</CommandTextArea>,
    );

    const input = getByRole('combobox') as HTMLTextAreaElement;
    await userEvent.type(input, '/c');

    await waitFor(() => expect(queryByRole('listbox')).toBeInTheDocument());

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(input.value).toBe('/c');
  });

  it('navigates options with ArrowDown and inserts on Enter', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea label="Message">{commandItems}</CommandTextArea>,
    );

    const input = getByRole('combobox') as HTMLTextAreaElement;
    await userEvent.type(input, '/');

    await waitFor(() => expect(queryByRole('listbox')).toBeInTheDocument());
    // Auto-focus lands on the first option (/clear).
    await waitFor(() =>
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        'ListBoxItem-/clear',
      ),
    );

    await userEvent.keyboard('{ArrowDown}'); // -> /help (second option)
    await waitFor(() =>
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        'ListBoxItem-/help',
      ),
    );
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(input.value).toBe('/help ');
    });
  });

  it('supports a configurable mention trigger anywhere in the text', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <CommandTextArea
        label="Message"
        triggers={[{ char: '@', atLineStart: false }]}
      >
        <CommandTextArea.Item key="@john" textValue="@john">
          John
        </CommandTextArea.Item>
        <CommandTextArea.Item key="@jane" textValue="@jane">
          Jane
        </CommandTextArea.Item>
      </CommandTextArea>,
    );

    const input = getByRole('combobox') as HTMLTextAreaElement;
    await userEvent.type(input, 'hi @j');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });
    // Wait for auto-focus to land on the first matching option (@john).
    await waitFor(() =>
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        'ListBoxItem-@john',
      ),
    );

    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      // First matching option is @john (focus starts on the first visible item).
      expect(input.value).toBe('hi @john ');
    });
  });

  it('works without a form', async () => {
    const { getByRole } = renderWithRoot(
      <CommandTextArea label="Message">{commandItems}</CommandTextArea>,
    );
    const input = getByRole('combobox');
    await act(async () => {
      await userEvent.type(input, 'Hello');
    });
    expect(input).toHaveValue('Hello');
  });

  it('integrates with Form', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <CommandTextArea label="Message" name="message">
        {commandItems}
      </CommandTextArea>,
    );
    const input = getByRole('combobox');
    await act(async () => {
      await userEvent.type(input, 'Hello');
    });
    expect(formInstance.getFieldValue('message')).toEqual('Hello');
  });
});
