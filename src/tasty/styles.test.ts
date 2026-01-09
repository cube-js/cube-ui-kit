import { borderStyle } from './styles/border';
import { colorStyle } from './styles/color';
import { createStyle } from './styles/createStyle';
import { fillStyle } from './styles/fill';
import { flowStyle } from './styles/flow';
import { gapStyle } from './styles/gap';
import { insetStyle } from './styles/inset';
import { marginStyle } from './styles/margin';
import { outlineStyle } from './styles/outline';
import { paddingStyle } from './styles/padding';
import { presetStyle } from './styles/preset';
import { radiusStyle } from './styles/radius';

describe('Tasty style tests', () => {
  it('should handle border styles', () => {
    expect(borderStyle({ border: '1px solid #000' })).toEqual({
      border: '1px solid var(--000-color, #000)',
    });
  });

  it('should handle color styles with fallbacks', () => {
    // Simple color variable
    expect(colorStyle({ color: 'var(--primary-color)' })).toEqual({
      color: 'var(--primary-color)',
      '--current-color': 'var(--primary-color)',
      '--current-color-rgb': 'var(--primary-color-rgb)',
    });

    // Color with fallback chain
    expect(
      colorStyle({ color: 'var(--placeholder-color, var(--dark-04-color))' }),
    ).toEqual({
      color: 'var(--placeholder-color, var(--dark-04-color))',
      '--current-color': 'var(--placeholder-color, var(--dark-04-color))',
      '--current-color-rgb':
        'var(--placeholder-color-rgb, var(--dark-04-color-rgb))',
    });

    // Nested fallbacks
    expect(
      colorStyle({
        color:
          'var(--primary-color, var(--secondary-color, var(--tertiary-color)))',
      }),
    ).toEqual({
      color:
        'var(--primary-color, var(--secondary-color, var(--tertiary-color)))',
      '--current-color':
        'var(--primary-color, var(--secondary-color, var(--tertiary-color)))',
      '--current-color-rgb':
        'var(--primary-color-rgb, var(--secondary-color-rgb, var(--tertiary-color-rgb)))',
    });
  });

  it('should handle fill styles with fallbacks', () => {
    // Simple fill variable
    expect(fillStyle({ fill: 'var(--primary-color)' })).toEqual({
      'background-color': 'var(--primary-color)',
    });

    // Fill with fallback chain
    expect(
      fillStyle({ fill: 'var(--surface-color, var(--white-color))' }),
    ).toEqual({
      'background-color': 'var(--surface-color, var(--white-color))',
    });

    // Nested fallbacks
    expect(
      fillStyle({
        fill: 'var(--primary-color, var(--secondary-color, var(--tertiary-color)))',
      }),
    ).toEqual({
      'background-color':
        'var(--primary-color, var(--secondary-color, var(--tertiary-color)))',
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
      padding: '10px',
    });
  });

  it('should handle margin styles', () => {
    expect(
      marginStyle({
        margin: '5px',
      }),
    ).toEqual({
      margin: '5px',
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
    expect(radiusStyle({ radius: '50%' })).toEqual({
      'border-radius': '50%',
    });
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

  describe('Color fallback syntax', () => {
    it('should generate both color and RGB variants for color fallback', () => {
      const handler = createStyle('#local-placeholder');
      const result = handler({
        '#local-placeholder': '(#placeholder, #dark-04)',
      });

      expect(result).toEqual({
        '--local-placeholder-color':
          'var(--placeholder-color, var(--dark-04-color))',
        '--local-placeholder-color-rgb':
          'var(--placeholder-color-rgb, var(--dark-04-color-rgb))',
      });
    });

    it('should handle nested color fallbacks with RGB variants', () => {
      const handler = createStyle('#theme');
      const result = handler({
        '#theme': '(#primary, (#secondary, #tertiary))',
      });

      expect(result).toEqual({
        '--theme-color':
          'var(--primary-color, var(--secondary-color, var(--tertiary-color)))',
        '--theme-color-rgb':
          'var(--primary-color-rgb, var(--secondary-color-rgb, var(--tertiary-color-rgb)))',
      });
    });

    it('should handle color fallback with hex literal', () => {
      const handler = createStyle('#custom');
      const result = handler({
        '#custom': '(#primary, #fff)',
      });

      expect(result).toEqual({
        '--custom-color': 'var(--primary-color, var(--fff-color, #fff))',
        '--custom-color-rgb':
          'var(--primary-color-rgb, var(--fff-color-rgb, 255 255 255))',
      });
    });

    it('should handle color fallback with CSS function', () => {
      const handler = createStyle('#background');
      const result = handler({
        '#background': '(#theme, rgb(255 0 0))',
      });

      expect(result).toEqual({
        '--background-color': 'var(--theme-color, rgb(255 0 0))',
        '--background-color-rgb': 'var(--theme-color-rgb, rgb(255 0 0))',
      });
    });

    it('should handle custom property with -color suffix and fallback', () => {
      const handler = createStyle('$local-placeholder-color');
      const result = handler({
        '$local-placeholder-color': '($placeholder-color, $dark-04-color)',
      });

      expect(result).toEqual({
        '--local-placeholder-color':
          'var(--placeholder-color, var(--dark-04-color))',
        '--local-placeholder-color-rgb':
          'var(--placeholder-color-rgb, var(--dark-04-color-rgb))',
      });
    });
  });
});
