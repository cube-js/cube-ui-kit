import { borderStyle } from './styles/border';
import { flowStyle } from './styles/flow';
import { gapStyle } from './styles/gap';
import { insetStyle } from './styles/inset';
import { marginStyle } from './styles/margin';
import { outlineStyle } from './styles/outline';
import { paddingStyle } from './styles/padding';
import { presetStyle } from './styles/preset';
import { radiusStyle } from './styles/radius';

import { configure } from './index';

describe('Tasty style tests', () => {
  it('should handle border styles', () => {
    expect(borderStyle({ border: '1px solid #000' })).toEqual({
      border: '1px solid var(--000-color, #000)',
    });
  });

  it('should handle outline styles', () => {
    expect(outlineStyle({ outline: '2px dashed #f00' })).toEqual({
      outline: '2px dashed var(--f00-color, #f00)',
    });
  });

  it('should handle padding styles', () => {
    expect(
      paddingStyle({
        padding: '10px',
      }),
    ).toEqual({
      'padding-top': '10px',
      'padding-right': '10px',
      'padding-bottom': '10px',
      'padding-left': '10px',
    });
  });

  it('should handle margin styles', () => {
    expect(
      marginStyle({
        margin: '5px',
      }),
    ).toEqual({
      'margin-top': '5px',
      'margin-right': '5px',
      'margin-bottom': '5px',
      'margin-left': '5px',
    });
  });

  it('should handle inset styles', () => {
    expect(insetStyle({ inset: '0 10px 20px 30px' })).toEqual({
      top: '0',
      right: '10px',
      bottom: '20px',
      left: '30px',
    });
  });

  it('should handle radius styles', () => {
    expect(radiusStyle({ radius: '50%' })).toEqual([
      { '--local-radius': '50%', 'border-radius': 'var(--local-radius)' },
      { $: '>*', '--context-radius': '50%' },
    ]);
  });

  it('should handle preset styles', () => {
    expect(
      presetStyle({
        preset: 't3',
      }),
    ).toEqual({
      '--font-size': 'var(--t3-font-size, var(--default-font-size, inherit))',
      '--font-style':
        'var(--t3-font-style, var(--default-font-style, inherit))',
      '--font-weight':
        'var(--t3-font-weight, var(--default-font-weight, inherit))',
      '--letter-spacing':
        'var(--t3-letter-spacing, var(--default-letter-spacing, inherit))',
      '--line-height':
        'var(--t3-line-height, var(--default-line-height, inherit))',
      '--bold-font-weight':
        'var(--t3-bold-font-weight, var(--default-bold-font-weight, inherit))',
      '--font-family':
        'var(--t3-font-family, var(--default-font-family, var(--font, NonexistentFontName))), var(--font, sans-serif)',
      '--icon-size': 'var(--t3-icon-size, var(--default-icon-size, inherit))',
      '--text-transform':
        'var(--t3-text-transform, var(--default-text-transform, inherit))',
      'font-size': 'var(--t3-font-size, var(--default-font-size, inherit))',
      'font-style': 'var(--t3-font-style, var(--default-font-style, inherit))',
      'font-weight':
        'var(--t3-font-weight, var(--default-font-weight, inherit))',
      'letter-spacing':
        'var(--t3-letter-spacing, var(--default-letter-spacing, inherit))',
      'line-height':
        'var(--t3-line-height, var(--default-line-height, inherit))',
      'font-family':
        'var(--t3-font-family, var(--default-font-family, var(--font, NonexistentFontName))), var(--font, sans-serif)',
      'text-transform':
        'var(--t3-text-transform, var(--default-text-transform, inherit))',
    });
  });

  it('should handle flow styles', () => {
    expect(flowStyle({ flow: 'row nowrap' })).toEqual(null);
  });

  it('should handle gap styles', () => {
    expect(
      gapStyle({
        gap: '1rem',
      }),
    ).toEqual({
      $: '& > *:not(:last-child)',
      'margin-bottom': '1rem',
    });
  });
});
