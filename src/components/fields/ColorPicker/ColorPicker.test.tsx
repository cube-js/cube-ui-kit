import {
  act,
  fireEvent,
  renderWithForm,
  renderWithRoot,
  userEvent,
  waitFor,
} from '../../../test';

import { ColorPicker } from './ColorPicker';

vi.mock('../../../_internal/hooks/use-warn');

describe('<ColorPicker />', () => {
  const openPopover = async (getByRole) => {
    await userEvent.click(getByRole('button', { name: /brand|color/i }));
    await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());
  };

  it('shows the color on the trigger, as a swatch and as text', () => {
    const { getByRole, getByTestId } = renderWithRoot(
      <ColorPicker aria-label="Brand" defaultValue="#26fcb2" />,
    );

    expect(getByRole('button')).toHaveTextContent('#26fcb2');
    expect(getByTestId('ColorSwatch')).toHaveStyle({
      '--color-picker-color': '#26fcb2',
    });
  });

  it('writes the value in the requested notation', () => {
    const { getByRole } = renderWithRoot(
      <ColorPicker aria-label="Brand" defaultValue="#26fcb2" format="oklch" />,
    );

    expect(getByRole('button')).toHaveTextContent(
      'oklch(0.8789 0.1857 162.47)',
    );
  });

  it('falls back to a muted placeholder without a color', () => {
    const { getByRole, getByText, getByTestId } = renderWithRoot(
      <ColorPicker aria-label="Brand" />,
    );

    expect(getByRole('button')).toHaveTextContent('Pick a color');
    expect(getByTestId('ColorSwatch')).toHaveAttribute('data-empty');
    // Rendered through `Text.Placeholder`, so an unset picker never reads like
    // one holding a value — a real color is bare text with no such wrapper.
    expect(getByText('Pick a color')).toHaveAttribute('data-qa', 'Text');
  });

  it('renders a real color as plain text, not as a placeholder', () => {
    const { getByText } = renderWithRoot(
      <ColorPicker aria-label="Brand" defaultValue="#26fcb2" />,
    );

    expect(getByText('#26fcb2')).not.toHaveAttribute('data-qa', 'Text');
  });

  it('declares itself a picker to the legacy Field wiring', () => {
    // `Text` would validate on blur and coerce a null value into '', neither of
    // which suits a trigger that commits on change.
    expect((ColorPicker as any).cubeInputType).toBe('Picker');
  });

  it('leaves the swatch alone when children are null', () => {
    const { getByRole, getByTestId } = renderWithRoot(
      <ColorPicker aria-label="Brand" defaultValue="#26fcb2" children={null} />,
    );

    expect(getByRole('button')).toHaveTextContent('');
    expect(getByTestId('ColorSwatch')).toBeInTheDocument();
  });

  it('lets children replace the label', () => {
    const { getByRole } = renderWithRoot(
      <ColorPicker aria-label="Brand" defaultValue="#26fcb2">
        Accent
      </ColorPicker>,
    );

    expect(getByRole('button')).toHaveTextContent('Accent');
  });

  it('opens the same popover the input uses', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <ColorPicker aria-label="Brand" defaultValue="#26fcb2" />,
    );

    expect(queryByRole('dialog')).not.toBeInTheDocument();

    await openPopover(getByRole);

    expect(
      Array.from(
        document.querySelectorAll('[data-input-type="slider"]'),
        (el) => el.getAttribute('aria-label'),
      ),
    ).toEqual(['Hue', 'Saturation', 'Tone']);
  }, 10000);

  it('publishes a channel change from the popover', async () => {
    const onChange = vi.fn();
    const { getByRole, getAllByRole, getByTestId } = renderWithRoot(
      <ColorPicker
        aria-label="Brand"
        defaultValue="#7a4dbf"
        defaultSpace="rgb"
        defaultOpen
        onChange={onChange}
      />,
    );

    await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

    const [, green] = getAllByRole('slider');

    await act(async () => {
      fireEvent.change(green, { target: { value: '200' } });
    });

    expect(onChange).toHaveBeenLastCalledWith('#7ac8bf');
    // The open popover contributes a hidden dismiss button, so the trigger has
    // to be addressed by name rather than by role alone.
    expect(getByTestId('ColorPickerTrigger')).toHaveTextContent('#7ac8bf');
  }, 10000);

  it('adopts a value set from the outside', async () => {
    const { getByRole, rerender } = renderWithRoot(
      <ColorPicker aria-label="Brand" value="#ff0000" />,
    );

    expect(getByRole('button')).toHaveTextContent('#ff0000');

    rerender(<ColorPicker aria-label="Brand" value="rgb(38 252 178)" />);

    await waitFor(() =>
      expect(getByRole('button')).toHaveTextContent('#26fcb2'),
    );
  });

  it('leaves an open panel uneditable while read-only', async () => {
    // Disabling the trigger only stops it being opened; a controlled or
    // default-open popover would otherwise stay fully editable.
    const { getByRole, getAllByRole } = renderWithRoot(
      <ColorPicker
        aria-label="Brand"
        defaultValue="#ff0000"
        swatches={['#7a4dbf', '#26fcb2']}
        defaultOpen
        isReadOnly
      />,
    );

    await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

    for (const slider of getAllByRole('slider')) {
      expect(slider).toBeDisabled();
    }

    for (const swatch of getAllByRole('radio')) {
      expect(swatch).toBeDisabled();
    }
  }, 10000);

  describe('the value field in the popover', () => {
    const field = (getAllByRole) =>
      getAllByRole('textbox')[0] as HTMLInputElement;

    it('offers no trigger of its own', async () => {
      // A disclosure inside the thing it discloses is meaningless, so the
      // nested input drops its trigger — leaving only the picker's own.
      const { getByRole, getAllByRole, queryByTestId } = renderWithRoot(
        <ColorPicker aria-label="Brand" defaultValue="#ff0000" defaultOpen />,
      );

      await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

      expect(field(getAllByRole)).toHaveValue('#ff0000');
      // `ColorInputTrigger` is the pipette a standalone ColorInput renders.
      expect(queryByTestId('ColorInputTrigger')).not.toBeInTheDocument();
    }, 10000);

    it('clears the picker when the field is cleared', async () => {
      // Dropping the null would empty the text while the preview and trigger
      // kept the old color.
      const onChange = vi.fn();
      const { getByRole, getAllByRole, getByTestId } = renderWithRoot(
        <ColorPicker
          aria-label="Brand"
          defaultValue="#ff0000"
          defaultOpen
          onChange={onChange}
        />,
      );

      await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

      await userEvent.clear(field(getAllByRole));

      expect(onChange).toHaveBeenLastCalledWith(null);
      // Scoped to the trigger: the nested field renders a swatch of its own.
      expect(
        getByTestId('ColorPickerTrigger').querySelector(
          '[data-qa="ColorSwatch"]',
        ),
      ).toHaveAttribute('data-empty');
    }, 10000);
  });

  it('does not open while disabled', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <ColorPicker aria-label="Brand" defaultValue="#ff0000" isDisabled />,
    );

    await userEvent.click(getByRole('button'));

    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('registers with a form and publishes the color', async () => {
    const { getByRole, getAllByRole, formInstance } = renderWithForm(
      <ColorPicker name="accent" label="Accent" defaultOpen />,
    );

    await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

    const [hue] = getAllByRole('slider');

    await act(async () => {
      fireEvent.change(hue, { target: { value: '120' } });
    });

    expect(formInstance.getFieldValue('accent')).toMatch(/^#[0-9a-f]{6}$/);
  }, 10000);
});
