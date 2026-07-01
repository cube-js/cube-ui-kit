import { act, waitFor } from '@testing-library/react';

import { renderWithForm, renderWithRoot, userEvent } from '../../../test/index';

import { CommandTextArea } from './CommandTextArea';

vi.mock('../../../_internal/hooks/use-warn');

const commands = [
  { key: '/clear', children: 'Clear conversation', textValue: '/clear' },
  { key: '/help', children: 'Show help', textValue: '/help' },
  { key: '/share', children: 'Share conversation', textValue: '/share' },
  { key: '/summarize', children: 'Summarize thread', textValue: '/summarize' },
];

const commandItems = commands.map((c) => (
  <CommandTextArea.Item key={c.key} textValue={c.textValue}>
    {c.children}
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
