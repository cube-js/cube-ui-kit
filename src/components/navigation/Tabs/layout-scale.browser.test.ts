import { getLayoutScale } from './layout-scale';

/**
 * `getLayoutScale` divides an element's on-screen size by its layout size.
 * jsdom has no layout, so only a browser measures either. The element has a
 * fractional size, padding and a border, as a tab strip does: a `content-box`
 * one leaves the padding and border out of its computed size.
 */
describe('getLayoutScale', () => {
  const mounted: HTMLElement[] = [];

  afterEach(() => {
    mounted.splice(0).forEach((node) => node.remove());
  });

  function mount(boxSizing: 'border-box' | 'content-box', scale: number) {
    const canvas = document.createElement('div');
    const element = document.createElement('div');

    canvas.style.cssText = `transform: scale(${scale}); transform-origin: 0 0`;
    element.style.cssText = `box-sizing: ${boxSizing}; width: 241.73px; height: 31.5px; padding: 4px 3px; border: 1px solid`;
    canvas.append(element);
    document.body.append(canvas);
    mounted.push(canvas);

    return element;
  }

  it.each(['border-box', 'content-box'] as const)(
    'measures the scale of a %s element on both axes',
    (boxSizing) => {
      for (const scale of [0.57, 1.5]) {
        const element = mount(boxSizing, scale);

        expect(getLayoutScale(element, 'horizontal')).toBeCloseTo(scale, 4);
        expect(getLayoutScale(element, 'vertical')).toBeCloseTo(scale, 4);
      }
    },
  );

  it.each(['border-box', 'content-box'] as const)(
    'returns exactly 1 for an unscaled %s element',
    (boxSizing) => {
      const element = mount(boxSizing, 1);

      expect(getLayoutScale(element, 'horizontal')).toBe(1);
      expect(getLayoutScale(element, 'vertical')).toBe(1);
    },
  );
});
