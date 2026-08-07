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
  it('shows the color as text and as a swatch', () => {
    const { getByRole, getByTestId } = renderWithRoot(
      <ColorPicker aria-label="Color" defaultValue="#26fcb2" />,
    );

    expect(getByRole('textbox')).toHaveValue('#26fcb2');
    expect(getByTestId('ColorSwatch')).toHaveStyle({
      '--color-picker-color': '#26fcb2',
    });
  });

  it.each([['isValid'], ['isInvalid']])(
    'renders the %s indicator left of the trigger',
    (state) => {
      const { getByRole, container } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
          defaultValue="#26fcb2"
          {...{ [state]: true }}
        />,
      );
      const indicator = container.querySelector('[data-element="State"]')!;
      const trigger = getByRole('button', { name: /color picker/i });

      expect(indicator).toBeInTheDocument();
      expect(
        indicator.compareDocumentPosition(trigger) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    },
  );

  it('marks the swatch empty without a color', () => {
    const { getByTestId } = renderWithRoot(<ColorPicker aria-label="Color" />);

    expect(getByTestId('ColorSwatch')).toHaveAttribute('data-empty');
  });

  describe('text entry', () => {
    it('reads every supported notation', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ColorPicker aria-label="Color" onChange={onChange} />,
      );

      for (const notation of [
        'rgb(255 0 0)',
        'hsl(0 100% 50%)',
        'okhsl(29.23 100% 56.81%)',
        'okhst(29.23 100% 58.59%)',
        'oklch(0.628 0.2577 29.23)',
      ]) {
        onChange.mockClear();
        await userEvent.clear(getByRole('textbox'));
        await userEvent.paste(notation);

        expect(onChange).toHaveBeenLastCalledWith('#ff0000');
      }
    });

    it('normalizes the text on blur in `forced` mode', async () => {
      const { getByRole } = renderWithRoot(
        <ColorPicker aria-label="Color" format="hex" />,
      );
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('rgb(255 0 0)');

      // Still exactly what was typed while the field is being edited.
      expect(input).toHaveValue('rgb(255 0 0)');

      await userEvent.tab();

      expect(input).toHaveValue('#ff0000');
    });

    it('keeps the notation and normalizes the value in `derive` mode', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
          formatMode="derive"
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('RGB(255, 0, 0)');
      await userEvent.tab();

      expect(input).toHaveValue('RGB(255, 0, 0)');
      expect(onChange).toHaveBeenLastCalledWith('rgb(255 0 0)');
    });

    it('passes the text through untouched in `free` mode', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
          formatMode="free"
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('RGB(255, 0, 0)');
      await userEvent.tab();

      expect(input).toHaveValue('RGB(255, 0, 0)');
      expect(onChange).toHaveBeenLastCalledWith('RGB(255, 0, 0)');
    });

    it('holds the last valid color while the text is unparsable', async () => {
      const onChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
          defaultValue="#ff0000"
          onChange={onChange}
        />,
      );
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('nonsense');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('reverts to the last valid color on blur', async () => {
      const { getByRole } = renderWithRoot(
        <ColorPicker aria-label="Color" defaultValue="#ff0000" />,
      );
      const input = getByRole('textbox');

      await userEvent.tripleClick(input);
      await userEvent.paste('not a color');
      await userEvent.tab();

      expect(input).toHaveValue('#ff0000');
    });

    it('treats an emptied field as a deliberate "no color"', async () => {
      const { getByRole } = renderWithRoot(
        <ColorPicker aria-label="Color" defaultValue="#ff0000" />,
      );
      const input = getByRole('textbox');

      await userEvent.clear(input);
      await userEvent.paste('not a color');
      await userEvent.tab();

      expect(input).toHaveValue('');
    });

    it('falls back to empty when there is no valid color to revert to', async () => {
      const { getByRole } = renderWithRoot(<ColorPicker aria-label="Color" />);
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('not a color');
      await userEvent.tab();

      expect(input).toHaveValue('');
    });

    it('normalizes on Enter without leaving the field', async () => {
      const { getByRole } = renderWithRoot(<ColorPicker aria-label="Color" />);
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('rgb(255 0 0)');
      await userEvent.keyboard('{Enter}');

      expect(input).toHaveValue('#ff0000');
      expect(input).toHaveFocus();
    });

    it('emits null when cleared', async () => {
      const onChange = vi.fn();
      const { getByRole, getByTestId } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
          defaultValue="#ff0000"
          onChange={onChange}
        />,
      );

      await userEvent.clear(getByRole('textbox'));

      expect(onChange).toHaveBeenLastCalledWith(null);
      expect(getByTestId('ColorSwatch')).toHaveAttribute('data-empty');
    });

    it('adopts a value set from the outside', async () => {
      const { getByRole, rerender } = renderWithRoot(
        <ColorPicker aria-label="Color" value="#ff0000" />,
      );

      expect(getByRole('textbox')).toHaveValue('#ff0000');

      rerender(<ColorPicker aria-label="Color" value="rgb(38 252 178)" />);

      await waitFor(() => expect(getByRole('textbox')).toHaveValue('#26fcb2'));
    });
  });

  describe('popover', () => {
    const channels = () =>
      [...document.querySelectorAll('[data-input-type="slider"]')].map((el) =>
        el.getAttribute('aria-label'),
      );

    it('opens and closes from the trigger', async () => {
      const onOpenChange = vi.fn();
      const { getByRole, queryByRole } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
          defaultValue="#ff0000"
          onOpenChange={onOpenChange}
        />,
      );
      const trigger = getByRole('button', { name: /color picker/i });

      expect(queryByRole('dialog')).not.toBeInTheDocument();

      await userEvent.click(trigger);

      await waitFor(() => expect(queryByRole('dialog')).toBeInTheDocument());
      expect(onOpenChange).toHaveBeenLastCalledWith(true);

      await userEvent.click(trigger);

      // Wait for the exit animation to unmount the popover.
      await waitFor(() =>
        expect(
          document.querySelector('[role="dialog"]'),
        ).not.toBeInTheDocument(),
      );
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    }, 10000);

    it('offers one slider per channel of the active space', async () => {
      const { getByRole } = renderWithRoot(
        <ColorPicker aria-label="Color" defaultValue="#ff0000" defaultOpen />,
      );

      await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

      expect(channels()).toEqual(['Hue', 'Saturation', 'Tone']);

      await userEvent.click(getByRole('radio', { name: 'RGB' }));

      expect(channels()).toEqual(['Red', 'Green', 'Blue']);

      await userEvent.click(getByRole('radio', { name: 'LCH' }));

      expect(channels()).toEqual(['Lightness', 'Chroma', 'Hue']);
    }, 10000);

    it('opens on the space named by `defaultSpace`', async () => {
      const { getByRole } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
          defaultValue="#ff0000"
          defaultSpace="lch"
          defaultOpen
        />,
      );

      await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

      expect(channels()).toEqual(['Lightness', 'Chroma', 'Hue']);
    }, 10000);

    it('writes a channel change straight back into the input', async () => {
      const onChange = vi.fn();
      const { getAllByRole, getByRole } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
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
      expect(getByRole('textbox')).toHaveValue('#7ac8bf');
    });

    it('writes the channel change in the notation of the current text', async () => {
      const onChange = vi.fn();
      const { getAllByRole, getByRole } = renderWithRoot(
        <ColorPicker
          aria-label="Color"
          formatMode="derive"
          defaultValue="rgb(122 77 191)"
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

      expect(onChange).toHaveBeenLastCalledWith('rgb(122 200 191)');
    });

    it('does not open while disabled', async () => {
      const { getByRole, queryByRole } = renderWithRoot(
        <ColorPicker aria-label="Color" defaultValue="#ff0000" isDisabled />,
      );

      await userEvent.click(getByRole('button', { name: /color picker/i }));

      expect(queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('form integration', () => {
    it('registers the field and publishes the normalized color', async () => {
      const { getByRole, formInstance } = renderWithForm(
        <ColorPicker name="brand" label="Brand" />,
      );

      await userEvent.click(getByRole('textbox'));
      await userEvent.paste('rgb(255 0 0)');

      expect(formInstance.getFieldValue('brand')).toBe('#ff0000');
    });

    it('takes its initial value from the form', () => {
      const { getByRole } = renderWithForm(
        <ColorPicker name="brand" label="Brand" />,
        { formProps: { defaultValues: { brand: 'rgb(38 252 178)' } } },
      );

      expect(getByRole('textbox')).toHaveValue('#26fcb2');
    });

    it('reports a validation error', async () => {
      const { getByRole, getByText } = renderWithForm(
        <ColorPicker
          name="brand"
          label="Brand"
          rules={[{ required: true, message: 'Pick a color' }]}
        />,
      );

      await userEvent.click(getByRole('textbox'));
      await userEvent.paste('#ff0000');
      await userEvent.clear(getByRole('textbox'));
      await userEvent.tab();

      await waitFor(() =>
        expect(getByText('Pick a color')).toBeInTheDocument(),
      );
    });
  });
});
