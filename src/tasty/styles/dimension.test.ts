import { heightStyle } from './height';
import { widthStyle } from './width';

const { parseStyle } = require('../utils/styles');

describe('dimensionStyle – width & height helpers', () => {
  test('single value width', () => {
    const res = widthStyle({ width: '10x' }) as any;
    expect(res.width).toBe('calc(10 * var(--gap))');
    expect(res['min-width']).toBe('initial');
    expect(res['max-width']).toBe('initial');
  });

  test('min & max width (two values)', () => {
    const res = widthStyle({ width: '1x 10x' }) as any;
    expect(res.width).toBe('auto');
    expect(res['min-width']).toBe('var(--gap)');
    expect(res['max-width']).toBe('calc(10 * var(--gap))');
  });

  test('min modifier width', () => {
    const res = widthStyle({ width: 'min 2x' }) as any;
    expect(res.width).toBe('auto');
    expect(res['min-width']).toBe('calc(2 * var(--gap))');
    expect(res['max-width']).toBe('initial');
  });

  test('max modifier width', () => {
    const res = widthStyle({ width: 'max 2x' }) as any;
    expect(res.width).toBe('auto');
    expect(res['min-width']).toBe('initial');
    expect(res['max-width']).toBe('calc(2 * var(--gap))');
  });

  test('width three args', () => {
    const res = widthStyle({ width: 'initial 36x max-content' }) as any;
    expect(res.width).toBe('calc(36 * var(--gap))');
    expect(res['min-width']).toBe('initial');
    expect(res['max-width']).toBe('max-content');
  });

  test('stretch width keyword', () => {
    const res = widthStyle({ width: 'stretch' }) as any;
    expect(res.width).toEqual([
      'stretch',
      '-webkit-fill-available',
      '-moz-available',
    ]);
  });

  test('boolean true width (auto)', () => {
    const res = widthStyle({ width: true }) as any;
    expect(res.width).toBe('auto');
  });

  test('responsive array width', () => {
    const res = widthStyle({ width: '1x 2x' }) as any;
    expect(res.width).toBe('auto');
    expect(res['min-width']).toBe('var(--gap)');
    expect(res['max-width']).toBe('calc(2 * var(--gap))');
  });

  test('single value height', () => {
    const res = heightStyle({ height: '100px' }) as any;
    expect(res.height).toBe('100px');
    expect(res['min-height']).toBe('initial');
    expect(res['max-height']).toBe('initial');
  });

  test('height three args', () => {
    const res = heightStyle({ height: '1x 5x 10x' }) as any;
    expect(res.height).toBe('calc(5 * var(--gap))');
    expect(res['min-height']).toBe('var(--gap)');
    expect(res['max-height']).toBe('calc(10 * var(--gap))');
  });

  test('boolean true height (auto)', () => {
    const res = heightStyle({ height: true }) as any;
    expect(res.height).toBe('auto');
  });

  test('stretch height keyword', () => {
    const res = heightStyle({ height: 'stretch' }) as any;
    expect(res.height).toBe('auto');
  });

  test('calc-size(auto) width', () => {
    const res = widthStyle({ width: 'calc-size(auto)' }) as any;
    expect(res.width).toBe('calc-size(auto)');
    expect(res['min-width']).toBe('initial');
    expect(res['max-width']).toBe('initial');
  });

  test('calc-size(auto) with min constraint', () => {
    const res = widthStyle({ width: '100px calc-size(auto)' }) as any;
    expect(res.width).toBe('auto');
    expect(res['min-width']).toBe('100px');
    expect(res['max-width']).toBe('calc-size(auto)');
  });

  test('parseStyle processes calc-size(auto) correctly', () => {
    const parsed = parseStyle('calc-size(auto)');
    expect(parsed.output).toBe('calc-size(auto)');
    expect(parsed.groups[0].values).toEqual(['calc-size(auto)']);
    expect(parsed.groups[0].mods).toEqual([]);
  });

  test('parseStyle processes calc-size with complex inner value', () => {
    const parsed = parseStyle('calc-size(fit-content)');
    expect(parsed.output).toBe('calc-size(fit-content)');
    expect(parsed.groups[0].values).toEqual(['calc-size(fit-content)']);
  });

  test('fixed modifier with pixels', () => {
    const res = widthStyle({ width: 'fixed 10px' }) as any;
    expect(res.width).toBe('10px');
    expect(res['min-width']).toBe('10px');
    expect(res['max-width']).toBe('10px');
  });

  test('fixed modifier with gap units', () => {
    const res = heightStyle({ height: 'fixed 5x' }) as any;
    expect(res.height).toBe('calc(5 * var(--gap))');
    expect(res['min-height']).toBe('calc(5 * var(--gap))');
    expect(res['max-height']).toBe('calc(5 * var(--gap))');
  });

  test('fixed modifier with rem units', () => {
    const res = widthStyle({ width: 'fixed 2rem' }) as any;
    expect(res.width).toBe('2rem');
    expect(res['min-width']).toBe('2rem');
    expect(res['max-width']).toBe('2rem');
  });

  test('fixed modifier with percentage', () => {
    const res = heightStyle({ height: 'fixed 100%' }) as any;
    expect(res.height).toBe('100%');
    expect(res['min-height']).toBe('100%');
    expect(res['max-height']).toBe('100%');
  });
});
