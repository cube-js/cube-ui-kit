import { splitFieldLayout } from './field-layout';

describe('splitFieldLayout', () => {
  it('keeps the style props on a bare input, over its styles', () => {
    expect(
      splitFieldLayout({
        isBare: true,
        width: '10x',
        styles: { width: '5x', fill: '#white' },
        fieldStyles: { margin: '1x' },
      }),
    ).toEqual({
      styles: { width: '10x', fill: '#white' },
      // Nothing to spread over the props: they keep their own field keys.
      field: {},
      fillWidth: false,
      fillHeight: false,
    });
  });

  it('moves the style props to the wrapper, over fieldStyles', () => {
    const { styles, field } = splitFieldLayout({
      label: 'Name',
      width: '10x',
      position: 'relative',
      styles: { width: '5x' },
      fieldStyles: { width: '3x', margin: '1x' },
    });

    expect(styles).toEqual({ width: '5x' });
    expect(field.fieldStyles).toEqual({
      width: '10x',
      margin: '1x',
      position: 'relative',
    });
    expect(field.fieldProps).toEqual({
      mods: { 'fill-width': true, 'fill-height': false },
    });
  });

  it('moves nothing when no style prop is set', () => {
    expect(
      splitFieldLayout({
        label: 'Name',
        fieldStyles: { width: '3x' },
        fieldProps: { mods: { custom: true } },
      }),
    ).toEqual({ styles: {}, field: {}, fillWidth: false, fillHeight: false });
  });

  it.each([
    ['inlineSize', 'width'],
    ['blockSize', 'height'],
  ])('gives %s its physical name on the wrapper', (logical, physical) => {
    expect(
      splitFieldLayout({ label: 'Name', [logical]: '10x' }).field.fieldStyles,
    ).toEqual({ [physical]: '10x' });
    // The physical one, given as well, wins: a reset too.
    expect(
      splitFieldLayout({ label: 'Name', [logical]: '10x', [physical]: '5x' })
        .field.fieldStyles,
    ).toEqual({ [physical]: '5x' });
    expect(
      splitFieldLayout({ label: 'Name', [logical]: '10x', [physical]: null })
        .field.fieldStyles,
    ).toEqual({ [physical]: null });
  });

  it('decides the fill on the size the wrapper gets', () => {
    expect(
      splitFieldLayout({ label: 'Name', width: 'auto', inlineSize: '10x' }),
    ).toMatchObject({ field: { fieldProps: undefined }, fillWidth: false });
  });

  it('keeps a null reset for the wrapper', () => {
    const { field } = splitFieldLayout({
      label: 'Name',
      width: null,
      fieldStyles: { width: '3x' },
    });

    expect(field.fieldStyles).toEqual({ width: null });
    expect(field.fieldProps).toBeUndefined();
  });

  it.each([null, undefined, 0, '0', 'none', 'auto', 'initial'])(
    'does not fill for a width of %s',
    (width) => {
      const layout = splitFieldLayout({ label: 'Name', width });

      expect(layout.field.fieldProps).toBeUndefined();
      expect(layout.fillWidth).toBe(false);
    },
  );

  it.each(['width', 'inlineSize', 'flexBasis', 'flexGrow', 'flex'])(
    'fills the width for %s',
    (name) => {
      expect(
        splitFieldLayout({ label: 'Name', [name]: '1' }).field.fieldProps,
      ).toEqual({ mods: { 'fill-width': true, 'fill-height': false } });
    },
  );

  it.each(['height', 'blockSize'])('fills the height for %s', (name) => {
    const layout = splitFieldLayout({ label: 'Name', [name]: '10x' });

    expect(layout.field.fieldProps).toEqual({
      mods: { 'fill-width': false, 'fill-height': true },
    });
    expect(layout).toMatchObject({ fillWidth: false, fillHeight: true });
  });

  it('fills the height for flex props only with fillHeightOnFlex', () => {
    expect(
      splitFieldLayout({ label: 'Name', flexGrow: 1 }).field.fieldProps,
    ).toEqual({ mods: { 'fill-width': true, 'fill-height': false } });
    expect(
      splitFieldLayout(
        { label: 'Name', flexGrow: 1 },
        { fillHeightOnFlex: true },
      ).field.fieldProps,
    ).toEqual({ mods: { 'fill-width': true, 'fill-height': true } });
  });

  it('does not fill for a style prop that only places the wrapper', () => {
    expect(
      splitFieldLayout({ label: 'Name', position: 'absolute', top: 0 }).field
        .fieldProps,
    ).toBeUndefined();
  });

  it('adds the fill mods to fieldProps', () => {
    const ref = { current: null };

    expect(
      splitFieldLayout({
        label: 'Name',
        width: '10x',
        fieldProps: { ref, mods: { custom: true } },
      }).field.fieldProps,
    ).toEqual({
      ref,
      mods: { custom: true, 'fill-width': true, 'fill-height': false },
    });
  });

  it('keeps everything on the input with hasChrome false', () => {
    expect(
      splitFieldLayout({ label: 'Alpha', width: '10x' }, { hasChrome: false })
        .styles,
    ).toEqual({ width: '10x' });
  });

  it('puts defaultStyles under styles', () => {
    expect(
      splitFieldLayout(
        { label: 'Name', styles: { fill: '#white' } },
        { defaultStyles: { fill: '#dark', flow: 'row' } },
      ).styles,
    ).toEqual({ fill: '#white', flow: 'row' });
  });
});
