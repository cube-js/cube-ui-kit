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

describe('ComboBox presses and Tab in a browser', () => {
  function Fruit(props: { isClearable?: boolean }) {
    return (
      <>
        <button>Before</button>
        <ComboBox label="Fruit" defaultSelectedKey="pear" {...props}>
          <ComboBox.Item key="pear">Pear</ComboBox.Item>
          <ComboBox.Item key="peach">Peach</ComboBox.Item>
        </ComboBox>
        <button>After</button>
      </>
    );
  }

  it('opens the list on a click into the input it already focuses', async () => {
    renderWithRoot(<Fruit />);

    const input = screen.getByRole('combobox', { name: 'Fruit' });

    await act(() => screen.getByRole('button', { name: 'Before' }).focus());
    await act(() => userEvent.keyboard('{Tab}'));
    expect(input).toHaveFocus();
    expect(screen.queryByRole('listbox')).toBeNull();

    await act(() => userEvent.click(input));

    await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves the caret and keeps the list open on a click in the open input', async () => {
    renderWithRoot(
      <ComboBox label="Fruit">
        <ComboBox.Item key="pear">Pear</ComboBox.Item>
        <ComboBox.Item key="peach">Peach</ComboBox.Item>
      </ComboBox>,
    );

    const input = screen.getByRole('combobox', {
      name: 'Fruit',
    }) as HTMLInputElement;

    await act(() => input.focus());
    await act(() => userEvent.keyboard('pe'));
    await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());
    expect(input.selectionStart).toBe(2);

    // At the very start of the text.
    await act(() => userEvent.click(input, { position: { x: 2, y: 4 } }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));

    expect(input.selectionStart).toBe(0);
    expect(input).toHaveFocus();
    expect(screen.getByRole('listbox')).toBeVisible();
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('commits the custom text on Enter after a caret click into text that matches nothing', async () => {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <ComboBox
        allowsCustomValue
        label="Fruit"
        onSelectionChange={onSelectionChange}
      >
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
        <ComboBox.Item key="banana">Banana</ComboBox.Item>
      </ComboBox>,
    );

    const input = screen.getByRole('combobox', {
      name: 'Fruit',
    }) as HTMLInputElement;

    await act(() => input.focus());
    await act(() => userEvent.keyboard('xyz'));
    expect(screen.queryByRole('listbox')).toBeNull();

    // At the very start of the text.
    await act(() => userEvent.click(input, { position: { x: 2, y: 4 } }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));

    expect(input.selectionStart).toBe(0);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await act(() => userEvent.keyboard('{Enter}'));

    expect(onSelectionChange.mock.calls).toEqual([['xyz']]);
    expect(input).toHaveValue('xyz');
  });

  it('focuses the input without opening the list on a click on the label', async () => {
    renderWithRoot(<Fruit />);

    const input = screen.getByRole('combobox', { name: 'Fruit' });

    await act(() => userEvent.click(screen.getByText('Fruit')));
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));

    expect(input).toHaveFocus();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes the list and moves past the chevron and clear button on Tab', async () => {
    renderWithRoot(<Fruit isClearable />);

    const input = screen.getByRole('combobox', { name: 'Fruit' });

    await act(() => userEvent.click(input));
    await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());

    await act(() => userEvent.keyboard('{Tab}'));

    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

    await act(() => userEvent.keyboard('{Shift>}{Tab}{/Shift}'));

    expect(input).toHaveFocus();
  });
});

describe('ComboBox Enter in a native form', () => {
  it('submits the typed match on Enter with the list closed', async () => {
    const onSubmit = vi.fn();

    renderWithRoot(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget).get('color'));
        }}
      >
        <ComboBox name="color" label="Color">
          <ComboBox.Item key="red">Red</ComboBox.Item>
          <ComboBox.Item key="green">Green</ComboBox.Item>
          <ComboBox.Item key="grey">Grey</ComboBox.Item>
        </ComboBox>
        <button type="submit">Save</button>
      </form>,
    );

    const input = screen.getByRole('combobox');

    await act(() => input.focus());
    await act(() => userEvent.keyboard('Gree'));
    await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());
    await act(() => userEvent.keyboard('{Escape}'));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

    await act(() => userEvent.keyboard('{Enter}'));

    expect(onSubmit.mock.calls).toEqual([['green']]);
    expect(input).toHaveValue('Green');
  });
});
