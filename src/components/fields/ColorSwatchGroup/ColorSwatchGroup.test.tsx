import {
  renderWithForm,
  renderWithRoot,
  userEvent,
  waitFor,
} from '../../../test';
import { ColorPicker } from '../ColorPicker';

import { ColorSwatchGroup } from './ColorSwatchGroup';

vi.mock('../../../_internal/hooks/use-warn');

const PALETTE = ['#7a4dbf', '#26fcb2', '#ff0000'];

describe('<ColorSwatchGroup />', () => {
  it('renders one swatch per color', () => {
    const { getAllByRole } = renderWithRoot(
      <ColorSwatchGroup aria-label="Palette" colors={PALETTE} />,
    );

    expect(getAllByRole('radio')).toHaveLength(3);
  });

  it('collapses the same color written different ways', () => {
    // Equivalent colors would make selection ambiguous, so only one survives.
    const { getAllByRole } = renderWithRoot(
      <ColorSwatchGroup
        aria-label="Palette"
        colors={['#ff0000', 'rgb(255 0 0)', 'hsl(0 100% 50%)', '#26fcb2']}
      />,
    );

    expect(getAllByRole('radio')).toHaveLength(2);
  });

  it('announces each swatch by its color', () => {
    const { getByRole } = renderWithRoot(
      <ColorSwatchGroup aria-label="Palette" colors={PALETTE} />,
    );

    expect(getByRole('radio', { name: '#7a4dbf' })).toBeInTheDocument();
  });

  it('prefers a given label over the color', () => {
    const { getByRole } = renderWithRoot(
      <ColorSwatchGroup
        aria-label="Palette"
        colors={[{ color: '#7a4dbf', label: 'Primary' }]}
      />,
    );

    expect(getByRole('radio', { name: 'Primary' })).toBeInTheDocument();
  });

  it('marks the swatch matching the value, whatever notation it is in', () => {
    const { getByRole } = renderWithRoot(
      <ColorSwatchGroup
        aria-label="Palette"
        colors={PALETTE}
        value="rgb(38 252 178)"
      />,
    );

    expect(getByRole('radio', { name: '#26fcb2' })).toBeChecked();
  });

  it('publishes the chosen color in the requested notation', async () => {
    const onChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <ColorSwatchGroup
        aria-label="Palette"
        colors={PALETTE}
        format="oklch"
        onChange={onChange}
      />,
    );

    await userEvent.click(
      getByRole('radio', { name: 'oklch(0.8789 0.1857 162.47)' }),
    );

    expect(onChange).toHaveBeenCalledWith('oklch(0.8789 0.1857 162.47)');
  });

  it('tracks the selection when uncontrolled', async () => {
    const { getByRole } = renderWithRoot(
      <ColorSwatchGroup
        aria-label="Palette"
        colors={PALETTE}
        defaultValue="#7a4dbf"
      />,
    );

    await userEvent.click(getByRole('radio', { name: '#ff0000' }));

    expect(getByRole('radio', { name: '#ff0000' })).toBeChecked();
    expect(getByRole('radio', { name: '#7a4dbf' })).not.toBeChecked();
  });

  it('lays the swatches out in the requested number of columns', () => {
    const { getByTestId } = renderWithRoot(
      <ColorSwatchGroup aria-label="Palette" colors={PALETTE} columns={2} />,
    );

    expect(getByTestId('ColorSwatchGroup')).toHaveStyle({ '--columns': '2' });
  });

  describe('custom colors', () => {
    it('appends a picker when allowed', () => {
      const { queryByTestId, rerender } = renderWithRoot(
        <ColorSwatchGroup aria-label="Palette" colors={PALETTE} />,
      );

      expect(queryByTestId('ColorSwatchGroupCustom')).not.toBeInTheDocument();

      rerender(
        <ColorSwatchGroup aria-label="Palette" colors={PALETTE} allowCustom />,
      );

      expect(queryByTestId('ColorSwatchGroupCustom')).toBeInTheDocument();
    });

    it('drops the picker inside a color popover, where it would recurse', async () => {
      // The escape hatch is itself a ColorPicker, so offering it inside one
      // would nest popovers without end.
      const { getByRole, queryByTestId } = renderWithRoot(
        <ColorPicker aria-label="Brand" swatches={PALETTE} defaultOpen />,
      );

      await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

      expect(queryByTestId('ColorSwatchGroupCustom')).not.toBeInTheDocument();
    }, 10000);
  });

  it('registers with a form and publishes the chosen color', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <ColorSwatchGroup name="accent" label="Accent" colors={PALETTE} />,
    );

    await userEvent.click(getByRole('radio', { name: '#ff0000' }));

    expect(formInstance.getFieldValue('accent')).toBe('#ff0000');
  });
});
