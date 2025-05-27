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

  test('min value height three args', () => {
    const res = heightStyle({ height: '1x 5x 10x' }) as any;
    expect(res.height).toBe('calc(5 * var(--gap))');
    expect(res['min-height']).toBe('var(--gap)');
    expect(res['max-height']).toBe('calc(10 * var(--gap))');
  });

  test('boolean true height (auto)', () => {
    const res = heightStyle({ height: true }) as any;
    expect(res.height).toBe('auto');
  });
});
