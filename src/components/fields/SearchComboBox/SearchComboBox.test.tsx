import { act, waitFor } from '@testing-library/react';
import { useState } from 'react';

import { renderWithRoot, userEvent } from '../../../test/index';

import { SearchComboBox } from './SearchComboBox';

const items = [
  { key: 'red', children: 'Red' },
  { key: 'orange', children: 'Orange' },
  { key: 'yellow', children: 'Yellow' },
  { key: 'green', children: 'Green' },
  { key: 'blue', children: 'Blue' },
];

vi.mock('../../../_internal/hooks/use-warn');

describe('<SearchComboBox />', () => {
  it('opens the popover and filters options while typing', async () => {
    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <SearchComboBox label="Colors" placeholder="Search a color">
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');

    expect(input).toHaveAttribute('placeholder', 'Search a color');
    expect(queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.type(input, 're');

    await waitFor(() => {
      expect(getByRole('listbox')).toBeInTheDocument();
      const options = getAllByRole('option');
      // "Red" and "Green" contain "re"
      expect(options).toHaveLength(2);
    });
  });

  it('fires onSelect and clears the input when an option is picked', async () => {
    const onSelect = vi.fn();

    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <SearchComboBox label="Colors" onSelect={onSelect}>
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');

    await userEvent.type(input, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    const options = getAllByRole('option');
    await userEvent.click(options[0]); // "Red"

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('red', 'Red');
      // Input is cleared after selection
      expect(input).toHaveValue('');
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('auto-focuses the first match so Enter fires onSelect', async () => {
    const onSelect = vi.fn();

    const { getByRole } = renderWithRoot(
      <SearchComboBox label="Colors" onSelect={onSelect}>
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');

    // "re" matches "Red" (first) and "Green"; the first should be auto-focused.
    await userEvent.type(input, 're');

    await waitFor(() => {
      expect(getByRole('listbox')).toBeInTheDocument();
    });

    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('red', 'Red');
      expect(input).toHaveValue('');
    });
  });

  it('prefers onSelect over onSubmit when a match is auto-focused', async () => {
    const onSelect = vi.fn();
    const onSubmit = vi.fn();

    const { getByRole } = renderWithRoot(
      <SearchComboBox label="Colors" onSelect={onSelect} onSubmit={onSubmit}>
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');

    await userEvent.type(input, 'blu');

    await waitFor(() => {
      expect(getByRole('listbox')).toBeInTheDocument();
    });

    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('blue', 'Blue');
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('resets and closes the popover after selecting with popoverTrigger="focus"', async () => {
    const onSelect = vi.fn();

    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <SearchComboBox label="Colors" popoverTrigger="focus" onSelect={onSelect}>
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');

    // Focusing the input opens the popover (popoverTrigger="focus").
    await userEvent.click(input);

    await waitFor(() => {
      expect(getByRole('listbox')).toBeInTheDocument();
    });

    await userEvent.click(getAllByRole('option')[0]);

    // After the commit the input is cleared and refocused; the programmatic
    // refocus must NOT reopen the popover.
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalled();
      expect(input).toHaveFocus();
    });

    expect(input).toHaveValue('');

    await waitFor(
      () => {
        expect(queryByRole('listbox')).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('submits raw text via onSubmit when no option is focused', async () => {
    const onSubmit = vi.fn();

    const { getByRole } = renderWithRoot(
      <SearchComboBox label="Search" onSubmit={onSubmit}>
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');

    // Type a query that matches no option so nothing is auto-focused.
    await userEvent.type(input, 'zzz');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('zzz');
      expect(input).toHaveValue('');
    });
  });

  it('does not submit when onSubmit is not provided', async () => {
    const { getByRole } = renderWithRoot(
      <SearchComboBox label="Search">
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');

    await userEvent.type(input, 'zzz');
    await userEvent.keyboard('{Enter}');

    // Input keeps the typed value (no-op Enter).
    expect(input).toHaveValue('zzz');
  });

  it('shows a custom emptyLabel when no results match', async () => {
    const { getByRole, getByText } = renderWithRoot(
      <SearchComboBox label="Colors" emptyLabel="Nothing here">
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');

    await userEvent.type(input, 'zzz');

    // The popover stays open on a non-empty query and shows the empty state.
    await waitFor(() => {
      expect(getByText('Nothing here')).toBeInTheDocument();
    });
  });

  it('supports external filtering with filter={false}', async () => {
    function ServerSearch() {
      const [value, setValue] = useState('');
      const results = value
        ? items.filter((i) =>
            i.children.toLowerCase().includes(value.toLowerCase()),
          )
        : items;

      return (
        <SearchComboBox
          label="Server"
          filter={false}
          inputValue={value}
          items={results}
          onInputChange={setValue}
        >
          {(item: (typeof items)[number]) => (
            <SearchComboBox.Item key={item.key}>
              {item.children}
            </SearchComboBox.Item>
          )}
        </SearchComboBox>
      );
    }

    const { getByRole, getAllByRole } = renderWithRoot(<ServerSearch />);

    const input = getByRole('combobox');

    await userEvent.type(input, 'blue');

    await waitFor(() => {
      const options = getAllByRole('option');
      // Parent narrowed items to just "Blue"; component shows them as-is.
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Blue');
    });
  });

  it('delays the loading indicator until loadingDelay elapses', async () => {
    vi.useFakeTimers();

    try {
      const { queryByTestId } = renderWithRoot(
        <SearchComboBox label="Colors" isLoading loadingDelay={1000}>
          {items.map((item) => (
            <SearchComboBox.Item key={item.key}>
              {item.children}
            </SearchComboBox.Item>
          ))}
        </SearchComboBox>,
      );

      // Loading icon should not appear immediately or before the delay.
      expect(queryByTestId('LoadingIcon')).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(queryByTestId('LoadingIcon')).not.toBeInTheDocument();

      // After the delay it becomes visible.
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(queryByTestId('LoadingIcon')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('never shows the loading indicator when the response is faster than the delay', async () => {
    vi.useFakeTimers();

    try {
      const { rerender, queryByTestId } = renderWithRoot(
        <SearchComboBox label="Colors" isLoading loadingDelay={1000}>
          {items.map((item) => (
            <SearchComboBox.Item key={item.key}>
              {item.children}
            </SearchComboBox.Item>
          ))}
        </SearchComboBox>,
      );

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Response arrives (isLoading -> false) before the delay elapsed.
      rerender(
        <SearchComboBox label="Colors" isLoading={false} loadingDelay={1000}>
          {items.map((item) => (
            <SearchComboBox.Item key={item.key}>
              {item.children}
            </SearchComboBox.Item>
          ))}
        </SearchComboBox>,
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(queryByTestId('LoadingIcon')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the input with the clear button', async () => {
    const onClear = vi.fn();

    const { getByRole, getByTestId } = renderWithRoot(
      <SearchComboBox label="Colors" onClear={onClear}>
        {items.map((item) => (
          <SearchComboBox.Item key={item.key}>
            {item.children}
          </SearchComboBox.Item>
        ))}
      </SearchComboBox>,
    );

    const input = getByRole('combobox');
    await userEvent.type(input, 'red');

    const clearButton = getByTestId('SearchComboBoxClearButton');
    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(onClear).toHaveBeenCalled();
    });
  });
});
