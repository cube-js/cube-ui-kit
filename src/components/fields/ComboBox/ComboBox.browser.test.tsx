import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';

import { ComboBox } from './ComboBox';

describe('ComboBox composite blur', () => {
  it.each([false, true])(
    'closes on Shift+Tab out of the input (allowsCustomValue=%s)',
    async (allowsCustomValue) => {
      const onBlur = vi.fn();
      const onOpenChange = vi.fn();

      renderWithRoot(
        <>
          <button>Before</button>
          <ComboBox
            label="Fruit"
            allowsCustomValue={allowsCustomValue}
            onBlur={onBlur}
            onOpenChange={onOpenChange}
          >
            <ComboBox.Item key="pear">Pear</ComboBox.Item>
            <ComboBox.Item key="peach">Peach</ComboBox.Item>
          </ComboBox>
        </>,
      );

      const input = screen.getByRole('combobox', { name: 'Fruit' });

      await act(() => userEvent.click(input));
      await act(() => userEvent.keyboard('p{ArrowDown}'));
      await waitFor(() =>
        expect(input).toHaveAttribute('aria-expanded', 'true'),
      );
      expect(screen.getByRole('listbox')).toBeVisible();
      expect(
        document.getElementById(input.getAttribute('aria-activedescendant')!),
      ).toHaveAttribute('data-focused');

      await act(() => userEvent.keyboard('{Shift>}{Tab}{/Shift}'));

      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      await waitFor(
        () => expect(input).toHaveAttribute('aria-expanded', 'false'),
        { timeout: 1000 },
      );
      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      expect(input).not.toHaveAttribute('aria-activedescendant');
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    },
  );

  it('keeps the popover open when focus enters it, then closes when focus leaves it', async () => {
    const onBlur = vi.fn();

    renderWithRoot(
      <>
        <button>Before</button>
        <ComboBox label="Fruit" onBlur={onBlur}>
          <ComboBox.Item key="pear" suffix={<button>Inspect Pear</button>}>
            Pear
          </ComboBox.Item>
          <ComboBox.Item key="peach">Peach</ComboBox.Item>
        </ComboBox>
      </>,
    );

    const input = screen.getByRole('combobox', { name: 'Fruit' });

    await act(() => userEvent.click(input));
    await act(() => userEvent.keyboard('p{ArrowDown}'));

    const button = await screen.findByRole('button', { name: 'Inspect Pear' });

    await act(() => button.focus());
    expect(button).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeVisible();
    expect(onBlur).not.toHaveBeenCalled();

    await act(() => screen.getByRole('button', { name: 'Before' }).focus());
    await waitFor(
      () => expect(input).toHaveAttribute('aria-expanded', 'false'),
      { timeout: 1000 },
    );
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
