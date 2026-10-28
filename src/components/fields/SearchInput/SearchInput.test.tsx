import { createRef, useState } from 'react';

import { act, renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';

import { SearchInput } from './SearchInput';

vi.mock('../../../_internal/hooks/use-warn');

describe('<SearchInput />', () => {
  it('skips the clear button when tabbing from the input', async () => {
    renderWithRoot(
      <>
        <SearchInput isClearable aria-label="Search" defaultValue="abc" />
        <Button>Next</Button>
      </>,
    );

    await userEvent.click(screen.getByRole('searchbox'));
    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('exposes isInvalid to assistive technology', () => {
    renderWithRoot(<SearchInput isInvalid aria-label="Search" />);

    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  describe('clearing', () => {
    it('clears on Escape and calls onClear, without isClearable', async () => {
      const onClear = vi.fn();

      renderWithRoot(<SearchInput aria-label="Search" onClear={onClear} />);

      const input = screen.getByRole('searchbox');

      await userEvent.type(input, 'abc');
      await userEvent.keyboard('{Escape}');

      expect(input).toHaveValue('');
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('leaves the text to a second Escape while its tooltip is open', async () => {
      const onClear = vi.fn();

      renderWithRoot(
        <SearchInput
          aria-label="Search"
          defaultValue="abc"
          tooltip="Searches names only"
          onClear={onClear}
        />,
      );

      const input = screen.getByRole('searchbox');

      await userEvent.tab();
      await screen.findByRole('tooltip');
      await userEvent.keyboard('{Escape}');

      // The first Escape only closes the tooltip.
      await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
      expect(input).toHaveValue('abc');
      expect(onClear).not.toHaveBeenCalled();

      await userEvent.keyboard('{Escape}');

      expect(input).toHaveValue('');
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('does not call onClear on Escape when there is no text', async () => {
      const onClear = vi.fn();

      renderWithRoot(<SearchInput aria-label="Search" onClear={onClear} />);

      await userEvent.click(screen.getByRole('searchbox'));
      await userEvent.keyboard('{Escape}');

      expect(onClear).not.toHaveBeenCalled();
    });

    it('calls onClear once from the clear button', async () => {
      const onClear = vi.fn();

      renderWithRoot(
        <SearchInput
          isClearable
          aria-label="Search"
          defaultValue="abc"
          onClear={onClear}
        />,
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'Clear search' }),
      );

      expect(screen.getByRole('searchbox')).toHaveValue('');
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  it('shares the input element with a caller inputRef', async () => {
    const inputRef = createRef<HTMLInputElement>();

    renderWithRoot(
      <>
        <SearchInput
          isClearable
          aria-label="Search"
          defaultValue="abc"
          inputRef={inputRef}
        />
        <Button>Elsewhere</Button>
      </>,
    );

    const input = screen.getByRole('searchbox');

    expect(inputRef.current).toBe(input);

    // The clear button keeps focus off itself and hands it to the input
    // through the hook's ref, so the hook has to be holding the same node.
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('clears a controlled value set to null and stays controlled', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let setValue: (value: string | null) => void = () => {};

    function Controlled() {
      const [value, set] = useState<string | null>('abc');

      setValue = set;

      return <SearchInput aria-label="Search" value={value} onChange={set} />;
    }

    renderWithRoot(<Controlled />);

    const input = screen.getByRole('searchbox');

    expect(input).toHaveValue('abc');

    act(() => setValue(null));

    expect(input).toHaveValue('');
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringMatching(/controlled to uncontrolled/),
    );

    warn.mockRestore();
  });
});
